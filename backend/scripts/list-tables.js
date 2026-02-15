const db = require('../db');

async function listTables() {
    try {
        const res = await db.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name;
        `);
        console.log('📊 Database Tables:');
        res.rows.forEach(row => {
            console.log(` - ${row.table_schema}.${row.table_name}`);
        });
    } catch (err) {
        console.error('Error listing tables:', err);
    } finally {
        process.exit();
    }
}

listTables();
