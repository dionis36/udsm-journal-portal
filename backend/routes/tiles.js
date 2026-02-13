"use strict";

module.exports = async function (fastify, opts) {
    // GET /api/tiles/:z/:x/:y.mvt
    // Returns Mapbox Vector Tiles (MVT) for readership data
    fastify.get('/tiles/:z/:x/:y.mvt', async (request, reply) => {
        const { z, x, y } = request.params;

        try {
            // PostGIS query to generate MVT
            // 1. ST_TileEnvelope(z, x, y) generates the bounding box for the tile
            // 2. ST_AsMVTGeom transforms our lat/lng points into tile-relative coordinates
            // 3. ST_AsMVT aggregates them into a binary MVT buffer
            const query = `
                WITH mvt_geom AS (
                    SELECT 
                        ST_AsMVTGeom(
                            location_point::geometry, 
                            ST_TileEnvelope($1, $2, $3),
                            4096, 0, false
                        ) as geom,
                        event_type,
                        journal_id
                    FROM readership_geodata
                    WHERE location_point && ST_TileEnvelope($1, $2, $3)
                )
                SELECT ST_AsMVT(mvt_geom.*, 'readership') as mvt FROM mvt_geom;
            `;

            const result = await fastify.db.query(query, [parseInt(z), parseInt(x), parseInt(y)]);

            if (result.rows.length === 0 || !result.rows[0].mvt) {
                return reply.code(204).send(); // No content for this tile
            }

            reply
                .header('Content-Type', 'application/vnd.mapbox-vector-tile')
                .header('Cache-Control', 'public, max-age=60') // Cache for 1 minute
                .send(result.rows[0].mvt);

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to generate vector tile' });
        }
    });
};
