const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function listData() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log("--- Database Tables ---");
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name));

        console.log("\n--- Samples ---");

        // Find the correct journal table name
        const journalTable = tables.rows.find(r => r.table_name === 'journals' || r.table_name === 'platform_journals')?.table_name;
        if (journalTable) {
            const journals = await pool.query(`SELECT journal_id FROM ${journalTable} LIMIT 5`);
            console.log(`${journalTable} IDs:`, journals.rows.map(r => r.journal_id));
        }

        const articleTable = tables.rows.find(r => r.table_name === 'platform_articles' || r.table_name === 'articles')?.table_name;
        if (articleTable) {
            const articles = await pool.query(`SELECT item_id FROM ${articleTable} LIMIT 5`);
            console.log(`${articleTable} IDs:`, articles.rows.map(r => r.item_id));
        }

        console.log("\n--- Article Columns ---");
        const aCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'platform_articles'");
        console.log(aCols.rows);

        console.log("\n--- Readership Geodata Columns ---");
        const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'readership_geodata'");
        console.log(columns.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

listData();
