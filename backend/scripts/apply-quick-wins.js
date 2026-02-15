const db = require('../db');

async function applyQuickWins() {
    console.log('🚀 Applying Database Quick Wins...');

    try {
        // 0. Check if table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'readership_geodata'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.error('❌ Table readership_geodata NOT found. Skipping index creation.');
            process.exit(0);
        }

        // 1. Create GIST Index for spatial queries
        console.log('📌 Creating GIST index on readership_geodata(location_point)...');
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_geodata_location_gist 
            ON readership_geodata USING GIST (location_point);
        `);
        console.log('✅ GIST index created successfully.');

        // 2. Add composite index for timestamp and journal_id (frequent filters)
        console.log('📌 Creating composite index on timestamp and journal_id...');
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_geodata_timestamp_journal 
            ON readership_geodata (timestamp DESC, journal_id);
        `);
        console.log('✅ Composite index created successfully.');

        // 3. Verify indexes
        const res = await db.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'readership_geodata';
        `);
        console.log('\n📊 Current indexes on readership_geodata:');
        res.rows.forEach(row => console.log(` - ${row.indexname}`));

    } catch (err) {
        console.error('❌ Error applying quick wins:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

applyQuickWins();
