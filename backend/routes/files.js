const fs = require('fs');
const path = require('path');

module.exports = async function (fastify, opts) {

    // Get PDF for an article
    fastify.get('/articles/:id/pdf', async (request, reply) => {
        const { id } = request.params;

        try {
            // Query to check if article exists and has file reference
            const result = await fastify.db.query(
                'SELECT item_id, title, metadata FROM platform_articles WHERE item_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Article not found' });
            }

            const article = result.rows[0];

            // Check for file path in metadata (if we stored it during ETL)
            const filePath = article.metadata?.filePath;

            if (!filePath) {
                // No file reference in database
                return reply.code(404).send({
                    error: 'PDF not available',
                    message: 'This article does not have an associated PDF file.'
                });
            }

            // Construct full path to PDF
            const fullPath = path.join(__dirname, '..', 'storage', 'articles', filePath);

            // Check if file exists
            if (!fs.existsSync(fullPath)) {
                return reply.code(404).send({
                    error: 'PDF file not found',
                    message: 'The PDF file is referenced but not available on the server.'
                });
            }

            // Stream the PDF
            const stream = fs.createReadStream(fullPath);

            reply
                .type('application/pdf')
                .header('Content-Disposition', `inline; filename="${article.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`)
                .send(stream);

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

    // Download PDF (forces download instead of inline view)
    fastify.get('/articles/:id/pdf/download', async (request, reply) => {
        const { id } = request.params;

        try {
            const result = await fastify.db.query(
                'SELECT item_id, title, metadata FROM platform_articles WHERE item_id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Article not found' });
            }

            const article = result.rows[0];
            const filePath = article.metadata?.filePath;

            if (!filePath) {
                return reply.code(404).send({
                    error: 'PDF not available',
                    message: 'This article does not have an associated PDF file.'
                });
            }

            const fullPath = path.join(__dirname, '..', 'storage', 'articles', filePath);

            if (!fs.existsSync(fullPath)) {
                return reply.code(404).send({
                    error: 'PDF file not found',
                    message: 'The PDF file is referenced but not available on the server.'
                });
            }

            const stream = fs.createReadStream(fullPath);

            reply
                .type('application/pdf')
                .header('Content-Disposition', `attachment; filename="${article.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`)
                .send(stream);

        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });
};
