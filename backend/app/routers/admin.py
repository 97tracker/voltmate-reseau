import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Report, Station, StationPhoto, StationStatus, User
from app.schemas import AdminStats
from app.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return AdminStats(
        total_stations=db.query(Station).count(),
        total_reports=db.query(Report).count(),
        total_users=db.query(User).count(),
        recent_stations=db.query(Station).order_by(Station.created_at.desc()).limit(10).all(),
        recent_reports=db.query(Report).order_by(Report.created_at.desc()).limit(20).all(),
    )


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: uuid.UUID, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()


@router.delete("/photos/{photo_id}", status_code=204)
def delete_photo(photo_id: uuid.UUID, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    photo = db.query(StationPhoto).filter(StationPhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(photo)
    db.commit()


@router.patch("/stations/{station_id}/status", status_code=200)
def change_station_status(
    station_id: uuid.UUID,
    status: StationStatus,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    station.current_status = status
    db.add(station)
    db.commit()
    return {"ok": True}


@router.post("/stations/merge", status_code=200)
def merge_stations(
    keep_id: uuid.UUID,
    remove_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if keep_id == remove_id:
        raise HTTPException(status_code=400, detail="keep_id and remove_id must differ")

    keep = db.query(Station).filter(Station.id == keep_id).first()
    remove = db.query(Station).filter(Station.id == remove_id).first()
    if not keep or not remove:
        raise HTTPException(status_code=404, detail="Station not found")

    db.query(Report).filter(Report.station_id == remove_id).update({"station_id": keep_id})
    db.query(Comment).filter(Comment.station_id == remove_id).update({"station_id": keep_id})
    db.query(StationPhoto).filter(StationPhoto.station_id == remove_id).update({"station_id": keep_id})
    db.delete(remove)
    db.commit()

    from app.reliability import recompute_station

    recompute_station(db, keep)
    return {"ok": True, "kept": str(keep_id)}
