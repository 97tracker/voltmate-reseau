import io
import uuid

import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Station

router = APIRouter(prefix="/stations", tags=["qrcode"])
settings = get_settings()


@router.get("/{station_id}/qrcode")
def get_station_qrcode(station_id: uuid.UUID, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    url = f"{settings.public_base_url}/station/{station_id}"
    img = qrcode.make(url)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
