/**
 * Article API Routes
 * Handles retrieval of issues and article lists from the platform_articles table.
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 */
async function articleRoutes(fastify, options) {

    // GET /api/journals/:path/issues/current
    // Fetches the Table of Contents (TOC) for the latest published issue with pagination.
    fastify.get('/journals/:path/issues/current', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    path: { type: 'string' }
                }
            },
            query: {
                type: 'object',
                properties: {
                    page: { type: 'integer', default: 1 },
                    limit: { type: 'integer', default: 10 }
                }
            }
        }
    }, async (request, reply) => {
        const { path } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const offset = (page - 1) * limit;

        try {
            fastify.log.info(`Fetching current issue articles for journal: ${path}, page: ${page}`);

            // Query the real platform_articles table populated by our ETL
            // Filter out junk: Titles matching 'Article [Number]' or 'Unknown' (Case Insensitive)
            const [articlesResult, countResult] = await Promise.all([
                fastify.db.query(`
                    SELECT 
                        a.item_id,
                        a.title,
                        a.authors,
                        EXTRACT(YEAR FROM a.publication_date) as year,
                        a.publication_date,
                        a.doi,
                        a.abstract,
                        a.pages
                    FROM platform_articles a
                    JOIN platform_journals j ON a.journal_id = j.journal_id
                    WHERE j.path = $1
                    AND a.title !~* '^Article [0-9]+$'
                    AND a.title !~* 'Unknown'
                    ORDER BY 
                        ('Unknown Author' = ANY(authors)) ASC,
                        a.publication_date DESC, 
                        a.title ASC
                    LIMIT $2 OFFSET $3;
                `, [path, limit, offset]),
                fastify.db.query(`
                    SELECT count(*) 
                    FROM platform_articles a
                    JOIN platform_journals j ON a.journal_id = j.journal_id
                    WHERE j.path = $1
                    AND a.title !~* '^Article [0-9]+$'
                    AND a.title !~* 'Unknown'
                `, [path])
            ]);

            return {
                articles: articlesResult.rows,
                pagination: {
                    page,
                    limit,
                    total: parseInt(countResult.rows[0].count)
                }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
        }
    });

    // GET /api/articles/:id
    // Fetches full details for a single article.
    // Note: This matches the standalone route used by the frontend
    fastify.get('/articles/:id', async (request, reply) => {
        const { id } = request.params;
        fastify.log.info(`Fetching details for article ID: ${id}`);
        try {
            const result = await fastify.db.query(`
                SELECT 
                    a.item_id,
                    a.title,
                    a.authors,
                    a.publication_date,
                    a.doi,
                    a.abstract,
                    a.pages
                FROM platform_articles a
                WHERE a.item_id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return reply.status(404).send({ error: 'Article not found' });
            }

            return result.rows[0];
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
        }
    });

}

module.exports = articleRoutes;
