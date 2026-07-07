-- VoltMate initial schema.
-- Runs automatically on first container start (empty data dir only), via
-- postgres's /docker-entrypoint-initdb.d mechanism. The backend also calls
-- SQLAlchemy's create_all() as an idempotent safety net (see app/main.py),
-- so this file is the authoritative, human-readable reference for the
-- schema — treat it as migration 001. Future schema changes should be
-- added as 002_*.sql, 003_*.sql, etc.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE station_status AS ENUM ('ok', 'warning', 'broken', 'unknown');
CREATE TYPE connector_type AS ENUM ('type2', 'ccs', 'chademo', 'other');
CREATE TYPE report_status AS ENUM (
    'working', 'occupied', 'slow', 'broken', 'cable_broken',
    'payment_failed', 'ice_parked', 'wrong_price', 'other'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address VARCHAR(300) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    operator VARCHAR(120),
    connector_type connector_type NOT NULL DEFAULT 'type2',
    advertised_power_kw DOUBLE PRECISION,
    estimated_price VARCHAR(80),
    current_status station_status NOT NULL DEFAULT 'unknown',
    reliability_score INTEGER NOT NULL DEFAULT 50,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stations_created_by ON stations(created_by_user_id);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status report_status NOT NULL,
    comment TEXT,
    observed_power_kw DOUBLE PRECISION,
    observed_price VARCHAR(80),
    waiting_time_minutes INTEGER,
    photo_url VARCHAR(500),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_station ON reports(station_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_station ON comments(station_id);

CREATE TABLE IF NOT EXISTS station_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    photo_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_station_photos_station ON station_photos(station_id);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
