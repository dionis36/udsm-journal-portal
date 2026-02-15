const CrossrefService = require('../services/crossref');
const OpenAlexService = require('../services/openalex');
const db = require('../db');
require('dotenv').config();

/**
 * Test External APIs
 * Verify that all citation services are working correctly
 */

async function testAPIs() {
    console.log('🧪 Testing External APIs\n');
    console.log('='.repeat(50) + '\n');

    // Test DOIs (real published articles)
    const testDOIs = [
        '10.1371/journal.pone.0295208', // Real PLOS ONE article
        '10.1038/s41586-020-2649-2',   // Real Nature article
        '10.1126/science.abc1234'       // Example Science article (may 404)
    ];

    // Test 1: Crossref
    console.log('1️⃣  Testing Crossref API...\n');
    const crossref = new CrossrefService();

    for (const doi of testDOIs) {
        try {
            console.log(`   Testing: ${doi}`);
            const count = await crossref.getCitationCount(doi);
            const metadata = await crossref.getArticleMetadata(doi);

            if (metadata) {
                console.log(`   ✓ Found: "${metadata.title.substring(0, 60)}..."`);
                console.log(`   ✓ Citations: ${count}`);
                console.log(`   ✓ Published: ${metadata.published_date?.toLocaleDateString() || 'Unknown'}`);
            } else {
                console.log(`   ⚠️  Not found in Crossref`);
            }
            console.log('');
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    // Test 2: OpenAlex
    console.log('\n2️⃣  Testing OpenAlex API...\n');
    const openalex = new OpenAlexService();

    for (const doi of testDOIs) {
        try {
            console.log(`   Testing: ${doi}`);
            const work = await openalex.getWorkByDOI(doi);

            if (work) {
                console.log(`   ✓ Found: "${work.title?.substring(0, 60)}..."`);
                console.log(`   ✓ Citations: ${work.citation_count}`);
                console.log(`   ✓ OpenAlex ID: ${work.openalex_id}`);
                console.log(`   ✓ Open Access: ${work.open_access ? 'Yes' : 'No'}`);
                if (work.concepts && work.concepts.length) {
                    console.log(`   ✓ Concepts: ${work.concepts.slice(0, 3).join(', ')}`);
                }
            } else {
                console.log(`   ⚠️  Not found in OpenAlex`);
            }
            console.log('');
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }

    // Test 3: Database connectivity
    console.log('\n3️⃣  Testing Database Schema...\n');

    try {
        // Check if platform_articles has citation columns
        const columns = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'platform_articles'
            AND column_name IN ('citations', 'openalex_id', 'pubmed_id', 'citations_updated_at')
        `);

        console.log(`   ✓ Citation columns found: ${columns.rows.length}/4`);
        columns.rows.forEach(row => console.log(`     - ${row.column_name}`));

        // Check article_citations table exists
        const citationTable = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'article_citations'
            )
        `);

        console.log(`   ${citationTable.rows[0].exists ? '✓' : '❌'} article_citations table exists`);

        // Check for articles with DOIs
        const articlesWithDOIs = await db.query(`
            SELECT COUNT(*) as count 
            FROM platform_articles 
            WHERE doi IS NOT NULL AND doi != ''
        `);

        console.log(`   ✓ Articles with DOIs: ${articlesWithDOIs.rows[0].count}`);

        if (articlesWithDOIs.rows[0].count > 0) {
            const sampleArticle = await db.query(`
                SELECT item_id, title, doi 
                FROM platform_articles 
                WHERE doi IS NOT NULL AND doi != ''
                LIMIT 1
            `);

            console.log(`\n   📄 Sample article:`);
            console.log(`      ID: ${sampleArticle.rows[0].item_id}`);
            console.log(`      DOI: ${sampleArticle.rows[0].doi}`);
            console.log(`      Title: "${sampleArticle.rows[0].title.substring(0, 60)}..."`);
        }

    } catch (error) {
        console.log(`   ❌ Database error: ${error.message}`);
    }

    // Test 4: Real update test (if articles exist)
    console.log('\n\n4️⃣  Testing Real Update (Single Article)...\n');

    try {
        const article = await db.query(`
            SELECT item_id, doi, title 
            FROM platform_articles 
            WHERE doi IS NOT NULL AND doi != ''
            LIMIT 1
        `);

        if (article.rows.length > 0) {
            const { item_id, doi, title } = article.rows[0];
            console.log(`   Testing update for: "${title.substring(0, 60)}..."`);
            console.log(`   DOI: ${doi}\n`);

            const citations = await crossref.updateArticleCitations(db, item_id, doi);

            if (citations !== null) {
                console.log(`   ✓ Successfully updated article ${item_id}`);
                console.log(`   ✓ Citations: ${citations}`);
            } else {
                console.log(`   ⚠️  Update failed (DOI not found or API error)`);
            }
        } else {
            console.log(`   ⚠️  No articles with DOIs found in database`);
        }

    } catch (error) {
        console.log(`   ❌ Update test error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ API testing complete!\n');
    process.exit(0);
}

testAPIs().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
