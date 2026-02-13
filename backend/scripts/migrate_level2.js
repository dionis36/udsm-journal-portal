const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log("--- Starting Migration: Level 2 Pulse Metrics ---");

        await pool.query(`
            DROP TABLE IF EXISTS readership_geodata CASCADE;

            CREATE TABLE readership_geodata (
                event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                journal_id INTEGER,
                item_id BIGINT,
                location_point GEOMETRY(Point, 4326),
                event_type VARCHAR(50) DEFAULT 'view',
                country_code CHAR(2),
                country_name VARCHAR(100),
                region_name VARCHAR(100),
                city_name VARCHAR(100),
                session_duration INTEGER,
                is_institutional BOOLEAN DEFAULT false,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX idx_geodata_points ON readership_geodata USING GIST (location_point);
            CREATE INDEX idx_geodata_journal ON readership_geodata (journal_id);
            CREATE INDEX idx_geodata_item ON readership_geodata (item_id);
        `);

        console.log("✅ Schema recreated successfully: Level 2 Pulse ready.");

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
