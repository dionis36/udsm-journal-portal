const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkGeodata() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        console.log("--- Readership Geodata Columns ---");
        const columns = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'readership_geodata'");
        console.log(columns.rows);

        const count = await client.query("SELECT count(*) FROM readership_geodata");
        console.log("\nTotal records:", count.rows[0].count);

        const sample = await client.query("SELECT * FROM readership_geodata LIMIT 5");
        console.log("\nSample records:", sample.rows);

    } catch (err) {
        console.error("Database connection error:", err);
    } finally {
        await client.end();
    }
}

checkGeodata();
