Good question 👌
If you’re designing a **professional journal page** (academic, research, or institutional journal), it must look credible, structured, and publication-ready.

I’ll break this into **3 levels**:

1. 🔹 Journal Website Main Page
2. 🔹 Individual Journal Issue Page
3. 🔹 Individual Article Page
4. 🔹 Printable Cover Page (PDF version)

---

# 🏛 1️⃣ Journal Main Page (Homepage)

This is the public-facing landing page.

### 🔹 A. Header Section

* Journal Name (Full Official Name)
* Journal Abbreviation (if applicable)
* Tagline / Scope statement
* ISSN (Print + Online if available)
* Logo
* Navigation:

  * About
  * Editorial Board
  * Current Issue
  * Archives
  * Submission Guidelines
  * Contact

---

### 🔹 B. Hero / Intro Section

* Brief description of journal scope
* Field / discipline focus
* Publishing frequency (Quarterly, Biannual, etc.)
* Open Access or Subscription model
* Indexed databases (if applicable)

---

### 🔹 C. Key Information Blocks

* Aims & Scope
* Author Guidelines
* Peer Review Policy
* Publication Ethics Statement
* APC (Article Processing Charges) if any
* DOI policy

---

### 🔹 D. Editorial Board Section

* Editor-in-Chief
* Managing Editor
* Associate Editors
* Advisory Board
* Institutional affiliations

---

### 🔹 E. Current Issue Preview

* Volume
* Issue number
* Publication date
* Featured articles

---

### 🔹 F. Footer

* Publisher name
* Copyright notice
* ISSN
* Contact email
* Physical address
* Social links
* Privacy policy

---

# 📘 2️⃣ Journal Issue Page (Volume/Issue Page)

Example: Volume 5, Issue 2 (2026)

### Required Elements:

* Journal Name
* Volume number
* Issue number
* Publication date
* DOI prefix
* Table of Contents

For each article listed:

* Title
* Author(s)
* Affiliation(s)
* Page numbers
* DOI
* Abstract preview
* Download PDF link

---

# 📄 3️⃣ Individual Article Page (VERY IMPORTANT)

This must look extremely professional.

---

## 🔹 A. Article Header

* Article Title (Full)
* Subtitle (if any)
* Author Names
* Author Affiliations
* Corresponding author email
* ORCID ID (optional but professional)
* Received date
* Revised date
* Accepted date
* Published date
* DOI
* Citation format

---

## 🔹 B. Abstract Section

* Structured or unstructured abstract
* Keywords (5–7 keywords)

---

## 🔹 C. Main Body Structure

Standard academic structure:

1. Introduction
2. Literature Review
3. Methodology
4. Results
5. Discussion
6. Conclusion
7. Recommendations (optional)
8. Limitations (optional)

---

## 🔹 D. Supporting Sections

* Acknowledgements
* Funding statement
* Conflict of interest declaration
* Data availability statement
* Ethical approval statement (if applicable)

---

## 🔹 E. References Section

* Proper citation format (APA, MLA, Chicago, Harvard, etc.)
* Numbered or author-date style

---

## 🔹 F. Footer Section

* Citation suggestion
* Copyright license
* Creative Commons badge (if open access)

---

# 📕 4️⃣ Printable Cover Page (PDF Journal Issue)

If you're designing the cover page of a journal issue, it should contain:

### Top Section

* Journal Name (Large typography)
* Logo
* Tagline

### Center Section

* Volume number
* Issue number
* Month & Year
* ISSN (Print & Online)
* Publisher name

### Optional

* Featured article title
* Thematic focus of the issue

### Bottom Section

* Website URL
* Publisher address

---

# 🧠 Extra Professional Elements (High Credibility Signals)

If you want it to look internationally professional:

* DOI assigned via Crossref
* ORCID integration
* Plagiarism policy
* Indexing info (Scopus, Web of Science, etc.)
* Digital archiving policy (LOCKSS, CLOCKSS)
* Clear peer review model (Double blind, single blind)
* Open Access policy statement

---

# 🎨 Design Guidelines (Important for UI Design)

Since you care about frontend design:

* Serif font for titles (academic feel)
* Clean sans-serif for body text
* Plenty of whitespace
* Clear hierarchy
* Structured margins
* Minimal color palette
* No flashy animations
* Formal tone

Academic design = calm, structured, authoritative.

---



## NEW

Based on a cross-reference of the **journal&relatedPages.md** requirements and the provided SQL files (`tjpsd32_schema.sql`, `oldSchema.sql`, and `oldSchema+Data.sql`), here is the breakdown of what is present in the database and what is missing or requires external integration.

### 1. Data Present in the SQL Files

The OJS (Open Journal Systems) schema provided is quite comprehensive for standard academic metadata.

* **Journal Identity & Header:**
* **Name & Abbreviation:** Found in `journal_settings`.
* **ISSN (Print/Online):** Stored as settings within `journal_settings`.
* **Path/URL Slug:** The `path` column in the `journals` table.


* **Issue Metadata:**
* **Volume, Issue, Year:** Explicitly stored in the `issues` table.
* **Issue Dates:** `date_published` and `last_modified` are in the `issues` table.
* **Table of Contents:** Can be reconstructed by joining `issues`  `submissions`  `publications`.


