export type Entry = {
  id?: string;
  theme_id?: string;
  source?: string;
  timestamp?: string | Date;
  sentiment?: string;
  urgency?: string;
  issueType?: string;
  title?: string;
  content?: string;
  author?: string;
};

export type Theme = {
  theme_id?: string;
  name?: string;
  num_mentions?: number;
  sentiment?: string;
  urgency?: string;
  trend?: string;
};

export type Trends = {
  trending_up?: unknown[];
  trending_down?: unknown[];
};

export type EntriesParams = {
  from?: string;
  to?: string;
  source?: string;
  sentiment?: string;
  urgency?: string;
  product_area?: string;
  theme_id?: string;
  page_size?: string;
  search?: string;
};

export type EntriesResponse = {
  items: Entry[];
  total?: number;
};

const buildQuery = (params?: EntriesParams) => {
  const searchParams = new URLSearchParams();
  if (!params) return '';
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

export const apiClient = {
  async getEntries(params?: EntriesParams): Promise<EntriesResponse> {
    const query = buildQuery(params);
    const data = await fetchJson<unknown>(`/api/feedback${query}`);
    const items = Array.isArray(data) ? data : (data as { items?: Entry[] }).items ?? [];
    const total =
      typeof (data as { total?: number }).total === 'number'
        ? (data as { total?: number }).total
        : items.length;
    return { items, total };
  },

  async getThemes(params?: EntriesParams): Promise<Theme[] | null> {
    const query = buildQuery(params);
    const response = await fetch(`/api/themes${query}`);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Theme[];
  },

  async getTrends(): Promise<Trends | null> {
    const response = await fetch('/api/trends');
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Trends;
  },
};
