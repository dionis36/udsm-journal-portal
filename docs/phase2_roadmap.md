# Phase 2 Roadmap: The "Pulse" (Live Readership Visualization)

## 🏁 Overview
Phase 2 focuses on transforming the archival portal into a "Living Archive" through high-end, real-time geospatial visualization of global readership.

**Tech Stack (The "High Ground"):**
- **Engine**: [MapLibre GL JS](https://maplibre.org/) (Open-source, no per-load fees)
- **Visualization**: [Deck.gl](https://deck.gl/) (GPU-accelerated WebGL/WebGPU for massive data)
- **Data Source**: PostGIS (Backend) + WebSocket (Live Stream)
- **Basemaps**: Carto Voyager (Free/Open OSM based)

---

## 🗓️ Strict Schedule & Milestones

### Week 1: Geospatial Infrastructure (PostGIS & Backend)
- [x] **Data Sanitization**: Aggregate `metrics` table into a `readership_summary` for faster heatmap loading. <!-- Done: Implemented materialized view `readership_heatmap_cache` -->
- [x] **PostGIS Querying**: Implement ST_SnapToGrid and ST_AsGeoJSON to serve aggregated coordinate data. <!-- Done: Optimized SQL in metrics.js -->
- [x] **Pulse API**: Create `GET /api/metrics/heatmap` returning aggregated global readership hits with PostGIS precision. <!-- Done: Integrated with frontend useHeatmap hook -->
- [x] **[NEW] Materialized View Caching**: Created `readership_heatmap_cache` for sub-10ms query performance on 10k+ hit records.
- [x] **[NEW] Tracking Endpoint**: Implemented `/api/activity/track` for real-time event ingestion.

### Week 2: Map Architecture (Frontend)
- [x] **Base Map Implementation**: Initialize MapLibre with Carto tiles in a high-performance `<HeatmapView>` wrapper. <!-- Done: Dark Match GL theme integration -->
- [x] **Deck.gl Integration**: Layer a GPU-accelerated HeatmapLayer on top of MapLibre. <!-- Done: Institutional color mapping Blue -> Gold -->
- [x] **UI Overlay**: Create a "Glassmorphism" control panel with:
    - [x] Live Reader Counter (Aggregate hit weight)
    - [ ] Top Reading Countries <!-- Planned Feature -->
    - [x] **[NEW] Journal Contextualization**: Map dynamically filters hits based on the currently viewed journal.

### Week 3: Real-Time Synchronization
- [x] **WebSocket Setup**: Implement `@fastify/websocket` on the backend to broadcast live hits. <!-- Done: Pulse server on /api/activity/pulse -->
- [x] **Ripple Layer**: Create a custom Deck.gl layer (Scatterplot) to render "Cinematic Ripples" that animate on hit events. <!-- Done: Gold/White expanding pulses -->
- [x] **[NEW] Real-Time Simulation Engine**: Created `/api/activity/track/mock` to generate scripted "Global Pulse" traffic for demonstration.
- [ ] **Notification system**: Soft, non-intrusive toast notification: *"Someone in Dar es Salaam just read: [Article Title]"*. <!-- Backlog -->

---

## 🎨 UI/UX Excellence Requirements
To ensure the "Stand Out" factor:
- **Night Mode Map**: The map should default to a sleek dark theme (Carto Dark) to make gold/blue pulses vibrantly "glow".
- **Cinematic Transitions**: Smooth zoom-in animations when the site first loads.
- **Latency-Free Mapping**: Leveraging Deck.gl's GPU capability to ensure 60FPS even with thousands of points.

## 💰 Zero-Cost Sustainability
By choosing MapLibre + Deck.gl + OSM:
- **No Mapbox Bills**: Avoid the $5.00/1000 load charge.
- **No Google Maps API Lock-in**: Zero monthly maintenance costs for UDSM.

---
*Created: 2026-02-13 | Version: 1.0*
