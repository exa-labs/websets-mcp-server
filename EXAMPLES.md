# Websets MCP Server - Usage Examples

This document provides practical examples of using the Websets MCP server with Claude.

## Basic Webset Operations

### Example 1: Create a Simple Webset

**Prompt to Claude:**
```
Create a webset called "AI Startups" that searches for 15 artificial intelligence companies 
founded in the last 3 years
```

**What happens:**
- Claude calls `create_webset` with:
  - searchQuery: "artificial intelligence companies founded in the last 3 years"
  - searchCount: 15
  - searchEntity: `{type: "company"}`

Note: there is no top-level `name` parameter on `create_webset`. To label a webset, call `update_webset` with `title` after creation, or pass a `metadata` object.

### Example 2: Create a Webset with Enrichments

**Prompt to Claude:**
```
Create a webset of "Series A SaaS Companies" with 20 companies. 
Add enrichments for:
- Annual Recurring Revenue (ARR)
- Number of employees
- Primary customer segment
- Tech stack used
```

**What happens:**
- Claude calls `create_webset` with enrichments array
- The webset will automatically populate and start enriching

### Example 3: View Webset Contents

**Prompt to Claude:**
```
List all my websets, then show me the full details and items from the 
"AI Startups" webset
```

**What happens:**
- Claude calls `list_websets` first
- Then calls `get_webset` with expandItems: true
- Shows you all the companies discovered

## Advanced Workflows

### Example 4: Build a Company Database

**Complete workflow prompt:**
```
I want to build a database of marketing agencies. Please:

1. Create a webset for "digital marketing agencies in the US with 50-200
   employees" and update its title to "Marketing Agencies".

2. Add these enrichments:
   - "Revenue": "Annual revenue in USD"
   - "Clients": "Notable client brands they've worked with"
   - "Services": "Primary marketing services offered"
   - "Location": "City and state of headquarters"

3. Run a follow-up search appending 50 more agencies focused on B2B SaaS
   clients.
```

**What happens:**
- Step 1: Claude calls `create_webset` and then `update_webset` with `title`
- Step 2: Claude calls `create_enrichment` multiple times
- Step 3: Claude calls `create_search` with `behavior: "append"`

### Example 5: Research Tracking

**Prompt to Claude:**
```
Create a webset to track AI research papers. Search for 
"machine learning papers on transformer architecture" and get 25 papers.

Add enrichments for:
- "Authors": "Lead authors of the paper"
- "Citations": "Number of citations"
- "Key Findings": "Main contributions or findings"
- "Year": "Publication year"
```

### Example 6: Investor Pipeline

**Prompt to Claude:**
```
I'm building an investor pipeline. Create a webset for
"climate technology startups that raised funding in 2024".

Get 30 companies and enrich with:
- "Funding Amount": "Total funding raised"
- "Stage": "Latest funding stage (seed, series A, etc)"
- "Investors": "Lead investors in latest round"
- "Technology": "Climate tech category (solar, carbon capture, etc)"

Then create a webhook to notify my server at https://example.com/hook
when new searches complete.
```

## Working with Existing Websets

### Example 7: Update Webset Metadata

**Prompt to Claude:**
```
Update my "AI Startups" webset to have the description 
"Collection of emerging AI companies for potential partnerships"
```

### Example 8: Add Enrichments to Existing Webset

**Prompt to Claude:**
```
For my "Marketing Agencies" webset, add a new enrichment:
- "CEO Name": "Name of the current CEO or founder"
```

### Example 9: List Items with Filtering

**Prompt to Claude:**
```
Show me the first 10 items from my "Climate Tech Startups" webset
```

Then you can ask follow-ups like:
```
Show me the next 10 items
```

Claude will use the pagination cursor automatically.

## Webhooks for Real-Time Updates

The Websets MCP server exposes webhook tools (`create_webhook`, `list_webhooks`,
`get_webhook`, `update_webhook`, `delete_webhook`) for receiving HTTP callbacks
when events occur in your websets.

**Common event types:**
- `webset.search.completed` — search finished finding items
- `webset.enrichment.completed` — enrichment finished extracting data
- `webset.idle` — webset has finished all in-flight work

**Example prompt:**
```
Create a webhook to https://example.com/hook subscribed to
webset.search.completed and webset.enrichment.completed events.
```

> Scheduled monitors are exposed by the underlying Websets API but are not
> currently surfaced as MCP tools in this server. Configure monitors directly
> via the Websets API or the [websets.exa.ai](https://websets.exa.ai/) dashboard.

## Tips for Best Results

### Writing Good Search Queries

**Good:**
- "B2B SaaS companies in San Francisco with Series A funding"
- "Academic researchers working on quantum computing at universities"
- "Health tech startups focused on mental health apps"

**Too Vague:**
- "tech companies" (too broad)
- "good startups" (subjective terms)

### Writing Good Enrichment Descriptions

**Good:**
- "Annual recurring revenue in USD as of latest available data"
- "Number of full-time employees excluding contractors"
- "Primary geographic market (North America, Europe, Asia, etc.)"

**Too Vague:**
- "revenue" (what currency? what time period?)
- "size" (employees? revenue? customers?)

## Real-World Use Cases

### Use Case 1: Venture Capital Deal Flow

**Setup:**
```
Create 3 websets for different investment stages:
1. Seed-stage prospects — early stage companies in our sectors
2. Series A targets — companies ready for growth capital
3. Late-stage tracking — companies we passed on but want to track

For each, set the title via `update_webset`, then add enrichments for: funding
history, team size, revenue metrics, and investor lists.
```

### Use Case 2: Sales Prospecting

**Setup:**
```
Create an "Enterprise Sales Prospects" webset searching for
"Fortune 1000 companies in financial services".

Enrich with: IT budget, current vendors, decision maker contacts,
tech stack, and recent news.
```

### Use Case 3: Market Research

**Setup:**
```
Create a "Competitor Analysis" webset tracking
"direct competitors in the project management software space".

Enrich with: pricing, feature set, customer count, recent product launches,
and marketing strategy.

Re-run searches periodically (with `behavior: "append"`) to catch new entrants.
```

## Troubleshooting Common Issues

### Issue: Not enough items found

**Solution:**
```
List my websets and check the status. If a search is still running, wait.
If completed with few items, the query might be too specific.
Try broadening the search criteria.
```

### Issue: Enrichments taking too long

**Solution:**
Enrichments can take time for large websets. Check progress:
```
Get the details of my webset including all items to see enrichment status
```

### Issue: Want to change search criteria

**Solution:**
You can't change criteria for existing searches, but you can:
```
Create a new search for my webset with updated criteria
```

Or create a new webset with the correct criteria.
