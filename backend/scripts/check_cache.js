const db = require('../db');
const fs = require('fs');

async function checkCache() {
    try {
        const res = await db.query(`
            SELECT 
                ST_AsText(geom) as grid_center, 
                weight, 
                journal_id, 
                event_type 
            FROM readership_heatmap_cache 
            ORDER BY weight DESC 
            LIMIT 20
        `);

        let output = '--- Cache Content (Top 20) ---\n';
        output += JSON.stringify(res.rows, null, 2);

        fs.writeFileSync('cache_check.txt', output);
        console.log('Written to cache_check.txt');

    } catch (err) {
        console.error(err);
        fs.writeFileSync('cache_check.txt', err.message);
    } finally {
        process.exit();
    }
}

checkCache();
