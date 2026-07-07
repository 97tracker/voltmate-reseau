"""Seed VoltMate with demo stations around Melun / Paris / Fontainebleau /
Lieusaint / Évry / Créteil so the map is usable immediately.

Usage (from the backend container or a local venv with the same deps):
    python seed.py

Idempotent: skips stations that already exist (matched by name).
"""
from app.database import Base, SessionLocal, engine
from app.gamification import award_for_report
from app.models import (
    Comment,
    ConnectorType,
    Report,
    ReportStatus,
    Station,
    User,
    UserRole,
)
from app.reliability import recompute_station
from app.security import hash_password

STATIONS = [
    dict(
        name="Melun Gare - Recharge Rapide",
        address="Place Gaston Monerville, 77000 Melun",
        latitude=48.5388,
        longitude=2.6597,
        operator="TotalEnergies",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=150,
        estimated_price="0.45€/kWh",
        reports=[ReportStatus.working, ReportStatus.working],
    ),
    dict(
        name="Melun Carrefour",
        address="Rue Rossini, 77000 Melun",
        latitude=48.5423,
        longitude=2.6501,
        operator="Freshmile",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price="0.35€/kWh",
        reports=[ReportStatus.slow, ReportStatus.occupied],
    ),
    dict(
        name="Paris Bercy - Ionity",
        address="Quai de Bercy, 75012 Paris",
        latitude=48.8383,
        longitude=2.3822,
        operator="Ionity",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=350,
        estimated_price="0.59€/kWh",
        reports=[ReportStatus.working, ReportStatus.working, ReportStatus.working],
    ),
    dict(
        name="Paris République",
        address="Place de la République, 75011 Paris",
        latitude=48.8674,
        longitude=2.3632,
        operator="Izivia",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price="0.40€/kWh",
        reports=[ReportStatus.broken, ReportStatus.cable_broken],
    ),
    dict(
        name="Fontainebleau Château",
        address="Place du Général de Gaulle, 77300 Fontainebleau",
        latitude=48.4042,
        longitude=2.7016,
        operator="TotalEnergies",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=50,
        estimated_price="0.42€/kWh",
        reports=[ReportStatus.working],
    ),
    dict(
        name="Fontainebleau Forêt Parking",
        address="Route de la Tour Denecourt, 77300 Fontainebleau",
        latitude=48.4103,
        longitude=2.6934,
        operator="Freshmile",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price=None,
        reports=[],
    ),
    dict(
        name="Lieusaint Carré Sénart",
        address="Place des Champs Elysées, 77127 Lieusaint",
        latitude=48.6167,
        longitude=2.5667,
        operator="Izivia",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=100,
        estimated_price="0.48€/kWh",
        reports=[ReportStatus.working, ReportStatus.payment_failed],
    ),
    dict(
        name="Lieusaint Gare",
        address="Avenue de la Gare, 77127 Lieusaint",
        latitude=48.6229,
        longitude=2.5559,
        operator="Freshmile",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price="0.35€/kWh",
        reports=[ReportStatus.working],
    ),
    dict(
        name="Évry Agora",
        address="Place des Terrasses de l'Agora, 91000 Évry-Courcouronnes",
        latitude=48.6294,
        longitude=2.4406,
        operator="TotalEnergies",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=150,
        estimated_price="0.45€/kWh",
        reports=[ReportStatus.working, ReportStatus.slow],
    ),
    dict(
        name="Évry Cathédrale",
        address="Boulevard des Coquibus, 91000 Évry-Courcouronnes",
        latitude=48.6244,
        longitude=2.4353,
        operator="Izivia",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price=None,
        reports=[ReportStatus.ice_parked],
    ),
    dict(
        name="Créteil Soleil",
        address="Centre Commercial Créteil Soleil, 94000 Créteil",
        latitude=48.7904,
        longitude=2.4556,
        operator="Ionity",
        connector_type=ConnectorType.ccs,
        advertised_power_kw=175,
        estimated_price="0.55€/kWh",
        reports=[ReportStatus.working, ReportStatus.working],
    ),
    dict(
        name="Créteil Préfecture",
        address="Avenue du Général de Gaulle, 94000 Créteil",
        latitude=48.7833,
        longitude=2.4614,
        operator="Freshmile",
        connector_type=ConnectorType.type2,
        advertised_power_kw=22,
        estimated_price="0.38€/kWh",
        reports=[ReportStatus.broken],
    ),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@voltmate.app").first()
        if not demo_user:
            demo_user = User(
                email="demo@voltmate.app",
                password_hash=hash_password("demo1234"),
                display_name="Demo Driver",
                role=UserRole.user,
            )
            db.add(demo_user)

        admin_user = db.query(User).filter(User.email == "admin@voltmate.app").first()
        if not admin_user:
            admin_user = User(
                email="admin@voltmate.app",
                password_hash=hash_password("admin1234"),
                display_name="VoltMate Admin",
                role=UserRole.admin,
            )
            db.add(admin_user)

        db.commit()
        db.refresh(demo_user)

        created = 0
        for spec in STATIONS:
            existing = db.query(Station).filter(Station.name == spec["name"]).first()
            if existing:
                continue

            station = Station(
                name=spec["name"],
                address=spec["address"],
                latitude=spec["latitude"],
                longitude=spec["longitude"],
                operator=spec["operator"],
                connector_type=spec["connector_type"],
                advertised_power_kw=spec["advertised_power_kw"],
                estimated_price=spec["estimated_price"],
                created_by_user_id=demo_user.id,
            )
            db.add(station)
            db.commit()
            db.refresh(station)

            for status in spec["reports"]:
                report = Report(station_id=station.id, user_id=demo_user.id, status=status)
                db.add(report)
                db.commit()
                award_for_report(db, demo_user, status)

            db.add(
                Comment(
                    station_id=station.id,
                    user_id=demo_user.id,
                    content="Merci de signaler l'état de cette borne après votre passage !",
                )
            )
            db.commit()

            recompute_station(db, station)
            created += 1

        print(f"Seed complete: {created} new station(s) created, {len(STATIONS) - created} already present.")
        print("Demo accounts: demo@voltmate.app / demo1234, admin@voltmate.app / admin1234")
    finally:
        db.close()


if __name__ == "__main__":
    run()
