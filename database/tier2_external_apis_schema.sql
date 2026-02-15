-- Tier 2: External API Integration - Database Schema Updates
-- Run this to prepare database for citation tracking and impact metrics

-- 1. Add citation tracking columns to platform_articles
ALTER TABLE platform_articles 
ADD COLUMN IF NOT EXISTS citations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS citations_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS openalex_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS pubmed_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS crossref_last_check TIMESTAMPTZ;

-- 2. Create article_citations table for detailed citation tracking
CREATE TABLE IF NOT EXISTS article_citations (
    citation_id SERIAL PRIMARY KEY,
    cited_article_id INTEGER REFERENCES platform_articles(item_id),
    citing_article_doi VARCHAR(255),
    citing_article_title TEXT,
    citation_date DATE,
    source VARCHAR(50) DEFAULT 'crossref', -- 'crossref', 'openalex', 'pubmed', 'google_scholar', 'manual'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_article ON article_citations(cited_article_id);
CREATE INDEX IF NOT EXISTS idx_citations_date ON article_citations(citation_date);
CREATE INDEX IF NOT EXISTS idx_citations_source ON article_citations(source);

-- 3. Create research_fields table for field normalization
CREATE TABLE IF NOT EXISTS research_fields (
    field_id SERIAL PRIMARY KEY,
    field_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'STEM', 'Social Sciences', 'Humanities', 'Health Sciences'
    baseline_citations_per_article FLOAT DEFAULT 1.0,
    description TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add field_id to platform_journals
ALTER TABLE platform_journals 
ADD COLUMN IF NOT EXISTS field_id INTEGER REFERENCES research_fields(field_id);

-- 5. Seed research fields
INSERT INTO research_fields (field_name, category, baseline_citations_per_article) VALUES
('Multidisciplinary Sciences', 'STEM', 2.5),
('Social Sciences', 'Social Sciences', 1.2),
('Engineering', 'STEM', 1.8),
('Medicine & Health', 'Health Sciences', 3.2),
('Humanities', 'Humanities', 0.6),
('Environmental Sciences', 'STEM', 2.0),
('Economics & Business', 'Social Sciences', 1.5),
('Mathematics & Statistics', 'STEM', 1.0),
('Computer Science', 'STEM', 2.2),
('Education', 'Social Sciences', 1.1)
ON CONFLICT (field_name) DO NOTHING;

-- 6. Update TJPSD journal with field
UPDATE platform_journals 
SET field_id = (SELECT field_id FROM research_fields WHERE field_name = 'Multidisciplinary Sciences')
WHERE path = 'tjpsd';

-- 7. Create materialized view for citation statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS journal_citation_stats AS
SELECT 
    j.journal_id,
    j.path as journal_path,
    j.name as journal_name,
    COUNT(DISTINCT a.item_id) as total_articles,
    SUM(a.citations) as total_citations,
    AVG(a.citations) as avg_citations_per_article,
    MAX(a.citations) as max_citations,
    COUNT(DISTINCT ac.citation_id) as detailed_citations_count,
    rf.field_name,
    rf.baseline_citations_per_article as field_baseline,
    CASE 
        WHEN rf.baseline_citations_per_article > 0 THEN
            (AVG(a.citations) / rf.baseline_citations_per_article)
        ELSE NULL
    END as field_normalized_impact
FROM platform_journals j
LEFT JOIN platform_articles a ON j.journal_id = a.journal_id
LEFT JOIN article_citations ac ON a.item_id = ac.cited_article_id
LEFT JOIN research_fields rf ON j.field_id = rf.field_id
GROUP BY j.journal_id, j.path, j.name, rf.field_name, rf.baseline_citations_per_article;

CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_citation_stats_id ON journal_citation_stats(journal_id);

-- 8. Create function to refresh citation stats
CREATE OR REPLACE FUNCTION refresh_citation_stats() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY journal_citation_stats;
END;
$$ LANGUAGE plpgsql;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_doi ON platform_articles(doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_citations ON platform_articles(citations DESC);
CREATE INDEX IF NOT EXISTS idx_articles_updated ON platform_articles(citations_updated_at);

COMMENT ON TABLE article_citations IS 'Detailed citation tracking from external APIs';
COMMENT ON COLUMN platform_articles.citations IS 'Total citation count from all sources';
COMMENT ON COLUMN platform_articles.openalex_id IS 'OpenAlex Work ID (e.g., W2741809807)';
COMMENT ON COLUMN platform_articles.pubmed_id IS 'PubMed ID (PMID) if applicable';
COMMENT ON MATERIALIZED VIEW journal_citation_stats IS 'Pre-computed citation statistics for performance';

-- Verify schema
SELECT 
    'platform_articles columns' as check_type,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'platform_articles' 
AND column_name IN ('citations', 'openalex_id', 'pubmed_id')

UNION ALL

SELECT 'article_citations table' as check_type, COUNT(*) as count
FROM information_schema.tables WHERE table_name = 'article_citations'

UNION ALL

SELECT 'research_fields data' as check_type, COUNT(*) as count
FROM research_fields;
