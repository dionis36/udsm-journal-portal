const db = require('../db');

async function checkData() {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_rows,
                COUNT(DISTINCT country_name) as distinct_countries,
                COUNT(DISTINCT city_name) as distinct_cities,
                COUNT(DISTINCT item_id) as distinct_articles,
                COUNT(*) FILTER (WHERE event_type = 'PDF_DOWNLOAD') as downloads
            FROM readership_geodata
        `);
        console.log('Data Integrity Check:', result.rows[0]);

        const sample = await db.query('SELECT * FROM readership_geodata LIMIT 1');
        console.log('Sample Row:', sample.rows[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkData();
