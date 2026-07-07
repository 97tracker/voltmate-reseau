import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.gamification import award_for_report
from app.limiter import limiter
from app.models import Report, Station, User
from app.reliability import recompute_station
from app.schemas import ReportCreate, ReportOut
from app.security import get_current_user_optional

router = APIRouter(prefix="/stations/{station_id}/reports", tags=["reports"])
settings = get_settings()


@router.get("", response_model=list[ReportOut])
def list_reports(station_id: uuid.UUID, db: Session = Depends(get_db)):
    return (
        db.query(Report)
        .filter(Report.station_id == station_id)
        .order_by(Report.created_at.desc())
        .all()
    )


@router.post("", response_model=ReportOut, status_code=201)
@limiter.limit(settings.report_rate_limit)
def create_report(
    request: Request,
    station_id: uuid.UUID,
    payload: ReportCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    report = Report(
        station_id=station_id,
        user_id=user.id if user else None,
        **payload.model_dump(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    recompute_station(db, station)
    award_for_report(db, user, payload.status)

    return report
