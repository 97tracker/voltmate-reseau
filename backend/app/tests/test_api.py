def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_and_login(client):
    resp = client.post(
        "/api/users/register",
        json={"email": "driver@example.com", "password": "s3cret123", "display_name": "Driver"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["user"]["email"] == "driver@example.com"
    token = body["access_token"]

    resp = client.post(
        "/api/users/login", json={"email": "driver@example.com", "password": "s3cret123"}
    )
    assert resp.status_code == 200

    resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "Driver"


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "password": "s3cret123", "display_name": "Dup"}
    assert client.post("/api/users/register", json=payload).status_code == 201
    assert client.post("/api/users/register", json=payload).status_code == 409


def test_create_station_and_report_updates_reliability(client):
    resp = client.post(
        "/api/stations",
        json={
            "name": "Test Charge Point",
            "address": "1 rue de Test, Paris",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "operator": "TestOp",
            "connector_type": "ccs",
            "advertised_power_kw": 100,
        },
    )
    assert resp.status_code == 201
    station = resp.json()
    assert station["current_status"] == "unknown"

    resp = client.post(
        f"/api/stations/{station['id']}/reports",
        json={"status": "working"},
    )
    assert resp.status_code == 201

    resp = client.get(f"/api/stations/{station['id']}")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["current_status"] == "ok"
    assert detail["reliability_score"] == 60
    assert len(detail["reports"]) == 1


def test_nearby_filters_by_radius(client):
    client.post(
        "/api/stations",
        json={
            "name": "Nearby Paris",
            "address": "Paris",
            "latitude": 48.8566,
            "longitude": 2.3522,
        },
    )
    client.post(
        "/api/stations",
        json={
            "name": "Far Marseille",
            "address": "Marseille",
            "latitude": 43.2965,
            "longitude": 5.3698,
        },
    )

    resp = client.get("/api/stations/nearby", params={"lat": 48.8566, "lng": 2.3522, "radius_km": 50})
    assert resp.status_code == 200
    names = [s["name"] for s in resp.json()]
    assert "Nearby Paris" in names
    assert "Far Marseille" not in names


def test_assistant_fallback_answer(client):
    resp = client.post("/api/assistant/query", json={"question": "Bonjour"})
    assert resp.status_code == 200
    assert "answer" in resp.json()


def test_assistant_trip_distance_estimate(client):
    resp = client.post("/api/assistant/query", json={"question": "combien de batterie ?", "trip_distance_km": 225})
    assert resp.status_code == 200
    assert "50%" in resp.json()["answer"]


def test_qrcode_returns_png(client):
    resp = client.post(
        "/api/stations",
        json={"name": "QR Station", "address": "Somewhere", "latitude": 1.0, "longitude": 1.0},
    )
    station_id = resp.json()["id"]

    resp = client.get(f"/api/stations/{station_id}/qrcode")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


def test_admin_stats_requires_admin_role(client):
    client.post(
        "/api/users/register",
        json={"email": "notadmin@example.com", "password": "s3cret123", "display_name": "Regular"},
    )
    login = client.post(
        "/api/users/login", json={"email": "notadmin@example.com", "password": "s3cret123"}
    )
    token = login.json()["access_token"]

    resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403

    resp = client.get("/api/admin/stats")
    assert resp.status_code == 401
