import os

# Must be set before the first `from app...` import: app.config.get_settings()
# is cached at import time, and the real REDIS_URL (voltmate-redis) isn't
# reachable from the test environment. slowapi/limits accepts "memory://"
# as an in-process rate-limit backend.
os.environ.setdefault("REDIS_URL", "memory://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite://"


@pytest.fixture()
def db_session():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    # Plain instantiation (no `with`) intentionally skips FastAPI's startup
    # event, which would otherwise call Base.metadata.create_all() against
    # the real Postgres engine — not available in the test environment.
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
