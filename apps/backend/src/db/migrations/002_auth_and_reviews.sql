CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assessor' CHECK (role IN ('assessor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS admin_comment TEXT NOT NULL DEFAULT '';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_review_status_check'
  ) THEN
    ALTER TABLE assessments ADD CONSTRAINT assessments_review_status_check
      CHECK (review_status IN ('pending', 'approved', 'failed', 'flagged'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS assessments_review_status_idx ON assessments(review_status);
