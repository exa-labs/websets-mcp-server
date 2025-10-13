
export interface Webset {
  id: string;
  externalId?: string;
  name?: string;
  description?: string;
  status: 'idle' | 'searching' | 'enriching' | 'monitoring' | 'canceled';
  itemsCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WebsetItem {
  id: string;
  websetId: string;
  url: string;
  status: 'pending' | 'verified' | 'failed' | 'enriching' | 'completed';
  properties: {
    name?: string;
    [key: string]: any;
  };
  enrichments?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface WebsetSearch {
  id: string;
  websetId: string;
  status: 'running' | 'completed' | 'failed' | 'canceled';
  query?: string;
  criteria?: string[];
  itemsFound: number;
  createdAt: number;
  completedAt?: number;
}

export interface WebsetEnrichment {
  id: string;
  websetId: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsTotal: number;
  createdAt: number;
  updatedAt: number;
}

export interface WebsetMonitor {
  id: string;
  websetId: string;
  name?: string;
  schedule: string;
  behavior: 'search' | 'refresh';
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateWebsetParams {
  name?: string;
  description?: string;
  externalId?: string;
  search?: {
    query: string;
    count?: number;
    criteria?: string[];
  };
  enrichments?: Array<{
    name: string;
    description: string;
  }>;
  monitors?: Array<{
    schedule: string;
    behavior: 'search' | 'refresh';
  }>;
}

export interface UpdateWebsetParams {
  name?: string;
  description?: string;
}

export interface ListWebsetsResponse {
  data: Webset[];
  cursor?: string;
}

export interface ListItemsResponse {
  data: WebsetItem[];
  cursor?: string;
}

export interface ListSearchesResponse {
  data: WebsetSearch[];
  cursor?: string;
}

export interface ListEnrichmentsResponse {
  data: WebsetEnrichment[];
  cursor?: string;
}

export interface ListMonitorsResponse {
  data: WebsetMonitor[];
  cursor?: string;
}

export interface ListWebhooksResponse {
  data: Webhook[];
  cursor?: string;
}

export interface PreviewWebsetParams {
  query: string;
}

export interface PreviewWebsetResponse {
  entityType?: string;
  search: {
    query: string;
    criteria?: string[];
  };
  enrichments: Array<{
    name: string;
    description: string;
  }>;
}

export interface CreateSearchParams {
  query?: string;
  count?: number;
  criteria?: string[];
}

export interface CreateEnrichmentParams {
  name: string;
  description: string;
}

export interface CreateMonitorParams {
  name?: string;
  schedule: string;
  behavior: 'search' | 'refresh';
  enabled?: boolean;
}

export interface UpdateMonitorParams {
  name?: string;
  schedule?: string;
  behavior?: 'search' | 'refresh';
  enabled?: boolean;
}

export interface CreateWebhookParams {
  url: string;
  events: string[];
  enabled?: boolean;
  secret?: string;
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  enabled?: boolean;
  secret?: string;
}
