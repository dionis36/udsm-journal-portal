# OJS Database to API Mapping Guide
## Migrating from Direct Database Access to REST API (OJS 3.4)

---

## Base API URL Structure

```
For single journal:
https://your-domain.com/api/v1/{endpoint}

For multi-journal installation:
https://your-domain.com/{journal-path}/api/v1/{endpoint}

Without mod_rewrite:
https://your-domain.com/index.php/{journal-path}/api/v1/{endpoint}
```

---

## Authentication

All API requests require authentication using an API token:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

To generate API tokens: Settings → Website → Users → Generate API Key

---

## Core Endpoints Mapping

### 1. SUBMISSIONS

**Database Tables:**
- `submissions`
- `submission_settings`

**API Endpoints:**

```bash
# Get all submissions (with pagination)
GET /api/v1/submissions
Parameters:
  - count: number of results per page (default: 20, max: 100)
  - offset: pagination offset
  - status: filter by status (1=queued, 3=published, 4=declined, 5=scheduled)
  - searchPhrase: search in title, authors, keywords
  - assignedTo: filter by assigned user ID
  - stageIds: filter by workflow stage
  - orderBy: dateSubmitted, lastModified, title
  - orderDirection: ASC or DESC
  - isIncomplete: true/false
  - isOverdue: true/false

# Get single submission
GET /api/v1/submissions/{submissionId}

# Create submission
POST /api/v1/submissions
Body: {
  "sectionId": 1,
  "locale": "en_US"
}

# Edit submission
PUT /api/v1/submissions/{submissionId}

# Delete submission
DELETE /api/v1/submissions/{submissionId}

# Get submission files
GET /api/v1/submissions/{submissionId}/files

# Get submission participants
GET /api/v1/submissions/{submissionId}/participants/{stageId}
```

---

### 2. PUBLICATIONS (Articles)

**Database Tables:**
- `publications`
- `publication_settings`

**API Endpoints:**

```bash
# Get all publications for a submission
GET /api/v1/submissions/{submissionId}/publications

# Get single publication
GET /api/v1/submissions/{submissionId}/publications/{publicationId}

# Create new publication version
POST /api/v1/submissions/{submissionId}/publications

# Update publication
PUT /api/v1/submissions/{submissionId}/publications/{publicationId}

# Publish a publication
PUT /api/v1/submissions/{submissionId}/publications/{publicationId}/publish

# Unpublish a publication
PUT /api/v1/submissions/{submissionId}/publications/{publicationId}/unpublish

# Delete publication
DELETE /api/v1/submissions/{submissionId}/publications/{publicationId}
```

**Publication Response Includes:**
- title, subtitle, abstract
- datePublished
- issueId
- pages
- copyrightHolder, copyrightYear
- licenseUrl
- authors (array)
- galleys (array)
- keywords, subjects, disciplines
- DOI, URLs

---

### 3. AUTHORS (Contributors)

**Database Tables:**
- `authors`
- `author_settings`

**API Endpoints:**

```bash
# Get all authors/contributors for a publication
GET /api/v1/submissions/{submissionId}/publications/{publicationId}/contributors

# Get single contributor
GET /api/v1/submissions/{submissionId}/publications/{publicationId}/contributors/{contributorId}

# Add contributor
POST /api/v1/submissions/{submissionId}/publications/{publicationId}/contributors
Body: {
  "givenName": {"en_US": "Jane"},
  "familyName": {"en_US": "Doe"},
  "email": "jane@example.com",
  "country": "US",
  "affiliation": {"en_US": "University"},
  "orcid": "",
  "seq": 1
}

# Update contributor
PUT /api/v1/submissions/{submissionId}/publications/{publicationId}/contributors/{contributorId}

# Delete contributor
DELETE /api/v1/submissions/{submissionId}/publications/{publicationId}/contributors/{contributorId}
```

---

### 4. ISSUES

**Database Tables:**
- `issues`
- `issue_settings`

**API Endpoints:**

```bash
# Get all issues
GET /api/v1/issues
Parameters:
  - count: results per page (default: 20, max: 100)
  - offset: pagination
  - orderBy: datePublished, lastModified, seq
  - orderDirection: ASC or DESC
  - isPublished: true/false
  - volumes: filter by volume number(s)
  - numbers: filter by issue number(s)
  - years: filter by year(s)

# Get single issue
GET /api/v1/issues/{issueId}

# Get current issue
GET /api/v1/issues/current

# Create issue
POST /api/v1/issues
Body: {
  "volume": 1,
  "number": "1",
  "year": 2024,
  "title": {"en_US": "Vol 1 No 1 (2024)"},
  "published": true
}

# Update issue
PUT /api/v1/issues/{issueId}

# Delete issue
DELETE /api/v1/issues/{issueId}

# Publish issue
PUT /api/v1/issues/{issueId}/publish

# Unpublish issue
PUT /api/v1/issues/{issueId}/unpublish
```

