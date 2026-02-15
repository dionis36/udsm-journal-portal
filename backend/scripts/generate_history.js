const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const CITIES = [
    { name: 'Dar es Salaam', country: 'Tanzania', code: 'TZ', reg: 'Coast', lat: -6.7924, lng: 39.2083 },
    { name: 'Dodoma', country: 'Tanzania', code: 'TZ', reg: 'Central', lat: -6.1722, lng: 35.7481 },
    { name: 'Nairobi', country: 'Kenya', code: 'KE', reg: 'Nairobi', lat: -1.2921, lng: 36.8219 },
    { name: 'London', country: 'United Kingdom', code: 'GB', reg: 'England', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', country: 'United States', code: 'US', reg: 'NY', lat: 40.7128, lng: -74.0060 },
    { name: 'Beijing', country: 'China', code: 'CN', reg: 'Beijing', lat: 39.9042, lng: 116.4074 },
    { name: 'Cape Town', country: 'South Africa', code: 'ZA', reg: 'Western Cape', lat: -33.9249, lng: 18.4241 },
    { name: 'Mumbai', country: 'India', code: 'IN', reg: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
    { name: 'Lagos', country: 'Nigeria', code: 'NG', reg: 'Lagos', lat: 6.5244, lng: 3.3792 },
    { name: 'Berlin', country: 'Germany', code: 'DE', reg: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { name: 'Sydney', country: 'Australia', code: 'AU', reg: 'NSW', lat: -33.8688, lng: 151.2093 },
    { name: 'Rio de Janeiro', country: 'Brazil', code: 'BR', reg: 'RJ', lat: -22.9068, lng: -43.1729 },
    { name: 'Cairo', country: 'Egypt', code: 'EG', reg: 'Cairo', lat: 30.0444, lng: 31.2357 },
    { name: 'Tokyo', country: 'Japan', code: 'JP', reg: 'Tokyo', lat: 35.6762, lng: 139.6503 }
];

async function generate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log("--- Generating Synthetic History (Level 2 Pulse) ---");

        // 0. Clean old data to prevent "Unknowns" or bad geography
        await pool.query("TRUNCATE TABLE readership_geodata");
        console.log("Table truncated.");

        // 1. Fetch valid IDs
        const journalsRes = await pool.query("SELECT journal_id FROM platform_journals");
        const articlesRes = await pool.query("SELECT item_id FROM platform_articles");

        const journals = journalsRes.rows.map(r => r.journal_id);
        const articles = articlesRes.rows.map(r => r.item_id);

        if (journals.length === 0 || articles.length === 0) {
            console.error("No journals or articles found to link data to.");
            return;
        }

        console.log(`Linking to ${journals.length} journals and ${articles.length} articles.`);

        // 2. Generate 1000 hits (can be scaled up)
        const totalHits = 1000;
        let successCount = 0;

        for (let i = 0; i < totalHits; i++) {
            const city = CITIES[Math.floor(Math.random() * CITIES.length)];
            const journalId = journals[Math.floor(Math.random() * journals.length)];
            const itemId = articles[Math.floor(Math.random() * articles.length)];
            const eventType = Math.random() > 0.7 ? 'download' : 'view';
            const duration = Math.floor(Math.random() * 900) + 10; // 10s to 15m

            // Add slight jitter to coordinates so points don't stack exactly
            const jitterLat = city.lat + (Math.random() - 0.5) * 0.1;
            const jitterLng = city.lng + (Math.random() - 0.5) * 0.1;

            await pool.query(
                `INSERT INTO readership_geodata (
                    journal_id, item_id, location_point, event_type, 
                    session_duration, country_name, country_code, city_name, region_name
                ) 
                VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10)`,
                [journalId, itemId, jitterLng, jitterLat, eventType, duration, city.country, city.code, city.name, city.reg]
            );

            if (i % 100 === 0) process.stdout.write(".");
            successCount++;
        }

        console.log(`\n✅ Generated ${successCount} hits successfully.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

generate();
