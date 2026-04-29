# Websets MCP Tool Schemas Reference

This document provides the exact schemas for all MCP tools. Use these examples to ensure you're calling the tools with the correct parameter formats.

## Object Parameter Formats

**IMPORTANT**: The following parameters must be passed as **objects**, not strings:

### Criteria Format
```json
{
  "criteria": [
    {"description": "criterion 1"},
    {"description": "criterion 2"}
  ]
}
```

### Entity Format
```json
{
  "entity": {
    "type": "company"  // or "person", "article", "research_paper", "custom"
  }
}
```

### Enrichment Options Format
```json
{
  "options": [
    {"label": "option 1"},
    {"label": "option 2"}
  ]
}
```

---

## Tool: create_webset

Create a new Webset collection with optional search and enrichments.

### Example Call
```json
{
  "name": "AI Startups in SF",
  "description": "Collection of artificial intelligence startups based in San Francisco",
  "externalId": "my-ai-startups-2024",
  "searchQuery": "AI startups in San Francisco",
  "searchCount": 20,
  "searchCriteria": [
    {"description": "Founded after 2020"},
    {"description": "Has more than 10 employees"}
  ],
  "enrichments": [
    {
      "description": "CEO name",
      "format": "text"
    },
    {
      "description": "Company size category",
      "format": "options",
      "options": [
        {"label": "Small (1-50)"},
        {"label": "Medium (51-200)"},
        {"label": "Large (201+)"}
      ]
    },
    {
      "description": "Annual revenue in USD",
      "format": "number"
    }
  ]
}
```

---

## Tool: create_search

Create a new search to find and add items to an existing webset.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "query": "Y Combinator alumni in fintech",
  "count": 15,
  "entity": {
    "type": "company"
  },
  "criteria": [
    {"description": "Participated in Y Combinator"},
    {"description": "Operating in financial technology sector"},
    {"description": "Currently active"}
  ],
  "behavior": "append",
  "recall": true,
  "metadata": {
    "source": "yc_fintech_2024",
    "batch": "q1"
  }
}
```

### Valid Entity Types
- `"company"`
- `"person"`
- `"article"`
- `"research_paper"`
- `"custom"`

### Valid Behaviors
- `"override"` - Replaces existing items (default)
- `"append"` - Adds to existing items

---

## Tool: create_enrichment

Create an enrichment to extract custom data from webset items.

### Example Call (Text Format)
```json
{
  "websetId": "webset_abc123",
  "description": "Primary contact email address",
  "format": "email",
  "metadata": {
    "purpose": "outreach",
    "verified": "false"
  }
}
```

### Example Call (Options Format)
```json
{
  "websetId": "webset_abc123",
  "description": "Company stage",
  "format": "options",
  "options": [
    {"label": "Pre-seed"},
    {"label": "Seed"},
    {"label": "Series A"},
    {"label": "Series B"},
    {"label": "Series C+"},
    {"label": "Public"}
  ]
}
```

### Valid Formats
- `"text"` - Free-form text
- `"date"` - Date values
- `"number"` - Numeric values
- `"options"` - Choose from predefined options (requires `options` parameter)
- `"email"` - Email addresses
- `"phone"` - Phone numbers
- `"url"` - URLs

---

## Tool: preview_webset

Preview how a search query will be interpreted before creating a webset. Returns the detected entity type, generated search criteria, and suggested enrichment columns.

### Example Call
```json
{
  "query": "AI startups in San Francisco"
}
```

---

## Tool: create_webhook

Subscribe to real-time HTTP callbacks for webset events. The `secret` is server-generated and is only returned in the create response — store it securely.

### Example Call
```json
{
  "url": "https://example.com/webhook",
  "events": [
    "webset.search.completed",
    "webset.enrichment.completed",
    "webset.idle"
  ],
  "metadata": {
    "environment": "production"
  }
}
```

---

## Tool: create_import

Upload your own CSV data into Websets. Returns an `uploadUrl` (presigned S3 URL) where you `PUT` your CSV. Imports can be used as scopes for searches or as exclude sources.

### Example Call
```json
{
  "format": "csv",
  "size": 12345,
  "count": 100,
  "entity": {
    "type": "company"
  },
  "title": "Q1 customer list"
}
```

---

## Tool: list_websets

List all websets with pagination.

### Example Call
```json
{
  "limit": 50,
  "cursor": "cursor_xyz789"
}
```

### Default Values
- `limit`: 25 (max: 100)
- `cursor`: null (for first page)

---

## Tool: get_webset

Get details about a specific webset.

### Example Call
```json
{
  "id": "webset_abc123",
  "expandItems": true
}
```

You can use either the webset ID or your externalId:
```json
{
  "id": "my-ai-startups-2024",
  "expandItems": false
}
```

---

## Tool: update_webset

Update a webset's metadata.

### Example Call
```json
{
  "id": "webset_abc123",
  "metadata": {
    "last_reviewed": "2024-10-16",
    "owner": "sales_team",
    "status": "active"
  }
}
```

---

## Tool: list_items

List all items in a webset.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "limit": 100,
  "cursor": "cursor_xyz789"
}
```

---

## Tool: get_item

Get a specific item from a webset.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "itemId": "item_def456"
}
```

---

## Tool: get_search

Get details about a search operation.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "searchId": "search_ghi789"
}
```

---

## Tool: cancel_search

Cancel a running search operation.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "searchId": "search_ghi789"
}
```

---

## Tool: get_enrichment

Get details about an enrichment.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "enrichmentId": "enrichment_jkl012"
}
```

---

## Tool: cancel_enrichment

Cancel a running enrichment operation.

### Example Call
```json
{
  "websetId": "webset_abc123",
  "enrichmentId": "enrichment_jkl012"
}
```

---

## Tool: delete_webset

Delete a webset permanently.

### Example Call
```json
{
  "id": "webset_abc123"
}
```

---

## Common Mistakes to Avoid

### ❌ Wrong: Passing strings for criteria
```json
{
  "criteria": ["criterion 1", "criterion 2"]
}
```

### ✅ Correct: Passing objects for criteria
```json
{
  "criteria": [
    {"description": "criterion 1"},
    {"description": "criterion 2"}
  ]
}
```

---

### ❌ Wrong: Passing string for entity
```json
{
  "entity": "company"
}
```

### ✅ Correct: Passing object for entity
```json
{
  "entity": {
    "type": "company"
  }
}
```

---

### ❌ Wrong: Passing strings for options
```json
{
  "options": ["option1", "option2"]
}
```

### ✅ Correct: Passing objects for options
```json
{
  "options": [
    {"label": "option1"},
    {"label": "option2"}
  ]
}
```

---

## Schema Consistency

All tools follow these consistent patterns:

1. **Criteria**: Always `[{description: string}]`
2. **Entity**: Always `{type: string}`
3. **Options**: Always `[{label: string}]`
4. **Metadata**: Always `Record<string, string>` (object with string keys and values)

This consistency ensures predictable usage across all Websets MCP tools.