* **Article Metadata:**
* **Title & Subtitle:** Stored in `publication_settings`.
* **Authors & Affiliations:** Managed in the `authors` and `author_settings` tables.
* **Abstract & Keywords:** Stored as `setting_name` entries in `publication_settings`.
* **Dates:** `date_submitted` (in `submissions`) and `date_published` (in `publications`).
* **DOI:** Managed in the `publications` table or as a setting in `publication_settings`.
* **ORCID:** The `orcid` column exists in the `authors` table.


* **Metrics & Usage:**
* **Usage Statistics:** The `metrics` table stores historical `country_id`, `city`, and `metric` (views/downloads).
* **Temporary Records:** The `usage_stats_temporary_records` table tracks recent hits before they are processed.



---

### 2. Data NOT in the SQL Files (Missing or Managed Externally)

While the database holds the "skeleton" of the journal, several professional elements from your list are either generated on the fly or stored in files rather than SQL rows.

* **Article Main Body (Full Text):**
* **The Content:** The "Introduction, Methodology, Results" sections are almost never in the SQL database. OJS stores these as **PDF/Galley files** on the server's file system. The database only stores the link/path to the file in the `submission_files` or `galley` tables.


* **Dynamic Professional Signals:**
* **PlumX / Altmetric Scores:** These are third-party API services. The SQL does not store these scores; your Next.js frontend must fetch them using the article's DOI.
* **Indexing Info (Scopus/Web of Science):** While the journal might be indexed, the "Scopus" icon or prestige ranking is a static design element or an external API pull, not a field in the `tjpsd32` schema.


* **Editorial Workflow Detail:**
* **Revised/Accepted Dates:** While `date_submitted` and `date_published` are standard, specific "Revised" or "Accepted" timestamps are often buried in `stage_assignments` or workflow logs rather than a single structured field in the `publications` table.


* **Design & UI Elements:**
* **Logos & Branding:** The `journal_settings` table might contain the *filename* of a logo, but the actual image file is on the server.
* **Whitespace & Typography:** These are purely CSS/Next.js responsibilities and have no representation in the SQL.


* **Citation Formats (APA, MLA, etc.):**
* The SQL stores raw bibliographic references in a `citations` table, but it does **not** store pre-rendered APA or MLA strings. Your backend must use a library to format the metadata into these styles for the frontend.



### Summary for your Dev Roadmap

| Category | Presence | Implementation Note |
| --- | --- | --- |
| **Metadata** | **High** | Join `publications`, `authors`, and `settings` tables. |
| **Stats/Map** | **High** | Use the `metrics` table for historical heatmaps. |
| **Full Text** | **Low** | You must handle PDF file uploads/rendering separately from SQL. |
| **Impact Metrics** | **None** | Requires external API calls (Crossref, Altmetric). |

To achieve the "High Ground," your Next.js frontend will need to act as the "glue"—taking the metadata from PostgreSQL and combining it with external API data and PDF file streams to create that "extremely professional" individual article page.



To build a world-class platform that meets the "Professional Article Page" standards, you must integrate dynamic data that does not exist in the legacy SQL files.

Below is the specification for the **External APIs** you must call and the **PDF File Streams** you must manage.

### 1. External API Data (The "Impact" Layer)

Since the `tjpsd32` schema only contains internal usage stats, you must use external APIs to pull global prestige metrics. These should be fetched using the **DOI** found in the `publications` table.

| API Service | Data Provided | Purpose |
| --- | --- | --- |
| **Crossref Event Data API** | Real-time citation counts and social media links. | Powers the "Cited By" section and evidence of global reach. |
| **Altmetric API** | Altmetric Attention Score (the "Doughnut"). | Visualizes mentions in news, blogs, and policy documents. |
| **Scopus / Clarivate API** | CiteScore, SJR, and Journal Impact Factor (JIF). | Provides the high-credibility academic metrics listed in your requirements. |
| **ORCID Public API** | Verified author profiles and biographies. | Automates the "Author Affiliations" section for a professional look. |
| **Sherpa Romeo API** | Open Access and archiving policies. | Automatically displays the journal's "Open Access Policy Statement." |

---

### 2. PDF File Streams (The "Full Text" Layer)

In the legacy schema, the database does **not** store the actual article content (the text of the Introduction, Results, etc.). It only stores a reference to a file.

#### **What are "PDF File Streams"?**

Instead of loading a massive 20MB PDF into memory all at once, your **Fastify backend** should "stream" the file from storage to the user's browser in small chunks.

* **Storage:** You should store the actual `.pdf` files in an **Object Storage** bucket (like AWS S3 or MinIO) or a dedicated directory on the UDSM server.
* **Database Link:** Your `research_items` table should store the *file path* or *S3 Key*.

#### **Implementation in your Next.js Frontend:**

To fulfill the "Individual Article Page" requirements, you should implement these streaming features:

1. **PDF Embedder:** Use a library like `react-pdf-viewer` to stream the article directly into the page so users can read it without leaving the site.
2. **Download Stream:** When the "Download PDF" link is clicked, the backend should set the `Content-Disposition` header to `attachment` and pipe the stream directly from storage to the user.
3. **Cover Page Injection:** Dynamically prepend a "Journal Cover Page" (containing the Journal Name, Volume, and Issue) to the PDF stream as it is being downloaded.

---

### **Checkmap Integration Summary**

* **External APIs**: These should be called **asynchronously** by your Next.js `getServerSideProps` or `App Router` components so they don't slow down the initial page load.
* **PDF Streams**: Your Fastify backend needs a specific route (e.g., `/api/articles/:id/download`) that handles the streaming logic and security checks (to ensure only authorized users can stream the file).