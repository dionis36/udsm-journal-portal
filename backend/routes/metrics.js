const ExternalMetricsService = require('../services/external-metrics');

module.exports = async function (fastify, opts) {
    const metricsService = new ExternalMetricsService(fastify.db);

    // Get metrics for a specific article by ID
    fastify.get('/articles/:id/metrics', async (request, reply) => {
        const { id } = request.params;

        try {
            // Get article DOI from database
            const result = await fastify.db.query(
                'SELECT doi, title FROM platform_articles WHERE item_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Article not found' });
            }

            const article = result.rows[0];
            const doi = article.doi;

            if (!doi) {
                return reply.send({
                    citations: null,
                    altmetric: null,
                    message: 'No DOI available for this article'
                });
            }

            // Fetch metrics (will use cache if available)
            const [crossrefData, altmetricData] = await Promise.allSettled([
                metricsService.getCrossrefData(doi),
                metricsService.getAltmetricScore(doi)
            ]);

            return reply.send({
                doi,
                citations: crossrefData.status === 'fulfilled' ? crossrefData.value : null,
                altmetric: altmetricData.status === 'fulfilled' ? altmetricData.value : null,
                article: {
                    id,
                    title: article.title
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch metrics' });
        }
    });

    // Bulk refresh metrics for all articles (admin endpoint)
    fastify.post('/metrics/refresh', async (request, reply) => {
        try {
            // Get all articles with DOIs
            const result = await fastify.db.query(
                'SELECT item_id, doi FROM platform_articles WHERE doi IS NOT NULL LIMIT 100'
            );

            const refreshPromises = result.rows.map(async (article) => {
                try {
                    await metricsService.getCrossrefData(article.doi);
                    await metricsService.getAltmetricScore(article.doi);
                    return { id: article.item_id, status: 'success' };
                } catch (error) {
                    return { id: article.item_id, status: 'failed', error: error.message };
                }
            });

            const results = await Promise.all(refreshPromises);

            return reply.send({
                message: 'Metrics refresh initiated',
                processed: results.length,
                results
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Bulk refresh failed' });
        }
    });

    // GET /api/metrics/heatmap
    // Returns aggregated readership data for Deck.gl / MapLibre
    fastify.get('/metrics/heatmap', async (request, reply) => {
        try {
            const { event_type, journal_id, scope } = request.query;
            let query = `
                SELECT 
                    ST_X(ST_SnapToGrid(location_point::geometry, 0.1)) as lng, 
                    ST_Y(ST_SnapToGrid(location_point::geometry, 0.1)) as lat, 
                    country_name,
                    country_code,
                    city_name,
                    COUNT(*) as weight 
                FROM readership_geodata`;

            const filters = [];
            const params = [];

            if (scope === 'traffic') {
                filters.push(`event_type IN ('historical_baseline', 'visit')`);
            } else if (scope === 'readership') {
                filters.push(`event_type IN ('view', 'download')`);
            }

            if (event_type) { params.push(event_type); filters.push(`event_type = $${params.length}`); }
            if (journal_id) { params.push(journal_id); filters.push(`journal_id = $${params.length}`); }

            if (filters.length > 0) query += ` WHERE ` + filters.join(' AND ');
            query += ` GROUP BY 1, 2, 3, 4, 5`;
            const result = await fastify.db.query(query, params);

            return reply.send({
                type: 'FeatureCollection',
                features: result.rows.map(row => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(row.lng), parseFloat(row.lat)]
                    },
                    properties: {
                        weight: parseInt(row.weight),
                        country: row.country_name,
                        country_code: row.country_code,
                        city: row.city_name
                    }
                }))
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch heatmap data' });
        }
    });

    // GET /api/metrics/location-events
    // Returns detailed latest events for a specific location
    fastify.get('/metrics/location-events', async (request, reply) => {
        const { lng, lat } = request.query;
        try {
            // Tight 500m radius for specific point matching
            const result = await fastify.db.query(`
                SELECT 
                    rg.event_id,
                    rg.event_type,
                    rg.timestamp,
                    pa.title as article_title,
                    pa.authors as article_authors,
                    rg.city_name,
                    rg.country_name,
                    rg.country_code
                FROM readership_geodata rg
                LEFT JOIN platform_articles pa ON rg.item_id = pa.item_id
                WHERE ST_DWithin(rg.location_point::geography, ST_MakePoint($1, $2)::geography, 500)
                ORDER BY rg.timestamp DESC
                LIMIT 5
            `, [parseFloat(lng), parseFloat(lat)]);

            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch location details' });
        }
    });

    // GET /api/metrics/impact-summary
    // Returns global aggregated counts for the map footer HUD
    fastify.get('/metrics/impact-summary', async (request, reply) => {
        try {
            const query = `
                SELECT 
                    COALESCE(SUM(weight), 0) as total_reads,
                    COUNT(DISTINCT item_id) as total_articles,
                    COUNT(DISTINCT country_name) as total_countries,
                    AVG(session_duration) as avg_duration,
                    COALESCE(SUM(weight) FILTER (WHERE event_type = 'PDF_DOWNLOAD'), 0) as total_downloads,
                    COALESCE(SUM(weight) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 year'), 0) as total_reads_past_year
                FROM readership_geodata
            `;
            const result = await fastify.db.query(query);
            return reply.send(result.rows[0]);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch impact summary' });
        }
    });

    // GET /api/metrics/top-regions
    // Returns top countries and cities for the HUD overlay
    fastify.get('/metrics/top-regions', async (request, reply) => {
        try {
            const query = `
                SELECT 
                    country_name, 
                    city_name, 
                    COUNT(*) as hits,
                    MAX(timestamp) as last_hit,
                    ST_X(ST_Centroid(ST_Collect(location_point::geometry))) as lng,
                    ST_Y(ST_Centroid(ST_Collect(location_point::geometry))) as lat
                FROM readership_geodata
                GROUP BY country_name, city_name
                ORDER BY hits DESC
                LIMIT 10
            `;
            const result = await fastify.db.query(query);
            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch top regions' });
        }
    });

    // GET /api/articles/:id/impact
    // Returns geographical hits for a specific article
    fastify.get('/articles/:id/impact', async (request, reply) => {
        const { id } = request.params;
        try {
            const query = `
                SELECT 
                    ST_X(location_point::geometry) as lng, 
                    ST_Y(location_point::geometry) as lat, 
                    event_type,
                    country_name,
                    city_name,
                    timestamp
                FROM readership_geodata
                WHERE item_id = $1
                ORDER BY timestamp DESC
            `;
            const result = await fastify.db.query(query, [id]);
            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch article impact' });
        }
    });

    // ========================================
    // COMPETITION ANALYTICS ENDPOINTS (NEW)
    // ========================================

    // GET /api/metrics/monthly-trends
    fastify.get('/metrics/monthly-trends', async (request, reply) => {
        try {
            const { months = 6 } = request.query;
            const result = await fastify.db.query(`
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', timestamp), 'Mon YYYY') as month,
                    COUNT(*)::int as reads,
                    SUM(CASE WHEN event_type = 'PDF_DOWNLOAD' THEN 1 ELSE 0 END)::int as downloads
                FROM readership_geodata
                WHERE timestamp >= NOW() - make_interval(months := $1)
                GROUP BY DATE_TRUNC('month', timestamp)
                ORDER BY DATE_TRUNC('month', timestamp)
            `, [parseInt(months)]);
            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch monthly trends' });
        }
    });

    // GET /api/metrics/top-articles
    fastify.get('/metrics/top-articles', async (request, reply) => {
        try {
            const { days = 30, limit = 10 } = request.query;
            const result = await fastify.db.query(`
                SELECT 
                    pa.item_id::text as id,
                    pa.title,
                    pa.year,
                    COUNT(*)::int as reads,
                    SUM(CASE WHEN rg.event_type = 'PDF_DOWNLOAD' THEN 1 ELSE 0 END)::int as downloads
                FROM readership_geodata rg
                JOIN platform_articles pa ON rg.item_id = pa.item_id
                WHERE rg.timestamp >= NOW() - make_interval(days := $1)
                GROUP BY pa.item_id, pa.title, pa.year
                ORDER BY reads DESC
                LIMIT $2
            `, [parseInt(days), parseInt(limit)]);
            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch top articles' });
        }
    });

    // GET /api/metrics/geographic-breakdown
    fastify.get('/metrics/geographic-breakdown', async (request, reply) => {
        try {
            const result = await fastify.db.query(`
                SELECT 
                    country_code,
                    CASE 
                        WHEN country_code = 'US' THEN 'United States'
                        WHEN country_code = 'GB' THEN 'United Kingdom'
                        WHEN country_code = 'CN' THEN 'China'
                        WHEN country_code = 'IN' THEN 'India'
                        WHEN country_code = 'TZ' THEN 'Tanzania'
                        WHEN country_code = 'KE' THEN 'Kenya'
                        ELSE country_code
                    END as country,
                    COUNT(*)::int as reads
                FROM readership_geodata
                WHERE country_code IS NOT NULL
                GROUP BY country_code
                ORDER BY reads DESC
            `);
            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch geographic breakdown' });
        }
    });

    // GET /api/metrics    // Journal Impact endpoints
    fastify.get('/metrics/journal-impact', async (request, reply) => {
        try {
            const { journal = 'tjpsd' } = request.query;

            const result = await fastify.db.query(`
                SELECT metadata->'impact_metrics' as metrics
                FROM platform_journals
                WHERE path = $1
            `, [journal]);

            return reply.send(result.rows[0]?.metrics || null);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch journal impact metrics' });
        }
    });

    // Get citations for a specific article
    fastify.get('/metrics/citations/:articleId', async (request, reply) => {
        try {
            const { articleId } = request.params;

            const result = await fastify.db.query(`
                SELECT citations, citations_updated_at, openalex_id, pubmed_id
                FROM platform_articles
                WHERE item_id = $1
            `, [articleId]);

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Article not found' });
            }

            return reply.send(result.rows[0]);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch citations' });
        }
    });

    // Get detailed citation list for an article
    fastify.get('/metrics/citations/:articleId/details', async (request, reply) => {
        try {
            const { articleId } = request.params;
            const { limit = 20 } = request.query;

            const result = await fastify.db.query(`
                SELECT 
                    citing_article_doi,
                    citing_article_title,
                    citation_date,
                    source,
                    metadata
                FROM article_citations
                WHERE cited_article_id = $1
                ORDER BY citation_date DESC
                LIMIT $2
            `, [articleId, limit]);

            return reply.send(result.rows);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch citation details' });
        }
    });

    // Get journal citation statistics
    fastify.get('/metrics/journal-citation-stats', async (request, reply) => {
        try {
            const { journal_id = 1 } = request.query;

            const result = await fastify.db.query(`
                SELECT * FROM journal_citation_stats
                WHERE journal_id = $1
            `, [journal_id]);

            if (result.rows.length === 0) {
                return reply.send({
                    total_articles: 0,
                    total_citations: 0,
                    avg_citations_per_article: 0,
                    field_normalized_impact: null
                });
            }

            return reply.send(result.rows[0]);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch journal citation stats' });
        }
    });

    // Trigger manual citation refresh for specific article
    fastify.post('/metrics/refresh-citations/:articleId', async (request, reply) => {
        try {
            const { articleId } = request.params;
            const CitationOrchestrator = require('../services/citation-orchestrator');
            const orchestrator = new CitationOrchestrator();

            // Get article DOI
            const article = await fastify.db.query(`
                SELECT doi FROM platform_articles WHERE item_id = $1
            `, [articleId]);

            if (article.rows.length === 0) {
                return reply.code(404).send({ error: 'Article not found' });
            }

            if (!article.rows[0].doi) {
                return reply.code(400).send({ error: 'Article has no DOI' });
            }

            // Refresh citations
            const result = await orchestrator.updateArticleCitations(
                fastify.db,
                articleId,
                article.rows[0].doi
            );

            return reply.send(result);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to refresh citations' });
        }
    });

    // ==================== TIER 3: ADVANCED ANALYTICS ====================

    // Get Live Impact Factor (real-time rolling 2-year metric)
    fastify.get('/metrics/live-impact-factor', async (request, reply) => {
        try {
            const { journal_id = 1 } = request.query;
            const LiveImpactFactorService = require('../services/live-impact-factor');
            const lifService = new LiveImpactFactorService();

            const current = await lifService.calculate(journal_id);

            return reply.send(current);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to calculate Live Impact Factor' });
        }
    });

    // Get historical LIF trend
    fastify.get('/metrics/live-impact-factor/trend', async (request, reply) => {
        try {
            const { journal_id = 1, years = 5 } = request.query;
            const LiveImpactFactorService = require('../services/live-impact-factor');
            const lifService = new LiveImpactFactorService();

            const trend = await lifService.calculateHistoricalTrend(journal_id, parseInt(years));

            return reply.send(trend);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch LIF trend' });
        }
    });

    // Get monthly progress for current year's LIF
    fastify.get('/metrics/live-impact-factor/monthly-progress', async (request, reply) => {
        try {
            const { journal_id = 1 } = request.query;
            const LiveImpactFactorService = require('../services/live-impact-factor');
            const lifService = new LiveImpactFactorService();

            const progress = await lifService.getMonthlyProgress(journal_id);

            return reply.send(progress);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch monthly progress' });
        }
    });

    // Compare LIF with traditional JIF
    fastify.get('/metrics/live-impact-factor/compare-jif', async (request, reply) => {
        try {
            const { journal_id = 1 } = request.query;
            const LiveImpactFactorService = require('../services/live-impact-factor');
            const lifService = new LiveImpactFactorService();

            const comparison = await lifService.compareWithJIF(journal_id);

            return reply.send(comparison);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to compare with JIF' });
        }
    });

    // Get top articles contributing to current LIF
    fastify.get('/metrics/live-impact-factor/top-contributors', async (request, reply) => {
        try {
            const { journal_id = 1, limit = 10 } = request.query;
            const LiveImpactFactorService = require('../services/live-impact-factor');
            const lifService = new LiveImpactFactorService();

            const contributors = await lifService.getTopContributors(journal_id, parseInt(limit));

            return reply.send(contributors);
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch top contributors' });
        }
    });

    // Get real-time top articles (Redis-powered)
    fastify.get('/metrics/top-this-week', async (request, reply) => {
        try {
            const { limit = 5 } = request.query;
            const { getRankingService } = require('../services/redis-rankings');
            const rankingService = getRankingService();

            // Get top IDs from Redis
            const topRankings = await rankingService.getTopArticles(parseInt(limit), 'week');

            if (topRankings.length === 0) {
                return reply.send([]);
            }

            // Hydrate with article details from DB
            const articleIds = topRankings.map(r => r.article_id);
            const placeholders = articleIds.map((_, i) => `$${i + 1}`).join(',');

            const details = await fastify.db.query(`
                SELECT item_id, title, authors
                FROM platform_articles
                WHERE item_id IN (${placeholders})
            `, articleIds);

            // Merge details with rankings
            const result = topRankings.map((ranking, index) => {
                const detail = details.rows.find(d => d.item_id === ranking.article_id);
                return {
                    ...ranking,
                    title: detail?.title || 'Unknown Article',
                    authors: detail?.authors || 'Unknown Authors',
                    rank: index + 1
                };
            });

            return reply.send(result);
        } catch (error) {
            fastify.log.error(error);
            // Return empty array on error so UI doesn't break
            return reply.send([]);
        }
    });

    // Record a read event (for testing/simulation)
    fastify.post('/metrics/record-read/:articleId', async (request, reply) => {
        try {
            const { articleId } = request.params;
            const { getRankingService } = require('../services/redis-rankings');
            const rankingService = getRankingService();

            await rankingService.incrementRead(articleId, 'week');

            return reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to record read' });
        }
    });

    // Tier 3: Downloads vs Citations Correlation
    fastify.get('/metrics/downloads-citations-correlation', async (request, reply) => {
        try {
            const { journal_id = 1, min_age_days = 90 } = request.query;

            // Get articles with their citation and download counts
            const result = await fastify.db.query(`
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
                AND a.publication_date < NOW() - INTERVAL '90 days' -- Ensure enough time for citations
                ORDER BY downloads DESC, citations DESC
                LIMIT 100
            `, [journal_id]);

            const data = result.rows;

            // Calculate simple correlation coefficient
            const calculateCorrelation = (x, y) => {
                const n = x.length;
                if (n === 0) return 0;

                const sum_x = x.reduce((a, b) => a + b, 0);
                const sum_y = y.reduce((a, b) => a + b, 0);
                const sum_xy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
                const sum_x2 = x.reduce((sum, xi) => sum + xi * xi, 0);
                const sum_y2 = y.reduce((sum, yi) => sum + yi * yi, 0);

                const numerator = (n * sum_xy) - (sum_x * sum_y);
                const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));

                return denominator === 0 ? 0 : numerator / denominator;
            };

            const correlation = calculateCorrelation(
                data.map(d => d.downloads),
                data.map(d => d.citations)
            );

            // Categorize into quadrants
            const medianDownloads = data.length > 0 ? data[Math.floor(data.length / 2)].downloads : 0;
            const medianCitations = data.length > 0 ? [...data].sort((a, b) => a.citations - b.citations)[Math.floor(data.length / 2)].citations : 0;

            const quadrants = {
                stars: data.filter(r => r.downloads >= medianDownloads && r.citations >= medianCitations).length,
                hidden_gems: data.filter(r => r.downloads < medianDownloads && r.citations >= medianCitations).length,
                popular: data.filter(r => r.downloads >= medianDownloads && r.citations < medianCitations).length,
                emerging: data.filter(r => r.downloads < medianDownloads && r.citations < medianCitations).length
            };

            return reply.send({ data, correlation, quadrants, medianDownloads, medianCitations });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch correlation data' });
        }
    });

    // Tier 3: Field-Normalized Impact (SNIP - Simulated)
    fastify.get('/metrics/field-normalized-impact', async (request, reply) => {
        try {
            const { journal_id = 1 } = request.query;

            // In a real implementation, this would query a field baselines table.
            // For the demo, we'll simulate it based on typical field averages.

            // 1. Get journal raw impact (citations / articles)
            const journalStats = await fastify.db.query(`
                SELECT 
                    COUNT(*) as article_count,
                    SUM(citations) as total_citations,
                    SUM(citations)::float / NULLIF(COUNT(*), 0) as raw_impact
                FROM platform_articles
                WHERE journal_id = $1
            `, [journal_id]);

            const rawImpact = journalStats.rows[0].raw_impact || 0;

            // 2. Field Baseline (Social Sciences)
            // Typical Social Science citation rate is lower than Medicine
            const fieldBaseline = 0.85;

            const snip = rawImpact / fieldBaseline;

            return reply.send({
                journal_id,
                field: "Social Sciences",
                raw_impact: rawImpact,
                field_baseline: fieldBaseline,
                snip_score: snip,
                percentile_in_field: 78 // Mocked percentile
            });
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to fetch SNIP data' });
        }
    });
};
