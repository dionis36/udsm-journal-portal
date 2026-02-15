const db = require('../db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add weight column if not exists
        console.log('Adding weight column...');
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='readership_geodata' AND column_name='weight') THEN 
                    ALTER TABLE readership_geodata ADD COLUMN weight INTEGER DEFAULT 1; 
                END IF; 
            END $$;
        `);

        // 2. Migrate legacy data (non-geo)
        console.log('Migrating legacy metrics (non-geo)...');
        // Since no geo data, we insert with NULL location
        const res = await db.query(`
            INSERT INTO readership_geodata (
                event_id, 
                journal_id, 
                location_point, 
                event_type, 
                country_code, 
                country_name, 
                city_name, 
                timestamp, 
                weight
            )
            SELECT 
                gen_random_uuid(),
                m.context_id,
                NULL, -- No location
                CASE WHEN m.assoc_type = 515 THEN 'download' ELSE 'view' END,
                NULL, -- No country code
                'Unknown',
                'Historical Audit',
                TO_TIMESTAMP(m.day, 'YYYYMMDD'),
                m.metric
            FROM metrics m
            WHERE m.metric > 0
            ON CONFLICT DO NOTHING;
        `);

        console.log(`Migrated ${res.rowCount} rows.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
