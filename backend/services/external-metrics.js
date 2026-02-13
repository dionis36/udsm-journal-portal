const fetch = require('node-fetch');

class ExternalMetricsService {
    constructor(db) {
        this.db = db;
        this.crossrefBaseUrl = 'https://api.crossref.org/works';
        this.altmetricBaseUrl = 'https://api.altmetric.com/v1/doi';
        this.orcidBaseUrl = 'https://pub.orcid.org/v3.0';

        // Rate limiting
        this.lastCrossrefCall = 0;
        this.crossrefDelay = 1000; // 1 second between calls (polite policy)
    }

    /**
     * Get citation count and metadata from Crossref
     */
    async getCrossrefData(doi) {
        if (!doi) return null;

        try {
            // Check cache first
            const cached = await this.getCachedMetrics(doi);
            if (cached && this.isCacheFresh(cached.last_updated, 24)) {
                return {
                    citations: cached.crossref_citations,
                    source: 'cache'
                };
            }

            // Rate limiting: wait if needed
            const now = Date.now();
            const timeSinceLastCall = now - this.lastCrossrefCall;
            if (timeSinceLastCall < this.crossrefDelay) {
                await this.sleep(this.crossrefDelay - timeSinceLastCall);
            }

            // Fetch from Crossref
            const response = await fetch(`${this.crossrefBaseUrl}/${encodeURIComponent(doi)}`, {
                headers: {
                    'User-Agent': 'UDSM-Journal-Platform/1.0 (mailto:admin@udsm.ac.tz)' // Polite policy
                }
            });

            this.lastCrossrefCall = Date.now();

            if (!response.ok) {
                console.warn(`Crossref API error for ${doi}: ${response.status}`);
                return null;
            }

            const data = await response.json();
            const citations = data.message['is-referenced-by-count'] || 0;

            // Cache the result
            await this.cacheMetrics(doi, { crossref_citations: citations });

            return {
                citations,
                source: 'api',
                metadata: {
                    title: data.message.title?.[0],
                    published: data.message.published?.['date-parts']?.[0]
                }
            };

        } catch (error) {
            console.error('Crossref API error:', error);
            return null;
        }
    }

    /**
     * Get Altmetric Attention Score
     */
    async getAltmetricScore(doi) {
        if (!doi) return null;

        try {
            // Check cache
            const cached = await this.getCachedMetrics(doi);
            if (cached && this.isCacheFresh(cached.last_updated, 24)) {
                return {
                    score: cached.altmetric_score,
                    source: 'cache'
                };
            }

            // Fetch from Altmetric (FREE tier has rate limits)
            const response = await fetch(`${this.altmetricBaseUrl}/${encodeURIComponent(doi)}`);

            if (!response.ok) {
                if (response.status === 404) {
                    // No Altmetric data for this DOI
                    return { score: 0, source: 'api' };
                }
                console.warn(`Altmetric API error for ${doi}: ${response.status}`);
                return null;
            }

            const data = await response.json();
            const score = data.score || 0;

            // Cache the result
            await this.cacheMetrics(doi, { altmetric_score: score });

            return {
                score,
                source: 'api',
                metadata: {
                    mentions: data.cited_by_tweeters_count || 0,
                    news: data.cited_by_msm_count || 0
                }
            };

        } catch (error) {
            console.error('Altmetric API error:', error);
            return null;
        }
    }

    /**
     * Get ORCID author profile
     */
    async getORCIDProfile(orcid) {
        if (!orcid) return null;

        try {
            const response = await fetch(`${this.orcidBaseUrl}/${orcid}/record`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn(`ORCID API error for ${orcid}: ${response.status}`);
                return null;
            }

            const data = await response.json();

            return {
                name: data.person?.name?.['given-names']?.value + ' ' + data.person?.name?.['family-name']?.value,
                affiliation: data.person?.['employment-summary']?.[0]?.['organization']?.name,
                source: 'api'
            };

        } catch (error) {
            console.error('ORCID API error:', error);
            return null;
        }
    }

    /**
     * Cache metrics in database
     */
    async cacheMetrics(doi, metrics) {
        try {
            await this.db.query(`
                INSERT INTO external_metrics (doi, crossref_citations, altmetric_score, last_updated)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (doi) DO UPDATE SET
                    crossref_citations = COALESCE($2, external_metrics.crossref_citations),
                    altmetric_score = COALESCE($3, external_metrics.altmetric_score),
                    last_updated = NOW();
            `, [doi, metrics.crossref_citations || null, metrics.altmetric_score || null]);
        } catch (error) {
            console.error('Cache error:', error);
        }
    }

    /**
     * Get cached metrics from database
     */
    async getCachedMetrics(doi) {
        try {
            const result = await this.db.query(
                'SELECT * FROM external_metrics WHERE doi = $1',
                [doi]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Cache retrieval error:', error);
            return null;
        }
    }

    /**
     * Check if cache is fresh (within hours limit)
     */
    isCacheFresh(lastUpdated, hoursLimit = 24) {
        if (!lastUpdated) return false;
        const cacheAge = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
        return cacheAge < hoursLimit;
    }

    /**
     * Sleep utility for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ExternalMetricsService;
