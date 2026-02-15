const db = require('../db');

async function verifyBridge() {
    console.log('🏁 Verifying OJS -> PostGIS Bridge...');

    try {
        // 1. Check total rows in view
        const countRes = await db.query('SELECT COUNT(*) FROM readership_geodata_from_ojs');
        const count = countRes.rows[0].count;
        console.log(`✅ Total events in Bridge View: ${count}`);

        // 2. Check unmapped locations (where location_point is null or centroid 0,0)
        const unmappedRes = await db.query(`
            SELECT country_code, city_name, COUNT(*) as hit_count
            FROM readership_geodata_from_ojs
            WHERE ST_X(location_point) = 0 AND ST_Y(location_point) = 0
            GROUP BY country_code, city_name
            ORDER BY hit_count DESC
            LIMIT 10;
        `);

        if (unmappedRes.rows.length > 0) {
            console.log('\n⚠️ Unmapped Locations (Defaulted to 0,0):');
            unmappedRes.rows.forEach(row => {
                console.log(` - ${row.country_code} | ${row.city_name}: ${row.hit_count} hits`);
            });
        } else {
            console.log('\n✨ All locations successfully mapped to coordinates!');
        }

        // 3. Sample check a few mapped rows
        const sampleRes = await db.query(`
            SELECT country_code, city_name, ST_AsText(location_point) as point
            FROM readership_geodata_from_ojs
            WHERE ST_X(location_point) != 0
            LIMIT 5;
        `);
        console.log('\n📍 Sample Mapped Points:');
        sampleRes.rows.forEach(row => {
            console.log(` - ${row.city_name} (${row.country_code}): ${row.point}`);
        });

    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        process.exit();
    }
}

verifyBridge();
