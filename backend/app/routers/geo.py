import httpx
from fastapi import APIRouter, Request

router = APIRouter(prefix="/geo", tags=["geo"])

_PRIVATE_PREFIXES = ("10.", "172.", "192.168.", "127.")


@router.get("/locate")
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
