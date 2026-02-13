# Project Roadmap / Checklist
**UDSM Journal Visibility and Impact Coding 2026**

This roadmap tracks the **Phased** and **Sub-Phased** implementation of the system.

---

## 🟢 Phase 1: Foundation & Metadata (Hours 1-12)
**Goal**: Functional Backend, Database, and Landing Page.

### 1.1 Infrastructure Setup
- [x] **Database**: PostgreSQL + PostGIS initialized.
- [x] **Backend**: Fastify project created & configured.
- [x] **Frontend**: Next.js project created.
- [x] **ETL**: Legacy data (Metrics + Journals) migrated to new schema.

### 1.2 Backend Core
- [x] **API - Journals**: `GET /api/journals/:path` (Fetch branding/settings).
- [x] **API - Articles**: `GET /api/journals/:path/issues/current` (Fetch TOC).
- [x] **Database Connection**: Ensure connection pool (Fastify-PG) is optimized.

### 1.3 Frontend Core
- [x] **Data Fetching**: Hook up SWR/TanStack Query for journal data.
- [x] **Journal Page**: Render dynamic Journal Title & Logo from API.
- [x] **Article List**: Display list of articles from the current issue.
- [x] **Search Page**: Advanced search with filters (`/search`).
- [x] **About Page**: Institutional mission statement (`/about`).
- [x] **FAQ Page**: Author and Reader common questions (`/faq`).
- [x] **Accessibility**: WCAG 2.1 Statement (`/accessibility`).

---

## 🟡 Phase 2: The "Pulse" (Hours 13-36)
**Goal**: Real-time Visualization (The Heatmap).

### 2.1 Geospatial API
- [ ] **Endpoint**: `GET /api/readership/heatmap`.
    - Returns GeoJSON or array of `{ lat, lng, type }`.
    - Optimized with PostGIS `ST_AsGeoJSON`.

### 2.2 Frontend Map Component
- [ ] **Leaflet Setup**: Initialize Map container.
- [ ] **Heat Layer**: Render "Historical Density" (Red/Yellow blobs) from `metrics`.
- [ ] **Pulse Layer**: Render "Live Activity" (Blue Ripples) from WebSocket.

### 2.3 Real-Time Pipeline
- [ ] **Socket.io Server**: Setup in Fastify (`@fastify/websocket` or `socket.io`).
- [ ] **Tracking Endpoint**: `POST /api/track` (Receives hits from client).
- [ ] **Broadcasting**: Emit `new_reader` event to all connected clients.

---

## 🔵 Phase 3: Impact Metrics (Hours 37-60)
**Goal**: Advanced Statistics & Citations.

### 3.1 External API Integrations
- [ ] **Crossref Proxy**: Fetch citation counts by DOI.
- [ ] **Altmetrics**: Placeholder/Integration for social shares.

### 3.2 Advanced Stats Logic
- [ ] **JIF/CiteScore Display**: Render static metrics from `platform_journals`.
- [ ] **Predictive Modeling**: Implement rolling "Live Impact Factor" calculation.
- [ ] **Correlation Graph**: Chart.js/Recharts scatter plot for "Downloads vs Citations".
- [ ] **Trend Calculation**: "Top 5 Read Articles this Week" (Redis Sorted Sets).

---

## 🔴 Phase 4: Polish & Production (Hours 61-72)
**Goal**: UX, Branding, and Stability.

### 4.1 UI/UX Refinement
- [ ] **UDSM Branding**: Apply official colors (Blue/Gold).
- [ ] **Mobile Responsiveness**: Check Map on mobile.

### 4.2 Performance
- [ ] **Rate Limiting**: Protect `/api/track`.
- [ ] **Caching**: Cache public API responses in Redis.

### 4.3 Final Deliverables
- [ ] **Deployment Script**: Dockerfile or PM2 config.
- [ ] **Presentation Demo**: Scripted "Fake Traffic" generator for the pitch.
