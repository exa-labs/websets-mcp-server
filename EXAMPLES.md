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
  - name: "AI Startups"
  - searchQuery: "artificial intelligence companies founded in the last 3 years"
  - searchCount: 15

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

1. Create a webset called "Marketing Agencies" searching for 
   "digital marketing agencies in the US with 50-200 employees"
   
2. Add these enrichments:
   - "Revenue": "Annual revenue in USD"
   - "Clients": "Notable client brands they've worked with"
   - "Services": "Primary marketing services offered"
   - "Location": "City and state of headquarters"
   
3. Set up a weekly monitor that searches for new agencies every Monday at 9am
```

**What happens:**
- Step 1: Claude calls `create_webset`
- Step 2: Claude calls `create_enrichment` multiple times
- Step 3: Claude calls `create_monitor` with schedule "0 9 * * 1"

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
I'm building an investor pipeline. Create a webset called "Climate Tech Startups" 
that searches for "climate technology startups that raised funding in 2024".

Get 30 companies and enrich with:
- "Funding Amount": "Total funding raised"
- "Stage": "Latest funding stage (seed, series A, etc)"
- "Investors": "Lead investors in latest round"
- "Technology": "Climate tech category (solar, carbon capture, etc)"

Then set up a daily monitor to check for new companies.
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

## Monitor Schedules

### Common Cron Patterns

**Daily Updates:**
```
Create a monitor for my webset that refreshes items daily at midnight
```
- Schedule: `0 0 * * *`

**Weekday Morning Updates:**
```
Create a monitor that searches for new items every weekday at 9am
```
- Schedule: `0 9 * * 1-5`

**Weekly Deep Refresh:**
```
Create a monitor that refreshes all item data every Sunday at 3am
```
- Schedule: `0 3 * * 0`
- Behavior: `refresh`

**Twice Daily:**
```
Create a monitor that searches for new items at 9am and 5pm every day
```
- Schedule: `0 9,17 * * *`

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

### Using Monitors Effectively

**Search behavior:** Use when you want to continuously grow the collection
```
Create a search monitor that runs weekly to find new companies matching the criteria
```

**Refresh behavior:** Use when you want to update existing data
```
Create a refresh monitor that runs daily to update enrichment data for all companies
```

## Real-World Use Cases

### Use Case 1: Venture Capital Deal Flow

**Setup:**
```
Create 3 websets for different investment stages:
1. "Seed Stage Prospects" - early stage companies in our sectors
2. "Series A Targets" - companies ready for growth capital  
3. "Late Stage Monitoring" - companies we passed on but want to track

For each, add enrichments for: funding history, team size, revenue metrics, 
and investor lists. Set up weekly monitors.
```

### Use Case 2: Sales Prospecting

**Setup:**
```
Create "Enterprise Sales Prospects" webset searching for 
"Fortune 1000 companies in financial services".

Enrich with: IT budget, current vendors, decision maker contacts, 
tech stack, and recent news.

Set up daily refresh to keep contact info current.
```

### Use Case 3: Market Research

**Setup:**
```
Create "Competitor Analysis" webset tracking 
"direct competitors in the project management software space".

Enrich with: pricing, feature set, customer count, recent product launches, 
and marketing strategy.

Set up twice-weekly search to catch new entrants.
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
