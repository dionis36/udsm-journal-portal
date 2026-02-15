# Tier 3: Advanced Analytics Features - Implementation Plan

**Purpose**: Design and implementation roadmap for cutting-edge analytics features that differentiate from standard OJS analytics.

---

## Overview

Tier 3 features represent **innovation beyond industry standards**. These are predictive, comparative, and real-time analytics that no other OJS instance currently offers.

**Competition Impact**: These features could be the **deciding factor** in winning the UDSM competition by demonstrating technical sophistication and forward-thinking design.

---

## Feature 1: Live Impact Factor Calculation

### Concept

Traditional Impact Factors are calculated annually by Clarivate. We create a **real-time, rolling impact factor** that updates continuously.

### Formula

```
Live Impact Factor (LIF) = 
    (Citations in current year to articles from previous 2 years) /
    (Number of articles published in previous 2 years)
```

**Example**:
- 2023-2024 publications: 50 articles
- Citations to those articles in 2025: 75 citations
- LIF = 75 / 50 = **1.5**

### Implementation

#### Database Schema
```sql
-- Track citations with timestamps
CREATE TABLE article_citations (
    citation_id SERIAL PRIMARY KEY,
    cited_article_id INTEGER REFERENCES platform_articles(item_id),
    citing_article_doi VARCHAR(255),
    citation_date DATE,
    source VARCHAR(50), -- 'crossref', 'google_scholar', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_date ON article_citations(citation_date);
CREATE INDEX idx_citations_article ON article_citations(cited_article_id);
```

#### Calculation Service
```javascript
// backend/services/live-impact-factor.js
class LiveImpactFactorService {
    async calculate(db, journalId) {
        const result = await db.query(`
            WITH recent_articles AS (
                -- Articles from previous 2 years
                SELECT item_id
                FROM platform_articles
                WHERE journal_id = $1
                AND publication_date >= DATE_TRUNC('year', NOW()) - INTERVAL '2 years'
                AND publication_date < DATE_TRUNC('year', NOW())
            ),
            current_citations AS (
                -- Citations this year to those articles
                SELECT COUNT(*) as citation_count
                FROM article_citations ac
                JOIN recent_articles ra ON ac.cited_article_id = ra.item_id
                WHERE EXTRACT(YEAR FROM ac.citation_date) = EXTRACT(YEAR FROM NOW())
            ),
            article_count AS (
                SELECT COUNT(*) as total_articles
                FROM recent_articles
            )
            SELECT 
                COALESCE(cc.citation_count, 0)::float / 
                NULLIF(ac.total_articles, 0)::float as lif,
                cc.citation_count,
                ac.total_articles
            FROM current_citations cc, article_count ac
        `, [journalId]);

        return result.rows[0];
    }

    // Calculate historical LIF for trend analysis
    async calculateHistorical(db, journalId, years = 5) {
        const trends = [];
        
        for (let i = 0; i < years; i++) {
            const year = new Date().getFullYear() - i;
            const lif = await this.calculateForYear(db, journalId, year);
            trends.push({ year, lif: lif.lif || 0 });
        }
        
        return trends.reverse();
    }
}
```

#### API Endpoint
```javascript
// GET /api/metrics/live-impact-factor
fastify.get('/live-impact-factor', async (request, reply) => {
    const { journal_id = 1 } = request.query;
    
    const lifService = new LiveImpactFactorService();
    const current = await lifService.calculate(db, journal_id);
    const historical = await lifService.calculateHistorical(db, journal_id, 5);
    
    return reply.send({
        current_lif: current.lif,
        citation_count: current.citation_count,
        article_count: current.total_articles,
        trend: historical,
        last_updated: new Date().toISOString()
    });
});
```

#### Frontend Component
```typescript
// frontend/components/analytics/LiveImpactFactor.tsx
export function LiveImpactFactor() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/api/metrics/live-impact-factor')
            .then(res => res.json())
            .then(setData);
    }, []);

    if (!data) return <Spinner />;

    return (
        <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-xl font-bold mb-4">Live Impact Factor</h3>
            
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-blue-600">
                    {data.current_lif.toFixed(3)}
                </span>
                <span className="text-sm text-gray-500">
                    Updated: {new Date(data.last_updated).toLocaleDateString()}
                </span>
            </div>

            <div className="text-sm text-gray-600 mb-4">
                {data.citation_count} citations to {data.article_count} articles
            </div>

            {/* Trend chart */}
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="lif" stroke="#2563eb" />
                </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-gray-500 mt-4">
                * Rolling 2-year calculation, updated in real-time
            </p>
        </div>
    );
}
```

