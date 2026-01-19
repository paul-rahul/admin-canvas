import type { FeedbackItem } from '@/data/mockFeedback';

export type TimePreset = '24h' | '7d' | '30d' | 'custom' | 'all';

export type TableFilters = {
  sources: string[];
  sentiments: string[];
  urgencies: string[];
  urgencyHighPlus: boolean;
  issueTypes: string[];
  priorityBands: string[];
  owners: string[];
  segments: string[];
  statuses: string[];
  tags: string[];
  timePreset: TimePreset;
  startDate: string | null;
  endDate: string | null;
  search: string;
};

export const DEFAULT_STATUSES = ['unresolved', 'in_progress'];

export const DEFAULT_FILTERS: TableFilters = {
  sources: [],
  sentiments: [],
  urgencies: [],
  urgencyHighPlus: false,
  issueTypes: [],
  priorityBands: [],
  owners: [],
  segments: [],
  statuses: DEFAULT_STATUSES,
  tags: [],
  timePreset: '7d',
  startDate: null,
  endDate: null,
  search: '',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const normalizeStatus = (item: FeedbackItem) => {
  const raw = (item as { status?: string }).status;
  if (raw) return raw.toLowerCase().replace(/\s+/g, '_');
  return item.resolved ? 'resolved' : 'unresolved';
};

export const getOwnerForIssueType = (issueType?: string) => {
  if (issueType === 'performance' || issueType === 'bug') return 'engineering';
  if (issueType === 'ux' || issueType === 'feature' || issueType === 'documentation') {
    return 'product';
  }
  if (issueType === 'pricing') return 'support';
  return 'unassigned';
};

export const normalizeOwner = (item: FeedbackItem) => {
  const raw = (item as { owner?: string }).owner;
  if (raw) return raw.toLowerCase().replace(/\s+/g, '_');
  return getOwnerForIssueType(item.issueType);
};

const parseListParam = (value: string | null) =>
  value
    ? value
        .split(',')
        .map((entry) => {
          let normalized = entry.trim().toLowerCase().replace(/\s+/g, '_');
          if (normalized === 'inprogress') normalized = 'in_progress';
          if (normalized === "won'tfix" || normalized === 'wontfix') normalized = 'ignored';
          return normalized;
        })
        .filter(Boolean)
    : [];

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const parseStartValue = (value: string) =>
  value.includes('T') ? new Date(value).getTime() : new Date(`${value}T00:00:00`).getTime();

const parseEndValue = (value: string) =>
  value.includes('T') ? new Date(value).getTime() : new Date(`${value}T23:59:59.999`).getTime();

const inferPresetFromRange = (start: string, end: string, now: Date) => {
  const startMs = parseStartValue(start);
  const endMs = parseEndValue(end);
  const windowMs = endMs - startMs;
  const endDelta = Math.abs(endMs - now.getTime());
  const nearNow = endDelta <= 2 * 60 * 60 * 1000;
  if (!nearNow) return 'custom' as TimePreset;
  if (windowMs <= DAY_MS) return '24h' as TimePreset;
  if (windowMs <= 7 * DAY_MS + DAY_MS) return '7d' as TimePreset;
  if (windowMs <= 30 * DAY_MS + DAY_MS) return '30d' as TimePreset;
  return 'custom' as TimePreset;
};

export const parseFiltersFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  const sources = parseListParam(params.get('sources'));
  const sentiments = parseListParam(params.get('sentiment'));
  const urgencies = parseListParam(params.get('urgency'));
  const issueTypes = parseListParam(params.get('issueTypes'));
  const priorityBands = parseListParam(params.get('priority'));
  const owners = parseListParam(params.get('owners'));
  const segments = parseListParam(params.get('segments'));
  const statuses = parseListParam(params.get('status'));
  const tags = parseListParam(params.get('tags'));
  const startDate = params.get('start');
  const endDate = params.get('end');
  const searchText = params.get('q') ?? '';
  const next: TableFilters = {
    ...DEFAULT_FILTERS,
    sources,
    sentiments,
    urgencies,
    issueTypes,
    priorityBands,
    owners,
    segments,
    statuses: statuses.length ? statuses : DEFAULT_STATUSES,
    tags,
    startDate: startDate || null,
    endDate: endDate || null,
    search: searchText,
    timePreset: DEFAULT_FILTERS.timePreset,
    urgencyHighPlus:
      urgencies.length === 2 &&
      urgencies.includes('critical') &&
      urgencies.includes('high'),
  };
  if (startDate || endDate) {
    next.timePreset =
      startDate && endDate ? inferPresetFromRange(startDate, endDate, new Date()) : 'custom';
  }
  return next;
};

