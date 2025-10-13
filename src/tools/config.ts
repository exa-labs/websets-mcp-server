export const API_CONFIG = {
  BASE_URL: 'https://api.exa.ai',
  ENDPOINTS: {
    WEBSETS: '/v0/websets',
    WEBSET_BY_ID: (id: string) => `/v0/websets/${id}`,
    WEBSET_CANCEL: (id: string) => `/v0/websets/${id}/cancel`,
    WEBSET_PREVIEW: '/v0/websets/preview',
    WEBSET_ITEMS: (websetId: string) => `/v0/websets/${websetId}/items`,
    WEBSET_ITEM_BY_ID: (websetId: string, itemId: string) => `/v0/websets/${websetId}/items/${itemId}`,
    WEBSET_SEARCHES: (websetId: string) => `/v0/websets/${websetId}/searches`,
    WEBSET_SEARCH_BY_ID: (websetId: string, searchId: string) => `/v0/websets/${websetId}/searches/${searchId}`,
    WEBSET_ENRICHMENTS: (websetId: string) => `/v0/websets/${websetId}/enrichments`,
    WEBSET_ENRICHMENT_BY_ID: (websetId: string, enrichmentId: string) => `/v0/websets/${websetId}/enrichments/${enrichmentId}`,
    WEBSET_MONITORS: (websetId: string) => `/v0/websets/${websetId}/monitors`,
    WEBSET_MONITOR_BY_ID: (websetId: string, monitorId: string) => `/v0/websets/${websetId}/monitors/${monitorId}`,
    WEBHOOKS: '/v0/webhooks',
    WEBHOOK_BY_ID: (id: string) => `/v0/webhooks/${id}`
  },
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100
} as const;
