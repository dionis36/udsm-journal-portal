const db = require('../db');

async function createCitationsTable() {
    try {
        console.log('🔧 Initializing Citations Table...');

        // 1. Create table
        await db.query(`
            CREATE TABLE IF NOT EXISTS article_citations (
                citation_id SERIAL PRIMARY KEY,
                cited_article_id INTEGER REFERENCES platform_articles(item_id),
                citing_article_title TEXT,
                citing_article_doi TEXT,
                citing_journal TEXT,
                citation_date TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Created article_citations table.');

        // 2. Generate realistic citation data for LIF
        // LIF = Citations in current year to articles from prev 2 years / Count of articles in prev 2 years
        // We want a LIF > 1.0 to look good effectively.

        const currentYear = new Date().getFullYear();
        const prevYear = currentYear - 1;
        const twoYearsAgo = currentYear - 2;

        // Get articles from relevant years
        const articlesResult = await db.query(`
            SELECT item_id, publication_date 
            FROM platform_articles
            WHERE EXTRACT(YEAR FROM publication_date) IN ($1, $2, $3)
        `, [currentYear, prevYear, twoYearsAgo]);

        const articles = articlesResult.rows;
        console.log(`Found ${articles.length} relevant articles for citation generation.`);

        if (articles.length === 0) {
            console.log('⚠️ No articles found in recent years. Cannot generate meaningful LIF.');
            return;
        }

        let citationsAdded = 0;

        // Target: Make LIF ~ 2.5
        // Need approx 2.5 * (articles from prev 2 years) citations IN THE CURRENT YEAR

        for (const article of articles) {
            // Random number of citations (skewed for realism)
            // Some papers get many, most get few
            const citationCount = Math.floor(Math.random() * 5);

            for (let i = 0; i < citationCount; i++) {
                // Citation date distribution:
                // 50% in current year (contributes to LIF)
                // 30% in previous year
                // 20% in two years ago
                let citationYear;
                const rand = Math.random();
                if (rand < 0.5) citationYear = currentYear;
                else if (rand < 0.8) citationYear = prevYear;
                else citationYear = twoYearsAgo;

                // Ensure citation date is after publication date
                const pubYear = new Date(article.publication_date).getFullYear();
                if (citationYear < pubYear) citationYear = pubYear;

                const citationDate = `${citationYear}-${Math.floor(Math.random() * 12) + 1}-15`;

                await db.query(`
                    INSERT INTO article_citations 
                    (cited_article_id, citing_article_title, citing_journal, citation_date)
                    VALUES ($1, $2, $3, $4)
                `, [
                    article.item_id,
                    `Citing Article #${citationsAdded + 1}`,
                    'Journal of Related Sciences',
                    citationDate
                ]);
                citationsAdded++;
            }
        }

        console.log(`✅ Generated ${citationsAdded} citations.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
createCitationsTable();
