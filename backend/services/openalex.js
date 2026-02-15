const axios = require('axios');

/**
 * OpenAlex API Service
 * FREE comprehensive academic metadata and citation data
 * 
 * API Docs: https://docs.openalex.org/
 * Rate Limit: 100,000 requests/day (with email), 10 requests/second
 * 
 * Better alternative to Crossref with more complete data
 */
class OpenAlexService {
    constructor() {
        this.baseURL = 'https://api.openalex.org';
        this.email = 'tjpsd@udsm.ac.tz'; // Polite pool access
        this.timeout = 10000;
    }

    /**
     * Search for work by DOI
     * @param {string} doi 
     * @returns {Promise<Object|null>}
     */
    async getWorkByDOI(doi) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/doi:${doi}`,
                {
                    params: { mailto: this.email },
                    timeout: this.timeout
                }
            );

            return this.parseWork(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn(`DOI not found in OpenAlex: ${doi}`);
                return null;
            }
            console.error(`OpenAlex API error for ${doi}:`, error.message);
            return null;
        }
    }

    /**
     * Get work by OpenAlex ID
     * @param {string} openalexId - e.g., "W2741809807"
     * @returns {Promise<Object|null>}
     */
    async getWorkById(openalexId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/${openalexId}`,
                {
                    params: { mailto: this.email },
                    timeout: this.timeout
                }
            );

            return this.parseWork(response.data);
        } catch (error) {
            console.error(`OpenAlex API error for ${openalexId}:`, error.message);
            return null;
        }
    }

    /**
     * Search works by title (fallback for articles without DOI)
     * @param {string} title 
     * @returns {Promise<Object|null>}
     */
    async searchByTitle(title) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works`,
                {
                    params: {
                        mailto: this.email,
                        filter: `title.search:${title}`,
                        per_page: 1
                    },
                    timeout: this.timeout
                }
            );

            if (response.data.results && response.data.results.length > 0) {
                return this.parseWork(response.data.results[0]);
            }

            return null;
        } catch (error) {
            console.error(`OpenAlex search error:`, error.message);
            return null;
        }
    }

    /**
     * Get works citing this work
     * @param {string} openalexId 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getCitingWorks(openalexId, limit = 20) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works`,
                {
                    params: {
                        mailto: this.email,
                        filter: `cites:${openalexId}`,
                        per_page: limit,
                        sort: 'publication_date:desc'
                    },
                    timeout: this.timeout
                }
            );

            return response.data.results.map(work => this.parseWork(work));
        } catch (error) {
            console.error(`Failed to fetch citing works:`, error.message);
            return [];
        }
    }

    /**
     * Update article citations from OpenAlex
     * @param {Object} db 
     * @param {number} articleId 
     * @param {string} doi 
     * @returns {Promise<Object|null>}
     */
    async updateArticleCitations(db, articleId, doi) {
        const work = await this.getWorkByDOI(doi);

        if (!work) {
            return null;
        }

        // Update platform_articles
        await db.query(`
            UPDATE platform_articles 
            SET citations = $1,
                openalex_id = $2,
                citations_updated_at = NOW()
            WHERE item_id = $3
        `, [work.citation_count, work.openalex_id, articleId]);

        console.log(`✓ Updated article ${articleId}: ${work.citation_count} citations (OpenAlex)`);

        return work;
    }

    /**
     * Refresh all articles using OpenAlex (alternative to Crossref)
     * @param {Object} db 
     * @param {number} batchSize 
     * @returns {Promise<Array>}
     */
    async refreshAllCitations(db, batchSize = 50) {
        const articles = await db.query(`
            SELECT item_id, doi, title
            FROM platform_articles 
            WHERE doi IS NOT NULL
            AND doi != ''
            ORDER BY citations_updated_at ASC NULLS FIRST
            LIMIT $1
        `, [batchSize]);

        console.log(`\n🔄 Refreshing citations via OpenAlex for ${articles.rows.length} articles...\n`);

        const results = [];
        for (const article of articles.rows) {
            const work = await this.updateArticleCitations(db, article.item_id, article.doi);

            results.push({
                id: article.item_id,
                doi: article.doi,
                citations: work?.citation_count || 0,
                openalex_id: work?.openalex_id
            });

            // Rate limiting: 10 req/sec = 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 110));
        }

        console.log(`\n✅ Updated ${results.length} articles via OpenAlex`);
        return results;
    }

    /**
     * Parse OpenAlex work object into standardized format
     * @param {Object} work - Raw OpenAlex work object
     * @returns {Object}
     */
    parseWork(work) {
        return {
            openalex_id: work.id?.replace('https://openalex.org/', ''),
            doi: work.doi?.replace('https://doi.org/', ''),
            title: work.title,
            citation_count: work.cited_by_count || 0,
            publication_date: work.publication_date,
            publication_year: work.publication_year,
            type: work.type,
            open_access: work.open_access?.is_oa || false,
            authors: work.authorships?.map(a => ({
                name: a.author?.display_name,
                orcid: a.author?.orcid,
                affiliation: a.institutions?.[0]?.display_name
            })) || [],
            journal: work.primary_location?.source?.display_name,
            concepts: work.concepts?.slice(0, 5).map(c => c.display_name) || [],
            references_count: work.referenced_works_count || 0,
            abstract: work.abstract_inverted_index ? this.reconstructAbstract(work.abstract_inverted_index) : null
        };
    }

    /**
     * Reconstruct abstract from inverted index
     * @param {Object} invertedIndex 
     * @returns {string|null}
     */
    reconstructAbstract(invertedIndex) {
        try {
            const words = [];
            for (const [word, positions] of Object.entries(invertedIndex)) {
                positions.forEach(pos => {
                    words[pos] = word;
                });
            }
            return words.join(' ').substring(0, 500); // First 500 chars
        } catch (error) {
            return null;
        }
    }
}

module.exports = OpenAlexService;
