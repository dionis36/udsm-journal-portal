# OJS API to Current Database Mapping Guide (PostgreSQL)
## Modern Portal Integration (OJS 3.4+)

This document maps the **Current Portal Schema** (`sql/currentSchema.sql`) to the **OJS REST API** endpoints. It also covers how to integrate external metrics (Citations, Altmetrics) that are not natively provided by the OJS API.

---

## 1. Journals Mapping
**Local Table**: `platform_journals`
**OJS Endpoint**: `/api/v1/contexts`

| Local Column | OJS API Field | Notes |
|--------------|---------------|-------|
| `journal_id` | `id` | Map OJS integer ID to local SERIAL |
| `path` | `urlPath` | Unique slug for the journal (e.g., 'zjahs') |
| `name` | `name` | Use preferred locale (e.g., `name.en_US`) |
| `branding` | `themeAttributes` | JSON object containing logos, primary colors, etc. |
| `metadata` | `settings` | Store ISSN, description, etc. from settings |
| `field_id` | N/A | Manually assigned or mapped from OJS categories |

**API Call**: `GET /api/v1/contexts`

---

## 2. Articles Mapping
**Local Table**: `research_items` (View: `platform_articles`)
**OJS Endpoint**: `/api/v1/submissions`

| Local Column | OJS API Field | Notes |
|--------------|---------------|-------|
| `item_id` | N/A | Local UUID (Generated on Import) |
| `legacy_id` | `id` | The OJS `submissionId` |
| `journal_id` | `contextId` | Links to `platform_journals.journal_id` |
| `title` | `title` | Use preferred locale |
| `year` | `datePublished` | Extract year from timestamp |
| `doi` | `doi` | Critical for linking external metrics |
| `authors` | `contributors` | Map to JSONB array: `[{name, affiliation}]` |

**API Call**: `GET /api/v1/submissions?status=3` (Published only)
*Note: Dig deeper into `/api/v1/submissions/{id}/publications` for detailed metadata.*

---

## 3. Usage Stats (Heatmap)
**Local Table**: `readership_geodata`
**OJS Endpoint**: `/api/v1/stats/usage`

OJS 3.4 provides aggregated usage stats. To populate the Heatmap with granular events:

1. **API Limitations**: The OJS REST API typically returns aggregates (by city/country).
2. **Strategy**: 
   - Call `/api/v1/stats/usage` with `timelineInterval=day`.
   - Use `assocTypes[]=ASSOC_TYPE_SUBMISSION` (Submissions) and `assocTypes[]=ASSOC_TYPE_SUBMISSION_FILE` (PDFs).
   - If granular IP-to-Geo is needed, you may need to parse OJS log files or use a custom tracker on the portal frontend.

| Local Column | OJS API / Source | Notes |
|--------------|-------------------|-------|
| `item_id` | `submissionId` | Map from OJS ID to local UUID |
| `location_point` | Geo-Lookup | Use IP from logs to get Lat/Long |
| `country_code` | `countryId` | 2-letter ISO code |
| `event_type` | `assocType` | `ASSOC_TYPE_SUBMISSION` -> ABSTRACT_VIEW |
| `timestamp` | `date` | Timestamp of the access record |

---

## 4. External Metrics & Citations
**Local Tables**: `external_metrics`, `article_citations`
**Source**: External APIs (Crossref, OpenAlex, Altmetric)

These details are **NOT** found in the OJS API. They must be collected using the **DOI** from your `research_items` table.

### A. Crossref (Citations)
**Endpoint**: `https://api.crossref.org/works/{DOI}`
- **Fetch**: `message.is-referenced-by-count`
- **Store**: `external_metrics.crossref_citations`

### B. OpenAlex (Detailed Citations)
**Endpoint**: `https://api.openalex.org/works/https://doi.org/{DOI}`
- **Fetch**: `cited_by_count`, `referenced_works`
- **Store**: `article_citations` (Linked via `item_id`)

### D. Linking Metrics to Journals
Even though metrics are fetched at the **Article** level (via DOI), they are automatically linked to the **Journal** through the existing database hierarchy:

1. `external_metrics` (DOI) -> `research_items` (DOI)
2. `article_citations` (cited_article_id) -> `research_items` (item_id)
3. `research_items` (journal_id) -> `platform_journals` (journal_id)

**Impact Analysis**: This structure allows you to calculate journal-level impact factors and citation counts by aggregating article metrics filtered by `journal_id`.

1. **Step 1: Sync Journals**: Pull from OJS `/api/v1/contexts` to populate `platform_journals`.
2. **Step 2: Sync Articles**: Pull from OJS `/api/v1/submissions` (published). Use the `id` as `legacy_id`.
3. **Step 3: Enrich with Metrics**: 
   - Iterate through `research_items` WHERE `doi` is present.
   - Call Crossref/OpenAlex/Altmetric.
   - Update `external_metrics` and `article_citations`.
   - **Linkage**: Use `item_id` (UUID) for internal foreign keys. Use `legacy_id` only for OJS-system references.
4. **Step 4: Update Stats**: Refresh the Materialized View `journal_citation_stats` after enriching metrics.

---

## Technical Considerations

- **DOI is Key**: Ensure all `research_items` updated from OJS have valid DOIs to enable metric tracking.
- **Incremental Sync**: Use `last_updated` in `external_metrics` to avoid redundant API calls.
- **Rate Limiting**: Be polite to Crossref/OpenAlex APIs (use your email in the user-agent "Polite Pool").
