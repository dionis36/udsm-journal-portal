const { getRankingService } = require('../services/redis-rankings');
const db = require('../db');

/**
 * Simulate Real-Time Traffic
 * Generates random read events to populate Redis/Memory rankings
 * Run this in background to make the "Top This Week" feature live
 */
async function simulateTraffic() {
    console.log('🚦 Starting traffic simulation...');
    console.log('   Press Ctrl+C to stop\n');

    const rankingService = getRankingService();

    // Get some real article IDs
    const result = await db.query('SELECT item_id, title FROM platform_articles LIMIT 50');
    const articles = result.rows;

    if (articles.length === 0) {
        console.error('❌ No articles found in database');
        process.exit(1);
    }

    console.log(`✓ Loaded ${articles.length} articles for simulation`);

    // Weighted random selection (some articles are more popular)
    const getRandomArticle = () => {
        // 20% of articles get 80% of traffic (Pareto principle)
        const popularCount = Math.ceil(articles.length * 0.2);

        if (Math.random() < 0.8) {
            // Pick from popular
            const idx = Math.floor(Math.random() * popularCount);
            return articles[idx];
        } else {
            // Pick from others
            const idx = Math.floor(Math.random() * (articles.length - popularCount)) + popularCount;
            return articles[idx];
        }
    };

    let events = 0;

    // Simulate loop
    while (true) {
        const article = getRandomArticle();

        await rankingService.incrementRead(article.item_id, 'week');
        events++;

        process.stdout.write(`\r📈 Generated ${events} reads - Latest: "${article.title.substring(0, 30)}..."`);

        // Random delay between 100ms and 2000ms
        const delay = Math.floor(Math.random() * 1900) + 100;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Start if run directly
if (require.main === module) {
    require('dotenv').config();
    simulateTraffic().catch(console.error);
}

module.exports = simulateTraffic;
