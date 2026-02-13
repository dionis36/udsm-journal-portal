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
};
