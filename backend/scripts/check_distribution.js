const db = require('../db');
const fs = require('fs');

async function checkDistribution() {
    try {
        let output = '';

        // 1. Total count
        const total = await db.query('SELECT COUNT(*) FROM readership_geodata');
        output += `Total Rows: ${total.rows[0].count}\n\n`;

        // 2. Distinct Coordinates
        const distCoords = await db.query('SELECT COUNT(DISTINCT location_point) FROM readership_geodata');
        output += `Distinct Locations: ${distCoords.rows[0].count}\n\n`;

        // 3. Sample Locations
        const samples = await db.query(`
            SELECT ST_AsText(location_point) as loc, city_name, country_name, count(*) as cnt 
            FROM readership_geodata 
            GROUP BY location_point, city_name, country_name 
            ORDER BY cnt DESC 
            LIMIT 10
        `);
        output += '--- Top 10 Locations ---\n';
        output += JSON.stringify(samples.rows, null, 2) + '\n\n';

        // 4. Cache Content
        const cacheStats = await db.query('SELECT count(*) FROM readership_heatmap_cache');
        output += `Cache Rows: ${cacheStats.rows[0].count}\n`;

        fs.writeFileSync('distribution_check.txt', output);
        console.log('Written to distribution_check.txt');

    } catch (err) {
        console.error(err);
        fs.writeFileSync('distribution_check.txt', err.message);
    } finally {
        process.exit();
    }
}

checkDistribution();
