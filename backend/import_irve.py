"""Import real EV charging stations from the official French government IRVE
dataset (data.gouv.fr, mirrored with a queryable REST API by ODRE/Opendatasoft),
scoped to VoltMate's launch departments (77 Seine-et-Marne, 91 Essonne,
94 Val-de-Marne), per ROADMAP.md's hyper-local cold-start strategy.

The source dataset is one row per physical charge point (PDC), several of which
usually share one station (`id_station_itinerance`) — this script groups PDC
rows into one VoltMate Station per real-world station before inserting.

Idempotent: matches on `external_ref` (the source's station id) and only
updates descriptive fields on re-run (name/address/operator/connector/power/
price) — it never touches `current_status` or `reliability_score`, which are
owned by VoltMate's own community reports (see app/reliability.py), not by
this import.

Usage (from the backend container or a local venv with the same deps):
    python import_irve.py
"""
from collections import defaultdict

import httpx

from app.database import Base, SessionLocal, engine
from app.models import ConnectorType, Station

API_URL = "https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/bornes-irve/records"
DEPARTMENTS = ["77", "91", "94"]
PAGE_SIZE = 100

# Sanity bounds for mainland France — guards against the odd bad row in the source data.
LAT_RANGE = (40.0, 52.0)
LON_RANGE = (-6.0, 10.0)


def fetch_department_rows(dept: str) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        response = httpx.get(
            API_URL,
            params={
                "where": f'startswith(code_insee_commune,"{dept}")',
                "limit": PAGE_SIZE,
                "offset": offset,
            },
            timeout=20.0,
        )
        response.raise_for_status()
        page = response.json()["results"]
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def group_key(row: dict) -> str | None:
    return row.get("id_station_itinerance") or row.get("id_station_local") or None


def pick_connector_type(group: list[dict]) -> ConnectorType:
    def any_true(field: str) -> bool:
        return any(str(row.get(field)).lower() == "true" for row in group)

    if any_true("prise_type_combo_ccs"):
        return ConnectorType.ccs
    if any_true("prise_type_chademo"):
        return ConnectorType.chademo
    if any_true("prise_type_2"):
        return ConnectorType.type2
    return ConnectorType.other


def pick_power(group: list[dict]) -> float | None:
    powers = [row["puissance_nominale"] for row in group if row.get("puissance_nominale")]
    return max(powers) if powers else None


def pick_price(group: list[dict]) -> str | None:
    if any(str(row.get("gratuit")).lower() == "true" for row in group):
        return "Gratuit"
    for row in group:
        if row.get("tarification"):
            return row["tarification"][:80]
    return None


def valid_coords(lat, lon) -> bool:
    return lat is not None and lon is not None and LAT_RANGE[0] <= lat <= LAT_RANGE[1] and LON_RANGE[0] <= lon <= LON_RANGE[1]


def build_station_specs(rows: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    fallback_index = 0
    for row in rows:
        lat = row.get("consolidated_latitude")
        lon = row.get("consolidated_longitude")
        if not valid_coords(lat, lon):
            continue
        key = group_key(row)
        if not key:
            # No stable id at all: treat each such row as its own station
            # rather than dropping it (real, standalone charge points do exist
            # without an itinerance id in this dataset).
            fallback_index += 1
            key = f"noref-{row.get('nom_station')}-{fallback_index}"
        groups[key].append(row)

    specs = []
    for key, group in groups.items():
        first = group[0]
        lat = first["consolidated_latitude"]
        lon = first["consolidated_longitude"]
        name = first.get("nom_station") or first.get("nom_enseigne") or "Borne de recharge"
        address = first.get("adresse_station") or ""
        operator = first.get("nom_operateur") or first.get("nom_amenageur")

        specs.append(
            dict(
                external_ref=key,
                name=name.strip(),
                address=address.strip(),
                latitude=lat,
                longitude=lon,
                operator=operator,
                connector_type=pick_connector_type(group),
                advertised_power_kw=pick_power(group),
                estimated_price=pick_price(group),
            )
        )
    return specs


def run():
    Base.metadata.create_all(bind=engine)

    print(f"Fetching IRVE data for departments {DEPARTMENTS}...")
    rows: list[dict] = []
    for dept in DEPARTMENTS:
        dept_rows = fetch_department_rows(dept)
        print(f"  dept {dept}: {len(dept_rows)} charge-point rows")
        rows.extend(dept_rows)

    specs = build_station_specs(rows)
    print(f"Grouped into {len(specs)} stations.")

    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for spec in specs:
            existing = db.query(Station).filter(Station.external_ref == spec["external_ref"]).first()
            if existing:
                existing.name = spec["name"]
                existing.address = spec["address"]
                existing.latitude = spec["latitude"]
                existing.longitude = spec["longitude"]
                existing.operator = spec["operator"]
                existing.connector_type = spec["connector_type"]
                existing.advertised_power_kw = spec["advertised_power_kw"]
                existing.estimated_price = spec["estimated_price"]
                updated += 1
            else:
                db.add(
                    Station(
                        external_ref=spec["external_ref"],
                        source="irve",
                        name=spec["name"],
                        address=spec["address"],
                        latitude=spec["latitude"],
                        longitude=spec["longitude"],
                        operator=spec["operator"],
                        connector_type=spec["connector_type"],
                        advertised_power_kw=spec["advertised_power_kw"],
                        estimated_price=spec["estimated_price"],
                    )
                )
                created += 1
        db.commit()
        print(f"Import complete: {created} created, {updated} updated.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
