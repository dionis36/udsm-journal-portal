# Tier 2: External API Integration Guide

**Purpose**: Comprehensive guide to obtaining and integrating external data sources for advanced journal metrics.

---

## Overview

Tier 2 enhances the analytics platform with authoritative citation and impact metrics from industry-standard sources. These metrics establish credibility and allow comparison with other journals.

---

## 1. Crossref API (Citations per Article) 🆓 FREE

### What is Crossref?

Crossref is a **free** citation linking service used by publishers worldwide. It provides:
- Citation counts for articles with DOIs
- Metadata for academic publications
- Reference linking between articles

### How to Get API Access

**Cost**: ✅ **100% FREE** (no registration required for basic access)

**Rate Limits**: 
- Anonymous: 50 requests/second
- With "Polite" API (email in User-Agent): Better performance

**Signup Process**: No signup needed!

### API Endpoints

#### Get Citation Count for an Article
```http
GET https://api.crossref.org/works/{DOI}
```

**Example**:
```bash
curl "https://api.crossref.org/works/10.1234/tjpsd.2023.001" \
  -H "User-Agent: UDSM-Analytics/1.0 (mailto:contact@udsm.ac.tz)"
```

**Response**:
```json
{
  "status": "ok",
  "message": {
    "DOI": "10.1234/tjpsd.2023.001",
    "title": ["Impact of Climate Change..."],
    "is-referenced-by-count": 12,  // ← Citation count!
    "issued": {"date-parts": [[2023, 3, 15]]},
    "author": [...]
  }
}
```

#### Batch Query Multiple DOIs
```http
POST https://api.crossref.org/works
Content-Type: application/json

{
  "filter": {
    "doi": "10.1234/tjpsd.2023.001,10.1234/tjpsd.2023.002"
  }
}
```

### Implementation Steps

1. **Update Articles Table** to ensure all articles have DOIs:
```sql
ALTER TABLE platform_articles 
ADD COLUMN IF NOT EXISTS doi VARCHAR(255),
ADD COLUMN IF NOT EXISTS citations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS citations_updated_at TIMESTAMPTZ;
```

2. **Create Crossref Service** (`backend/services/crossref.js`):
```javascript
const axios = require('axios');

class CrossrefService {
    constructor() {
        this.baseURL = 'https://api.crossref.org';
        this.userAgent = 'UDSM-Analytics/1.0 (mailto:contact@udsm.ac.tz)';
    }

    async getCitationCount(doi) {
        try {
            const response = await axios.get(
                `${this.baseURL}/works/${doi}`,
                { headers: { 'User-Agent': this.userAgent } }
            );
            
            return response.data.message['is-referenced-by-count'] || 0;
        } catch (error) {
            console.error(`Failed to fetch citations for ${doi}:`, error.message);
            return null;
        }
    }

    async updateArticleCitations(db, articleId, doi) {
        const citations = await this.getCitationCount(doi);
        
        if (citations !== null) {
            await db.query(`
                UPDATE platform_articles 
                SET citations = $1, citations_updated_at = NOW()
                WHERE item_id = $2
            `, [citations, articleId]);
        }
        
        return citations;
    }

    async refreshAllCitations(db) {
        const articles = await db.query(`
            SELECT item_id, doi 
            FROM platform_articles 
            WHERE doi IS NOT NULL
        `);

        const results = [];
        for (const article of articles.rows) {
            const citations = await this.updateArticleCitations(
                db, article.item_id, article.doi
            );
            results.push({ id: article.item_id, citations });
            
            // Rate limiting: 50 req/sec
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        return results;
    }
}

module.exports = CrossrefService;
```

3. **Create Cron Job** to refresh citations daily:
```javascript
// backend/jobs/refresh-citations.js
const cron = require('node-cron');
const CrossrefService = require('../services/crossref');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Refreshing citation counts...');
    const service = new CrossrefService();
    const results = await service.refreshAllCitations(db);
    console.log(`✅ Updated ${results.length} articles`);
});
```

4. **Add API Endpoint**:
```javascript
// GET /api/metrics/citations/:articleId
fastify.get('/citations/:articleId', async (request, reply) => {
    const { articleId } = request.params;
    
    const result = await db.query(`
        SELECT citations, citations_updated_at
        FROM platform_articles
        WHERE item_id = $1
    `, [articleId]);
    
    return reply.send(result.rows[0] || { citations: 0 });
});
```

