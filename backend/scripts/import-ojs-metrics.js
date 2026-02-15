const fs = require('fs');
const readline = require('readline');
const db = require('../db');
const path = require('path');

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');
const MAX_ROWS = 1000; // Limit for development/testing

async function importOjsMetrics() {
    console.log('📥 Importing OJS Metrics from SQL dump...');

    try {
        // 1. Create metrics table (Simplified version of what we saw in the dump)
        console.log('📌 Creating metrics table in DB...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS metrics (
                load_id VARCHAR(255),
                context_id BIGINT,
                submission_id BIGINT,
                assoc_type BIGINT,
                day VARCHAR(8),
                month VARCHAR(6),
                country_id VARCHAR(2),
                region VARCHAR(2),
                city VARCHAR(255),
                metric_type VARCHAR(255),
                metric INT
            );
        `);

        // 2. Parse file and insert data
        const fileStream = fs.createReadStream(SQL_FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let insertedCount = 0;
        let isInMetricsInsert = false;

        console.log('📌 Parsing SQL dump for metrics data...');
        for await (const line of rl) {
            if (line.includes('INSERT INTO `metrics`')) {
                isInMetricsInsert = true;
                continue;
            }

            if (isInMetricsInsert && line.includes('VALUES')) {
                continue;
            }

            if (isInMetricsInsert) {
                // Extract values using regex
                // Format: ('usage_events_20200424.log', 1, NULL, NULL, NULL, NULL, NULL, 256, 1, '20200424', '202004', NULL, NULL, NULL, NULL, 'ojs::counter', 4),
                // We need to map these to our simplified table
                // Note: The actual dump has many more columns. We'll be careful.

                const matches = line.match(/\('([^']+)',\s*(\d+),\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*(?:NULL|\d+),\s*(?:NULL|(\d+)),\s*(?:NULL|\d+),\s*(\d+),\s*\d+,\s*'(\d+)',\s*'(\d+)',\s*(?:NULL|\d+),\s*(?:NULL|'([^']*)'),\s*(?:NULL|'([^']*)'),\s*(?:NULL|'([^']*)'),\s*'([^']+)',\s*(\d+)\)/);

                if (matches && insertedCount < MAX_ROWS) {
                    const [_, loadId, contextId, submissionId, assocType, day, month, country, region, city, metricType, metric] = matches;

                    await db.query(`
                        INSERT INTO metrics (load_id, context_id, submission_id, assoc_type, day, month, country_id, region, city, metric_type, metric)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [loadId, contextId, submissionId || null, assocType, day, month, country || null, region || null, city || null, metricType, metric]);

                    insertedCount++;
                    if (insertedCount % 100 === 0) console.log(`   - Inserted ${insertedCount} rows...`);
                }
            }

            if (line.endsWith(';')) {
                isInMetricsInsert = false;
            }

            if (insertedCount >= MAX_ROWS) break;
        }

        console.log(`✅ Successfully imported ${insertedCount} OJS metrics rows.`);

    } catch (err) {
        console.error('❌ Error importing metrics:', err);
    } finally {
        process.exit();
    }
}

importOjsMetrics();
