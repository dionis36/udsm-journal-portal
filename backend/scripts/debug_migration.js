const db = require('../db');
const fs = require('fs');

async function debugMigration() {
    try {
        let output = '';

        output += '--- Sample Metrics (WHERE city IS NOT NULL) ---\n';
        const resMetrics = await db.query(`SELECT city, country_id FROM metrics WHERE city IS NOT NULL AND city != '' LIMIT 10`);
        output += JSON.stringify(resMetrics.rows, null, 2) + '\n';

        output += '--- Sample GeoIP Cities ---\n';
        const resGeo = await db.query(`SELECT city_name, country_code FROM geoip_cities LIMIT 10`);
        output += JSON.stringify(resGeo.rows, null, 2) + '\n';

        output += '--- Test Join ---\n';
        const resJoin = await db.query(`
            SELECT m.city, m.country_id, g.city_name, g.country_code 
            FROM metrics m 
            JOIN geoip_cities g ON LOWER(m.country_id) = LOWER(g.country_code) AND LOWER(m.city) = LOWER(g.city_name)
            LIMIT 5
        `);
        output += `Join matches: ${resJoin.rowCount}\n`;
        if (resJoin.rowCount > 0) output += JSON.stringify(resJoin.rows, null, 2) + '\n';

        fs.writeFileSync('debug_output.txt', output);
        console.log('Written to debug_output.txt');

    } catch (err) {
        console.error(err);
        fs.writeFileSync('debug_output.txt', err.message);
    } finally {
        process.exit();
    }
}

debugMigration();
