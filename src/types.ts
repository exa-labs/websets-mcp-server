
// === Response Types (matching current API schemas) ===

export type EntityType = 'company' | 'person' | 'article' | 'research_paper' | 'custom';

export interface Entity {
  type: EntityType;
  description?: string; // required when type is 'custom'
}

export interface ExcludeSource {
  source: 'import' | 'webset';
  id: string;
}

export interface Webset {
  id: string;
  object: 'webset';
  status: 'idle' | 'pending' | 'running' | 'paused';
  externalId: string | null;
  title: string | null;
  searches: WebsetSearch[];
  imports: Import[];
  enrichments: WebsetEnrichment[];
  monitors: WebsetMonitor[];
  excludes?: ExcludeSource[];
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetItem {
  id: string;
  object: 'webset_item';
  websetId: string;
  source: 'search' | 'import';
  sourceId: string;
  properties: Record<string, unknown>;
  enrichments: Array<{
    id: string;
    enrichmentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    value: unknown;
    failedReason?: string | null;
  }> | null;
  evaluations?: Array<{
    criterionDescription: string;
    passed: boolean;
    confidence: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetSearch {
  id: string;
  object: 'webset_search';
  websetId: string;
  status: 'created' | 'pending' | 'running' | 'completed' | 'canceled';
  query: string;
  entity: Entity | null;
  criteria: Array<{ description: string; successRate: number }>;
  count: number;
  behavior: 'override' | 'append';
  exclude: ExcludeSource[];
  scope?: {
    source: 'import' | 'webset';
    id: string;
    relationship?: string;
  };
  progress?: {
    found: number;
    completion: number;
  };
  recall?: boolean;
  metadata: Record<string, string>;
  canceledAt?: string | null;
  canceledReason?: string | null;
  createdAt: string;
}

export interface WebsetEnrichment {
  id: string;
  object: 'webset_enrichment';
  websetId: string;
  title: string | null;
  description: string;
  format: 'text' | 'date' | 'number' | 'options' | 'email' | 'phone' | 'url';
  options?: Array<{ label: string }>;
  instructions?: string;
  status: 'pending' | 'canceled' | 'completed';
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsetMonitor {
  id: string;
  object: 'monitor';
  websetId: string;
  status: 'enabled' | 'disabled';
  cadence: {
    cron: string;
    timezone: string;
  };
  behavior: {
    type: 'search';
    config?: {
      query?: string;
      criteria?: Array<{ description: string }>;
      entity?: Entity;
      count?: number;
      behavior?: 'append' | 'override';
    };
  };
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  object: 'webhook';
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret?: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Import {
  id: string;
  object: 'import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'csv' | 'webset';
  entity: Entity | null;
  title: string;
  count: number;
  metadata: Record<string, string>;
  failedReason?: string | null;
  failedAt?: string | null;
  failedMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadUrl: string;
  uploadValidUntil: string;
}

export interface WebsetEvent {
  id: string;
  object: 'event';
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// === Request Parameter Types ===

export interface CreateWebsetParams {
  externalId?: string;
  search?: {
    query: string;
    count?: number;
    entity?: Entity;
    criteria?: Array<{ description: string }>;
    behavior?: 'override' | 'append';
    exclude?: ExcludeSource[];
    scope?: {
      source: 'import' | 'webset';
      id: string;
      relationship?: string;
    };
    recall?: boolean;
  };
  enrichments?: Array<{
    description: string;
    format?: 'text' | 'date' | 'number' | 'options' | 'email' | 'phone' | 'url';
    options?: Array<{ label: string }>;
  }>;
  metadata?: Record<string, string>;
  excludes?: ExcludeSource[];
}

export interface UpdateWebsetParams {
  title?: string;
  metadata?: Record<string, string> | null;
}

export interface CreateSearchParams {
  query: string;
  count?: number;
  entity?: Entity;
  criteria?: Array<{ description: string }>;
  behavior?: 'override' | 'append';
  exclude?: ExcludeSource[];
  scope?: {
    source: 'import' | 'webset';
    id: string;
    relationship?: string;
  };
  recall?: boolean;
  metadata?: Record<string, string>;
}

export interface CreateEnrichmentParams {
  description: string;
  format?: 'text' | 'date' | 'number' | 'options' | 'email' | 'phone' | 'url';
  options?: Array<{ label: string }>;
  metadata?: Record<string, string>;
}

export interface CreateMonitorParams {
  websetId: string;
  cadence: {
    cron: string;
    timezone?: string;
  };
  behavior: {
    type: 'search';
    config?: {
      query?: string;
      criteria?: Array<{ description: string }>;
      entity?: Entity;
      count?: number;
      behavior?: 'append' | 'override';
    };
  };
  metadata?: Record<string, string>;
}

export interface UpdateMonitorParams {
  cadence?: {
    cron: string;
    timezone?: string;
  };
  behavior?: {
    type: 'search';
    config?: {
      query?: string;
      criteria?: Array<{ description: string }>;
      entity?: Entity;
      count?: number;
      behavior?: 'append' | 'override';
    };
  };
  status?: 'enabled' | 'disabled';
  metadata?: Record<string, string>;
}

export interface CreateWebhookParams {
  url: string;
  events: string[];
  secret?: string;
  metadata?: Record<string, string>;
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  status?: 'active' | 'inactive';
  secret?: string;
  metadata?: Record<string, string>;
}

export interface CreateImportParams {
  format: 'csv';
  size: number;
  count: number;
  entity: Entity;
  title?: string;
  metadata?: Record<string, string>;
  csv?: {
    identifier?: number;
  };
}

export interface PreviewWebsetParams {
  query: string;
}

export interface PreviewWebsetResponse {
  entity?: Entity;
  search: {
    query: string;
    criteria?: Array<{ description: string }>;
  };
  enrichments: Array<{
    description: string;
    format?: string;
  }>;
}

// === List Response Types ===

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type ListWebsetsResponse = PaginatedResponse<Webset>;
export type ListItemsResponse = PaginatedResponse<WebsetItem>;
export type ListSearchesResponse = PaginatedResponse<WebsetSearch>;
export type ListEnrichmentsResponse = PaginatedResponse<WebsetEnrichment>;
export type ListMonitorsResponse = PaginatedResponse<WebsetMonitor>;
export type ListWebhooksResponse = PaginatedResponse<Webhook>;
export type ListImportsResponse = PaginatedResponse<Import>;
export type ListEventsResponse = PaginatedResponse<WebsetEvent>;
