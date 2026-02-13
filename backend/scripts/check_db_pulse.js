const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        console.log("--- Tables ---");
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name));

        console.log("\n--- Metrics Columns ---");
        const columns = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'metrics'");
        console.log(columns.rows);

        console.log("\n--- Extensions ---");
        const extensions = await client.query("SELECT extname FROM pg_extension");
        console.log(extensions.rows.map(r => r.extname));

    } catch (err) {
        console.error("Database connection error:", err);
    } finally {
        await client.end();
    }
}

checkDatabase();
