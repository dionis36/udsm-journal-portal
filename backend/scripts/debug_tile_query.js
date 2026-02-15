const db = require('../db');

// Mock request parameters for Tile 0/0/0
const z = 0, x = 0, y = 0;

async function debugTileQuery() {
    try {
        console.log(`Testing Tile Query for ${z}/${x}/${y}...`);

        // Exact query from tiles.js (Low Zoom)
        const query = `
            WITH tile_data AS (
                SELECT 
                    geom,
                    weight,
                    event_type,
                    journal_id::text
                FROM readership_heatmap_cache
                WHERE ST_Transform(geom, 3857) && ST_TileEnvelope($1, $2, $3)
            )
            SELECT count(*) as row_count FROM tile_data;
        `;

        const res = await db.query(query, [z, x, y]);
        console.log(`Low Zoom Query matches: ${res.rows[0].row_count} rows`);

        // High Zoom Query check (random spot, e.g., Beijing)
        // Beijing is approx Tile 10/843/385 (need calculate, but let's just check global high zoom logic if it wasn't filtered)
        // Actually, let's just check the High Zoom Logic logic on Zoom 0 envelope to see if it finds points (ignoring the zoom<10 check for a moment)
        const queryHigh = `
            WITH tile_data AS (
                SELECT 
                    location_point
                FROM readership_geodata
                WHERE ST_Transform(location_point, 3857) && ST_TileEnvelope($1, $2, $3)
                AND location_point IS NOT NULL
            )
            SELECT count(*) as row_count FROM tile_data;
        `;
        const resHigh = await db.query(queryHigh, [0, 0, 0]);
        console.log(`High Zoom Logic (on World Envelope) matches: ${resHigh.rows[0].row_count} rows`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugTileQuery();
