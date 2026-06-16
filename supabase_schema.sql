-- ============================================================
-- Triply AI — Supabase Database Schema
-- Run this in your Supabase project's SQL Editor:
-- https://supabase.com/dashboard/project/dgindgftgkheiouqinsc/sql/new
-- ============================================================

-- ────────────────────────────────────────
-- TABLE: trips
-- Stores each trip planning request
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_request JSONB NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',  -- pending | complete | failed
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ────────────────────────────────────────
-- TABLE: itineraries
-- Stores the fully generated itinerary JSON for each trip
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.itineraries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    itinerary_json  JSONB NOT NULL,
    risk_score      NUMERIC(3, 1),
    total_cost_inr  NUMERIC(12, 2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);

-- ────────────────────────────────────────
-- TABLE: price_alerts
-- Stores user-set price watch alerts
-- ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id            UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    segment_type       TEXT NOT NULL,   -- 'transport' | 'hotel'
    segment_data       JSONB NOT NULL,
    target_price_inr   NUMERIC(12, 2) NOT NULL,
    current_price_inr  NUMERIC(12, 2),
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at    TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_trip_id   ON public.price_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_is_active ON public.price_alerts(is_active);

-- ────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Disabled for now (using service_role key from backend)
-- Enable and add policies when adding user auth
-- ────────────────────────────────────────
ALTER TABLE public.trips         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts  DISABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────
-- GRANT access to service_role (already default, but explicit)
-- ────────────────────────────────────────
GRANT ALL ON public.trips        TO service_role;
GRANT ALL ON public.itineraries  TO service_role;
GRANT ALL ON public.price_alerts TO service_role;
