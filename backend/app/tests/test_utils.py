from app.ai import estimate_battery_percent
from app.routers.stations import _haversine_km
from app.security import hash_password, verify_password


def test_haversine_same_point_is_zero():
    assert _haversine_km(48.8566, 2.3522, 48.8566, 2.3522) == 0


def test_haversine_paris_melun_roughly_40km():
    dist = _haversine_km(48.8566, 2.3522, 48.5388, 2.6597)
    assert 35 < dist < 50


def test_estimate_battery_percent_bounds():
    assert estimate_battery_percent(0) == 1
    assert estimate_battery_percent(450) == 100
    assert estimate_battery_percent(10_000) == 100


def test_password_hash_roundtrip():
    hashed = hash_password("s3cret!")
    assert hashed != "s3cret!"
    assert verify_password("s3cret!", hashed)
    assert not verify_password("wrong", hashed)
