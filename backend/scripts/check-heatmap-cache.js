const db = require('../db');

async function checkCache() {
    try {
        console.log('Checking readership_heatmap_cache...');

        // Check if view exists
        const viewCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM pg_matviews 
                WHERE matviewname = 'readership_heatmap_cache'
            );
        `);

        if (!viewCheck.rows[0].exists) {
            console.log('❌ Materialized View "readership_heatmap_cache" DOES NOT EXIST.');
            return;
        }

        const count = await db.query('SELECT COUNT(*) FROM readership_heatmap_cache');
        console.log(`Cache Row count: ${count.rows[0].count}`);

        const totalEvents = await db.query('SELECT COUNT(*) FROM readership_geodata');
        console.log(`Total Events count: ${totalEvents.rows[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkCache();