export const serializeFiltersToSearch = (filters: TableFilters, now = new Date()) => {
  const params = new URLSearchParams();
  const sortedStatuses = [...filters.statuses].sort();
  const defaultStatuses = [...DEFAULT_STATUSES].sort();
  const pushList = (key: string, values: string[]) => {
    if (values.length) params.set(key, values.join(','));
  };
  pushList('sources', filters.sources);
  pushList('sentiment', filters.sentiments);
  if (filters.urgencyHighPlus && filters.urgencies.length === 0) {
    params.set('urgency', 'critical,high');
  } else {
    pushList('urgency', filters.urgencies);
  }
  pushList('issueTypes', filters.issueTypes);
  pushList('priority', filters.priorityBands);
  pushList('owners', filters.owners);
  pushList('segments', filters.segments);
  if (filters.statuses.length && sortedStatuses.join(',') !== defaultStatuses.join(',')) {
    params.set('status', filters.statuses.join(','));
  }
  pushList('tags', filters.tags);
  const hasCustomDates = Boolean(filters.startDate || filters.endDate);
  if (filters.timePreset !== 'custom' && filters.timePreset !== 'all' && !hasCustomDates && filters.timePreset !== '7d') {
    const end = now;
    const start =
      filters.timePreset === '24h'
        ? new Date(end.getTime() - DAY_MS)
        : filters.timePreset === '30d'
        ? new Date(end.getTime() - 30 * DAY_MS)
        : new Date(end.getTime() - 7 * DAY_MS);
    params.set('start', toDateString(start));
    params.set('end', toDateString(end));
  } else if (filters.startDate || filters.endDate) {
    if (filters.startDate) params.set('start', filters.startDate);
    if (filters.endDate) params.set('end', filters.endDate);
  }
  if (filters.search.trim()) {
    params.set('q', filters.search.trim());
  }
  return params.toString();
};

const tokenizeSearch = (input: string) => {
  const tokens = input
    .trim()
    .split(/\s+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
  const include: string[] = [];
  const exclude: string[] = [];
  tokens.forEach((token) => {
    if (token.startsWith('-') && token.length > 1) {
      exclude.push(token.slice(1));
    } else {
      include.push(token);
    }
  });
  return { include, exclude };
};

const resolveTimeWindow = (filters: TableFilters, nowMs: number) => {
  if (filters.timePreset === 'all') {
    return { startMs: null, endMs: null };
  }
  if (filters.timePreset === 'custom') {
    const startMs = filters.startDate ? parseStartValue(filters.startDate) : null;
    const endMs = filters.endDate ? parseEndValue(filters.endDate) : null;
    return { startMs, endMs };
  }
  if (filters.timePreset === '24h') {
    return { startMs: nowMs - DAY_MS, endMs: nowMs };
  }
  if (filters.timePreset === '7d') {
    return { startMs: nowMs - 7 * DAY_MS, endMs: nowMs };
  }
  if (filters.timePreset === '30d') {
    return { startMs: nowMs - 30 * DAY_MS, endMs: nowMs };
  }
  return { startMs: null, endMs: null };
};

export const applyFilters = (entries: FeedbackItem[], filters: TableFilters, nowMs = Date.now()) => {
  const searchText = filters.search.trim().toLowerCase();
  const { include, exclude } = tokenizeSearch(searchText);
  const effectiveUrgencies = filters.urgencyHighPlus
    ? ['critical', 'high']
    : filters.urgencies;
  const { startMs, endMs } = resolveTimeWindow(filters, nowMs);
  const filtered = entries.filter((item) => {
    if (filters.sources.length && !filters.sources.includes(item.source)) return false;
    if (filters.sentiments.length && !filters.sentiments.includes(item.sentiment)) return false;
    if (effectiveUrgencies.length && !effectiveUrgencies.includes(item.urgency)) return false;
    if (filters.issueTypes.length && !filters.issueTypes.includes(item.issueType)) return false;
    if (filters.priorityBands.length) {
      const score = item.priorityScore ?? 0;
      const band =
        score >= 80 ? 'p0' : score >= 60 ? 'p1' : score >= 40 ? 'p2' : 'p3';
      if (!filters.priorityBands.includes(band)) return false;
    }
    const owner = normalizeOwner(item);
    if (filters.owners.length && !filters.owners.includes(owner)) return false;
    const segment = (item.customerSegment ?? 'unknown').toLowerCase();
    if (filters.segments.length && !filters.segments.includes(segment)) return false;
    const statusValue = normalizeStatus(item);
    if (filters.statuses.length && !filters.statuses.includes(statusValue)) return false;
    if (filters.tags.length) {
      const tags = (item.tags ?? []).map((tag) => tag.toLowerCase());
      if (!filters.tags.some((tag) => tags.includes(tag))) return false;
    }
    if (startMs !== null || endMs !== null) {
      const createdAt = item.createdAt;
      const timestamp = createdAt ? new Date(createdAt).getTime() : item.timestamp?.getTime?.() ?? null;
      if (timestamp === null) return false;
      if (startMs !== null && timestamp < startMs) return false;
      if (endMs !== null && timestamp > endMs) return false;
    }
    return true;
  });
  if (!include.length && !exclude.length) return filtered;
  return filtered.filter((item) => {
    const description = (item.description ?? item.title ?? '').toLowerCase();
    for (const token of include) {
      if (!description.includes(token)) return false;
    }
    for (const token of exclude) {
      if (description.includes(token)) return false;
    }
    return true;
  });
};

export const formatFilterLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
