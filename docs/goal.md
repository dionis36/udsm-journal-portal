# Competition Strategy & Context Specification: UDSM Coding 2026

This document serves as both a strategic roadmap and a technical context file for the **UDSM Journal Visibility and Impact Coding 2026** competition. It outlines the mission-critical objectives and the "High Ground" strategies required to secure the top prize.

---

### 1. The Mission Objective

The core challenge is to solve a visibility deficit. While UDSM research is consumed globally, the university lacks a way to evidence this impact in real-time. Your team must build a functional prototype that tracks and visualizes UDSM’s academic footprint through an **Interactive Real-Time Readership Dashboard**.

**Primary Deliverables:**

* **Interactive World Heat Map:** Real-time visualization of reader locations.
* **Live Metrics:** Dynamic counters for article downloads and citation impact.
* **Institutional Integration:** A professional UI/UX that aligns with UDSM’s official branding.

---

### 2. The "High Ground" Strategy

To surpass other teams at CoICT Labs, your team must move beyond basic functionality and focus on **Technical Sophistication** and **Data Intelligence**.

#### **A. The Real-Time Engine (Technical Edge)**

Most teams will use standard database polling, which is slow. To gain the high ground, implement a **Stream-Processing Architecture**:

* **WebSockets (Socket.io):** Use this to push "Ripple" events to the map immediately when a hit is recorded.
* **Redis Caching:** Use Redis to store "Live Now" session counts. This ensures the dashboard stays lightning-fast even if the primary database is under load.
* **PostGIS (Spatial Superiority):** Instead of simple latitude/longitude strings, use PostGIS in your PostgreSQL database. This allows for advanced spatial aggregations (e.g., "Top 10 Cities in East Africa") that would take other teams hours to calculate manually.

#### **B. Data-Driven Innovation (Functional Edge)**

Don't just track views; track **Meaningful Impact**:

* **Institutional IP Tagging:** Use the `institutional_subscription_ip` data from the legacy schema to identify and label "Internal UDSM Usage."
* **Crossref Integration:** Use article DOIs from the `publications` table to fetch live citation counts from external APIs. Showing live external citations is a massive "impact" signal that is not explicitly in the prompt but will impress the judges.
* **"Trending Now" Logic:** Create a sidebar showing which articles are gaining momentum in the last 60 minutes.

---

### 3. Data Context: Leveraging the Legacy Schema

The provided `oldSchema.sql` is your historical foundation. To win, you must successfully "prime" your new system with this data.

**Critical Tables to Map:**

* **`metrics`:** This is your historical heatmap data. You must extract `country_id` and `city` to provide the "Past 12 Months" view on your map.
* **`journal_settings`:** Use this to programmatically pull official names and branding for journals like **ZJAHS**.
* **`usage_stats_temporary_records`:** Treat this as your "Live Buffer." In your prototype, this table should be the source of your most recent "Pulsing" map dots.

---

### 4. The 72-Hour Implementation Roadmap (February 13–15)

| Timeframe | Phase | Key Milestone |
| --- | --- | --- |
| **Hours 1–12** | **The Foundation** | Set up the Fastify/Next.js environment. Import the `oldSchema.sql` schema and create the metadata API to load journal pages. |
| **Hours 13–36** | **The Pulse** | Implement the GeoIP enrichment. Turn an IP address into a map coordinate. Get the first "Real-Time Ripple" working on Leaflet.js. |
| **Hours 37–60** | **Impact Layer** | Integrate Redis for live counters. Add the "Institutional Access" check. Connect the Crossref API for live citation counts. |
| **Hours 61–72** | **The Polish** | Align UI with UDSM blue/gold. Finalize the 3-minute pitch. Ensure the "Live Demo" is foolproof (e.g., have a script to simulate hits if the room is quiet). |

---

### 5. Winning the Pitch (Gain the High Ground)

In a hackathon, the demo is as important as the code.

1. **Show, Don't Tell:** Have one team member access the journal site from their phone during the presentation. The map on the screen should "ripple" instantly.
2. **Focus on "Visibility":** Explicitly mention how your tool helps the Deputy Vice Chancellor (Research) see exactly which countries are reading UDSM research.
3. **Scalability:** Emphasize that your schema is built for **all** UDSM journals, not just a single demo.

**Key Reward Reminder:** The winning system goes **LIVE** on the UDSM Journal Site. Code for production, not just for a grade.

---

### 6. Journal visibility and impact metrics

Journal visibility and impact metrics are quantitative tools used to evaluate the reach, influence, and quality of scholarly publications. They are derived from citation data, usage statistics, and social media mentions. 
Here is a comprehensive list categorized by source and type:
1. Clarivate Analytics (Web of Science) Metrics 
These metrics are derived from the Web of Science database and are often considered the industry standard for traditional impact assessment. 
Journal Impact Factor (JIF): Measures the average number of citations received by papers published in a journal during the two preceding years.
Journal Citation Indicator (JCI): A field-normalized metric that measures the citation impact of a journal relative to other journals in the same category.
Immediacy Index: Measures how quickly articles in a journal are cited in the same year they are published.
Eigenfactor Score: Calculates the value of a journal based on the number of incoming citations, with higher weight given to citations from top-tier journals.
Article Influence Score: Measures the average influence of a journal's articles over the first five years after publication.
Cited Half-Life: The median age of the articles that were cited in the Journal Citation Reports (JCR) year. 
2. Scopus (Elsevier) Metrics
These metrics are based on the Scopus database, which covers a broader range of journals than Web of Science. 
CiteScore: Calculates the average citations received per document over a four-year period.
Source Normalized Impact per Paper (SNIP): Measures contextual citation impact by weighting citations based on the total number of citations in a specific field, allowing for comparison across disciplines.
SCImago Journal Rank (SJR): A prestige metric that considers both the number of citations and the prestige of the citing journal.
Journal Quartiles (Q1-Q4): Ranks journals within their subject categories based on metrics like SJR or CiteScore. 
3. Google Scholar Metrics
h5-index: The h-index for articles published in a journal in the last five complete years.
h5-median: The median number of citations for the articles that make up the h5-index. 
4. Alternative Metrics (Altmetrics)
These track the visibility and impact of research outside traditional academic citations, including online attention. 
Altmetric Attention Score: Measures the volume and source of social media mentions, news articles, policy documents, and blogs.
Usage Metrics (Downloads/Views): Number of times articles are accessed, downloaded, or viewed.
PlumX Metrics: Categorizes metrics into Citations, Usage, Captures (e.g., bookmarks), Mentions, and Social Media. 
5. Other Specialized Metrics
Cabells Scholarly Analytics: Provides metrics to help identify predatory journals and evaluate journal quality.
h-index (Journal Level): Often used in combination with other metrics to show both productivity and citation impact. 
Key Considerations for Using Metrics
Context is Crucial: Metrics should not be used in isolation; they are best used alongside qualitative, expert assessment.
Field Differences: Citation habits differ significantly between disciplines (e.g., medicine vs. humanities), making field-normalized metrics like SNIP more useful for cross-discipline comparisons.
Manipulation Risk: Metrics can be skewed by excessive self-citation or "citation cartels". 