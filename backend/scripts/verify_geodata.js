const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verify() {
    try {
        const res = await pool.query(`
            SELECT country_name, COUNT(*) 
            FROM readership_geodata 
            WHERE event_type = 'historical_baseline' 
            GROUP BY country_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 10
        `);
        console.log('--- Top 10 Historical Countries ---');
        console.table(res.rows);

        const total = await pool.query("SELECT COUNT(*) FROM readership_geodata WHERE event_type = 'historical_baseline'");
        console.log(`Total Historical Hits: ${total.rows[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verify();
