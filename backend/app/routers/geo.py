import httpx
from fastapi import APIRouter, Query, Request

from app.limiter import limiter

router = APIRouter(prefix="/geo", tags=["geo"])

_PRIVATE_PREFIXES = ("10.", "172.", "192.168.", "127.")

# Nominatim's usage policy requires a real, identifying User-Agent on every request
# (anonymous/browser-default UAs get silently rate-limited or blocked) and asks that
# callers not hammer it — this is called from our own backend (not client-side) so we
# can hold to a single request per lookup, no live-as-you-type autocomplete spam.
_NOMINATIM_HEADERS = {"User-Agent": "VoltMate/1.0 (contact@voltmate-reseau.com)"}


@router.get("/locate")
@limiter.limit("30/minute")
def locate_by_ip(request: Request):
    """Approximate the caller's position from their public IP.

    No permission prompt needed, unlike the browser Geolocation API, so this is used
    to give the map a sensible default center before the user opts into precise GPS.
    Returns nulls (not an error) whenever the IP can't be geolocated, so callers can
    fall back to the default map center without special-casing failures.
    """
    client_ip = request.client.host if request.client else None
    if not client_ip or client_ip.startswith(_PRIVATE_PREFIXES):
        return {"latitude": None, "longitude": None, "city": None}

    try:
        response = httpx.get(
            f"http://ip-api.com/json/{client_ip}",
            params={"fields": "status,lat,lon,city"},
            timeout=3.0,
        )
        data = response.json()
    except httpx.HTTPError:
        return {"latitude": None, "longitude": None, "city": None}

    if data.get("status") != "success":
        return {"latitude": None, "longitude": None, "city": None}

    return {"latitude": data["lat"], "longitude": data["lon"], "city": data.get("city")}


@router.get("/search")
@limiter.limit("20/minute")
def search_address(request: Request, q: str = Query(..., min_length=2, max_length=200)):
    """Geocode a free-text address/place name (France-biased) via Nominatim (OSM).

    Returns a short list of candidates so the frontend can let the user disambiguate
    ("Melun" the town vs. a street named Melun elsewhere), rather than guessing the
    single best match.
    """
    try:
        response = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": q,
                "format": "jsonv2",
                "countrycodes": "fr",
                "limit": 5,
                "addressdetails": 0,
            },
            headers=_NOMINATIM_HEADERS,
            timeout=5.0,
        )
        response.raise_for_status()
        results = response.json()
    except httpx.HTTPError:
        return []

    return [
        {
            "label": item["display_name"],
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
        }
        for item in results
    ]
