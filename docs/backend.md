This document outlines the complete backend architecture for the **UDSM Journal Visibility and Impact Dashboard**. It is designed to be implemented within a 72-hour window, leveraging the existing `tjpsd32` MySQL schema for historical data and a new Next.js/Redis pipeline for real-time tracking.

---

# Backend Engineering Specification: "The Visibility Engine"

## 1. System Architecture Overview

The backend is split into two functional layers:

* **The Metadata Layer:** Communicates with the legacy MySQL database (`tjpsd32`) to serve journal details, issues, and article metadata.
* **The Event Layer:** A high-speed pipeline using Next.js API routes and Redis to capture, enrich, and broadcast live readership events (the "Pulse").

---

## 2. Phase 1: The Metadata Engine (Hours 1–12)

**Goal:** Expose the existing journal content from the SQL schema to the Next.js frontend.

### Feature: Unified Journal & Issue API

This endpoint fetches everything needed to render a page like ZJAHS. Because the OJS schema uses an "Entity-Attribute-Value" (EAV) model for settings, your query must pivot the `journal_settings` and `publication_settings` tables.

**SQL Implementation (The "Hackathon Winner" Query):**
This query retrieves the current journal's branding and all articles associated with the most recent issue.

```sql
-- Fetching Journal Metadata and Current Issue Articles
SELECT 
    j.journal_id,
    js_name.setting_value AS journal_name,
    i.issue_id,
    i.volume,
    i.number,
    i.year,
    p.publication_id,
    ps_title.setting_value AS article_title,
    GROUP_CONCAT(DISTINCT CONCAT(as_fname.setting_value, ' ', as_lname.setting_value) SEPARATOR ', ') AS authors
FROM journals j
JOIN journal_settings js_name ON (j.journal_id = js_name.journal_id AND js_name.setting_name = 'name')
JOIN issues i ON (j.journal_id = i.journal_id AND i.current = 1)
JOIN publications p ON (p.status = 3) -- 3 = Published status
JOIN submissions s ON (p.submission_id = s.submission_id AND s.context_id = j.journal_id)
JOIN publication_settings ps_title ON (p.publication_id = ps_title.publication_id AND ps_title.setting_name = 'title')
JOIN authors a ON (p.publication_id = a.publication_id)
JOIN author_settings as_fname ON (a.author_id = as_fname.author_id AND as_fname.setting_name = 'givenName')
JOIN author_settings as_lname ON (a.author_id = as_lname.author_id AND as_lname.setting_name = 'familyName')
WHERE j.path = 'zjahs' -- Dynamic parameter for the journal path
GROUP BY p.publication_id, i.issue_id;

```

---

## 3. Phase 2: The Real-time Pulse Pipeline (Hours 13–36)

**Goal:** Track live global readership and provide data for the "Interactive World Heat Map".

### Feature: The Readership Ingestion Endpoint (`/api/track`)

* **Trigger:** Client-side `useEffect` sends a POST request when an article is viewed.
* **Data Captured:** `submission_id`, `journal_id`, `ip_address` (from headers), `user_agent`.
* **Processing Logic:**
1. **Geo-Resolution:** Resolve the IP into `latitude`, `longitude`, and `country_code` using a local database or high-speed API.
2. **Institutional Check:** Compare the IP against the ranges in `institutional_subscription_ip` to identify if the reader is on the UDSM campus.
3. **Broadcast:** Send a payload to the WebSocket server (Socket.io or Pusher) to trigger a visual pulse on the map.



---

## 4. Phase 3: Impact Metrics & Global Stats (Hours 37–60)

**Goal:** Display dynamic counters for downloads and academic influence.

### Feature: Aggregated Metrics API

* **Historical Downloads:** Sum the `metric` column from the `metrics` table filtered by `assoc_type = 256` (Articles).
* **Real-time Citations:**
* Instead of the static `citations` table, the backend will act as a proxy for the **Crossref API**.
* On article load, the backend fetches the citation count using the article's DOI and caches it in Redis for 24 hours to avoid API rate limits.


* **Peer Review Speed:** Calculate the median of (`date_published` - `date_submitted`) from the `submissions` and `publications` tables to showcase journal efficiency.

---

## 5. Phase 4: Production Readiness & UX Details (Hours 61–72)

**Goal:** Ensure the system is stable, secure, and ready to go LIVE.

### Functional Details:

* **Redis Caching Layer:** Store the "Top 5 Most Read Articles" in Redis. Re-calculate every 10 minutes from the `usage_stats_temporary_records` table to keep the dashboard snappy.
* **Security (Rate Limiting):** Apply a "Leaky Bucket" algorithm to the tracking endpoint to prevent bot views from inflating the "Live Metrics".
* **CORS Configuration:** Strictly limit the API to only accept requests from the official `udsm.ac.tz` domain to prevent data scraping.

---

## Summary of Data Mapping

