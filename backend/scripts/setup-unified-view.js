const db = require('../db');

async function setupUnifiedView() {
    console.log('🏗️ Setting up Standard Unified View...');

    try {
        // 1. Simple View for GeoIP Resolution (No Extensions)
        // This uses CASE statements for common TZ cities if they exist in metrics but not coordinates
        await db.query(`
            CREATE OR REPLACE VIEW public.global_analytics_view AS
            
            -- 1. New High-Precision Data
            SELECT 
                id::text as event_id,
                journal_id::text,
                source_item_id as item_id,
                timestamp,
                event_type,
                location_point,
                country_code as country_code,
                city_name as city_name,
                'NEW_SYSTEM' as data_source
            FROM public.readership_geodata
            
            UNION ALL
            
            -- 2. Legacy OJS Data (Bridged)
            SELECT 
                m.load_id as event_id,
                m.context_id::text as journal_id,
                m.submission_id::text as item_id,
                TO_TIMESTAMP(m.day, 'YYYYMMDD') as timestamp,
                CASE 
                    WHEN m.assoc_type = 515 THEN 'download'
                    WHEN m.assoc_type = 1048585 THEN 'view'
                    ELSE 'visit'
                END as event_type,
                -- Resolve coordinates from lookup or default
                COALESCE(
                    (SELECT public.ST_SetSRID(public.ST_MakePoint(g.longitude, g.latitude), 4326) 
                     FROM public.geoip_cities g 
                     WHERE g.country_code = m.country_id AND LOWER(g.city_name) = LOWER(m.city) LIMIT 1),
                    -- Regional Fallbacks
                    CASE 
                        WHEN m.country_id = 'TZ' THEN public.ST_SetSRID(public.ST_MakePoint(39.2083, -6.7924), 4326) -- Dar es Salaam
                        ELSE public.ST_SetSRID(public.ST_MakePoint(34.8888, -6.3690), 4326) -- TZ Center
                    END
                ) as location_point,
                COALESCE(m.country_id, 'TZ') as country_code,
                COALESCE(m.city, 'Unknown') as city_name,
                'OJS_LEGACY' as data_source
            FROM public.metrics m;
        `);

        console.log('✅ Unified View (global_analytics_view) established.');

    } catch (err) {
        console.error('❌ Failed to setup unified view:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

setupUnifiedView();
