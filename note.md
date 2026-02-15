




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



metrics to consider:
https://www.elsevier.com/researcher/author/tools-and-resources/measuring-a-journals-impact



metrics notes:
comprehensive list of journal visibility and impact metrics
8 hours ago

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