### Best Practices

- ✅ **Use Polite API**: Include email in User-Agent for better performance
- ✅ **Cache Results**: Update citations daily, not on every request
- ✅ **Handle Missing DOIs**: Gracefully handle articles without DOIs
- ✅ **Respect Rate Limits**: Max 50 req/sec

---

## 2. Journal Impact Metrics (JIF, CiteScore, SJR, h5-index)

### Option A: Manual Entry (Recommended for Demo)

**Process**:
1. Visit journal ranking websites
2. Look up your journal metrics manually
3. Store in database as static values

**Where to Find Metrics**:

#### JIF (Journal Impact Factor)
- **Source**: Clarivate Web of Science
- **URL**: https://jcr.clarivate.com
- **Access**: Requires institutional subscription ($$$)
- **Alternative**: Check journal's "About" page (many journals self-report)

#### CiteScore
- **Source**: Scopus (Elsevier)
- **URL**: https://www.scopus.com/sources
- **Access**: Free to browse, but download requires subscription
- **How to**: Search for journal name, view metrics

#### SJR (SCImago Journal Rank)
- **Source**: SCImago Journal & Country Rank
- **URL**: https://www.scimagojr.com
- **Access**: ✅ **100% FREE** - Public website
- **How to**: Search journal by ISSN or title

#### h5-index
- **Source**: Google Scholar Metrics
- **URL**: https://scholar.google.com/citations?view_op=top_venues
- **Access**: ✅ **100% FREE** - No login required
- **How to**: Browse by category or search journal name

**Implementation**:
```sql
-- Add metrics to platform_journals table
UPDATE platform_journals 
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{impact_metrics}',
    '{
        "jif": 1.42,
        "citescore": 1.8,
        "sjr": 0.45,
        "h5_index": 12,
        "h5_median": 18,
        "quartile": "Q2",
        "percentile": 65,
        "last_updated": "2025-01-15"
    }'::jsonb
)
WHERE journal_id = 1;
```

**Update Backend Endpoint**:
```javascript
// GET /api/metrics/journal-impact?journal=tjpsd
fastify.get('/journal-impact', async (request, reply) => {
    const { journal = 'tjpsd' } = request.query;
    
    const result = await fastify.db.query(`
        SELECT metadata->'impact_metrics' as metrics
        FROM platform_journals
        WHERE path = $1
    `, [journal]);
    
    if (!result.rows[0]?.metrics) {
        return reply.send(null);
    }
    
    return reply.send(result.rows[0].metrics);
});
```

### Option B: API Integration (Production)

#### Scopus API (CiteScore)

**Cost**: Requires Scopus subscription or institutional access

**API Documentation**: https://dev.elsevier.com/

**Signup**:
1. Create account at https://dev.elsevier.com/
2. Register application
3. Get API key
4. Requires institutional Scopus subscription for full access

**Example Request**:
```bash
curl "https://api.elsevier.com/content/serial/title/issn/1234-5678" \
  -H "X-ELS-APIKey: YOUR_API_KEY" \
  -H "Accept: application/json"
```

#### Web of Science API (JIF)

**Cost**: Requires Web of Science subscription

**API Documentation**: https://developer.clarivate.com/

**Access**: Institutional subscription required (very expensive)

**Note**: Most universities have subscriptions; contact your library

#### SCImago API

**Status**: No official public API

**Alternative**: Web scraping (not recommended - terms of service violation)

**Best Approach**: Manual lookup on https://www.scimagojr.com (free)

---

## 3. Altmetric API (Social Media Attention)

### What is Altmetric?

Altmetric tracks online attention to research:
- Social media mentions (Twitter, Facebook, Reddit)
- News articles
- Blog posts
- Policy documents
- Wikipedia citations

### Pricing

**Plans**:
- **Free**: No public free tier for API
- **Explorer**: $2,500-5,000/year (small institutions)
- **Institutional**: $10,000+/year (universities)

**Free Alternative**: Altmetric badges (embedded widgets) - no API needed

### API Access (Paid Plans Only)

**Signup**:
1. Visit https://www.altmetric.com/products/altmetric-api/
2. Contact sales for quote
3. Get API key after purchase