**Estimated Development Time**: 6-8 hours  
**Complexity**: Medium  
**Competition Value**: ⭐⭐⭐⭐⭐ (Unique differentiator)

---

## Feature 2: Downloads vs Citations Correlation

### Concept

Visualize the relationship between article readership (downloads) and academic impact (citations). Identifies which articles are "sleeper hits" (high citations despite low downloads) or "popular but uncited" (high downloads, low citations).

### Visualization

**Scatter Plot**: X-axis = Downloads, Y-axis = Citations

**Quadrants**:
1. **Top-Right**: High downloads, high citations (⭐ Star articles)
2. **Top-Left**: Low downloads, high citations (💎 Hidden gems)
3. **Bottom-Right**: High downloads, low citations (📢 Popularbut not impactful)
4. **Bottom-Left**: Low downloads, low citations (Starting out)

### Implementation

#### Backend Query
```javascript
// GET /api/metrics/downloads-citations-correlation
fastify.get('/downloads-citations-correlation', async (request, reply) => {
    const { journal_id = 1, min_age_days = 180 } = request.query;

    const result = await db.query(`
        SELECT 
            a.item_id,
            a.title,
            a.authors,
            a.citations,
            COUNT(r.id) as downloads,
            a.publication_date,
            EXTRACT(DAYS FROM (NOW() - a.publication_date)) as age_days
        FROM platform_articles a
        LEFT JOIN readership_geodata r ON a.item_id = r.item_id
        WHERE a.journal_id = $1
        AND a.publication_date < NOW() - INTERVAL '${min_age_days} days'
        GROUP BY a.item_id, a.title, a.authors, a.citations, a.publication_date
        HAVING COUNT(r.id) > 0 OR a.citations > 0
        ORDER BY downloads DESC, citations DESC
        LIMIT 100
    `, [journal_id]);

    // Calculate correlation coefficient
    const data = result.rows;
    const correlation = calculateCorrelation(
        data.map(r => r.downloads),
        data.map(r => r.citations)
    );

    return reply.send({
        data: data,
        correlation: correlation,
        quadrants: categorizeQuadrants(data)
    });
});

function calculateCorrelation(x, y) {
    const n = x.length;
    const sum_x = x.reduce((a, b) => a + b, 0);
    const sum_y = y.reduce((a, b) => a + b, 0);
    const sum_xy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sum_x2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sum_y2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sum_xy - sum_x * sum_y;
    const denominator = Math.sqrt(
        (n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)
    );

    return denominator === 0 ? 0 : numerator / denominator;
}

function categorizeQuadrants(data) {
    const medianDownloads = median(data.map(r => r.downloads));
    const medianCitations = median(data.map(r => r.citations));

    return {
        stars: data.filter(r => r.downloads >= medianDownloads && r.citations >= medianCitations),
        hidden_gems: data.filter(r => r.downloads < medianDownloads && r.citations >= medianCitations),
        popular: data.filter(r => r.downloads >= medianDownloads && r.citations < medianCitations),
        emerging: data.filter(r => r.downloads < medianDownloads && r.citations < medianCitations)
    };
}
```

#### Frontend Component
```typescript
// frontend/components/analytics/CorrelationChart.tsx
export function CorrelationChart() {
    const [data, setData] = useState(null);

    // ... fetch data

    return (
        <div className="bg-white p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Downloads vs Citations</h3>
                <span className="text-sm text-gray-500">
                    Correlation: {data.correlation.toFixed(3)}
                </span>
            </div>

            <ResponsiveContainer width="100%" height={500}>
                <ScatterChart>
                    <CartesianGrid />
                    <XAxis dataKey="downloads" name="Downloads" label="Downloads" />
                    <YAxis dataKey="citations" name="Citations" label="Citations" />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Quadrant lines */}
                    <ReferenceLine x={medianDownloads} stroke="#ccc" strokeDasharray="3 3" />
                    <ReferenceLine y={medianCitations} stroke="#ccc" strokeDasharray="3 3" />

                    <Scatter 
                        data={data.data} 
                        fill="#3b82f6"
                        onClick={handleArticleClick}
                    />
                </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant Legend */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <QuadrantCard 
                    title="⭐ Star Articles" 
                    count={data.quadrants.stars.length}
                    description="High downloads & citations"
                />
                <QuadrantCard 
                    title="💎 Hidden Gems" 
                    count={data.quadrants.hidden_gems.length}
                    description="High citations despite low downloads"
                />
                <QuadrantCard 
                    title="📢 Popular" 
                    count={data.quadrants.popular.length}
                    description="High downloads, awaiting citations"
                />
                <QuadrantCard 
                    title="🌱 Emerging" 
                    count={data.quadrants.emerging.length}
                    description="Recently published"
                />
            </div>
        </div>
    );
}
```

