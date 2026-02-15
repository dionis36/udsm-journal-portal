const db = require('../db');

async function checkCitationsTable() {
    try {
        console.log('Testing article_citations table...');

        // Check if table exists
        const tableCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'article_citations'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Table "article_citations" exists.');
            const count = await db.query('SELECT COUNT(*) FROM article_citations');
            console.log(`Row count: ${count.rows[0].count}`);
        } else {
            console.log('❌ Table "article_citations" DOES NOT EXIST.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkCitationsTable();
