const db = require('../db');

async function fixSchema() {
    try {
        console.log('🔧 Fixing Database Schema...');

        // 1. Add columns if they don't exist
        await db.query(`
            ALTER TABLE platform_articles 
            ADD COLUMN IF NOT EXISTS citations INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS citations_updated_at TIMESTAMP DEFAULT NULL
        `);
        console.log('✅ Added citations column.');

        // 2. Populate with dummy data for demo
        // We want some articles to have high citations to show "Hidden Gems"
        const updateResult = await db.query(`
            UPDATE platform_articles 
            SET citations = FLOOR(RANDOM() * 50)::int
            WHERE citations IS NULL OR citations = 0
        `);

        console.log(`✅ Populated ${updateResult.rowCount} articles with random citations.`);

        // 3. Create a few "Star" papers (High Downloads [already in DB] + High Citations)
        // We need to know which items have high downloads first, but for now just random high citations
        // is enough to create scatter.

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
fixSchema();
