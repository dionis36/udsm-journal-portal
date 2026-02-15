const axios = require('axios');

/**
 * Crossref API Service
 * FREE citation data for articles with DOIs
 * 
 * API Docs: https://api.crossref.org/swagger-ui/index.html
 * Rate Limit: 50 requests/second (anonymous), better with polite pool
 */
class CrossrefService {
    constructor() {
        this.baseURL = 'https://api.crossref.org';
        this.userAgent = 'UDSM-Analytics/1.0 (mailto:tjpsd@udsm.ac.tz; https://journals.udsm.ac.tz)';
        this.timeout = 10000; // 10 seconds
    }

    /**
     * Get citation count for a single DOI
     * @param {string} doi - Article DOI (e.g., "10.1234/tjpsd.2023.001")
     * @returns {Promise<number|null>} Citation count or null if error
     */
    async getCitationCount(doi) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/${doi}`,
                {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                }
            );

            const work = response.data.message;
            return work['is-referenced-by-count'] || 0;
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn(`DOI not found in Crossref: ${doi}`);
                return 0;
            }
            console.error(`Crossref API error for ${doi}:`, error.message);
            return null;
        }
    }

    /**
     * Get detailed article metadata including citations
     * @param {string} doi 
     * @returns {Promise<Object|null>}
     */
    async getArticleMetadata(doi) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/${doi}`,
                {
                    headers: { 'User-Agent': this.userAgent },
                    timeout: this.timeout
                }
            );

            const work = response.data.message;

            return {
                doi: work.DOI,
                title: work.title?.[0] || 'Unknown',
                citations: work['is-referenced-by-count'] || 0,
                published_date: this.extractDate(work.issued),
                authors: this.extractAuthors(work.author),
                journal: work['container-title']?.[0],
                publisher: work.publisher,
                type: work.type,
                references_count: work['references-count'] || 0,
                update_date: new Date().toISOString()
            };
        } catch (error) {
            console.error(`Failed to fetch metadata for ${doi}:`, error.message);
            return null;
        }
    }

    /**
     * Get list of articles citing this DOI
     * @param {string} doi 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getCitingArticles(doi, limit = 20) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/${doi}/cited-by`,
                {
                    headers: { 'User-Agent': this.userAgent },
                    params: { rows: limit },
                    timeout: this.timeout
                }
            );

            return response.data.message.items.map(item => ({
                doi: item.DOI,
                title: item.title?.[0],
                published_date: this.extractDate(item.issued),
                authors: this.extractAuthors(item.author)
            }));
        } catch (error) {
            console.error(`Failed to fetch citing articles for ${doi}:`, error.message);
            return [];
        }
    }

    /**
     * Update citation count for an article in database
     * @param {Object} db - Database connection
     * @param {number} articleId 
     * @param {string} doi 
     * @returns {Promise<number|null>}
     */
    async updateArticleCitations(db, articleId, doi) {
        const citations = await this.getCitationCount(doi);

        if (citations !== null) {
            await db.query(`
                UPDATE platform_articles 
                SET citations = $1, 
                    citations_updated_at = NOW(),
                    crossref_last_check = NOW()
                WHERE item_id = $2
            `, [citations, articleId]);

            console.log(`✓ Updated article ${articleId} (DOI: ${doi}): ${citations} citations`);
        }

        return citations;
    }

    /**
     * Refresh citations for all articles with DOIs
     * @param {Object} db 
     * @param {number} batchSize 
     * @returns {Promise<Array>}
     */
    async refreshAllCitations(db, batchSize = 100) {
        const articles = await db.query(`
            SELECT item_id, doi, title
            FROM platform_articles 
            WHERE doi IS NOT NULL
            AND doi != ''
            ORDER BY citations_updated_at ASC NULLS FIRST
            LIMIT $1
        `, [batchSize]);

        console.log(`\n🔄 Refreshing citations for ${articles.rows.length} articles...\n`);

        const results = [];
        for (const article of articles.rows) {
            const citations = await this.updateArticleCitations(
                db, article.item_id, article.doi
            );

            results.push({
                id: article.item_id,
                doi: article.doi,
                title: article.title,
                citations
            });

            // Rate limiting: 50 req/sec means 20ms between requests
            await new Promise(resolve => setTimeout(resolve, 25));
        }

        console.log(`\n✅ Updated ${results.length} articles`);
        return results;
    }

    /**
     * Store detailed citation relationships
     * @param {Object} db 
     * @param {number} articleId 
     * @param {string} doi 
     */
    async storeCitingArticles(db, articleId, doi) {
        const citingArticles = await this.getCitingArticles(doi);

        for (const citing of citingArticles) {
            try {
                await db.query(`
                    INSERT INTO article_citations (
                        cited_article_id, citing_article_doi, citing_article_title,
                        citation_date, source, metadata
                    ) VALUES ($1, $2, $3, $4, 'crossref', $5)
                    ON CONFLICT DO NOTHING
                `, [
                    articleId,
                    citing.doi,
                    citing.title,
                    citing.published_date,
                    JSON.stringify({ authors: citing.authors })
                ]);
            } catch (error) {
                console.error(`Failed to store citation:`, error.message);
            }
        }
    }

    // Helper methods
    extractDate(issued) {
        if (!issued || !issued['date-parts'] || !issued['date-parts'][0]) {
            return null;
        }
        const parts = issued['date-parts'][0];
        return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    }

    extractAuthors(authorList) {
        if (!authorList) return [];
        return authorList.map(a => ({
            family: a.family,
            given: a.given,
            full_name: `${a.given || ''} ${a.family || ''}`.trim()
        }));
    }
}

module.exports = CrossrefService;
