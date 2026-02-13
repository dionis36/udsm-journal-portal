"use strict";

module.exports = async function (fastify, opts) {
    // Keep track of connected clients
    const clients = new Set();

    fastify.get('/activity/pulse', { websocket: true }, (connection, req) => {
        clients.add(connection);
        fastify.log.info('WebSocket client connected');

        connection.on('close', () => {
            clients.delete(connection);
            fastify.log.info('WebSocket client disconnected');
        });

        // Send a heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
            if (connection.readyState === 1) {
                connection.send(JSON.stringify({ type: 'HEARTBEAT' }));
            }
        }, 30000);

        connection.on('error', (err) => {
            fastify.log.error(err);
            clients.delete(connection);
        });
    });

    // Broadcast utility
    const broadcast = (data) => {
        const message = JSON.stringify(data);
        for (const client of clients) {
            if (client.readyState === 1) {
                client.send(message);
            }
        }
    };

    // Tracking Endpoint: Trigger a live ripple
    // In a real system, this would be called by the frontend or an archival hook
    fastify.post('/track', async (request, reply) => {
        const { journal_id, article_id, lat, lng, event_type } = request.body;

        const event = {
            type: 'READERSHIP_HIT',
            payload: {
                journal_id,
                article_id,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                event_type: event_type || 'view',
                timestamp: new Date().toISOString()
            }
        };

        // Broadcast to all connected clients
        broadcast(event);

        // Also log to geodata table for heatmap persistence
        try {
            await fastify.db.query(
                `INSERT INTO readership_geodata (journal_id, article_id, location_point, event_type) 
                 VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)`,
                [journal_id, article_id, lng, lat, event_type || 'view']
            );
        } catch (err) {
            fastify.log.error('Failed to log geodata:', err);
        }

        return reply.send({ status: 'broadcasted', event });
    });

    // Bulk Simulated Hits (for testing animations)
    fastify.post('/track/mock', async (request, reply) => {
        const count = request.body.count || 5;
        const hits = [];

        for (let i = 0; i < count; i++) {
            // Random-ish coordinates around Africa/Europe/Asia
            const lat = (Math.random() * 60) - 20;
            const lng = (Math.random() * 80);

            const event = {
                type: 'READERSHIP_HIT',
                payload: {
                    lat,
                    lng,
                    timestamp: new Date().toISOString()
                }
            };
            broadcast(event);
            hits.push(event);
        }

        return reply.send({ status: 'mocked', count, hits });
    });
};
