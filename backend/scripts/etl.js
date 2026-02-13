const fs = require('fs');
const readline = require('readline');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql'); // Target the file WITH data
const MAX_METRICS_ROWS = 500; // Selective extraction limit

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runETL() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const fileStream = fs.createReadStream(SQL_FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        let metricsCount = 0;
        const dailyCounts = []; // Store { date: '20200325', count: 4 }

        console.log('Starting Extract (Selective)...');

        for await (const line of rl) {
            // 2. Extract Metrics (Values)
            if (line.includes('INSERT INTO `metrics`') && metricsCount < MAX_METRICS_ROWS) {
                // Capture: '20200325', ..., 'ojs::counter', 4
                const matches = line.matchAll(/'(\d{8})', '[^']+', (?:NULL|'[^']*'), (?:NULL|'[^']*'), (?:NULL|'[^']*'), (?:NULL|'[^']*'), '([^']+)', (\d+)\)/g);

                for (const match of matches) {
                    const dateStr = match[1]; // yyyyMMdd
                    const type = match[2];
                    const count = parseInt(match[3], 10);

                    if (type === 'ojs::counter' && count > 0) {
                        dailyCounts.push({ date: dateStr, count });
                        metricsCount++;
                    }
                }
            }
        }

        console.log(`Extraction Done. Found ${dailyCounts.length} metric entries.`);
        console.log('Transforming and Loading Data...');

        // 1. Insert ZJAHS Journal (Fixed for demo)
        const journalRes = await client.query(`
          INSERT INTO platform_journals (path, name, branding)
          VALUES ($1, $2, $3)
          ON CONFLICT (path) DO UPDATE SET name = EXCLUDED.name
          RETURNING journal_id;
        `, ['zjahs', 'Zoology Journal', JSON.stringify({ primary_color: '#005bb7' })]);

        const journalId = journalRes.rows[0].journal_id;

        // 2. Generate Geospatial Data from Metrics
        // Bias towards Tanzania (Lat: -6, Lon: 39)
        let insertedPoints = 0;

        for (const item of dailyCounts) {
            const { date, count } = item;
            const isoDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)} 12:00:00`;

            for (let i = 0; i < count; i++) {
                let lat, lon, city = 'Dar es Salaam', country = 'TZ';

                // 70% Tanzania / 30% Global
                if (Math.random() > 0.3) {
                    // Dar es Salaam / Tanzania rough box
                    lat = -6.79 + (Math.random() * 2 - 1);
                    lon = 39.20 + (Math.random() * 2 - 1);
                } else {
                    // Global random
                    lat = (Math.random() * 160) - 80;
                    lon = (Math.random() * 360) - 180;
                    country = 'Global';
                    city = 'International';
                }

                await client.query(`
                  INSERT INTO readership_geodata (journal_id, location_point, country_code, city_name, event_type, timestamp)
                  VALUES 
                  ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, 'PDF_DOWNLOAD', $6)
                `, [journalId, lon, lat, country, city, isoDate]);
                insertedPoints++;
            }
        }

        console.log(`ETL Completed. Inserted ${insertedPoints} geospatial points.`);

    } catch (err) {
        console.error('ETL Failed:', err);
    } finally {
        await client.end();
    }
}

runETL();
