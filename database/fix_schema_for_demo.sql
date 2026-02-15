-- CRITICAL FIX: Schema alignment for demo data generation
-- This addresses mismatches between the demo script and actual schema

-- 1. Add missing columns to readership_geodata that backend expects
ALTER TABLE readership_geodata 
ADD COLUMN IF NOT EXISTS country_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- 2. Create platform_articles as a view or alias if using research_items
-- Check if we're using research_items (new schema) or platform_articles (old)
DO $$
BEGIN
    -- If research_items exists and platform_articles doesn't, create view
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_items')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_articles')
    THEN
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
        
        RAISE NOTICE 'Created platform_articles view from research_items';
    END IF;
    
    -- If neither exists, create platform_articles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name IN ('research_items', 'platform_articles'))
    THEN
        CREATE TABLE platform_articles (
            item_id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            authors TEXT,
            year SMALLINT,
            doi VARCHAR(255),
            journal_id INTEGER DEFAULT 1
        );
        
        RAISE NOTICE 'Created platform_articles table';
    END IF;
END $$;

-- 3. Seed some sample articles if table is empty
DO $$
DECLARE
    article_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO article_count FROM platform_articles;
    
    IF article_count = 0 THEN
        INSERT INTO platform_articles (title, authors, year, doi, journal_id) VALUES
        ('Impact of Climate Change on East African Agriculture', 'Mwamba, J.K.; Nyerere, A.M.', 2023, '10.1234/tjpsd.2023.001', 1),
        ('Urban Planning Strategies for Dar es Salaam', 'Hassan,S.A.; Mohamed, F.', 2023, '10.1234/tjpsd.2023.002', 1),
        ('Renewable Energy Solutions in Tanzania', 'Kimaro, D.N.', 2023, '10.1234/tjpsd.2023.003', 1),
        ('Public Health Interventions in Rural Communities', 'Lupembe, N.L.; Shayo, E.', 2022, '10.1234/tjpsd.2022.001', 1),
        ('Digital Transformation in Education', 'Moshi, H.P.; Komba, A.', 2022, '10.1234/tjpsd.2022.002', 1),
        ('Water Resource Management in Semi-Arid Regions', 'Lyimo, T.J.', 2022, '10.1234/tjpsd.2022.003', 1),
        ('Economic Development and Trade Policy', 'Kinyondo, A.; Pelizzo, R.', 2023, '10.1234/tjpsd.2023.004', 1),
        ('Indigenous Knowledge Systems in Conservation', 'Materu, S.F.; Mligo, C.', 2023, '10.1234/tjpsd.2023.005', 1),
        ('Coastal Ecosystem Management', 'Mmochi, A.J.; Mfilinge, P.L.', 2022, '10.1234/tjpsd.2022.004', 1),
        ('Agricultural Value Chains in East Africa', 'Mutabazi, K.D.; Amede, T.', 2023, '10.1234/tjpsd.2023.006', 1),
        ('Urbanization and Infrastructure Development', 'Kironde, J.M.L.', 2023, '10.1234/tjpsd.2023.007', 1),
        ('Health Systems Strengthening in Tanzania', 'Mamdani, M.; Bangser, M.', 2022, '10.1234/tjpsd.2022.005', 1),
        ('Tourism and Cultural Heritage', 'Nelson, F.; Makko, S.', 2023, '10.1234/tjpsd.2023.008', 1),
        ('Gender Equality in Higher Education', 'Morley, L.; Lussier, K.', 2022, '10.1234/tjpsd.2022.006', 1),
        ('Fisheries Management in Lake Victoria', 'Kolding, J.; Medard, M.', 2023, '10.1234/tjpsd.2023.009', 1),
        ('Forest Conservation and Biodiversity', 'Munishi, P.K.T.; Shear, T.H.', 2023, '10.1234/tjpsd.2023.010', 1),
        ('Financial Inclusion and Microfinance', 'Bee, F.K.', 2022, '10.1234/tjpsd.2022.007', 1),
        ('Transport Infrastructure Planning', 'Rizzo, M.', 2023, '10.1234/tjpsd.2023.011', 1),
        ('Climate Adaptation Strategies', 'Kangalawe, R.Y.M.', 2023, '10.1234/tjpsd.2023.012', 1),
        ('Community-Based Natural Resource Management', 'Bluwstein, J.; Lund, J.F.', 2022, '10.1234/tjpsd.2022.008', 1);
        
        RAISE NOTICE 'Seeded 20 sample articles';
    ELSE
        RAISE NOTICE 'Articles already exist (count: %)', article_count;
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geodata_country ON readership_geodata(country_code);
CREATE INDEX IF NOT EXISTS idx_geodata_timestamp ON readership_geodata(timestamp);
CREATE INDEX IF NOT EXISTS idx_geodata_event_type ON readership_geodata(event_type);
