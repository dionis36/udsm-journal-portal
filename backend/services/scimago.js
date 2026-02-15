const axios = require('axios');
const cheerio = require('cheerio');

/**
 * SCImago Journal Rank (SJR) Service
 * FREE journal rankings and metrics from public website
 * 
 * Website: https://www.scimagojr.com
 * Note: No official API - uses web scraping (use sparingly)
 */
class SCImagoService {
    constructor() {
        this.baseURL = 'https://www.scimagojr.com';
        this.timeout = 15000;
    }

    /**
     * Search for journal by ISSN
     * @param {string} issn - Journal ISSN (e.g., "1234-5678")
     * @returns {Promise<Object|null>}
     */
    async searchByISSN(issn) {
        try {
            const response = await axios.get(
                `${this.baseURL}/journalsearch.php`,
                {
                    params: {
                        q: issn,
                        tip: 'iss'
                    },
                    timeout: this.timeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            return this.parseSearchResults(response.data);
        } catch (error) {
            console.error(`SCImago search error for ISSN ${issn}:`, error.message);
            return null;
        }
    }

    /**
     * Search for journal by title
     * @param {string} title - Journal title
     * @returns {Promise<Object|null>}
     */
    async searchByTitle(title) {
        try {
            const response = await axios.get(
                `${this.baseURL}/journalsearch.php`,
                {
                    params: {
                        q: title,
                        tip: 'sid'
                    },
                    timeout: this.timeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            );

            return this.parseSearchResults(response.data);
        } catch (error) {
            console.error(`SCImago search error for "${title}":`, error.message);
            return null;
        }
    }

    /**
     * Parse SCImago HTML response
     * @param {string} html 
     * @returns {Object|null}
     */
    parseSearchResults(html) {
        try {
            const $ = cheerio.load(html);

            // Find the first result
            const firstResult = $('.search_results').first();

            if (firstResult.length === 0) {
                return null;
            }

            // Extract metrics
            const metrics = {};
            firstResult.find('.jrnldata p').each((i, elem) => {
                const text = $(elem).text().trim();

                if (text.includes('SJR:')) {
                    metrics.sjr = parseFloat(text.match(/[\d.]+/)?.[0]);
                }
                if (text.includes('H index:')) {
                    metrics.h_index = parseInt(text.match(/\d+/)?.[0]);
                }
                if (text.includes('Quartile:')) {
                    metrics.quartile = text.match(/Q\d/)?.[0];
                }
            });

            return {
                title: firstResult.find('a').first().text().trim(),
                sjr: metrics.sjr || null,
                h_index: metrics.h_index || null,
                quartile: metrics.quartile || null,
                source: 'scimago',
                last_updated: new Date().toISOString()
            };
        } catch (error) {
            console.error('SCImago parsing error:', error.message);
            return null;
        }
    }

    /**
     * Manual lookup guide (recommended over scraping)
     * @returns {string}
     */
    getManualLookupGuide() {
        return `
📚 SCImago Journal Rank - Manual Lookup Guide

1. Visit: https://www.scimagojr.com
2. Search by journal title or ISSN
3. Click on the journal name
4. Record the following metrics:
   - SJR (SCImago Journal Rank)
   - H-index
   - Quartile (Q1, Q2, Q3, Q4)
   - Total Documents, Total Cites, Cites per Doc

5. Enter manually into database:
   UPDATE platform_journals 
   SET metadata = jsonb_set(
       COALESCE(metadata, '{}'::jsonb),
       '{impact_metrics, sjr}',
       'X.XX'::jsonb
   )
   WHERE path = 'tjpsd';

Note: SCImago updates annually in May
`;
    }
}

module.exports = SCImagoService;
