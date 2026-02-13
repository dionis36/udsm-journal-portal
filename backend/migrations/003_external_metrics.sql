-- Create external_metrics table for caching API responses
CREATE TABLE IF NOT EXISTS external_metrics (
    doi TEXT PRIMARY KEY,
    crossref_citations INT,
    altmetric_score FLOAT,
    last_updated TIMESTAMP DEFAULT NOW(),
    raw_data JSONB
);

-- Index for faster lookups by update time
CREATE INDEX IF NOT EXISTS idx_external_metrics_last_updated ON external_metrics(last_updated);

-- Add comment
COMMENT ON TABLE external_metrics IS 'Cached data from external APIs (Crossref, Altmetric, etc.) to reduce API calls';
