# UDSM Journal Archive & Visibility Portal

Professional archival and impact monitoring system for University of Dar es Salaam (UDSM) journals.

## 🏗️ Project Structure

- **/frontend**: Next.js portal with high-end UI/UX, Leaflet geospatial visualization, and real-time activity "Pulse".
- **/backend**: Fastify API with PostGIS integration for geospatial analytics and OJS data extraction.
- **/sql**: Source archival data and schema definitions.
- **/docs**: Project roadmap, technical guides, and architectural decisions.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v14+ with PostGIS extension

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env # Configure your DB_URL
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🗺️ Phase 2: The Pulse
This project is currently in **Phase 2**, focusing on the "Readership Pulse" — a real-time heatmap showing global engagement with UDSM research.

---
&copy; 2026 University of Dar es Salaam.
