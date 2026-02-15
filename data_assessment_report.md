# Critical Assessment: OJS API vs. Portal Requirements
## Data Sufficiency & Metrics Strategy Report

This report evaluates the ability of the OJS REST API to support the UDSM Journal Portal's advanced features, specifically the **Global Map**, **Impact Statistics**, and **Detailed Article Insights**.

---

### 1. Executive Summary
The OJS REST API is **insufficient** as a sole data source for a modern, high-impact research portal. While OJS is excellent for managing the submission-to-publication workflow, it lacks the real-time tracking, granular geospatial data, and historical citation analytics required for our vision. 

**Recommendation**: Maintain a "Hybrid Architecture" where OJS provides core metadata, but our local PostgreSQL database acts as the primary engine for analytics and engagement.

---

### 2. Critical Gap Analysis

| Feature | OJS API Capability | Our Portal Requirement | Verdict |
|---------|-------------------|-------------------------|---------|
| **High-Precision Map** | Aggregated by City/Country | Precise 10m radius heatmapping | **FAILED** |
| **Live Impact Feed** | No real-time event stream | Live "Hit" notifications (HUD) | **FAILED** |
| **Historical Trends** | Basic monthly aggregates | Rolling 2-year Live Impact Factor (LIF) | **INSUFFICIENT** |
| **Citation Tracking** | None | Full citation lists (OpenAlex/Crossref) | **NOT SUPPORTED** |
| **Social Impact** | None | Altmetric/Twitter/News mentions | **NOT SUPPORTED** |

---

### 3. Metric Management Strategy

#### Where should data live?
- **OJS System**: Primary source for Article Titles, Authors, Abstracts, and Journal Settings.
- **Our Portal (PostgreSQL)**: Primary source for **Readership Geodata**, **Citations**, **External Metrics**, and **Pre-computed Impact Factors**.

#### When are metrics updated?
1. **Metadata**: Synced from OJS weekly or upon new publication alerts.
2. **Usage/Readership**: Collected **Live** via our portal's frontend tracker directly into `readership_geodata`. 
   * *Note: Relying on OJS usage stats via API would introduce a 24-48 hour delay and lose precision.*
3. **Citations (Impact)**: Fetched daily/weekly from Crossref and OpenAlex using DOIs. These are stored locally in `external_metrics` and `article_citations`.

---

### 4. Integration Logic (The "Sync" Pipeline)

Our system uses a sophisticated linkage to ensure data integrity:

- **Journal Linkage**: `platform_journals` maps to OJS `id`.
- **Article Linkage**: `research_items` maps to OJS `submissionId` (as `legacy_id`). All external metrics are tied to the **DOI**.
- **Metrics Linking**:
  - `external_metrics` links to `research_items` via DOI.
  - `article_citations` links to `research_items` via UUID.
  - **Result**: We can calculate a "Journal Impact" by aggregating citations from all articles linked to that Journal ID.

---

### 5. Why OJS Metrics are Insufficient
OJS usage statistics are designed for internal reporting, not for powering a public-facing, interactive dashboard. 
- **No Individual Events**: You cannot see *where* a single user is coming from *now*.
- **No External Connectivity**: OJS does not know if an article was cited in *Nature* or *Science* because it doesn't talk to OpenAlex/Crossref API.
- **Data Retention**: Historically, OJS stats can be difficult to query for complex trends (like "star" articles vs. "emerging" articles) which our `metrics.js` service already handles.

---

### 6. Conclusions & Next Steps
We must continue to leverage the **current PostgreSQL schema** as the "Source of Truth" for impact data.

1. **Immediate Action**: Ensure the frontend tracking script is active on the journal pages to feed `readership_geodata` directly.
2. **Maintenance**: Regularly run the `metrics/refresh` and `metrics/refresh-citations` endpoints to keep local metric caches fresh.
3. **Feature Extension**: Use the `journal_citation_stats` view to power your journal-specific ranking pages without stressing the OJS server.
