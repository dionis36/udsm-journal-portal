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
                    COALESCE(SUM(weight), 0) as total_hits,
                    COUNT(DISTINCT item_id) as total_articles,
                    COUNT(DISTINCT country_name) as total_countries,
                    AVG(session_duration) as avg_duration,
                    COALESCE(SUM(weight) FILTER (WHERE event_type = 'download'), 0) as total_downloads
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
};
