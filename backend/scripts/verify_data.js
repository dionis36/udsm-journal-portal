const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function verifyData() {
    console.log('🔍 Verifying Demo Data Quality\n');

    try {
        // 1. Check country distribution
        const countries = await db.query(`
            SELECT country_code, COUNT(*) as count 
            FROM readership_geodata 
            GROUP BY country_code 
            ORDER BY count DESC 
            LIMIT 15
        `);

        console.log('📊 Top 15 Countries by Readership:');
        countries.rows.forEach(r => console.log(`  ${r.country_code}: ${r.count} events`));

        // 2. Check total stats
        const totals = await db.query(`
            SELECT 
                COUNT(DISTINCT country_code) as countries,
                COUNT(DISTINCT city_name) as cities,
                COUNT(*) as total_events,
                COUNT(DISTINCT item_id) as articles_with_data
            FROM readership_geodata
        `);

        console.log('\n🌍 Geographic Coverage:');
        console.log(`  Countries: ${totals.rows[0].countries}`);
        console.log(`  Cities: ${totals.rows[0].cities}`);
        console.log(`  Total Events: ${totals.rows[0].total_events}`);
        console.log(`  Articles with data: ${totals.rows[0].articles_with_data}`);

        // 3. Check event type distribution
        const eventTypes = await db.query(`
            SELECT event_type, COUNT(*) as count 
            FROM readership_geodata 
            GROUP BY event_type
        `);

        console.log('\n📈 Event Type Distribution:');
        eventTypes.rows.forEach(r => console.log(`  ${r.event_type}: ${r.count}`));

        // 4. Check time distribution
        const timeDistribution = await db.query(`
            SELECT 
                DATE_TRUNC('month', timestamp) as month,
                COUNT(*) as count
            FROM readership_geodata
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        `);

        console.log('\n📅 Last 6 Months Distribution:');
        timeDistribution.rows.forEach(r => {
            const date = new Date(r.month);
            console.log(`  ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}: ${r.count} events`);
        });

        // 5. Check articles table
        const articles = await db.query(`
            SELECT COUNT(*) as total, COUNT(DISTINCT title) as unique_titles 
            FROM platform_articles
        `);

        console.log('\n📚 Articles Database:');
        console.log(`  Total: ${articles.rows[0].total}`);
        console.log(`  Unique titles: ${articles.rows[0].unique_titles}`);

        // 6. Check sample article
        const sample = await db.query(`
            SELECT title, authors 
            FROM platform_articles 
            LIMIT 3
        `);

        console.log('\n📄 Sample Articles:');
        sample.rows.forEach(r => console.log(`  - "${r.title}"`));

        console.log('\n✅ Data verification complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

verifyData();
