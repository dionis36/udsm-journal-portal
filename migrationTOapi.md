# UDSM Journal Portal - Migration & API Integration Master Guide
## Transitioning from OJS Legacy to Modern PostgreSQL Analytics

This document serves as the master blueprint for the UDSM Journal Portal. It combines the data sufficiency assessment, the API-to-Schema mapping, and the practical implementation steps required to build a high-impact research analytics platform.

---

## SECTION 1: Data Sufficiency & Metrics Strategy
### Why OJS API is Not Enough

Based on our critical assessment, the OJS REST API serves as a foundation but cannot power the advanced features of the UDSM Portal on its own.

#### Critical Gap Analysis
| Feature | OJS API Capability | Our Portal Requirement | Verdict |
|---------|-------------------|-------------------------|---------|
| **High-Precision Map** | Aggregated by City/Country | Precise 10m radius heatmapping | **FAILED** |
| **Live Impact Feed** | No real-time event stream | Live "Hit" notifications (HUD) | **FAILED** |
| **Historical Trends** | Basic monthly aggregates | Rolling 2-year Live Impact Factor (LIF) | **INSUFFICIENT** |
| **Citation Tracking** | None | Full citation lists (OpenAlex/Crossref) | **NOT SUPPORTED** |
| **Social Impact** | None | Altmetric/Twitter/News mentions | **NOT SUPPORTED** |

#### The Hybrid Solution
To solve these deficiencies, we use a **Hybrid Architecture**:
1. **OJS System**: Acts as the authoritative source for Article Metadata (Titles, Authors, Abstracts).
2. **PostgreSQL Portal**: Acts as the primary engine for **Engagement Analytics** and **Impact Metrics**. 
   - Usage stats (Heatmap) are captured **live** on the portal frontend.
   - External metrics (Citations/Altmetrics) are fetched via DOI from global providers.

---

## SECTION 2: API to Schema Mapping
### Connecting OJS 3.4+ to PostgreSQL

| Local Table | OJS API Endpoint | Key Fields |
|-------------|-------------------|------------|
| `platform_journals` | `/api/v1/contexts` | `urlPath` → `path`, `name` → `name`, `settings` → `metadata` |
| `research_items` | `/api/v1/submissions` | `id` → `legacy_id`, `title` → `title`, `doi` → `doi` |
| `readership_geodata` | `/api/v1/stats/usage` | Aggregated fallback only. See Section 3 for Live tracking. |

**External Linkage:**
- **Article -> Citations**: Linked via `item_id` (UUID).
- **Article -> Metric Cache**: Linked via `doi` (String).
- **Metric -> Journal**: Linked via the `journal_id` hierarchy in `research_items`.

---

## SECTION 3: Integration & Implementation Process
### 3.1 Configuration Management

All sensitive details and instance paths should be stored in a centralized `config.json` or `.env` file within the `backend/` directory.

**Where to put required details:**
- **OJS API Tokens**: Generate in OJS (Settings → Website → Users → API Key). Store in `OJS_API_TOKEN`.
- **Base URLs**: The full URL to the journal (e.g., `https://journals.udsm.ac.tz/zjahs`). Store in `OJS_BASE_URL`.
- **Database Connection**: Use `DATABASE_URL` in your backend `.env`.

#### Sample `config.json` Structure:
```json
{
  "ojs_instances": [
    {
      "journal_id": 1,
      "path": "zjahs",
      "base_url": "https://journals.udsm.ac.tz/zjahs",
      "api_token": "TOK_12345"
    }
  ],
  "external_apis": {
    "crossref_email": "admin@udsm.ac.tz",
    "openalex_url": "https://api.openalex.org"
  }
}
```

### 3.2 Automated Sync Pipeline (The ETL Process)

Your system should run a multi-stage sync script (e.g., in Python or Node.js) to populate the hierarchy.

#### Stage 1: Journal Synchronization
Pulls from `/api/v1/contexts` to ensure all UDSM journals are registered.
```python
# Pseudo-code for Journal Sync
context = client.get('contexts/1')
cur.execute("INSERT INTO platform_journals (...) ON CONFLICT (journal_id) DO UPDATE ...")
```

#### Stage 2: Article Synchronization
Pulls published articles from `/api/v1/submissions?status=3`.
```python
# Mapping OJS Submission to Local Research Item
submissions = client.get_all_paginated('submissions', {'status': 3})
for sub in submissions:
    # Use sub['id'] as legacy_id to prevent duplicates
    # Use Doi to enable future citation tracking
```

#### Stage 3: External Metric Enrichment
This stage is critical as it fills the gaps OJS cannot reach.
1. **Crossref**: Fetch `is-referenced-by-count` using the article DOI.
2. **OpenAlex**: Fetch detailed `citing_works` to populate `article_citations`.
3. **Altmetric**: Fetch the attention score for social media impact.

### 3.3 Scheduling & Maintenance

To keep the "Live" feeling of the portal, use the following cron/systemd schedule:

| Task | Frequency | Purpose |
|------|-----------|---------|
| **Journal Sync** | Weekly | Updates branding and metadata. |
| **New Article Sync** | Daily | Pulls latest publications from OJS. |
| **Metric Refresh** | Daily | Updates citation counts and Altmetric scores. |
| **Stats Refresh** | Hourly | Refreshes `journal_citation_stats` Materialized View. |

---

## SECTION 4: Technical Summary for Developers

1. **DOI is Mandatory**: Metrics cannot be fetched for articles missing a DOI. The OJS API sync must prioritize capturing valid DOIs.
2. **UUIDs for Internal Consistency**: While OJS uses integer IDs, our portal uses **UUIDs** for `item_id` to allow for distributed scaling and unique external tracking.
3. **Live Geodata**: Do not rely on OJS Stats API for the Heatmap. Use the portal's internal `metrics/record-read` endpoint to capture live, high-precision events (Lat/Lng) directly into `readership_geodata`.
4. **Performance**: Always use **concurrent refreshes** for Materialized Views to prevent locking the database during data updates.
