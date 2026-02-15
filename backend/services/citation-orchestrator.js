const CrossrefService = require('./crossref');
const OpenAlexService = require('./openalex');
const PubMedService = require('./pubmed');
const SCImagoService = require('./scimago');

/**
 * Citation Orchestrator
 * Coordinates multiple citation services with fallback logic
 * 
 * Priority: OpenAlex → Crossref → PubMed (for health sciences)
 */
class CitationOrchestrator {
    constructor() {
        this.crossref = new CrossrefService();
        this.openalex = new OpenAlexService();
        this.pubmed = new PubMedService();
        this.scimago = new SCImagoService();
    }

    /**
     * Update citations using best available source
     * @param {Object} db 
     * @param {number} articleId 
     * @param {string} doi 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async updateArticleCitations(db, articleId, doi, options = {}) {
        const { preferredSource = 'openalex', includePubMed = false } = options;

        let result = { success: false, source: null, citations: 0 };

        // Try preferred source first
        if (preferredSource === 'openalex') {
            const openalexData = await this.openalex.updateArticleCitations(db, articleId, doi);
            if (openalexData) {
                result = {
                    success: true,
                    source: 'openalex',
                    citations: openalexData.citation_count,
                    openalex_id: openalexData.openalex_id
                };
            }
        }

        // Fallback to Crossref
        if (!result.success) {
            const crossrefCitations = await this.crossref.updateArticleCitations(db, articleId, doi);
            if (crossrefCitations !== null) {
                result = {
                    success: true,
                    source: 'crossref',
                    citations: crossrefCitations
                };
            }
        }

        // Optional: Supplement with PubMed for health sciences
        if (includePubMed) {
            const pubmedData = await this.pubmed.updateArticleCitations(db, articleId, doi);
            if (pubmedData && pubmedData.citations > result.citations) {
                result.citations = pubmedData.citations;
                result.pubmed_id = pubmedData.pmid;
                result.source = result.source + '+pubmed';
            }
        }

        return result;
    }

    /**
     * Batch update with progress tracking
     * @param {Object} db 
     * @param {number} batchSize 
     * @param {Object} options 
     * @returns {Promise<Array>}
     */
    async batchUpdate(db, batchSize = 50, options = {}) {
        const { includePubMed = false, onProgress = null } = options;

        // Get articles needing updates
        const articles = await db.query(`
            SELECT item_id, doi, title
            FROM platform_articles 
            WHERE doi IS NOT NULL
            AND doi != ''
            AND (citations_updated_at IS NULL 
                 OR citations_updated_at < NOW() - INTERVAL '7 days')
            ORDER BY citations_updated_at ASC NULLS FIRST
            LIMIT $1
        `, [batchSize]);

        console.log(`\n🔄 Updating ${articles.rows.length} articles...\n`);

        const results = [];
        let completed = 0;

        for (const article of articles.rows) {
            const result = await this.updateArticleCitations(
                db,
                article.item_id,
                article.doi,
                { includePubMed }
            );

            completed++;
            results.push({
                id: article.item_id,
                doi: article.doi,
                title: article.title,
                ...result
            });

            // Progress callback
            if (onProgress) {
                onProgress(completed, articles.rows.length, result);
            }

            console.log(
                `✓ [${completed}/${articles.rows.length}] ${article.title.substring(0, 60)}... ` +
                `(${result.citations} citations via ${result.source})`
            );

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        console.log(`\n✅ Updated ${results.length} articles`);

        // Refresh materialized view
        await db.query('SELECT refresh_citation_stats()');
        console.log('✅ Citation stats refreshed');

        return results;
    }

    /**
     * Get comprehensive article metadata
     * @param {string} doi 
     * @returns {Promise<Object>}
     */
    async getArticleMetadata(doi) {
        // Try OpenAlex first (most comprehensive)
        let metadata = await this.openalex.getWorkByDOI(doi);

        if (!metadata) {
            // Fallback to Crossref
            metadata = await this.crossref.getArticleMetadata(doi);
        }

        return metadata;
    }

    /**
     * Get journal metrics (manual lookup helper)
     * @param {string} issn 
     * @param {string} title 
     * @returns {Promise<Object>}
     */
    async getJournalMetrics(issn, title) {
        // Try SCImago
        let scimagoData = null;

        if (issn) {
            scimagoData = await this.scimago.searchByISSN(issn);
        }

        if (!scimagoData && title) {
            scimagoData = await this.scimago.searchByTitle(title);
        }

        return {
            scimago: scimagoData,
            manual_lookup_guide: this.scimago.getManualLookupGuide()
        };
    }

    /**
     * Generate citation report for a journal
     * @param {Object} db 
     * @param {number} journalId 
     * @returns {Promise<Object>}
     */
    async generateJournalReport(db, journalId) {
        const stats = await db.query(`
            SELECT * FROM journal_citation_stats
            WHERE journal_id = $1
        `, [journalId]);

        const topCited = await db.query(`
            SELECT item_id, title, authors, citations, publication_date
            FROM platform_articles
            WHERE journal_id = $1
            AND citations > 0
            ORDER BY citations DESC
            LIMIT 10
        `, [journalId]);

        const recentCitations = await db.query(`
            SELECT 
                DATE_TRUNC('month', citation_date) as month,
                COUNT(*) as citation_count
            FROM article_citations ac
            JOIN platform_articles pa ON ac.cited_article_id = pa.item_id
            WHERE pa.journal_id = $1
            AND citation_date >= NOW() - INTERVAL '1 year'
            GROUP BY month
            ORDER BY month DESC
        `, [journalId]);

        return {
            overall_stats: stats.rows[0],
            top_cited_articles: topCited.rows,
            citation_trend: recentCitations.rows
        };
    }
}

module.exports = CitationOrchestrator;
