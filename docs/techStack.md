This **Technical Stack Specification** defines the architecture for the **UDSM Journal Visibility and Impact Coding 2026** project. It is designed to meet the challenge's requirements for a real-time, interactive global readership dashboard with a professional UI/UX.

Following your specific requirements, the architecture utilizes a decoupled approach with **Next.js** strictly for the frontend and **Fastify** for the high-performance backend.

### 1. Technical Stack Overview

| Layer | Technology | Why? |
| --- | --- | --- |
| **Backend** | **Node.js (Fastify)** | Non-blocking I/O is essential for handling thousands of concurrent "readership" events. |
| **Real-time Engine** | **Socket.io (WebSockets)** | Enables the "Live Metrics" to update without page refreshes. |
| **Database (Primary)** | **PostgreSQL (with PostGIS)** | You should migrate/mirror the `tjpsd32` MySQL data to Postgres. PostGIS handles geographic queries (heat maps) 10x faster. |
| **Cache/Stream** | **Redis** | Use Redis to store "Active Sessions" and "Recent Hits" to avoid hammering your main SQL DB. |
| **Frontend** | **Next.js** | Server-side rendering (SSR) for SEO-friendly journal pages, with dynamic client-side dashboarding. |
| **Mapping Library** | **Leaflet.js + Leaflet.heat** | Lightweight and perfect for real-time "ripple" effects and heat maps. |

---

### 2. Layer-by-Layer Specification

#### **Backend: Node.js (Fastify)**

* **Role**: Serves as the high-throughput API gateway and event processor.
* **Implementation**: Fastify will handle the heavy lifting of processing incoming hits from the journal pages, resolving IP addresses via GeoIP, and managing the connection to the PostgreSQL/PostGIS database.
* **Performance**: Chosen for its extremely low overhead, making it ideal for the "Live Metrics" requirement of the UDSM challenge.

#### **Real-time Engine: Socket.io**

* **Role**: The bridge between the backend event stream and the frontend UI.
* **Functionality**: When the backend processes a new reader event, Socket.io broadcasts the coordinates and journal metadata to all connected Next.js clients. This powers the "Interactive World Heat Map" in real-time.

#### **Database: PostgreSQL + PostGIS**

* **Role**: Permanent storage for historical readership data and journal metadata.
* **Migration**: The existing `tjpsd32` schema (including tables like `metrics`, `journals`, and `publications`) will be mirrored here.
* **Geospatial Advantage**: PostGIS enables complex spatial queries (e.g., "count downloads within a 50km radius of Dar es Salaam") which are significantly faster than standard SQL for heat map generation.

#### **Cache/Stream: Redis**

* **Role**: High-speed memory store for volatile data.
* **Use Case**: Redis will track "Live Now" session counts and the last 100 reader events. This prevents frequent, expensive `SELECT` queries on the primary database during periods of high traffic.

#### **Frontend: Next.js**

* **Role**: The presentation layer, strictly focused on the UI and client-side interactions.
* **Branding**: Ensures a professional UI/UX that aligns with UDSM's official branding (e.g., University colors and logos) as required by the mission.
* **SEO**: Utilizes Server-Side Rendering (SSR) to ensure journal articles and metadata are easily indexable by academic search engines like Google Scholar.

#### **Mapping Library: Leaflet.js + Leaflet.heat**

* **Role**: Geospatial visualization.
* **Interactive Features**: Renders the "World Heat Map". `Leaflet.heat` will be used to visualize density (heat), while standard Leaflet markers or circles will create the "ripple" pulse effect for live hits.

---

### 3. Architecture Flow

1. **Ingestion**: A visitor accesses a journal page (e.g., ZJAHS).
2. **Processing**: The page sends a request to the **Fastify Backend**.
3. **Enrichment**: Fastify resolves the IP, checks for **UDSM Institutional Access**, and updates **Redis**.
4. **Broadcast**: **Socket.io** pushes the event to the **Next.js Frontend**.
5. **Visualization**: The **Leaflet.js** map on the dashboard displays a live "ripple" at the reader's location.