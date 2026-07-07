import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Station, StationPhoto, User
from app.reliability import recompute_station
from app.schemas import StationPhotoOut
from app.security import get_current_user_optional

router = APIRouter(prefix="/stations/{station_id}/photos", tags=["photos"])
settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _sanitize_filename(station_id: uuid.UUID, ext: str) -> str:
    safe_ext = re.sub(r"[^a-z0-9.]", "", ext.lower())
    return f"{station_id}-{uuid.uuid4().hex}{safe_ext}"


@router.post("", response_model=StationPhotoOut, status_code=201)
async def upload_photo(
    station_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG or WebP images are allowed")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"Photo exceeds {settings.max_upload_size_mb}MB limit")

    filename = _sanitize_filename(station_id, ALLOWED_CONTENT_TYPES[file.content_type])
    dest = Path(settings.upload_dir) / filename
    dest.write_bytes(contents)

    photo = StationPhoto(
        station_id=station_id,
        user_id=user.id if user else None,
        photo_url=f"/uploads/{filename}",
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    recompute_station(db, station)

    return photo
