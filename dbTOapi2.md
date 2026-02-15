# UDSM Journal Portal - OJS API Integration Guide
## Populating PostgreSQL Analytics Platform from OJS REST API

---

## Overview

This guide shows how to populate your PostgreSQL analytics database using the OJS REST API instead of direct database access. Your platform aggregates data from multiple OJS journals to provide unified analytics, heatmaps, and citation tracking.

**Architecture:**
```
OJS Journals (Multiple Instances)
        ↓
    OJS REST API
        ↓
  Sync/ETL Scripts
        ↓
PostgreSQL Analytics DB (Your Platform)
```

---

## Table of Contents

1. [Authentication & Setup](#authentication--setup)
2. [Platform Journals Sync](#1-platform_journals)
3. [Research Items Sync](#2-research_items)
4. [Readership Geodata Sync](#3-readership_geodata)
5. [External Metrics Integration](#4-external_metrics)
6. [Article Citations Tracking](#5-article_citations)
7. [Research Fields Management](#6-research_fields)
8. [Complete Sync Scripts](#complete-sync-scripts)
9. [Scheduling & Automation](#scheduling--automation)

---

## Authentication & Setup

### Configuration File

Create `config.json`:

```json
{
  "ojs_instances": [
    {
      "journal_id": 1,
      "path": "zjahs",
      "name": "Zanzibar Journal of Applied Health Sciences",
      "base_url": "https://journals.udsm.ac.tz/zjahs",
      "api_token": "YOUR_API_TOKEN_HERE",
      "field_id": 4
    },
    {
      "journal_id": 2,
      "path": "tjs",
      "name": "Tanzania Journal of Science",
      "base_url": "https://journals.udsm.ac.tz/tjs",
      "api_token": "YOUR_API_TOKEN_HERE",
      "field_id": 1
    }
  ],
  "database": {
    "host": "localhost",
    "port": 5432,
    "dbname": "udsm_portal",
    "user": "portal_user",
    "password": "secure_password"
  },
  "external_apis": {
    "crossref_email": "your-email@udsm.ac.tz",
    "altmetric_key": "YOUR_ALTMETRIC_KEY"
  }
}
```

### Python Dependencies

```bash
pip install requests psycopg2-binary python-dateutil
```

### Base API Client

```python
import requests
import json
from typing import Dict, List, Optional

class OJSAPIClient:
    def __init__(self, base_url: str, api_token: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api/v1"
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def get(self, endpoint: str, params: Dict = None) -> Dict:
        """Make GET request to OJS API"""
        url = f"{self.api_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_all_paginated(self, endpoint: str, params: Dict = None) -> List[Dict]:
        """Fetch all items from paginated endpoint"""
        all_items = []
        offset = 0
        count = 100  # max per request
        
        if params is None:
            params = {}
        
        while True:
            params['offset'] = offset
            params['count'] = count
            
            data = self.get(endpoint, params)
            items = data.get('items', [])
            all_items.extend(items)
            
            if len(items) < count:
                break
            
            offset += count
        
        return all_items
```

---

## 1. platform_journals

**Purpose:** Registry of all OJS journals in your platform

### API Mapping

| PostgreSQL Column | OJS API Source | API Endpoint |
|------------------|----------------|--------------|
| path | context.urlPath | GET /contexts/{contextId} |
| name | context.name | GET /contexts/{contextId} |
| branding → logo_url | context.pageHeaderLogoImage.en_US | GET /contexts/{contextId} |
| branding → primary_color | Custom setting | GET /contexts/{contextId} |
| metadata → issn | context.onlineIssn | GET /contexts/{contextId} |
| metadata → description | context.description | GET /contexts/{contextId} |
| field_id | Manual mapping | N/A |

### Sync Script

```python
import psycopg2
from psycopg2.extras import Json

def sync_platform_journals(config: Dict):
    """Sync journal metadata from OJS to platform_journals table"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    for journal_config in config['ojs_instances']:
        print(f"Syncing journal: {journal_config['name']}")
        
        client = OJSAPIClient(
            journal_config['base_url'], 
            journal_config['api_token']
        )
        
        # Get context/journal metadata
        # Note: contextId is usually 1 for single-journal installations
        context = client.get('contexts/1')
        
        # Extract branding information
        branding = {
            'logo_url': context.get('pageHeaderLogoImage', {}).get('en_US', ''),
            'primary_color': context.get('primaryColor', '#1E6292'),
            'custom_headers': context.get('customHeaders', '')
        }
        
        # Extract metadata
        metadata = {
            'issn_print': context.get('printIssn', ''),
            'issn_online': context.get('onlineIssn', ''),
            'description': context.get('description', {}),
            'about': context.get('about', {}),
            'publisher': context.get('publisherInstitution', ''),
            'contact_email': context.get('contactEmail', ''),
            'supported_locales': context.get('supportedLocales', []),
            'primary_locale': context.get('primaryLocale', 'en_US')
        }
        
        # Upsert journal
        cur.execute("""
            INSERT INTO platform_journals (journal_id, path, name, branding, metadata, field_id)
            VALUES (%(journal_id)s, %(path)s, %(name)s, %(branding)s, %(metadata)s, %(field_id)s)
            ON CONFLICT (journal_id) 
            DO UPDATE SET 
                path = EXCLUDED.path,
                name = EXCLUDED.name,
                branding = EXCLUDED.branding,
                metadata = EXCLUDED.metadata,
                field_id = EXCLUDED.field_id
        """, {
            'journal_id': journal_config['journal_id'],
            'path': journal_config['path'],
            'name': context.get('name', {}).get('en_US', journal_config['name']),
            'branding': Json(branding),
            'metadata': Json(metadata),
            'field_id': journal_config.get('field_id')
        })
    
    conn.commit()
    cur.close()
    conn.close()
    print("Journal sync completed")

# Usage
with open('config.json') as f:
    config = json.load(f)

sync_platform_journals(config)
```

---

## 2. research_items

**Purpose:** Unified index of all published articles across journals

### API Mapping

| PostgreSQL Column | OJS API Source | API Endpoint |
|------------------|----------------|--------------|
| legacy_id | submission.id | GET /submissions?status=3 |
| journal_id | Internal mapping | N/A |
| title | publication.title.en_US | GET /submissions/{id}/publications/{pubId} |
| year | publication.datePublished | GET /submissions/{id}/publications/{pubId} |
| doi | publication.pub-id::doi | GET /submissions/{id}/publications/{pubId} |
| authors | contributors array | GET /submissions/{id}/publications/{pubId} |

### Sync Script

```python
from datetime import datetime
from dateutil import parser as date_parser

def extract_authors(contributors: List[Dict]) -> List[Dict]:
    """Transform OJS contributors to simplified author format"""
    authors = []
    for contrib in sorted(contributors, key=lambda x: x.get('seq', 0)):
        author = {
            'name': f"{contrib.get('givenName', {}).get('en_US', '')} {contrib.get('familyName', {}).get('en_US', '')}".strip(),
            'affiliation': contrib.get('affiliation', {}).get('en_US', ''),
            'email': contrib.get('email', ''),
            'orcid': contrib.get('orcid', ''),
            'country': contrib.get('country', '')
        }
        authors.append(author)
    return authors

def sync_research_items(config: Dict):
    """Sync published articles from OJS to research_items table"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    for journal_config in config['ojs_instances']:
        print(f"Syncing articles from: {journal_config['name']}")
        
        client = OJSAPIClient(
            journal_config['base_url'], 
            journal_config['api_token']
        )
        
        # Get all published submissions
        submissions = client.get_all_paginated('submissions', {
            'status': 3,  # STATUS_PUBLISHED
            'orderBy': 'datePublished',
            'orderDirection': 'DESC'
        })
        
        print(f"Found {len(submissions)} published articles")
        
        for submission in submissions:
            submission_id = submission['id']
            
            # Get full publication details
            publication = submission.get('publications', [{}])[0]
            
            if not publication:
                print(f"Warning: No publication found for submission {submission_id}")
                continue
            
            # Extract title (prefer English, fallback to first available)
            title_obj = publication.get('title', {})
            title = title_obj.get('en_US', '') or next(iter(title_obj.values()), '')
            
            # Extract publication year
            date_published = publication.get('datePublished')
            year = None
            if date_published:
                try:
                    year = date_parser.parse(date_published).year
                except:
                    pass
            
            # Extract DOI
            doi = publication.get('pub-id::doi', '') or publication.get('doi', '')
            
            # Extract authors
            contributors = publication.get('authors', [])
            authors = extract_authors(contributors)
            
            # Create search vector (title + authors for full-text search)
            author_names = ' '.join([a['name'] for a in authors])
            search_text = f"{title} {author_names}"
            
            # Upsert research item
            cur.execute("""
                INSERT INTO research_items (
                    legacy_id, 
                    journal_id, 
                    title, 
                    year, 
                    doi, 
                    authors,
                    search_vector
                )
                VALUES (
                    %(legacy_id)s, 
                    %(journal_id)s, 
                    %(title)s, 
                    %(year)s, 
                    %(doi)s, 
                    %(authors)s,
                    to_tsvector('english', %(search_text)s)
                )
                ON CONFLICT (legacy_id) 
                DO UPDATE SET 
                    title = EXCLUDED.title,
                    year = EXCLUDED.year,
                    doi = EXCLUDED.doi,
                    authors = EXCLUDED.authors,
                    search_vector = EXCLUDED.search_vector
                RETURNING item_id
            """, {
                'legacy_id': submission_id,
                'journal_id': journal_config['journal_id'],
                'title': title,
                'year': year,
                'doi': doi,
                'authors': Json(authors),
                'search_text': search_text
            })
            
            item_id = cur.fetchone()[0]
            print(f"  ✓ Synced: {title[:50]}... (item_id: {item_id})")
        
        conn.commit()
    
    cur.close()
    conn.close()
    print("Research items sync completed")

# Usage
sync_research_items(config)
```

---

## 3. readership_geodata

**Purpose:** Geographic readership tracking for heatmap visualization

### API Mapping

| PostgreSQL Column | OJS API Source | API Endpoint |
|------------------|----------------|--------------|
| journal_id | Internal mapping | N/A |
| item_id | From research_items | N/A |
| location_point | From IP geolocation | Stats API + GeoIP |
| country_code | statistics.country | GET /stats/usage |
| event_type | statistics.assocType | GET /stats/usage |
| timestamp | statistics.date | GET /stats/usage |

### OJS Statistics API

```python
def get_usage_statistics(client: OJSAPIClient, 
                        date_start: str, 
                        date_end: str) -> List[Dict]:
    """
    Get usage statistics from OJS
    
    Args:
        client: OJS API client
        date_start: YYYY-MM-DD format
        date_end: YYYY-MM-DD format
    
    Returns:
        List of usage records
    """
    
    params = {
        'dateStart': date_start,
        'dateEnd': date_end,
        'timelineInterval': 'day',
        'assocTypes': [
            'ASSOC_TYPE_SUBMISSION',      # Abstract views
            'ASSOC_TYPE_SUBMISSION_FILE'  # PDF downloads
        ]
    }
    
    # Note: OJS stats API returns aggregated data
    # For detailed IP-level tracking, you may need to:
    # 1. Use OJS plugin for raw log export
    # 2. Process Apache/Nginx access logs
    # 3. Use Google Analytics API if GA is configured
    
    return client.get('stats/usage', params)
```

### Sync Script with GeoIP

```python
import geoip2.database
from shapely.geometry import Point

def sync_readership_geodata(config: Dict, 
                            date_start: str, 
                            date_end: str):
    """
    Sync usage statistics with geographic data
    
    Note: OJS native stats API provides aggregated data.
    For detailed IP tracking, consider:
    1. OJS Custom Stats Plugin
    2. Access log parsing
    3. Google Analytics API integration
    """
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    # Initialize GeoIP reader
    # Download MaxMind GeoLite2-City database from:
    # https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
    geoip_reader = geoip2.database.Reader('/path/to/GeoLite2-City.mmdb')
    
    for journal_config in config['ojs_instances']:
        print(f"Syncing geodata for: {journal_config['name']}")
        
        client = OJSAPIClient(
            journal_config['base_url'], 
            journal_config['api_token']
        )
        
        # Get usage stats
        stats = get_usage_statistics(client, date_start, date_end)
        
        # Process each stat record
        for record in stats:
            # Map OJS submission ID to our item_id
            cur.execute("""
                SELECT item_id FROM research_items 
                WHERE legacy_id = %s AND journal_id = %s
            """, (record.get('assocId'), journal_config['journal_id']))
            
            result = cur.fetchone()
            if not result:
                continue
            
            item_id = result[0]
            
            # Determine event type
            event_type = 'ABSTRACT_VIEW'
            if record.get('assocType') == 'ASSOC_TYPE_SUBMISSION_FILE':
                event_type = 'PDF_DOWNLOAD'
            
            # GeoIP lookup
            # Note: You'll need to extract IP from logs or custom tracking
            ip_address = record.get('ip')  # If available
            
            if ip_address:
                try:
                    geo_data = geoip_reader.city(ip_address)
                    
                    # Check if institutional (UDSM IP range)
                    is_institutional = is_udsm_ip(ip_address)
                    
                    # Insert geodata record
                    cur.execute("""
                        INSERT INTO readership_geodata (
                            journal_id,
                            item_id,
                            location_point,
                            country_code,
                            country_name,
                            city_name,
                            is_institutional,
                            event_type,
                            timestamp
                        )
                        VALUES (
                            %(journal_id)s,
                            %(item_id)s,
                            ST_SetSRID(ST_MakePoint(%(longitude)s, %(latitude)s), 4326),
                            %(country_code)s,
                            %(country_name)s,
                            %(city_name)s,
                            %(is_institutional)s,
                            %(event_type)s,
                            %(timestamp)s
                        )
                    """, {
                        'journal_id': journal_config['journal_id'],
                        'item_id': item_id,
                        'longitude': geo_data.location.longitude,
                        'latitude': geo_data.location.latitude,
                        'country_code': geo_data.country.iso_code,
                        'country_name': geo_data.country.name,
                        'city_name': geo_data.city.name,
                        'is_institutional': is_institutional,
                        'event_type': event_type,
                        'timestamp': record.get('date')
                    })
                    
                except Exception as e:
                    print(f"GeoIP lookup failed for {ip_address}: {e}")
        
        conn.commit()
    
    cur.close()
    conn.close()
    geoip_reader.close()

def is_udsm_ip(ip_address: str) -> bool:
    """Check if IP is from UDSM network"""
    # Add your institution's IP ranges
    udsm_ranges = [
        '196.216.0.0/16',   # Example UDSM range
        '41.93.0.0/16',     # Example range
    ]
    
    from ipaddress import ip_address as parse_ip, ip_network
    
    ip = parse_ip(ip_address)
    for range_str in udsm_ranges:
        if ip in ip_network(range_str):
            return True
    return False
```

### Alternative: Google Analytics Integration

If you use Google Analytics for tracking:

```python
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest

def sync_from_google_analytics(property_id: str, config: Dict):
    """Sync readership data from Google Analytics"""
    
    client = BetaAnalyticsDataClient()
    
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[
            {"name": "pagePath"},
            {"name": "country"},
            {"name": "city"},
            {"name": "date"}
        ],
        metrics=[
            {"name": "screenPageViews"}
        ],
        date_ranges=[{"start_date": "30daysAgo", "end_date": "today"}]
    )
    
    response = client.run_report(request)
    
    # Process GA data and insert into readership_geodata
    # Similar to above but using GA dimensions
```

---

## 4. external_metrics

**Purpose:** Cache citation counts and altmetrics from external APIs

### Crossref API Integration

```python
import time
from typing import Optional

class CrossrefClient:
    def __init__(self, email: str):
        self.base_url = "https://api.crossref.org"
        self.email = email
    
    def get_citation_count(self, doi: str) -> Optional[int]:
        """Get citation count for a DOI from Crossref"""
        headers = {'User-Agent': f'UDSM Portal (mailto:{self.email})'}
        
        url = f"{self.base_url}/works/{doi}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            return data['message'].get('is-referenced-by-count', 0)
        
        return None
    
    def get_work_metadata(self, doi: str) -> Optional[Dict]:
        """Get complete work metadata from Crossref"""
        headers = {'User-Agent': f'UDSM Portal (mailto:{self.email})'}
        
        url = f"{self.base_url}/works/{doi}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()['message']
        
        return None

class AltmetricClient:
    def __init__(self, api_key: str):
        self.base_url = "https://api.altmetric.com/v1"
        self.api_key = api_key
    
    def get_altmetric_score(self, doi: str) -> Optional[Dict]:
        """Get Altmetric data for a DOI"""
        url = f"{self.base_url}/doi/{doi}"
        params = {'key': self.api_key}
        
        response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        
        return None

def sync_external_metrics(config: Dict):
    """Fetch and cache external metrics for all articles with DOIs"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    # Get all articles with DOIs
    cur.execute("""
        SELECT item_id, doi, title 
        FROM research_items 
        WHERE doi IS NOT NULL AND doi != ''
    """)
    
    articles = cur.fetchall()
    
    crossref = CrossrefClient(config['external_apis']['crossref_email'])
    altmetric = AltmetricClient(config['external_apis'].get('altmetric_key', ''))
    
    for item_id, doi, title in articles:
        print(f"Fetching metrics for: {title[:50]}...")
        
        # Get Crossref citations
        citation_count = crossref.get_citation_count(doi)
        crossref_metadata = crossref.get_work_metadata(doi)
        
        # Get Altmetric score
        altmetric_data = altmetric.get_altmetric_score(doi)
        altmetric_score = altmetric_data.get('score', 0) if altmetric_data else 0
        
        # Combine raw data
        raw_data = {
            'crossref': crossref_metadata,
            'altmetric': altmetric_data
        }
        
        # Upsert external metrics
        cur.execute("""
            INSERT INTO external_metrics (
                doi, 
                crossref_citations, 
                altmetric_score, 
                last_updated, 
                raw_data
            )
            VALUES (
                %(doi)s, 
                %(citations)s, 
                %(altmetric)s, 
                NOW(), 
                %(raw_data)s
            )
            ON CONFLICT (doi) 
            DO UPDATE SET 
                crossref_citations = EXCLUDED.crossref_citations,
                altmetric_score = EXCLUDED.altmetric_score,
                last_updated = NOW(),
                raw_data = EXCLUDED.raw_data
        """, {
            'doi': doi,
            'citations': citation_count or 0,
            'altmetric': altmetric_score,
            'raw_data': Json(raw_data)
        })
        
        conn.commit()
        
        # Rate limiting (Crossref: 50 req/sec, Altmetric: varies by plan)
        time.sleep(0.1)
    
    cur.close()
    conn.close()
    print("External metrics sync completed")
```

---

## 5. article_citations

**Purpose:** Detailed citation tracking with citing article information

### Crossref Citations API

```python
def sync_article_citations(config: Dict):
    """Fetch detailed citation data from Crossref"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    # Get articles with DOIs
    cur.execute("""
        SELECT item_id, doi, title 
        FROM research_items 
        WHERE doi IS NOT NULL AND doi != ''
    """)
    
    articles = cur.fetchall()
    
    crossref = CrossrefClient(config['external_apis']['crossref_email'])
    
    for item_id, doi, title in articles:
        print(f"Fetching citations for: {title[:50]}...")
        
        # Get works that cite this DOI
        headers = {'User-Agent': f'UDSM Portal (mailto:{crossref.email})'}
        url = f"{crossref.base_url}/works"
        params = {
            'filter': f'doi:{doi}',
            'select': 'DOI,title,published-print,author'
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            continue
        
        data = response.json()
        citing_works = data.get('message', {}).get('items', [])
        
        for citing_work in citing_works:
            citing_doi = citing_work.get('DOI', '')
            citing_title = citing_work.get('title', [''])[0]
            
            # Extract publication date
            citation_date = None
            if 'published-print' in citing_work:
                date_parts = citing_work['published-print'].get('date-parts', [[]])[0]
                if len(date_parts) >= 1:
                    year = date_parts[0]
                    month = date_parts[1] if len(date_parts) > 1 else 1
                    day = date_parts[2] if len(date_parts) > 2 else 1
                    citation_date = f"{year}-{month:02d}-{day:02d}"
            
            # Store citation
            cur.execute("""
                INSERT INTO article_citations (
                    cited_article_id,
                    citing_article_doi,
                    citing_article_title,
                    citation_date,
                    source,
                    metadata
                )
                VALUES (
                    %(cited_id)s,
                    %(citing_doi)s,
                    %(citing_title)s,
                    %(citation_date)s,
                    'crossref',
                    %(metadata)s
                )
                ON CONFLICT DO NOTHING
            """, {
                'cited_id': item_id,
                'citing_doi': citing_doi,
                'citing_title': citing_title,
                'citation_date': citation_date,
                'metadata': Json(citing_work)
            })
        
        conn.commit()
        time.sleep(0.1)  # Rate limiting
    
    cur.close()
    conn.close()
    print("Citation tracking completed")
```

---

## 6. research_fields

**Purpose:** Field classification for normalized metrics

This table is typically manually maintained or semi-automated:

```python
def initialize_research_fields(config: Dict):
    """Initialize research fields taxonomy"""
    
    fields = [
        {
            'field_name': 'Computer Science',
            'category': 'STEM',
            'baseline_citations_per_article': 15.2,
            'description': 'Computing, AI, Software Engineering'
        },
        {
            'field_name': 'Medicine',
            'category': 'Health Sciences',
            'baseline_citations_per_article': 25.8,
            'description': 'Clinical medicine, surgery, diagnostics'
        },
        {
            'field_name': 'Chemistry',
            'category': 'STEM',
            'baseline_citations_per_article': 18.5,
            'description': 'Organic, inorganic, analytical chemistry'
        },
        {
            'field_name': 'Public Health',
            'category': 'Health Sciences',
            'baseline_citations_per_article': 22.3,
            'description': 'Epidemiology, health policy, community health'
        },
        {
            'field_name': 'Social Sciences',
            'category': 'Social Sciences',
            'baseline_citations_per_article': 12.1,
            'description': 'Sociology, anthropology, political science'
        }
    ]
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    for field in fields:
        cur.execute("""
            INSERT INTO research_fields (
                field_name, 
                category, 
                baseline_citations_per_article, 
                description
            )
            VALUES (%(name)s, %(category)s, %(baseline)s, %(description)s)
            ON CONFLICT (field_name) DO NOTHING
        """, {
            'name': field['field_name'],
            'category': field['category'],
            'baseline': field['baseline_citations_per_article'],
            'description': field['description']
        })
    
    conn.commit()
    cur.close()
    conn.close()
```

**Baseline Citations Sources:**
- Journal Citation Reports (JCR)
- Scopus CiteScore data
- Field-specific averages from literature

---

## Complete Sync Scripts

### Full Sync Runner

```python
#!/usr/bin/env python3
"""
UDSM Portal - Complete Data Sync
Pulls data from OJS API and external sources
"""

import json
import sys
from datetime import datetime, timedelta

def main():
    # Load configuration
    with open('config.json') as f:
        config = json.load(f)
    
    print("=== UDSM Portal Data Sync ===")
    print(f"Started at: {datetime.now()}")
    
    # 1. Sync journal metadata
    print("\n[1/5] Syncing platform journals...")
    sync_platform_journals(config)
    
    # 2. Sync research items (articles)
    print("\n[2/5] Syncing research items...")
    sync_research_items(config)
    
    # 3. Sync geodata (last 30 days)
    print("\n[3/5] Syncing readership geodata...")
    date_end = datetime.now().strftime('%Y-%m-%d')
    date_start = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    sync_readership_geodata(config, date_start, date_end)
    
    # 4. Sync external metrics
    print("\n[4/5] Syncing external metrics...")
    sync_external_metrics(config)
    
    # 5. Sync citation data
    print("\n[5/5] Syncing article citations...")
    sync_article_citations(config)
    
    # Refresh materialized views
    print("\nRefreshing statistics...")
    refresh_stats(config)
    
    print(f"\n✓ Sync completed at: {datetime.now()}")

def refresh_stats(config: Dict):
    """Refresh materialized views"""
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    cur.execute("SELECT refresh_citation_stats()")
    conn.commit()
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
```

### Incremental Sync (Daily Updates)

```python
#!/usr/bin/env python3
"""
Incremental sync - only new/updated content
Run daily via cron
"""

def incremental_sync(config: Dict):
    """Sync only changed data since last run"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    # Get last sync timestamp
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sync_log (
            sync_id SERIAL PRIMARY KEY,
            sync_type VARCHAR(50),
            last_sync TIMESTAMPTZ,
            status VARCHAR(20)
        )
    """)
    
    cur.execute("""
        SELECT last_sync FROM sync_log 
        WHERE sync_type = 'incremental' 
        ORDER BY last_sync DESC LIMIT 1
    """)
    
    result = cur.fetchone()
    last_sync = result[0] if result else datetime.now() - timedelta(days=7)
    
    print(f"Syncing changes since: {last_sync}")
    
    for journal_config in config['ojs_instances']:
        client = OJSAPIClient(
            journal_config['base_url'], 
            journal_config['api_token']
        )
        
        # Get recently modified submissions
        submissions = client.get_all_paginated('submissions', {
            'status': 3,
            'orderBy': 'lastModified',
            'orderDirection': 'DESC'
        })
        
        # Filter to only those modified since last sync
        for submission in submissions:
            last_modified = submission.get('lastModified')
            if not last_modified:
                continue
            
            modified_date = date_parser.parse(last_modified)
            if modified_date.replace(tzinfo=None) <= last_sync.replace(tzinfo=None):
                break  # Rest are older
            
            # Update this submission
            # (use same logic as full sync_research_items)
    
    # Log sync completion
    cur.execute("""
        INSERT INTO sync_log (sync_type, last_sync, status)
        VALUES ('incremental', NOW(), 'success')
    """)
    
    conn.commit()
    cur.close()
    conn.close()
```

---

## Scheduling & Automation

### Cron Jobs

```bash
# /etc/cron.d/udsm-portal-sync

# Full sync - weekly on Sunday at 2 AM
0 2 * * 0 portal /usr/local/bin/udsm-full-sync.sh

# Incremental sync - daily at 3 AM
0 3 * * * portal /usr/local/bin/udsm-incremental-sync.sh

# External metrics - daily at 4 AM
0 4 * * * portal python3 /opt/portal/sync_external_metrics.py

# Geodata sync - every 6 hours
0 */6 * * * portal python3 /opt/portal/sync_geodata.py

# Refresh materialized views - hourly
0 * * * * portal psql -d udsm_portal -c "SELECT refresh_citation_stats();"
```

### Systemd Service

```ini
# /etc/systemd/system/udsm-portal-sync.service

[Unit]
Description=UDSM Portal OJS Data Sync
After=network.target postgresql.service

[Service]
Type=oneshot
User=portal
WorkingDirectory=/opt/portal
ExecStart=/usr/bin/python3 /opt/portal/full_sync.py
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Systemd Timer

```ini
# /etc/systemd/system/udsm-portal-sync.timer

[Unit]
Description=Run UDSM Portal Sync Daily
Requires=udsm-portal-sync.service

[Timer]
OnCalendar=daily
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

Activate timer:
```bash
sudo systemctl enable udsm-portal-sync.timer
sudo systemctl start udsm-portal-sync.timer
```

---

## Error Handling & Monitoring

### Logging

```python
import logging
from logging.handlers import RotatingFileHandler

# Setup logging
logger = logging.getLogger('udsm_portal_sync')
logger.setLevel(logging.INFO)

handler = RotatingFileHandler(
    '/var/log/udsm-portal/sync.log',
    maxBytes=10485760,  # 10MB
    backupCount=5
)

formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Use in sync functions
logger.info("Starting journal sync")
logger.error(f"Failed to sync journal {journal_id}: {error}")
```

### Health Checks

```python
def check_sync_health(config: Dict) -> Dict:
    """Check data freshness and integrity"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    health = {}
    
    # Check last sync time
    cur.execute("""
        SELECT MAX(last_sync) FROM sync_log 
        WHERE status = 'success'
    """)
    health['last_successful_sync'] = cur.fetchone()[0]
    
    # Check article count per journal
    cur.execute("""
        SELECT journal_id, COUNT(*) 
        FROM research_items 
        GROUP BY journal_id
    """)
    health['article_counts'] = dict(cur.fetchall())
    
    # Check geodata freshness
    cur.execute("""
        SELECT MAX(timestamp) FROM readership_geodata
    """)
    health['latest_geodata'] = cur.fetchone()[0]
    
    # Check for articles without DOIs
    cur.execute("""
        SELECT COUNT(*) FROM research_items 
        WHERE doi IS NULL OR doi = ''
    """)
    health['articles_without_doi'] = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    return health
```

---

## Data Quality Checks

### Validation Queries

```sql
-- Articles missing authors
SELECT item_id, title 
FROM research_items 
WHERE authors = '[]' OR authors IS NULL;

-- Duplicate DOIs
SELECT doi, COUNT(*) 
FROM research_items 
WHERE doi IS NOT NULL AND doi != ''
GROUP BY doi 
HAVING COUNT(*) > 1;

-- Journals without articles
SELECT j.journal_id, j.name, COUNT(r.item_id) as article_count
FROM platform_journals j
LEFT JOIN research_items r ON j.journal_id = r.journal_id
GROUP BY j.journal_id, j.name
HAVING COUNT(r.item_id) = 0;

-- Geodata without location
SELECT COUNT(*) 
FROM readership_geodata 
WHERE location_point IS NULL;

-- Stale external metrics (>30 days old)
SELECT doi, last_updated 
FROM external_metrics 
WHERE last_updated < NOW() - INTERVAL '30 days';
```

---

## Performance Optimization

### Batch Processing

```python
def batch_upsert_research_items(items: List[Dict], config: Dict):
    """Batch insert/update for better performance"""
    
    conn = psycopg2.connect(**config['database'])
    cur = conn.cursor()
    
    # Use COPY or multi-row INSERT
    from psycopg2.extras import execute_values
    
    values = [
        (
            item['legacy_id'],
            item['journal_id'],
            item['title'],
            item['year'],
            item['doi'],
            Json(item['authors'])
        )
        for item in items
    ]
    
    execute_values(cur, """
        INSERT INTO research_items (
            legacy_id, journal_id, title, year, doi, authors
        ) VALUES %s
        ON CONFLICT (legacy_id) DO UPDATE SET
            title = EXCLUDED.title,
            year = EXCLUDED.year,
            doi = EXCLUDED.doi,
            authors = EXCLUDED.authors
    """, values)
    
    conn.commit()
    cur.close()
    conn.close()
```

### Connection Pooling

```python
from psycopg2 import pool

# Initialize connection pool
db_pool = psycopg2.pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    **config['database']
)

def get_db_connection():
    """Get connection from pool"""
    return db_pool.getconn()

def return_db_connection(conn):
    """Return connection to pool"""
    db_pool.putconn(conn)
```

---

## Troubleshooting

### Common Issues

**Issue: OJS API returns 401 Unauthorized**
- Solution: Verify API token is valid and not expired
- Check: User account has appropriate permissions

**Issue: Missing data in research_items**
- Solution: Check submission status (must be 3 = published)
- Verify: Publications array exists in submission response

**Issue: Geodata not populating**
- Solution: OJS stats API provides aggregated data without IPs
- Alternative: Parse access logs or use Google Analytics

**Issue: External API rate limits**
- Solution: Implement exponential backoff
- Add delays between requests
- Cache results and update periodically

**Issue: Materialized view refresh fails**
- Solution: Check for duplicate entries in base tables
- Ensure foreign key constraints are valid
- Use REFRESH MATERIALIZED VIEW CONCURRENTLY

---

## Migration Checklist

- [ ] Install Python dependencies
- [ ] Configure `config.json` with all OJS instances
- [ ] Generate API tokens for each journal
- [ ] Initialize `research_fields` table
- [ ] Run full sync for first time
- [ ] Verify data in all tables
- [ ] Set up cron jobs or systemd timers
- [ ] Configure monitoring and alerts
- [ ] Test incremental sync
- [ ] Document custom field mappings
- [ ] Set up log rotation
- [ ] Create database backups
- [ ] Test disaster recovery

---

## Additional Resources

- **OJS API Docs**: https://docs.pkp.sfu.ca/dev/api/ojs/3.4
- **Crossref API**: https://api.crossref.org
- **Altmetric API**: https://api.altmetric.com/docs
- **MaxMind GeoIP**: https://dev.maxmind.com/geoip
- **PostGIS**: https://postgis.net/documentation

---

*Last Updated: February 2026*
*Platform: UDSM Journal Portal*
*OJS Version: 3.4*