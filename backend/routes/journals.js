const pool = require('../db');

/**
 * Journal API Routes
 * Handles retrieval of journal-specific metadata and branding.
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 */
async function journalRoutes(fastify, options) {
  fastify.log.info('Journal Routes Registered');

  // GET /api/journals
  // Fetches a list of all journals on the platform
  fastify.get('/', async (request, reply) => {
    const result = await pool.query('SELECT journal_id, path, name FROM platform_journals');
    return result.rows;
  });

  // GET /api/journals/:path
  // Fetches branding, name, and metadata for a journal by its URL path slug (e.g., 'zjahs')
  fastify.get('/:path', {
    schema: {
      params: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            journal_id: { type: 'integer' },
            name: { type: 'string' },
            branding: { type: 'object', additionalProperties: true }, // Flexible JSON
            metadata: { type: 'object', additionalProperties: true }
          }
        },
        404: {
          type: 'object', properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { path } = request.params;
    fastify.log.info(`Fetching journal metadata for path: ${path}`);

    // Parameterized query prevents SQL injection
    const result = await pool.query(
      `SELECT journal_id, name, branding, metadata 
       FROM platform_journals 
       WHERE path = $1`,
      [path]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Journal not found' });
    }

    return result.rows[0];
  });

}

module.exports = journalRoutes;
