-- 1. Enable PostGIS for geospatial queries (Heatmap)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Platform Journals Table (Replaces 'journals' + 'journal_settings')
CREATE TABLE IF NOT EXISTS platform_journals (
    journal_id SERIAL PRIMARY KEY,
    path VARCHAR(64) NOT NULL UNIQUE, -- e.g., 'zjahs'
    name VARCHAR(255) NOT NULL,
    branding JSONB DEFAULT '{}', -- Stores logo_url, primary_color, etc.
    metadata JSONB DEFAULT '{}'  -- Stores issn, description, etc.
);

-- 3. Research Items Table (Unified Index of Articles)
-- Replaces 'publications', 'submissions', 'authors' structure for read-only speed
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

-- 4. Readership Geodata Table (The "Heatmap" Source)
-- Storing individual hit events with location data
CREATE TABLE IF NOT EXISTS readership_geodata (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id INT REFERENCES platform_journals(journal_id),
    item_id UUID REFERENCES research_items(item_id),
    
    -- Geospatial Point (Longitude, Latitude)
    -- SRID 4326 is the standard for GPS coordinates (WGS 84)
    location_point GEOMETRY(POINT, 4326),
    
    country_code CHAR(2),
    city_name VARCHAR(100),
    
    is_institutional BOOLEAN DEFAULT FALSE, -- True if IP matched UDSM range
    event_type VARCHAR(20) CHECK (event_type IN ('ABSTRACT_VIEW', 'PDF_DOWNLOAD')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Spatial Index for fast Heatmap generation
CREATE INDEX IF NOT EXISTS idx_geodata_location ON readership_geodata USING GIST (location_point);

-- 6. Create Index for fast retrieval by Journal
CREATE INDEX IF NOT EXISTS idx_items_journal ON research_items(journal_id);