---

### 5. SECTIONS

**Database Tables:**
- `sections`
- `section_settings`

**API Endpoints:**

```bash
# Get all sections
GET /api/v1/contexts/{contextId}/sections
Parameters:
  - count: results per page
  - offset: pagination
  - searchPhrase: search in title, abbrev

# Get single section
GET /api/v1/contexts/{contextId}/sections/{sectionId}

# Create section
POST /api/v1/contexts/{contextId}/sections
Body: {
  "abbrev": {"en_US": "ART"},
  "title": {"en_US": "Articles"},
  "policy": {"en_US": "..."},
  "reviewFormId": null
}

# Update section
PUT /api/v1/contexts/{contextId}/sections/{sectionId}

# Delete section
DELETE /api/v1/contexts/{contextId}/sections/{sectionId}
```

---

### 6. USERS

**Database Tables:**
- `users`
- `user_settings`
- `user_groups`
- `user_user_groups`

**API Endpoints:**

```bash
# Get all users
GET /api/v1/users
Parameters:
  - count: results per page (max: 100)
  - offset: pagination
  - roleIds: filter by role (1=Site Admin, 16=Manager, 17=Editor, etc.)
  - status: active, disabled
  - searchPhrase: search in name, email, username
  - assignedToSection: section ID
  - assignedToCategory: category ID

# Get single user
GET /api/v1/users/{userId}

# Get current user
GET /api/v1/users/me

# Create user
POST /api/v1/users
Body: {
  "username": "jdoe",
  "email": "jdoe@example.com",
  "givenName": {"en_US": "Jane"},
  "familyName": {"en_US": "Doe"},
  "country": "US",
  "affiliation": {"en_US": "University"}
}

# Update user
PUT /api/v1/users/{userId}

# Delete user
DELETE /api/v1/users/{userId}
```

---

### 7. GALLEYS (Publication Formats)

**Database Tables:**
- `publication_galleys`
- `publication_galley_settings`

**API Endpoints:**

```bash
# Get all galleys for a publication
GET /api/v1/submissions/{submissionId}/publications/{publicationId}/galleys

# Get single galley
GET /api/v1/submissions/{submissionId}/publications/{publicationId}/galleys/{galleyId}

# Create galley
POST /api/v1/submissions/{submissionId}/publications/{publicationId}/galleys
Body: {
  "label": "PDF",
  "locale": "en_US",
  "urlPath": "",
  "urlRemote": ""
}

# Update galley
PUT /api/v1/submissions/{submissionId}/publications/{publicationId}/galleys/{galleyId}

# Delete galley
DELETE /api/v1/submissions/{submissionId}/publications/{publicationId}/galleys/{galleyId}
```

---

### 8. SUBMISSION FILES

**Database Tables:**
- `submission_files`
- `submission_file_settings`

**API Endpoints:**

```bash
# Get all files for submission
GET /api/v1/submissions/{submissionId}/files
Parameters:
  - fileStages: array of file stage IDs

# Get single file
GET /api/v1/submissions/{submissionId}/files/{fileId}

# Upload file
POST /api/v1/submissions/{submissionId}/files
(Multipart form data upload)

# Update file
PUT /api/v1/submissions/{submissionId}/files/{fileId}

# Delete file
DELETE /api/v1/submissions/{submissionId}/files/{fileId}
```

**File Stages:**
- 2: SUBMISSION_FILE_SUBMISSION
- 4: SUBMISSION_FILE_REVIEW_FILE
- 9: SUBMISSION_FILE_REVIEW_ATTACHMENT
- 10: SUBMISSION_FILE_REVIEW_REVISION
- 17: SUBMISSION_FILE_COPYEDIT
- 19: SUBMISSION_FILE_PROOF
- 10: SUBMISSION_FILE_PRODUCTION_READY
- 11: SUBMISSION_FILE_ATTACHMENT
- 13: SUBMISSION_FILE_QUERY

---

### 9. ANNOUNCEMENTS

**Database Tables:**
- `announcements`
- `announcement_settings`

**API Endpoints:**

```bash
# Get all announcements
GET /api/v1/announcements
Parameters:
  - count: results per page
  - offset: pagination
  - searchPhrase: search in title, content

# Get single announcement
GET /api/v1/announcements/{announcementId}

# Create announcement
POST /api/v1/announcements

# Update announcement
PUT /api/v1/announcements/{announcementId}

# Delete announcement
DELETE /api/v1/announcements/{announcementId}
```

