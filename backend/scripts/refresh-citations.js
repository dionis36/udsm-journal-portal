const CitationOrchestrator = require('../services/citation-orchestrator');
const db = require('../db');
require('dotenv').config();

/**
 * Refresh Citations Script
 * Run manually or via cron to update citation counts
 * 
 * Usage:
 *   node scripts/refresh-citations.js [batchSize] [includePubMed]
 * 
 * Examples:
 *   node scripts/refresh-citations.js 50       # Update 50 articles
 *   node scripts/refresh-citations.js 100 true # Update 100 articles including PubMed
 */

async function refreshCitations() {
    const batchSize = parseInt(process.argv[2]) || 50;
    const includePubMed = process.argv[3] === 'true';

    console.log('📚 UDSM Citation Refresh Service');
    console.log('=================================\n');
    console.log(`Batch Size: ${batchSize}`);
    console.log(`Include PubMed: ${includePubMed ? 'Yes' : 'No'}\n`);

    const orchestrator = new CitationOrchestrator();

    try {
        const results = await orchestrator.batchUpdate(db, batchSize, {
            includePubMed,
            onProgress: (current, total, result) => {
                const percentage = Math.round((current / total) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
                process.stdout.write(`\r[${bar}] ${percentage}% - ${result.source}`);
            }
        });

        // Summary statistics
        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            sources: {
                openalex: results.filter(r => r.source?.includes('openalex')).length,
                crossref: results.filter(r => r.source === 'crossref').length,
                pubmed: results.filter(r => r.source?.includes('pubmed')).length
            },
            total_citations: results.reduce((sum, r) => sum + (r.citations || 0), 0),
            avg_citations: 0
        };

        summary.avg_citations = summary.successful > 0
            ? (summary.total_citations / summary.successful).toFixed(2)
            : 0;

        console.log('\n\n📊 Summary');
        console.log('==========');
        console.log(`Total articles processed: ${summary.total}`);
        console.log(`Successful: ${summary.successful}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`\nSources used:`);
        console.log(`  OpenAlex: ${summary.sources.openalex}`);
        console.log(`  Crossref: ${summary.sources.crossref}`);
        console.log(`  PubMed: ${summary.sources.pubmed}`);
        console.log(`\nCitation Statistics:`);
        console.log(`  Total citations: ${summary.total_citations}`);
        console.log(`  Average per article: ${summary.avg_citations}`);

        // Top cited articles
        const topCited = results
            .filter(r => r.citations > 0)
            .sort((a, b) => b.citations - a.citations)
            .slice(0, 5);

        if (topCited.length > 0) {
            console.log(`\n🏆 Top Cited Articles:`);
            topCited.forEach((article, idx) => {
                console.log(`  ${idx + 1}. ${article.title.substring(0, 60)}... (${article.citations} citations)`);
            });
        }

        console.log('\n✅ Citation refresh complete!\n');

    } catch (error) {
        console.error('\n❌ Error during citation refresh:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

refreshCitations();
