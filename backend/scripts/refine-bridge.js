const db = require('../db');

async function refineBridgeFinal() {
    console.log('🏗️ Refining Analytics Infrastructure (Fixed Syntax)...');

    try {
        // 1. Extensions
        console.log('📌 Enabling extensions...');
        await db.query('CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;');
        await db.query('CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;');

        // 2. Resolution Function
        console.log('📌 Creating resolution function...');
        await db.query(`
            CREATE OR REPLACE FUNCTION public.get_coordinates_from_city(
                p_country_code VARCHAR(10),
                p_region VARCHAR(10),
                p_city VARCHAR(255)
            ) RETURNS public.GEOMETRY AS $$
            DECLARE
                v_lat DOUBLE PRECISION := NULL;
                v_lng DOUBLE PRECISION := NULL;
            BEGIN
                -- 1. Handle NULL or empty country
                IF p_country_code IS NULL OR p_country_code = '' THEN
                   RETURN public.ST_SetSRID(public.ST_MakePoint(34.8888, -6.3690), 4326);
                END IF;

                -- 2. Try lookup
                SELECT latitude, longitude INTO v_lat, v_lng
                FROM public.geoip_cities
                WHERE country_code = p_country_code
                  AND LOWER(city_name) = LOWER(TRIM(COALESCE(p_city, '')))
                LIMIT 1;
                
                -- 3. Fallbacks
                IF v_lat IS NULL THEN
                    CASE p_country_code
                        WHEN 'TZ' THEN v_lat := -6.3690; v_lng := 34.8888;
                        ELSE v_lat := 0; v_lng := 0;
                    END CASE;
                END IF;

                RETURN public.ST_SetSRID(public.ST_MakePoint(v_lng, v_lat), 4326);
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
        `);

        // 3. Materialized View
        console.log('📌 Creating readership_geodata_from_ojs...');
        await db.query(`
            DROP MATERIALIZED VIEW IF EXISTS public.readership_geodata_from_ojs CASCADE;
            
            CREATE MATERIALIZED VIEW public.readership_geodata_from_ojs AS
            SELECT 
                gen_random_uuid() as id,
                m.context_id::text as journal_id,
                m.submission_id::text as item_id,
                TO_TIMESTAMP(m.day, 'YYYYMMDD') as timestamp,
                CASE 
                    WHEN m.assoc_type = 515 THEN 'download'
                    WHEN m.assoc_type = 1048585 THEN 'view'
                    ELSE 'visit'
                END as event_type,
                public.get_coordinates_from_city(m.country_id, m.region, m.city) as location_point,
                COALESCE(m.country_id, 'TZ') as country_code,
                COALESCE(m.city, 'Unknown City') as city_name,
                'OJS_LEGACY' as data_source
            FROM public.metrics m;
            
            CREATE INDEX idx_ojs_view_location ON public.readership_geodata_from_ojs USING GIST (location_point);
        `);

        // 4. Unified Global View
        console.log('📌 Creating global_analytics_view...');
        await db.query(`
            CREATE OR REPLACE VIEW public.global_analytics_view AS
            SELECT 
                id, journal_id, item_id, timestamp, event_type, location_point, country_code, city_name, 
                'NEW_SYSTEM' as data_source, metadata->>'institution' as institution
            FROM public.readership_geodata
            UNION ALL
            SELECT 
                id, journal_id, item_id, timestamp, event_type, location_point, country_code, city_name, 
                'OJS_LEGACY' as data_source, NULL as institution
            FROM public.readership_geodata_from_ojs;
        `);

        console.log('✅ Infrastructure finalized successfully.');

    } catch (err) {
        console.error('❌ Refinement failed:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

refineBridgeFinal();
