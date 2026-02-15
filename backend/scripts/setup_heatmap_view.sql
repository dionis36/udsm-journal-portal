-- Create materialized view for heatmap aggregation
-- This snaps coordinates to a 0.1 degree grid (~11km) for privacy and performance
DROP MATERIALIZED VIEW IF EXISTS readership_heatmap_cache;

CREATE MATERIALIZED VIEW readership_heatmap_cache AS
SELECT 
    ST_SnapToGrid(location_point, 0.1) as geom,
    journal_id,
    SUM(weight) as weight,
    event_type
FROM readership_geodata
WHERE location_point IS NOT NULL
GROUP BY ST_SnapToGrid(location_point, 0.1), journal_id, event_type;

-- Index for performance
CREATE INDEX idx_heatmap_geom ON readership_heatmap_cache USING GIST(geom);
CREATE INDEX idx_heatmap_event ON readership_heatmap_cache(event_type);
CREATE INDEX idx_heatmap_journal ON readership_heatmap_cache(journal_id);

-- Refresh function (mock for now, would be called by a trigger or cron)
-- REFRESH MATERIALIZED VIEW readership_heatmap_cache;
