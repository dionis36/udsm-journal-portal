-- =========================================================
-- UDSM Journal Portal - Current PostgreSQL Schema
-- Consolidated from various setup and migration scripts
-- =========================================================

-- Enable PostGIS for geospatial queries (Heatmap)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Research Fields (Field Normalization)
CREATE TABLE IF NOT EXISTS research_fields (
    field_id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'STEM', 'Social Sciences', 'Humanities', 'Health Sciences'
    baseline_citations_per_article FLOAT DEFAULT 1.0,
    description TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Platform Journals
CREATE TABLE IF NOT EXISTS platform_journals (
    journal_id SERIAL PRIMARY KEY,
    path VARCHAR(64) NOT NULL UNIQUE, -- e.g., 'zjahs'
    name VARCHAR(255) NOT NULL,
    branding JSONB DEFAULT '{}', -- Stores logo_url, primary_color, etc.
    metadata JSONB DEFAULT '{}',  -- Stores issn, description, etc.
    field_id INTEGER REFERENCES research_fields(field_id)
);

-- 3. Research Items (Unified Index of Articles)
CREATE TABLE IF NOT EXISTS research_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legacy_id BIGINT UNIQUE, -- Maps back to OJS submission_id
    journal_id INT REFERENCES platform_journals(journal_id),
    title TEXT NOT NULL,
    year SMALLINT,
    doi VARCHAR(255),
    authors JSONB DEFAULT '[]', -- Array of {name, affiliation} objects
    search_vector TSVECTOR -- Pre-computed for fast search
);

-- 4. View for Research Items / Platform Articles (Legacy Compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_articles') THEN
        CREATE VIEW platform_articles AS
        SELECT 
            item_id,
            legacy_id,
            journal_id,
            title,
            year,
            doi,
            authors
        FROM research_items;
    END IF;
END $$;

-- 5. Readership Geodata (Heatmap Source)
CREATE TABLE IF NOT EXISTS readership_geodata (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id INT REFERENCES platform_journals(journal_id),
    item_id UUID REFERENCES research_items(item_id),
    
    -- Geospatial Point (Longitude, Latitude)
    -- SRID 4326 is the standard for GPS coordinates (WGS 84)
    location_point GEOMETRY(POINT, 4326),
    
    country_code CHAR(2),
    country_name VARCHAR(100),
    city_name VARCHAR(100),
    
    is_institutional BOOLEAN DEFAULT FALSE, -- True if IP matched UDSM range
    event_type VARCHAR(20) CHECK (event_type IN ('ABSTRACT_VIEW', 'PDF_DOWNLOAD')),
    session_duration INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 1,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. External Metrics (Cached API Data)
CREATE TABLE IF NOT EXISTS external_metrics (
    doi TEXT PRIMARY KEY,
    crossref_citations INT,
    altmetric_score FLOAT,
    last_updated TIMESTAMP DEFAULT NOW(),
    raw_data JSONB
);

-- 7. Article Citations (Detailed Tracking)
CREATE TABLE IF NOT EXISTS article_citations (
    citation_id SERIAL PRIMARY KEY,
    cited_article_id UUID REFERENCES research_items(item_id),
    citing_article_doi VARCHAR(255),
    citing_article_title TEXT,
    citation_date DATE,
    source VARCHAR(50) DEFAULT 'crossref', -- 'crossref', 'openalex', 'pubmed', google_scholar', 'manual'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Materialized View for Citation Statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS journal_citation_stats AS
SELECT 
    j.journal_id,
    j.path as journal_path,
    j.name as journal_name,
    COUNT(DISTINCT r.item_id) as total_articles,
    -- Note: This assumes we might add a 'citations' column to research_items 
    -- as seen in some tier 2 updates, or we count from article_citations
    COUNT(DISTINCT ac.citation_id) as detailed_citations_count,
    rf.field_name,
    rf.baseline_citations_per_article as field_baseline
FROM platform_journals j
LEFT JOIN research_items r ON j.journal_id = r.journal_id
LEFT JOIN article_citations ac ON r.item_id = ac.cited_article_id
LEFT JOIN research_fields rf ON j.field_id = rf.field_id
GROUP BY j.journal_id, j.path, j.name, rf.field_name, rf.baseline_citations_per_article;

-- 9. Refresh Logic for Stats
CREATE OR REPLACE FUNCTION refresh_citation_stats() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY journal_citation_stats;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------
-- Indexes for Performance
-- --------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_geodata_location ON readership_geodata USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_items_journal ON research_items(journal_id);
CREATE INDEX IF NOT EXISTS idx_geodata_country ON readership_geodata(country_code);
CREATE INDEX IF NOT EXISTS idx_geodata_timestamp ON readership_geodata(timestamp);
CREATE INDEX IF NOT EXISTS idx_geodata_event_type ON readership_geodata(event_type);
CREATE INDEX IF NOT EXISTS idx_external_metrics_last_updated ON external_metrics(last_updated);
CREATE INDEX IF NOT EXISTS idx_citations_article ON article_citations(cited_article_id);
CREATE INDEX IF NOT EXISTS idx_citations_date ON article_citations(citation_date);
CREATE INDEX IF NOT EXISTS idx_citations_source ON article_citations(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_citation_stats_id ON journal_citation_stats(journal_id);
