CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), site_name TEXT NOT NULL, address TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('Good', 'Moderate', 'Bad')),
  chicken_count INTEGER NOT NULL CHECK (chicken_count >= 0), photos JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '', assessor TEXT NOT NULL DEFAULT '', access TEXT NOT NULL DEFAULT 'Open',
  urgency TEXT NOT NULL DEFAULT 'Routine', structural_damage TEXT NOT NULL DEFAULT '', poultry_impact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('draft', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS assessments_condition_idx ON assessments(condition);
CREATE INDEX IF NOT EXISTS assessments_updated_at_idx ON assessments(updated_at DESC);
