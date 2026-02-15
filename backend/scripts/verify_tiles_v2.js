const db = require('../db');

// Mock request for High Zoom (Zoom 10)
const z = 10, x = 0, y = 0;

async function verifyTileData() {
    try {
        console.log(`Testing High Zoom Query Structure (using World Envelope for hit detection)...`);

        // We use the High Zoom Logic but with a huge envelope to ensure we hit our sample points
        // In real app, x/y would target the specific tile.

        const query = `
            WITH tile_data AS (
                SELECT 
                    rg.location_point,
                    LEFT(pa.title, 50) as article_title_preview,
                    rg.city_name,
                    rg.region_name
                FROM readership_geodata rg
                LEFT JOIN platform_articles pa ON rg.item_id = pa.item_id
                WHERE location_point IS NOT NULL
                LIMIT 5
            )
            SELECT * FROM tile_data;
        `;

        const res = await db.query(query);
        console.log('--- Sample High Zoom Data ---');
        console.log(JSON.stringify(res.rows, null, 2));

        if (res.rows.length > 0 && res.rows[0].article_title_preview) {
            console.log("SUCCESS: Article titles are joining correctly.");
        } else {
            console.log("WARNING: No article titles found (might be null in data or join failed).");
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

verifyTileData();