---

### 10. CONTEXTS (Journals)

**Database Tables:**
- `journals`
- `journal_settings`

**API Endpoints:**

```bash
# Get all contexts
GET /api/v1/contexts
Parameters:
  - count: results per page
  - offset: pagination
  - isEnabled: true/false
  - searchPhrase: search in name, description

# Get single context
GET /api/v1/contexts/{contextId}

# Update context
PUT /api/v1/contexts/{contextId}

# Get context theme
GET /api/v1/contexts/{contextId}/theme
```

---

### 11. CATEGORIES

**Database Tables:**
- `categories`
- `category_settings`

**API Endpoints:**

```bash
# Get all categories
GET /api/v1/contexts/{contextId}/categories
Parameters:
  - count: results per page
  - offset: pagination

# Get single category
GET /api/v1/contexts/{contextId}/categories/{categoryId}

# Create category
POST /api/v1/contexts/{contextId}/categories

# Update category
PUT /api/v1/contexts/{contextId}/categories/{categoryId}

# Delete category
DELETE /api/v1/contexts/{contextId}/categories/{categoryId}
```

---

### 12. REVIEW ROUNDS & ASSIGNMENTS

**Database Tables:**
- `review_rounds`
- `review_assignments`
- `review_round_files`

**API Endpoints:**

```bash
# Get review rounds for submission
GET /api/v1/submissions/{submissionId}/reviewRounds

# Get review assignments
GET /api/v1/submissions/{submissionId}/reviewAssignments
Parameters:
  - stageId: workflow stage ID
  - round: review round number
```

---

### 13. EDITORIAL DECISIONS

**Database Tables:**
- `edit_decisions`

**API Endpoints:**

```bash
# Make editorial decision
POST /api/v1/submissions/{submissionId}/decisions
Body: {
  "decision": 1,  # decision type
  "reviewRoundId": 123,
  "stageId": 3
}

# Available decision types:
# 1 = Accept
# 2 = Decline
# 3 = Initial Decline
# 4 = Revisions Required
# 5 = Resubmit for Review
# 16 = Send to Production
# 17 = Accept (copyediting)
```

---

### 14. STATISTICS

**Database Tables:**
- `metrics`
- `usage_stats_temporary_records`

**API Endpoints:**

```bash
# Get editorial statistics
GET /api/v1/stats/editorial
Parameters:
  - dateStart: YYYY-MM-DD
  - dateEnd: YYYY-MM-DD
  - contextIds: array of journal IDs

# Get publication statistics
GET /api/v1/stats/publications
Parameters:
  - dateStart: YYYY-MM-DD
  - dateEnd: YYYY-MM-DD
  - contextIds: array of journal IDs
  - searchPhrase: search filter
  - count: results per page
  - offset: pagination

# Get usage statistics (views/downloads)
GET /api/v1/stats/usage
Parameters:
  - dateStart: YYYY-MM-DD
  - dateEnd: YYYY-MM-DD
  - timelineInterval: day/month
  - assocTypes: array (ASSOC_TYPE_SUBMISSION, ASSOC_TYPE_SUBMISSION_FILE)
```

---

### 15. SUBSCRIPTIONS

**Database Tables:**
- `subscriptions`
- `subscription_types`

**API Endpoints:**

```bash
# Get all subscriptions
GET /api/v1/subscriptions
Parameters:
  - count: results per page
  - offset: pagination
  - searchPhrase: search in user name, email
  - status: 1=active, 2=expired, etc.

# Get single subscription
GET /api/v1/subscriptions/{subscriptionId}

# Create subscription
POST /api/v1/subscriptions

# Update subscription
PUT /api/v1/subscriptions/{subscriptionId}

# Delete subscription
DELETE /api/v1/subscriptions/{subscriptionId}
```

---

### 16. EMAIL TEMPLATES

**Database Tables:**
- `email_templates`
- `email_templates_settings`

**API Endpoints:**

```bash
# Get all email templates
GET /api/v1/emailTemplates
Parameters:
  - count: results per page
  - offset: pagination
  - searchPhrase: search in subject, body

# Get single template
GET /api/v1/emailTemplates/{key}

# Update template
PUT /api/v1/emailTemplates/{key}

# Reset template to default
POST /api/v1/emailTemplates/{key}/restoreDefault
```

---

### 17. NAVIGATION MENUS

**Database Tables:**
- `navigation_menus`
- `navigation_menu_items`

**API Endpoints:**

