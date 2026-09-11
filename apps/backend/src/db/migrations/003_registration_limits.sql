CREATE TABLE IF NOT EXISTS registration_ip_limits (
  ip_address INET PRIMARY KEY,
  account_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
