const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sql = fs.readFileSync(
            path.join(__dirname, '003_external_metrics.sql'),
            'utf8'
        );

        await client.query(sql);
        console.log('✓ Migration 003_external_metrics.sql completed');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
    }
}

runMigration();
