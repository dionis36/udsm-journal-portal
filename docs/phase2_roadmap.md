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
- [ ] **Data Sanitization**: Aggregate `metrics` table into a `readership_summary` for faster heatmap loading.
- [ ] **PostGIS Querying**: Implement ST_SnapToGrid and ST_AsGeoJSON to serve aggregated coordinate data.
- [ ] **Pulse API**: Create `GET /api/metrics/pulse` returning the last 50 global readership hits.

### Week 2: Map Architecture (Frontend)
- [ ] **Base Map Implementation**: Initialize MapLibre with Carto tiles in a high-performance `<MapboxView>` wrapper.
- [ ] **Deck.gl Integration**: Layer a GPU-accelerated HeatmapLayer on top of MapLibre.
- [ ] **UI Overlay**: Create a "Glassmorphism" control panel with:
    - Live Reader Counter
    - Top Reading Countries
    - Historical Range Selector

### Week 3: Real-Time Synchronization
- [ ] **WebSocket Setup**: Implement `@fastify/websocket` on the backend to broadcast live hits.
- [ ] **Ripple Layer**: Create a custom Deck.gl layer to render "Blue Ripples" that animate on hit events.
- [ ] **Notification system**: Soft, non-intrusive toast notification: *"Someone in Dar es Salaam just read: [Article Title]"*.

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
