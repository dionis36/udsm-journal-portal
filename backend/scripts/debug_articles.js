const { Client } = require('pg');
require('dotenv').config();

async function debugData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        console.log('--- JOURNAL DATA ---');
        const journals = await client.query('SELECT journal_id, path, name FROM platform_journals');
        console.table(journals.rows);

        console.log('\n--- ARTICLE COUNT PER JOURNAL ---');
        const counts = await client.query(`
            SELECT j.path, count(a.item_id) 
            FROM platform_journals j 
            LEFT JOIN platform_articles a ON j.journal_id = a.journal_id 
            GROUP BY j.path
        `);
        console.table(counts.rows);

        console.log('\n--- SAMPLE ARTICLES ---');
        const samples = await client.query('SELECT item_id, journal_id, title FROM platform_articles LIMIT 5');
        console.table(samples.rows);

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await client.end();
    }
}

debugData();
