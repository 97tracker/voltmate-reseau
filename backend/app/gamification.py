"""Lightweight points + badges for community reports.

Kept intentionally simple for the MVP: no external rules engine, just a
few named thresholds checked after each report.
"""
from sqlalchemy.orm import Session

from app.models import Badge, Report, ReportStatus, User

POINTS_PER_REPORT = 5
POINTS_PER_BROKEN_REPORT = 10

FIRST_REPORT = "Premier signalement"
HELPER = "Aide les conducteurs"
BROKEN_HUNTER = "Chasseur de bornes cassées"

HELPER_THRESHOLD = 10
BROKEN_HUNTER_THRESHOLD = 5


def _award_badge_once(db: Session, user: User, name: str) -> None:
    exists = db.query(Badge).filter(Badge.user_id == user.id, Badge.badge_name == name).first()
    if not exists:
        db.add(Badge(user_id=user.id, badge_name=name))


def award_for_report(db: Session, user: User | None, report_status: ReportStatus) -> None:
    if user is None:
        return

    is_broken = report_status in (ReportStatus.broken, ReportStatus.cable_broken)
    user.points += POINTS_PER_BROKEN_REPORT if is_broken else POINTS_PER_REPORT

    total_reports = db.query(Report).filter(Report.user_id == user.id).count()
    if total_reports >= 1:
        _award_badge_once(db, user, FIRST_REPORT)
    if total_reports >= HELPER_THRESHOLD:
        _award_badge_once(db, user, HELPER)

    if is_broken:
        broken_reports = (
            db.query(Report)
            .filter(
                Report.user_id == user.id,
                Report.status.in_([ReportStatus.broken, ReportStatus.cable_broken]),
            )
            .count()
        )
        if broken_reports >= BROKEN_HUNTER_THRESHOLD:
            _award_badge_once(db, user, BROKEN_HUNTER)

    db.add(user)
    db.commit()
