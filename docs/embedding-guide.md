# UDSM Analytics Widget - Embedding Guide

## Quick Start

The UDSM Analytics Widget provides a drop-in solution for displaying real-time readership analytics on OJS journal pages.

### Basic Integration

Add this snippet to your OJS theme template where you want the analytics to appear:

```html
<!-- Widget Container -->
<div 
  id="udsm-analytics-widget" 
  data-journal="your-journal-path"
  data-scope="single"
  data-theme="light"
></div>

<!-- Widget Script -->
<script src="https://analytics.udsm.ac.tz/widget.js"></script>
```

That's it! The widget will automatically initialize and render the full analytics dashboard.

---

## Configuration Options

### Required Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `id` | Must be `udsm-analytics-widget` | `id="udsm-analytics-widget"` |
| `data-journal` | Journal path identifier | `data-journal="tjpsd"` |

### Optional Attributes

| Attribute | Options | Default | Description |
|-----------|---------|---------|-------------|
| `data-scope` | `single` \| `all` | `single` | Single journal or aggregate view |
| `data-theme` | `light` \| `dark` | `light` | Visual theme |
| `data-height` | Number (pixels) | `800` | Minimum widget height |
| `data-api-url` | URL string | (auto) | Custom API endpoint |

---

## Examples

### Example 1: Single Journal (Light Theme)

```html
<div 
  id="udsm-analytics-widget" 
  data-journal="tjpsd"
  data-scope="single"
  data-theme="light"
></div>
<script src="https://analytics.udsm.ac.tz/widget.js"></script>
```

**Result**: Displays analytics for TJPSD journal only, light theme.

---

### Example 2: All Journals Aggregate (Dark Theme)

```html
<div 
  id="udsm-analytics-widget" 
  data-journal="all"
  data-scope="all"
  data-theme="dark"
  data-height="1000"
></div>
<script src="https://analytics.udsm.ac.tz/widget.js"></script>
```

**Result**: Displays aggregate analytics for all UDSM journals, dark theme, 1000px height.

---

### Example 3: Custom API Endpoint

```html
<div 
  id="udsm-analytics-widget" 
  data-journal="ter"
  data-api-url="https://custom-backend.udsm.ac.tz"
></div>
<script src="https://analytics.udsm.ac.tz/widget.js"></script>
```

**Result**: Loads data from custom backend URL.

---

## OJS Integration Methods

### Method 1: Theme Template (Recommended)

Edit your OJS theme's template file (usually `templates/frontend/pages/issue.tpl`):

```smarty
{* Add widget container after issue table of contents *}
<div class="issue-analytics">
    <h2>Readership Analytics</h2>
    <div 
        id="udsm-analytics-widget" 
        data-journal="{$currentJournal->getPath()}"
        data-scope="single"
        data-theme="light"
    ></div>
</div>

{* Load widget script in footer *}
<script src="https://analytics.udsm.ac.tz/widget.js"></script>
```

---

### Method 2: OJS Plugin (Advanced)

For advanced users, install the **UDSM Analytics Plugin**:

1. Download `UDSMAnalyticsPlugin.tar.gz`
2. Upload via OJS Admin Panel → Settings → Plugins → Upload New Plugin
3. Enable the plugin
4. Configure widget placement in plugin settings

**Benefits**:
- Automatic journal detection
- Admin panel configuration
- Version updates via OJS plugin manager

---

## Widget Features

The widget displays:

1. **Impact Metrics Cards**
   - Journal Impact Factor (JIF)
   - CiteScore (4-year)
   - SJR Ranking
   - h5-index

2. **Monthly Readership Trend Chart**
   - Line chart showing last 6 months
   - Total reads and downloads

3. **Geographic Breakdown**
   - Top 10 countries bar chart
   - Total readership by location

4. **Top Articles Panel**
   - Top 5 most-read articles (last 30 days)
   - Read counts and download stats

---

## Styling & Customization

### Override Default Styles

The widget uses scoped CSS classes prefixed with `.udsm-analytics-widget`. You can override styles:

```css
/* Example: Change widget background */
.udsm-analytics-widget {
    background: #f0f0f0 !important;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Example: Hide impact metrics section */
.udsm-analytics-widget .impact-metrics {
    display: none;
}
```

---

## Performance

- **Initial Load**: <2 seconds (with CDN)
- **Bundle Size**: ~180KB (gzipped)
- **API Calls**: 4 requests (cached for 5 minutes)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## Troubleshooting

### Widget Not Displaying

1. **Check container ID**: Must be exactly `udsm-analytics-widget`
2. **Verify script URL**: Ensure `https://analytics.udsm.ac.tz/widget.js` is accessible
3. **Check browser console**: Look for JavaScript errors
4. **Test API endpoints**: Open `https://analytics.udsm.ac.tz/api/metrics/journal-impact?journal=tjpsd` in browser

### Data Not Loading

1. **Verify journal path**: Check `data-journal` attribute matches actual journal path
2. **Check backend API**: Ensure backend is running and accessible
3. **CORS issues**: Backend must allow cross-origin requests from your OJS domain

### Styling Conflicts

1. **Use iframe mode**: Add `data-mode="iframe"` to isolate widget styles
2. **Increase specificity**: Use `!important` flags in custom CSS
3. **Check z-index**: Ensure widget isn't hidden behind other elements

---

## Support

**Documentation**: https://analytics.udsm.ac.tz/docs  
**GitHub**: https://github.com/udsm/analytics-widget  
**Contact**: analytics@udsm.ac.tz  

---

## License

© 2026 University of Dar es Salaam. All rights reserved.