**Estimated Development Time**: 8-10 hours  
**Complexity**: Medium-High  
**Competition Value**: ⭐⭐⭐⭐ (Unique insight tool)

---

## Feature 3: Redis-Based "Top This Week" Real-Time Ranking

### Concept

Use Redis sorted sets for **sub-second** real-time rankings of most-read articles, updated with every download event.

### Why Redis?

- **Speed**: In-memory data structure (microsecond latency)
- **Sorted Sets**: Built-in ranking functionality
- **TTL**: Auto-expiring data for weekly windows

### Architecture

```
User reads article → Event logged to DB → Redis sorted set updated
                                       ↓
                               Frontend queries Redis
                                       ↓
                               Top 5 articles displayed (<1ms)
```

### Implementation

#### Setup Redis
```bash
# Install Redis
npm install redis

# Start Redis server (Docker)
docker run -d -p 6379:6379 redis:alpine
```

#### Redis Service
```javascript
// backend/services/redis-rankings.js
const redis = require('redis');

class RedisRankingService {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.client.connect();
    }

    // Increment read count for article
    async incrementRead(articleId, scope = 'week') {
        const key = `top:${scope}`;
        const weekNumber = this.getCurrentWeek();
        const scopedKey = `${key}:${weekNumber}`;

        await this.client.zIncrBy(scopedKey, 1, articleId.toString());
        
        // Set expiry (2 weeks to keep previous week)
        await this.client.expire(scopedKey, 60 * 60 * 24 * 14);
    }

    // Get top N articles
    async getTopArticles(n = 5, scope = 'week') {
        const key = `top:${scope}:${this.getCurrentWeek()}`;
        
        // Get top N with scores (read counts)
        const results = await this.client.zRevRangeWithScores(key, 0, n - 1);
        
        return results.map(r => ({
            article_id: parseInt(r.value),
            reads: r.score
        }));
    }

    // Get article's current rank
    async getArticleRank(articleId, scope = 'week') {
        const key = `top:${scope}:${this.getCurrentWeek()}`;
        const rank = await this.client.zRevRank(key, articleId.toString());
        
        return rank !== null ? rank + 1 : null; // +1 for 1-indexed
    }

    getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }
}
```

#### Hook into Tracking Endpoint
```javascript
// backend/routes/tracking.js
const RedisRankingService = require('../services/redis-rankings');
const rankingService = new RedisRankingService();

fastify.post('/tracking/event', async (request, reply) => {
    const { event_type, article_id, journal_id } = request.body;

    // ... existing code to log to database ...

    // Update Redis ranking
    if (event_type === 'PDF_DOWNLOAD' || event_type === 'view') {
        await rankingService.incrementRead(article_id, 'week');
        await rankingService.incrementRead(article_id, 'month');
        await rankingService.incrementRead(article_id, 'year');
    }

    return reply.code(201).send({ status: 'logged' });
});
```

#### API Endpoint
```javascript
// GET /api/metrics/top-this-week
fastify.get('/top-this-week', async (request, reply) => {
    const { limit = 5, scope = 'week' } = request.query;

    // Get IDs and counts from Redis
    const topArticles = await rankingService.getTopArticles(limit, scope);

    // Enrich with article details from database
    const articleIds = topArticles.map(a => a.article_id);
    
    const articles = await db.query(`
        SELECT item_id, title, authors, publication_date
        FROM platform_articles
        WHERE item_id = ANY($1)
    `, [articleIds]);

    // Merge Redis counts with DB details
    const enriched = topArticles.map(ra => {
        const article = articles.rows.find(a => a.item_id === ra.article_id);
        return {
            ...article,
            reads_this_week: ra.reads,
            rank: topArticles.indexOf(ra) + 1
        };
    });

    return reply.send(enriched);
});
```

