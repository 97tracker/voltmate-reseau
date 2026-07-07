import math
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Station, User
from app.schemas import StationCreate, StationDetailOut, StationOut
from app.security import get_current_user_optional

router = APIRouter(prefix="/stations", tags=["stations"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@router.get("", response_model=list[StationOut])
def list_stations(db: Session = Depends(get_db)):
    return db.query(Station).order_by(Station.created_at.desc()).all()


@router.get("/nearby", response_model=list[StationOut])
def nearby_stations(
    lat: float,
    lng: float,
    radius_km: float = 25.0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    stations = db.query(Station).all()
    scored = []
    for s in stations:
        dist = _haversine_km(lat, lng, s.latitude, s.longitude)
        if dist <= radius_km:
            scored.append((dist, s))
    scored.sort(key=lambda pair: pair[0])
    return [s for _, s in scored[:limit]]


@router.get("/{station_id}", response_model=StationDetailOut)
def get_station(station_id: uuid.UUID, db: Session = Depends(get_db)):
    station = (
        db.query(Station)
        .options(
            joinedload(Station.reports),
            joinedload(Station.comments),
            joinedload(Station.photos),
        )
        .filter(Station.id == station_id)
        .first()
    )
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station


@router.post("", response_model=StationOut, status_code=201)
def create_station(
    payload: StationCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    station = Station(
        **payload.model_dump(),
        created_by_user_id=user.id if user else None,
    )
    db.add(station)
    db.commit()
    db.refresh(station)
    return station
