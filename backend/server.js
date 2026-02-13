const fastify = require('fastify')({ logger: true });
require('dotenv').config();
const pool = require('./db');

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: true // Allow all for hackathon; restrict in prod
});

// Register WebSockets
fastify.register(require('@fastify/websocket'));

// Register Swagger (OpenAPI)
fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'UDSM Journal Visibility API',
      description: 'API for Journal Metadata, Articles, and Real-time Analytics',
      version: '1.0.0'
    },
    host: 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

fastify.register(require('@fastify/swagger-ui'), {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
})

  ;

// Decorate Fastify with database pool
fastify.decorate('db', pool);

// Register Routes
fastify.register(require('./routes/journals'), { prefix: '/api/journals' });
fastify.register(require('./routes/articles'), { prefix: '/api' });
fastify.register(require('./routes/files'), { prefix: '/api' }); // PDF file serving
fastify.register(require('./routes/metrics'), { prefix: '/api' }); // External metrics
fastify.register(require('./routes/activity'), { prefix: '/api' }); // Live Pulse & Tracking
fastify.register(require('./routes/tiles'), { prefix: '/api' }); // Vector Tiles

// Root Route
fastify.get('/', async (request, reply) => {
  return { hello: 'UDSM Journal Visibility Dashboard', docs: '/documentation' };
});

// Database Check (using Pool)
fastify.get('/db-check', async (request, reply) => {
  try {
    const client = await pool.getClient();
    const res = await client.query('SELECT NOW()');
    client.release();
    return { status: 'connected', time: res.rows[0].now };
  } catch (err) {
    fastify.log.error(err);
    return { status: 'error', message: err.message };
  }
});

const start = async () => {
  try {
    await fastify.ready();
    fastify.swagger(); // Generate Swagger

    // Listen on 3001
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
