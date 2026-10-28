-- =============================================================================
-- Migration: 001_initial.sql
-- Description: Initial database schema for Personalized Travel Itinerary Planner
-- Tables: profiles, trips, itinerary_days
-- Includes: RLS policies, indexes, and updated_at triggers
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles table
-- Stores per-user display name and preferences, linked to auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferences  JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- trips table
-- Core trip record capturing all planning inputs and status
-- -----------------------------------------------------------------------------
CREATE TABLE trips (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    destination      TEXT NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    duration_days    INT NOT NULL,
    travelers_count  INT NOT NULL CHECK (travelers_count >= 1),
    traveler_type    TEXT NOT NULL CHECK (traveler_type IN ('solo','couple','family','friends')),
    budget_amount    NUMERIC(12, 2) NOT NULL CHECK (budget_amount > 0),
    budget_currency  TEXT NOT NULL DEFAULT 'USD',
    travel_pace      TEXT NOT NULL CHECK (travel_pace IN ('relaxed','moderate','fast-paced')),
    interests        TEXT[] NOT NULL DEFAULT '{}',
    preferences      JSONB NOT NULL DEFAULT '{}',
    status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- itinerary_days table
-- One row per day of a trip; activities stored as JSONB array
-- -----------------------------------------------------------------------------
CREATE TABLE itinerary_days (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number   INT NOT NULL CHECK (day_number >= 1),
    date         DATE NOT NULL,
    theme        TEXT NOT NULL,
    activities   JSONB NOT NULL DEFAULT '[]',
    daily_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (trip_id, day_number)
);

-- =============================================================================
-- Row-Level Security
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profile"
    ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users access own trips"
    ON trips FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own itinerary days"
    ON itinerary_days FOR ALL
    USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_trips_user_id        ON trips(user_id);
CREATE INDEX idx_trips_created_at     ON trips(created_at DESC);
CREATE INDEX idx_itinerary_days_trip_id    ON itinerary_days(trip_id);
CREATE INDEX idx_itinerary_days_trip_day   ON itinerary_days(trip_id, day_number);

-- =============================================================================
-- updated_at trigger function and triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_days_updated_at
    BEFORE UPDATE ON itinerary_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
