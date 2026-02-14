const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function verifyData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const client = await pool.connect();
        console.log('Connected to database');

        const res = await client.query('SELECT event_type, COUNT(*) FROM readership_geodata GROUP BY event_type;');
        console.log('Event Type Distribution:');
        console.table(res.rows);

        const count = await client.query('SELECT COUNT(*) FROM readership_geodata;');
        console.log('Total geopoints:', count.rows[0].count);

        client.release();
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

verifyData();
