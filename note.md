new journals to consider:
The following are the journals application (and database) with multiple journals. It is advised that your solution include analytics for each individual journal as well as aggregate for all hosted journals.



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





WHY ARE THE POINTS ON MAP SO HUGE ... FOR LIGHT THEME ... THEY ARE BIG ... FOR DARK THEME THEY HAVE A GLOWY OUTLINE .... REVERT TO THE PREVIOUS METHOD OF POINTS ON MAP .... THEY WHERE GOOD ... THEY ONLY NEED COLOR CHANGE ONLY ... SO PLEASE RETURN THEM


I THINK UPTO THIS POINT YOU HAVE NOTICED THE ISSUE ON THE SLOWED FRAMES RATE ... THE INTERACTION ON THE MAP IS VERY SLOW ... WHY .... ITS NOT SMOOTH EXPERIENCE AT ALL INTERACTING WITH IT WHY

create a plan to fix this


To resolve the performance issues with your **Deck.gl** and **MapLibre** implementation, you must shift from a "client-heavy" data model to a "streaming-binary" model.

Below are the identified causes and the high-performance solutions required to achieve the "High Ground" in your competition.

### 1. Identified Causes of Slowness

* **The JSON Parsing Bottleneck**: If you are fetching your 8MB historical data as a standard JSON file, the browser must stop everything to parse that text into JavaScript objects. This "freezes" the main thread, causing jerky zooms and slow loads.
* **React State Overhead**: Storing 100,000+ points in a `useState` hook is a primary cause of lag. Every time a single point updates, React attempts to re-render the entire array, which is computationally expensive.
* **Lack of Spatial Indexing**: If your backend is scanning the entire 8MB table for every zoom change instead of using a spatial index, the database response time will be too slow for smooth transitions.
* **Main Thread Congestion**: Moving the map (zooming/panning) is a high-frequency event. If the CPU is busy calculating layer properties at the same time, the frame rate will drop below 60fps.

---

### 2. The "Fast-Track" Solutions

#### **A. Shift to Vector Tiles (MVT)**

Instead of sending the whole 8MB file at once, use your PostGIS backend to generate **Mapbox Vector Tiles (MVT)**.

* **The Logic**: The map only requests data for the specific "tile" the user is looking at. As you zoom in, it fetches more detail; as you zoom out, it fetches simplified "overviews."
* **SQL Implementation**: Use `ST_AsMVT` in PostGIS to serve binary tiles directly to MapLibre. This reduces the initial load from 8MB to a few kilobytes per view.

#### **B. Use Binary Data Formats (FlatGeobuf)**

If you must load the whole dataset, stop using JSON. Use **Loaders.gl** with **FlatGeobuf**.

* **Why**: FlatGeobuf is a binary format that Deck.gl can read directly into the GPU memory without the "parsing" phase. This allows 100,000 points to load almost instantly.

#### **C. Bypass React State for Heavy Data**

To keep the UI responsive, move the heavy map data out of React's state management.

* **The Strategy**: Use a `useRef` to hold the data or a specialized store like **Zustand**. Pass the data to the Deck.gl `layers` prop directly. This ensures that a map update doesn't trigger a full React component re-render.

#### **D. Database Optimization (GiST Indexing)**

Ensure your PostgreSQL database is optimized for geographic "lookups" during zoom and pan events.

* **Action**: Run the following command on your metrics table:
`CREATE INDEX idx_metrics_location ON readership_geodata USING GIST (location_point);`
* **Result**: This reduces query times from seconds to milliseconds, enabling the "fast transition" experience you need.

---

### 3. Implementation Checklist for Smooth Transitions

1. **Disable SSR**: Ensure your map component is loaded using `next/dynamic` with `{ ssr: false }` to prevent hydration mismatches and window errors.
2. **Transition Interpolator**: Use Deck.gl's `FlyToInterpolator` for "Fast Transitions" between points. It handles the mathematical curve of the camera move on the GPU, keeping it silky smooth.
3. **Coordinate Jittering**: If many hits are at the same city coordinate, use the `getOffset` or a "jitter" function in your Deck.gl layer to spread them out. This prevents "Z-fighting" where the GPU struggles to render overlapping points.

By implementing the **MVT (Vector Tile)** strategy and **GiST indexing**, you will solve the "slow load" issue, while **Binary Data** and **SSR disabling** will fix the "jerky interaction" and "slow zoom" problems.





