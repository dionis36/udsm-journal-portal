const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const JOURNAL_ID = 1; // TJPSD
const DETAILS_URL = 'https://s01.flagcounter.com/countries/6Axm/';

async function scrapeTJPSD() {
    console.log('🚀 Starting High-Fidelity Historical Expansion for TJPSD (6Axm)...');

    try {
        console.log(`🔍 Fetching Country Details: ${DETAILS_URL}`);
        const detailsRes = await axios.get(DETAILS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $details = cheerio.load(detailsRes.data);
        const countries = [];

        $details('table[cellspacing="5"] tr').each((i, el) => {
            const countryName = $details(el).find('u').text().trim();
            if (countryName) {
                const tds = $details(el).find('td');
                const hitsText = tds.eq(4).text().trim().replace(/,/g, '');
                const lastVisitor = tds.eq(7).text().trim();
                const hits = parseInt(hitsText) || 0;

                if (hits > 0) {
                    countries.push({ name: countryName, hits, lastVisitor });
                }
            }
        });

        console.log(`📊 Identified ${countries.length} nations. Total Historial Hits: ${countries.reduce((a, b) => a + b.hits, 0)}`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Clear previous historical entries
            await client.query("DELETE FROM readership_geodata WHERE journal_id = $1 AND event_type = 'historical_baseline'", [JOURNAL_ID]);

            // Approximate center points for major regions (simplified)
            const regionCenters = {
                'Tanzania': [34.8, -6.3],
                'United States': [-95.7, 37.0],
                'Kenya': [37.9, -0.02],
                'Nigeria': [8.0, 9.0],
                'United Kingdom': [-1.1, 52.3],
                'India': [78.9, 20.5],
                'South Africa': [22.9, -30.5],
                'China': [104.1, 35.8],
                'Germany': [10.4, 51.1],
                'Canada': [-106.3, 56.1]
            };

            let totalInserted = 0;
            for (const country of countries) {
                const center = regionCenters[country.name] || [34.8, -6.3]; // Default to TZ if unknown

                // For each hit, we insert a jittered point
                for (let i = 0; i < country.hits; i++) {
                    const jitterLng = center[0] + (Math.random() - 0.5) * 5; // 5 degree jitter
                    const jitterLat = center[1] + (Math.random() - 0.5) * 5;

                    let timestamp = new Date();
                    try {
                        if (country.lastVisitor.includes(',')) {
                            timestamp = new Date(country.lastVisitor);
                        }
                    } catch (e) { }

                    await client.query(
                        `INSERT INTO readership_geodata (
                            journal_id, country_name, event_type, session_duration, location_point, timestamp
                        ) VALUES ($1, $2, 'historical_baseline', 0, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)`,
                        [JOURNAL_ID, country.name, jitterLng, jitterLat, timestamp]
                    );
                    totalInserted++;
                }
            }

            await client.query('COMMIT');
            console.log(`✅ Success: Expanded and persisted ${totalInserted} historical points to PostGIS.`);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('❌ TJPSD Expansion Failed:', err);
    } finally {
        await pool.end();
    }
}

scrapeTJPSD();