#### Frontend Component
```typescript
// frontend/components/analytics/TopThisWeek.tsx
export function TopThisWeek() {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        // Poll every 5 seconds for real-time updates
        const interval = setInterval(() => {
            fetch('/api/metrics/top-this-week?limit=5')
                .then(res => res.json())
                .then(setArticles);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
                <Flame className="text-orange-500" size={24} />
                <h3 className="text-xl font-bold">🔥 Top This Week</h3>
                <span className="ml-auto text-xs text-gray-500">
                    Updated 5s ago
                </span>
            </div>

            <div className="space-y-3">
                {articles.map((article, idx) => (
                    <div key={article.item_id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                        <div className={`text-2xl font-bold ${
                            idx === 0 ? 'text-yellow-500' : 
                            idx === 1 ? 'text-gray-400' :
                            idx === 2 ? 'text-orange-600' : 'text-gray-300'
                        }`}>
                            #{idx + 1}
                        </div>

                        <div className="flex-1">
                            <h4 className="font-semibold text-sm line-clamp-1">
                                {article.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {article.reads_this_week} reads this week
                            </p>
                        </div>

                        {idx === 0 && <Trophy className="text-yellow-500" size={20} />}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

**Estimated Development Time**: 10-12 hours  
**Complexity**: High  
**Competition Value**: ⭐⭐⭐⭐⭐ (Real-time = wow factor)

---

## Feature 4: Field-Normalized Impact (SNIP equivalent)

### Concept

Normalize citation counts by research field to allow fair comparison across disciplines. Medical journals naturally get more citations than humanities journals - SNIP accounts for this.

### Formula

```
Field-Normalized Impact = 
    (Journal citations / Journal articles) / 
    (Average citations in same field / Average articles in same field)
```

### Implementation Strategy

1. **Manual Field Assignment**: Assign each journal to a field category
2. **Cross-Journal Analysis**: Calculate field averages across multiple journals
3. **Normalization**: Apply field baseline to compute normalized score

#### Database Schema
```sql
CREATE TABLE research_fields (
    field_id SERIAL PRIMARY KEY,
    field_name VARCHAR(100),
    category VARCHAR(50), -- 'STEM', 'Social Sciences', 'Humanities'
    baseline_citations_per_article FLOAT DEFAULT 1.0,
    last_updated TIMESTAMPTZ
);

ALTER TABLE platform_journals 
ADD COLUMN field_id INTEGER REFERENCES research_fields(field_id);
```

#### Calculation
```javascript
// backend/services/field-normalization.js
class FieldNormalizationService {
    async calculateSNIP(db, journalId) {
        const result = await db.query(`
            WITH journal_stats AS (
                SELECT 
                    j.journal_id,
                    j.field_id,
                    COUNT(a.item_id) as article_count,
                    SUM(a.citations) as total_citations
                FROM platform_journals j
                JOIN platform_articles a ON j.journal_id = a.journal_id
                WHERE j.journal_id = $1
                GROUP BY j.journal_id, j.field_id
            ),
            field_baseline AS (
                SELECT baseline_citations_per_article
                FROM research_fields rf
                JOIN journal_stats js ON rf.field_id = js.field_id
            )
            SELECT 
                (js.total_citations::float / NULLIF(js.article_count, 0)) / 
                NULLIF(fb.baseline_citations_per_article, 0) as snip
            FROM journal_stats js, field_baseline fb
        `, [journalId]);

        return result.rows[0]?.snip || 0;
    }
}
```

**Estimated Development Time**: 6-8 hours  
**Complexity**: Medium  
**Competition Value**: ⭐⭐⭐ (Academic credibility)

---

##Implementation Priority

### Phase 1 (Competition MVP) - 8-12 hours
1. **Live Impact Factor** ⭐⭐⭐⭐⭐ (6-8 hours)
2. **Top This Week (Redis)** ⭐⭐⭐⭐⭐ (10-12 hours)

**Total**: 16-20 hours of development

### Phase 2 (Post-Competition Enhancement) - 10-14 hours
3. **Downloads vs Citations Correlation** ⭐⭐⭐⭐ (8-10 hours)
4. **Field-Normalized Impact** ⭐⭐⭐ (6-8 hours)

**Total**: 14-18 hours of development

---

## Technology Stack

### Required Services
- **Redis**: Real-time rankings (Docker: `redis:alpine`)
- **PostgreSQL**: Citation storage and analytics
- **Node.js**: Backend services
- **React + Recharts**: Frontend visualizations

### New Dependencies
```bash
npm install redis
npm install recharts  # Already installed
```

---

## Success Metrics

After implementing Tier 3:

- ✅ Live Impact Factor updates in real-time
- ✅ "Top This Week" refreshes every 5 seconds
- ✅ Downloads-Citations scatter plot reveals article patterns
- ✅ Field-normalized scores allow cross-discipline comparison
- ✅ **Competition judges impressed** by innovation and technical depth

---

## Next Steps

1. Review this plan with user
2. Prioritize features (recommend Phase 1 for competition)
3. Set up Redis infrastructure
4. Implement Live Impact Factor (start here - highest ROI)
5. Build Redis ranking service
6. Create frontend components
7. Test with demo data
8. Deploy for competition demonstration

