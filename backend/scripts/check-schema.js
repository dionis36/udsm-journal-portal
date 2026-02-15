const db = require('../db');

async function checkSchema() {
    try {
        const result = await db.query('SELECT * FROM platform_articles LIMIT 1');
        if (result.rows.length > 0) {
            console.log('Column Names:', Object.keys(result.rows[0]));
        } else {
            console.log('Table is empty, cannot infer columns from row.');
            // Fallback to information_schema
            const schema = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'platform_articles'
            `);
            console.log('Schema:', schema.rows);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkSchema();
