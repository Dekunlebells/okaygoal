-- Schema Migrations Table
-- This table tracks which migrations have been applied

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schema_migrations IS 'Tracks database schema migration versions';