from app.models import ConnectorType, Report, ReportStatus, Station, StationStatus
from app.reliability import recompute_station


def _make_station(db_session) -> Station:
    station = Station(
        name="Test Station",
        address="1 rue de Test",
        latitude=48.85,
        longitude=2.35,
        connector_type=ConnectorType.type2,
    )
    db_session.add(station)
    db_session.commit()
    db_session.refresh(station)
    return station


def test_no_reports_means_unknown_status(db_session):
    station = _make_station(db_session)
    updated = recompute_station(db_session, station)
    assert updated.current_status == StationStatus.unknown


def test_working_reports_raise_score_and_mark_ok(db_session):
    station = _make_station(db_session)
    for _ in range(3):
        db_session.add(Report(station_id=station.id, status=ReportStatus.working))
    db_session.commit()

    updated = recompute_station(db_session, station)
    assert updated.current_status == StationStatus.ok
    assert updated.reliability_score == 80  # 50 base + 3*10


def test_broken_report_drops_score_and_marks_broken(db_session):
    station = _make_station(db_session)
    db_session.add(Report(station_id=station.id, status=ReportStatus.broken))
    db_session.commit()

    updated = recompute_station(db_session, station)
    assert updated.current_status == StationStatus.broken
    assert updated.reliability_score == 25  # 50 base - 25


def test_score_is_clamped_between_0_and_100(db_session):
    station = _make_station(db_session)
    for _ in range(10):
        db_session.add(Report(station_id=station.id, status=ReportStatus.broken))
    db_session.commit()

    updated = recompute_station(db_session, station)
    assert updated.reliability_score == 0
