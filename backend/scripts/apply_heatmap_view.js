const db = require('../db');
const fs = require('fs');
const path = require('path');

async function applyView() {
    try {
        const sqlPath = path.join(__dirname, 'setup_heatmap_view.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing SQL from setup_heatmap_view.sql...');
        await db.query(sql);
        console.log('Successfully created/refreshed materialized view.');
    } catch (err) {
        console.error('Error applying view:', err);
    } finally {
        process.exit();
    }
}

applyView();
