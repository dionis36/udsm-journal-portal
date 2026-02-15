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
            const zoom = parseInt(z);
            let query;
            const params = [zoom, parseInt(x), parseInt(y)];

            if (zoom < 10) {
                // Low Zoom: Function on pre-aggregated data
                query = `
                        WITH tile_data AS (
                            SELECT 
                                geom,
                                weight,
                                event_type,
                                journal_id::text
                            FROM readership_heatmap_cache
                            WHERE ST_Transform(geom, 3857) && ST_TileEnvelope($1, $2, $3)
                        ),
                        mvt_geom AS (
                            SELECT 
                                ST_AsMVTGeom(st_transform(geom, 3857), ST_TileEnvelope($1, $2, $3), 4096, 0, false) as geom,
                                weight,
                                event_type,
                                journal_id
                            FROM tile_data
                        )
                        SELECT ST_AsMVT(mvt_geom.*, 'readership', 4096, 'geom') as mvt FROM mvt_geom;
                    `;
            } else {
                // High Zoom: Precise individual points
                query = `
                        WITH tile_data AS (
                            SELECT 
                                rg.location_point,
                                rg.weight,
                                rg.event_type,
                                rg.journal_id::text,
                                COALESCE(rg.city_name, 'Regional Center') as city,
                                COALESCE(rg.country_name, 'Unknown') as country,
                                rg.region_name,
                                rg.country_code,
                                LEFT(pa.title, 100) as article_title
                            FROM readership_geodata rg
                            LEFT JOIN platform_articles pa ON rg.item_id = pa.item_id
                            WHERE ST_Transform(rg.location_point, 3857) && ST_TileEnvelope($1, $2, $3)
                            AND rg.location_point IS NOT NULL
                        ),
                        mvt_geom AS (
                            SELECT 
                                ST_AsMVTGeom(ST_Transform(location_point, 3857), ST_TileEnvelope($1, $2, $3), 4096, 0, false) as geom,
                                ROW_NUMBER() OVER () as id,
                                weight,
                                event_type,
                                journal_id,
                                city,
                                country,
                                region_name,
                                country_code,
                                article_title
                            FROM tile_data
                        )
                        SELECT ST_AsMVT(mvt_geom.*, 'readership', 4096, 'geom', 'id') as mvt FROM mvt_geom;
                    `;
            }

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
            return reply.code(500).send({
                error: 'Failed to generate vector tile',
                message: error.message,
                z, x, y
            });
        }
    });
};