```bash
# Get all navigation menus
GET /api/v1/navigationMenus
Parameters:
  - count: results per page
  - offset: pagination

# Get single menu
GET /api/v1/navigationMenus/{menuId}

# Update menu
PUT /api/v1/navigationMenus/{menuId}
```

---

## Common Query Parameters

Most list endpoints support:
- `count`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset
- `searchPhrase`: Full-text search
- `isEnabled`: Filter by enabled status
- `isPublished`: Filter by published status
- `orderBy`: Sort field
- `orderDirection`: ASC or DESC

---

## Response Format

All API responses follow this structure:

```json
{
  "itemsMax": 100,
  "items": [...],
  "_links": {
    "self": "...",
    "next": "...",
    "prev": "..."
  }
}
```

---

## Error Handling

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing API token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

Error Response:
```json
{
  "error": "Error message",
  "errorMessage": "Detailed description"
}
```

---

## Localization

OJS is multilingual. Many fields accept/return objects with locale keys:

```json
{
  "title": {
    "en_US": "English Title",
    "fr_CA": "Titre français"
  }
}
```

Common locales: en_US, fr_CA, es_ES, de_DE, pt_BR, etc.

---

## Pagination Strategy

For large datasets:

```python
def fetch_all_items(endpoint, params={}):
    all_items = []
    offset = 0
    count = 100  # max per request
    
    while True:
        params['offset'] = offset
        params['count'] = count
        
        response = requests.get(endpoint, params=params, headers=auth_headers)
        data = response.json()
        
        items = data.get('items', [])
        all_items.extend(items)
        
        if len(items) < count:
            break  # last page
            
        offset += count
    
    return all_items
```

---

## Migration Tips

1. **Start with Read Operations**: Test GET endpoints before POST/PUT
2. **Use Pagination**: Always paginate large result sets
3. **Handle Locale Data**: Check which fields are multilingual
4. **Cache API Responses**: Reduce API calls where possible
5. **Error Handling**: Implement retry logic for transient errors
6. **Rate Limiting**: Be mindful of server load
7. **Test Permissions**: Different user roles have different access
8. **Validate Before Write**: Check data format matches API expectations

---

## Common Database-to-API Mapping Examples

### Get All Published Articles

**Old Database Query:**
```sql
SELECT s.*, ps.* 
FROM submissions s
JOIN publications p ON s.submission_id = p.submission_id
JOIN publication_settings ps ON p.publication_id = ps.publication_id
WHERE p.status = 3 AND p.date_published IS NOT NULL
```

**New API Call:**
```bash
GET /api/v1/submissions?status=3&isPublished=true
```

---

### Get Article with Authors

**Old Database Query:**
```sql
SELECT p.*, a.*, ps.setting_value as title
FROM publications p
JOIN authors a ON p.publication_id = a.publication_id
JOIN publication_settings ps ON p.publication_id = ps.publication_id
WHERE p.publication_id = 123 AND ps.setting_name = 'title'
```

**New API Call:**
```bash
GET /api/v1/submissions/{submissionId}/publications/{publicationId}
# Response includes authors array automatically
```

---

### Get Articles by Issue

**Old Database Query:**
```sql
SELECT p.*, ps.setting_value as title
FROM publications p
JOIN publication_settings ps ON p.publication_id = ps.publication_id
WHERE p.issue_id = 456 AND ps.setting_name = 'title'
```

**New API Call:**
```bash
GET /api/v1/submissions?issueIds[]=456&status=3
```

---

### Get User Information

**Old Database Query:**
```sql
SELECT u.*, us.setting_value as given_name
FROM users u
JOIN user_settings us ON u.user_id = us.user_id
WHERE u.user_id = 789 AND us.setting_name = 'givenName'
```

**New API Call:**
```bash
GET /api/v1/users/789
```

---

## Additional Resources

- **Official API Documentation**: https://docs.pkp.sfu.ca/dev/api/ojs/3.4
- **PKP Forum**: https://forum.pkp.sfu.ca/
- **Developer Documentation**: https://docs.pkp.sfu.ca/dev/
- **GitHub Repository**: https://github.com/pkp/ojs

---

## Notes

1. **API versions**: This guide covers OJS 3.4 API (v1). Future versions may have breaking changes.

2. **Permissions**: API access depends on user roles and permissions. Site admins have full access.

3. **Performance**: API calls are typically slower than direct database access but provide better stability and security.

4. **Backwards Compatibility**: Direct database access may break with OJS updates. API provides stable interface.

5. **Testing**: Always test API calls in a development environment before production use.

6. **Authentication**: Store API tokens securely. Never commit them to version control.

---

*Last Updated: February 2026*
*OJS Version: 3.4*