| Feature | Legacy Source (`tjpsd32`) | New Backend Action | Dashboard Output |
| --- | --- | --- | --- |
| **Heat Map** | `metrics` (historical) | Real-time IP resolution | Glowing Map Pulse |
| **Issue List** | `issues`, `sections` | Next.js API Route | TOC / Landing Page |
| **Impact Score** | `citations` (bibliography) | External DOI Proxying | Dynamic Citation Count |
| **Campus Badge** | `institutional_subscriptions` | IP Range Matching | "Read at UDSM" Tag |

This phased approach ensures that you have a functional metadata site within 12 hours, a working map by 36 hours, and a fully polished, metric-rich dashboard by the competition deadline.



To achieve a high-impact solution for the **UDSM Journal Visibility and Impact Coding 2026**, you must bridge the gap between the legacy OJS system and your modern, real-time stack.

The strategy involves "flattening" the complex SQL structure from the `tjpsd32` schema into a high-performance PostgreSQL/PostGIS environment.

---

### 1. Unified Platform Schema Specification

The new schema is designed for speed and real-time visualization, shifting from the Entity-Attribute-Value (EAV) model of OJS to a hybrid Relational-JSONB structure.

#### **A. PostgreSQL Core Tables**

* **`platform_journals`**: Stores identity for all journals (e.g., ZJAHS).
* **Fields**: `journal_id` (Primary Key), `path` (slug), `name`, `branding` (JSONB: colors, logo_url), `metadata` (JSONB: ISSN, scope).


* **`research_items`**: A unified index of all articles across the platform.
* **Fields**: `item_id` (UUID), `legacy_id` (mapping to OJS `submission_id`), `journal_id`, `title`, `doi`, `authors` (JSONB array), `search_vector` (TSVector for global search).


* **`readership_geodata`**: **(PostGIS Enabled)** The source for your World Heat Map.
* **Fields**: `event_id`, `journal_id`, `item_id`, `location_point` (Geometry: Point 4326), `country_code`, `city_name`, `is_institutional` (Boolean), `event_type` (READ vs. DOWNLOAD), `timestamp`.



#### **B. Real-Time Stats Layer (Redis)**

To provide "Live Metrics" without overloading the database, store active counters in Redis.

* **`stats:live_now`**: Set of active session IDs with a 5-minute TTL.
* **`stats:journal:{id}:downloads`**: Atomic counter incremented on every PDF access.
* **`stats:recent_activity`**: A capped list of the last 50 events (e.g., "{City}, {Country} just downloaded {Article}").

---

### 2. Data Extraction and Transformation (ETL)

To archive the legacy data and use it for development, follow this **Extract, Transform, Load (ETL)** pipeline.

#### **Step 1: Extract (Querying the SQL File)**

You need to selectively pull historical data to "prime" your system. Use a script to extract:

* **Journal Info**: Join `journals` and `journal_settings`.
* **Historical Impact**: Select `country_id`, `city`, and `metric` from the `metrics` table where `assoc_type = 256` (Articles).
* **Campus Ranges**: Extract `ip_start` and `ip_end` from `institutional_subscription_ip` to identify UDSM campus hits.

#### **Step 2: Transform (Data Cleaning)**

* **Flattening**: Convert the multiple rows of `journal_settings` into a single JSONB object for your `platform_journals` table.
* **Geocoding**: Convert the ISO `country_id` (e.g., 'TZ') and `city` strings from the legacy `metrics` table into actual Latitude/Longitude coordinates using a GeoIP library (e.g., MaxMind).
* **Pseudonymization**: Truncate IP addresses from the `sessions` table to ensure privacy compliance before migration.

#### **Step 3: Load (Populating Dev Environment)**

* Insert the transformed data into your PostgreSQL/PostGIS tables.
* **Dev Shortcut**: To keep your dev environment light, only migrate data from the last 12 months (filter by the `month` column in the `metrics` table).

---

### 3. Functional Backend Logic

Your Fastify backend must manage the "Live Pulse" through three distinct triggers.

| Trigger | Logic | Output |
| --- | --- | --- |
| **On Abstract View** | Increment Redis `reads` + Log `ABSTRACT_VIEW` in PostGIS. | Small Blue Ripple on Map. |
| **On PDF Click** | Increment Redis `downloads` + Log `PDF_DOWNLOAD` in PostGIS. | Large Gold Ripple on Map. |
| **Institutional Match** | Compare IP against `ip_start/ip_end` ranges. | "Read from UDSM Campus" Badge. |

### 4. Implementation Assessment

* **Speed**: Using a **Materialized View** in PostgreSQL to pre-calculate the "Global Impact Stats" for the Heat Map ensures the dashboard loads in under 200ms.
* **Scalability**: The UUID approach in `research_items` allows your platform to eventually index journals outside of UDSM (Global scalability).
* **Visibility**: Integrating the **Crossref Event Data API** allows you to show "Citations" alongside "Downloads," fulfilling the competition's "Impact" requirement.

---

**Next Step for Your Team:**
Would you like me to generate the **SQL Migration Script** that specifically flattens the `journal_settings` for the ZJAHS journal so you can test it on your local database?