const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
    try {
        console.log('🔍 Checking database schema...\n');

        // Check which tables exist
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('platform_articles', 'research_items', 'readership_geodata', 'platform_journals')
            ORDER BY table_name
        `);

        console.log('📊 Existing tables:');
        if (tables.rows.length === 0) {
            console.log('  ❌ NO TABLES FOUND!');
        } else {
            tables.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
        }

        // Check readership_geodata columns
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'readership_geodata'
            ORDER BY ordinal_position
        `);

        console.log('\n📝 readership_geodata columns:');
        if (columns.rows.length === 0) {
            console.log('  ❌ Table does not exist!');
        } else {
            columns.rows.forEach(r => {
                console.log(`  - ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            });
        }

        // Check article count
        const articleCheck = await pool.query(`
            SELECT COUNT(*) as count FROM platform_articles
        `).catch(() => ({ rows: [{ count: 0 }] }));

        console.log(`\n📚 Articles in database: ${articleCheck.rows[0].count}`);

        // Check existing events
        const eventCheck = await pool.query(`
            SELECT COUNT(*) as count FROM readership_geodata
        `).catch(() => ({ rows: [{ count: 0 }] }));

        console.log(`📍 Existing events: ${eventCheck.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
