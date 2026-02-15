const db = require('../db');

async function checkQuery() {
    try {
        console.log('Testing SQL Query...');
        const result = await db.query(`
            WITH article_downloads AS (
                SELECT item_id, COUNT(*) as downloads
                FROM readership_geodata
                WHERE event_type = 'PDF_DOWNLOAD'
                GROUP BY item_id
            )
            SELECT 
                a.item_id,
                a.title,
                a.authors,
                COALESCE(a.citations, 0) as citations,
                COALESCE(ad.downloads, 0) as downloads,
                a.publication_date,
                EXTRACT(DAY FROM (NOW() - a.publication_date)) as age_days
            FROM platform_articles a
            LEFT JOIN article_downloads ad ON a.item_id = ad.item_id
            WHERE a.journal_id = $1
            AND a.publication_date < NOW() - INTERVAL '90 days'
            ORDER BY downloads DESC, citations DESC
            LIMIT 100
        `, [1]);

        console.log(`Success! Got ${result.rows.length} rows.`);
        if (result.rows.length > 0) {
            console.log('Sample:', result.rows[0]);
        }
    } catch (error) {
        console.error('SQL Error:', error.message);
        console.error('Detail:', error);
    } finally {
        process.exit();
    }
}

require('dotenv').config();
checkQuery();
