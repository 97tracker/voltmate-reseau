"""Reliability score computation for a station.

MVP rules (score is clamped to [0, 100], starts at 50 = unknown):
  - working report in the last 30 days:      +10
  - broken / cable_broken report:            -25
  - payment_failed report:                   -15
  - slow report:                             -10
  - occupied report:                          -5
  - recent photo (last 30 days):              +3
  - no report in the last 30 days:            status -> unknown (score untouched)

The score is recalculated from the full report history every time a new
report comes in, rather than drifting incrementally, so it never gets out
of sync with what actually happened.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Report, ReportStatus, Station, StationPhoto, StationStatus

RECENT_WINDOW_DAYS = 30

_SCORE_DELTA = {
    ReportStatus.working: 10,
    ReportStatus.broken: -25,
    ReportStatus.cable_broken: -25,
    ReportStatus.payment_failed: -15,
    ReportStatus.slow: -10,
    ReportStatus.occupied: -5,
    ReportStatus.wrong_price: -5,
    ReportStatus.ice_parked: -5,
    ReportStatus.other: 0,
}

_STATUS_FROM_REPORT = {
    ReportStatus.working: StationStatus.ok,
    ReportStatus.broken: StationStatus.broken,
    ReportStatus.cable_broken: StationStatus.broken,
    ReportStatus.payment_failed: StationStatus.warning,
    ReportStatus.slow: StationStatus.warning,
    ReportStatus.occupied: StationStatus.warning,
    ReportStatus.wrong_price: StationStatus.warning,
    ReportStatus.ice_parked: StationStatus.warning,
    ReportStatus.other: StationStatus.unknown,
}


def recompute_station(db: Session, station: Station) -> Station:
    cutoff = datetime.now(timezone.utc) - timedelta(days=RECENT_WINDOW_DAYS)

    recent_reports = (
        db.query(Report)
        .filter(Report.station_id == station.id, Report.created_at >= cutoff)
        .order_by(Report.created_at.desc())
        .all()
    )

    if not recent_reports:
        station.current_status = StationStatus.unknown
        db.add(station)
        db.commit()
        db.refresh(station)
        return station

    score = 50
    for report in recent_reports:
        score += _SCORE_DELTA.get(report.status, 0)

    has_recent_photo = (
        db.query(StationPhoto)
        .filter(StationPhoto.station_id == station.id, StationPhoto.created_at >= cutoff)
        .first()
        is not None
    )
    if has_recent_photo:
        score += 3

    score = max(0, min(100, score))

    latest_status = recent_reports[0].status
    station.current_status = _STATUS_FROM_REPORT.get(latest_status, StationStatus.unknown)
    station.reliability_score = score

    db.add(station)
    db.commit()
    db.refresh(station)
    return station