**Endpoints**:
```bash
# Get Altmetric score for DOI
curl "https://api.altmetric.com/v1/doi/10.1234/tjpsd.2023.001" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response**:
```json
{
  "altmetric_id": 123456,
  "score": 45.25,
  "cited_by_tweeters_count": 23,
  "cited_by_msm_count": 3,
  "cited_by_posts_count": 67
}
```

### Free Alternative: Altmetric Badges

**No API Key Required**:
```html
<!-- Embed Altmetric badge in article page -->
<div class='altmetric-embed' data-doi='10.1234/tjpsd.2023.001'></div>
<script src='https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js'></script>
```

**Implementation**:
```javascript
// backend/services/altmetric.js (Free Scraping - NOT RECOMMENDED)
// Better: Use manual entry or paid API

class AltmetricService {
    async getScore(doi) {
        // For demo: Return mock data or null
        // For production: Use paid API or embed badges
        return null;
    }
}
```

---

## 4. Combined Implementation Strategy

### For Competition Demo (Recommended)

**Approach**: Manual + Free APIs

1. ✅ **Crossref API**: Automated citation counts (FREE)
2. ✅ **Manual Entry**: JIF, CiteScore from journal websites
3. ✅ **SCImago Lookup**: Free SJR/h5-index from public website
4. ⚠️ **Altmetric**: Use free badge embeds OR skip (not essential)

**Estimated Time**: 2-3 hours
**Estimated Cost**: $0

### For Production (Full Integration)

**Approach**: Mixed APIs + Manual

1. ✅ **Crossref API**: Automated (FREE)
2. ⚠️ **Scopus API**: If institutional access available
3. ⚠️ **Altmetric API**: If budget allows ($2.5k-5k/year)
4. ✅ **Manual Update**: Annual refresh of impact factors

**Estimated Time**: 1-2 weeks
**Estimated Cost**: $0-10k/year (depending on subscriptions)

---

## 5. Quick Start Implementation

### Step 1: Install Dependencies
```bash
cd backend
npm install axios node-cron
```

### Step 2: Create Crossref Service
```bash
# Already provided above - copy into backend/services/crossref.js
```

### Step 3: Update Database Schema
```sql
-- Add citations column
ALTER TABLE platform_articles 
ADD COLUMN IF NOT EXISTS citations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS citations_updated_at TIMESTAMPTZ;

-- Add impact metrics to journals
ALTER TABLE platform_journals 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### Step 4: Seed Impact Metrics Manually
```sql
-- Example for TJPSD journal
UPDATE platform_journals 
SET metadata = '{
    "impact_metrics": {
        "jif": 0.95,
        "citescore": 1.2,
        "sjr": 0.38,
        "h5_index": 8,
        "h5_median": 12,
        "quartile": "Q3",
        "category": "Social Sciences",
        "last_updated": "2025-02-15"
    }
}'::jsonb
WHERE path = 'tjpsd';
```

### Step 5: Test Crossref Integration
```bash
node -e "
const CrossrefService = require('./services/crossref');
const service = new CrossrefService();
service.getCitationCount('10.1371/journal.pone.0295208').then(console.log);
"
```

---

## 6. Data Validation Checklist

Before going live:

- [ ] All articles have valid DOIs in database
- [ ] Crossref service tested with real DOIs
- [ ] Citation counts updating correctly
- [ ] Impact metrics manually verified against official sources
- [ ] Frontend displaying metrics without errors
- [ ] Rate limits respected (Crossref: 50 req/sec)
- [ ] Error handling for missing/invalid DOIs
- [ ] Cron job scheduled for daily citation refresh

---

## 7. Cost Summary

| Service | Access | Cost | Required? |
|---------|--------|------|-----------|
| **Crossref** | Free API | $0/year | ✅ Yes - Essential |
| **SCImago** | Free website | $0/year | ✅ Yes - Manual lookup |
| **Google Scholar** | Free website | $0/year | ✅ Yes - Manual lookup |
| **Scopus API** | Subscription | $5k-15k/year | ❌ No - Use manual entry |
| **Web of Science API** | Subscription | $10k-30k/year | ❌ No - Use manual entry |
| **Altmetric API** | Paid plans | $2.5k-10k/year | ❌ No - Use free badges |

**Total for Demo**: **$0**  
**Total for Production (minimal)**: **$0** (using manual entry)  
**Total for Production (full automation)**: **$20k-50k/year**

---

## Next Steps

1. Review this guide
2. Implement Crossref integration (2-3 hours)
3. Manually gather impact metrics for TJPSD journal (30 minutes)
4. Proceed to Tier 3 planning document

