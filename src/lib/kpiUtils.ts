import type { Entry, Theme, Trends } from './apiClient';

export type KpiFilters = {
  from?: string | Date | null;
  to?: string | Date | null;
  source?: string | null;
  sentiment?: string | null;
  urgency?: string | null;
  search?: string | null;
};

const normalize = (value?: string | null) => value?.toLowerCase().trim() ?? '';

export const normalizeUrgency = (value?: string | null) => normalize(value);

export const normalizeSentiment = (value?: string | null) => normalize(value);

export const parseTimestamp = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const applyEntryFilters = (entries: Entry[], filters: KpiFilters) => {
  const source = normalize(filters.source);
  const urgency = normalize(filters.urgency);
  const sentiment = normalize(filters.sentiment);
  const search = normalize(filters.search);
  const from = parseTimestamp(filters.from ?? undefined);
  const to = parseTimestamp(filters.to ?? undefined);

  return entries.filter((entry) => {
    const entrySource = normalize(entry.source);
    const entryUrgency = normalize(entry.urgency);
    const entrySentiment = normalize(entry.sentiment);
    const entryTimestamp = parseTimestamp(
      (entry as { createdAt?: string }).createdAt ?? entry.timestamp
    );
    const entryText = `${entry.title ?? ''} ${entry.content ?? ''} ${entry.author ?? ''}`.toLowerCase();

    if (source && entrySource !== source) return false;
    if (urgency && entryUrgency !== urgency) return false;
    if (sentiment && entrySentiment !== sentiment) return false;
    if (search && !entryText.includes(search)) return false;
    if (from && entryTimestamp && entryTimestamp < from) return false;
    if (to && entryTimestamp && entryTimestamp > to) return false;

    return true;
  });
};

const pickTopLabel = (counts: Record<string, number>) => {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
};

const pickMostCommon = (counts: Record<string, number>) =>
  Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

export const deriveThemesFromEntries = (entries: Entry[]): Theme[] => {
  const themeMap = new Map<
    string,
    { count: number; sentimentCounts: Record<string, number>; urgencyCounts: Record<string, number> }
  >();

  entries.forEach((entry) => {
    const themeId = normalize(entry.issueType) || 'uncategorized';
    const sentiment = normalize(entry.sentiment) || 'neutral';
    const urgency = normalize(entry.urgency) || 'medium';
    const existing = themeMap.get(themeId) ?? {
      count: 0,
      sentimentCounts: {},
      urgencyCounts: {},
    };
    existing.count += 1;
    existing.sentimentCounts[sentiment] = (existing.sentimentCounts[sentiment] ?? 0) + 1;
    existing.urgencyCounts[urgency] = (existing.urgencyCounts[urgency] ?? 0) + 1;
    themeMap.set(themeId, existing);
  });

  return Array.from(themeMap.entries()).map(([themeId, data]) => ({
    theme_id: themeId,
    num_mentions: data.count,
    sentiment: pickMostCommon(data.sentimentCounts),
    urgency: pickMostCommon(data.urgencyCounts),
  }));
};

export const computeNegativePercentage = (entries: Entry[], themes: Theme[] | null) => {
  if (entries.length) {
    const negative = entries.filter((entry) => normalizeSentiment(entry.sentiment) === 'negative').length;
    return entries.length ? (negative / entries.length) * 100 : null;
  }

  if (themes && themes.length) {
    const weightedTotal = themes.reduce((sum, theme) => sum + (theme.num_mentions ?? 1), 0);
    const weightedNegative = themes.reduce((sum, theme) => {
      const weight = theme.num_mentions ?? 1;
      return normalizeSentiment(theme.sentiment) === 'negative' ? sum + weight : sum;
    }, 0);
    return weightedTotal ? (weightedNegative / weightedTotal) * 100 : null;
  }

  return null;
};

export const computeHighCriticalCount = (entries: Entry[], themes: Theme[] | null) => {
  const isHigh = (value?: string | null) => ['high', 'critical'].includes(normalizeUrgency(value));

  if (entries.length) {
    return entries.filter((entry) => isHigh(entry.urgency)).length;
  }

  if (themes && themes.length) {
    return themes.filter((theme) => isHigh(theme.urgency)).length;
  }

  return null;
};

export const computeCriticalPercentage = (entries: Entry[], themes: Theme[] | null) => {
  const isCritical = (value?: string | null) => normalizeUrgency(value) === 'critical';

  if (entries.length) {
    const critical = entries.filter((entry) => isCritical(entry.urgency)).length;
    return entries.length ? (critical / entries.length) * 100 : null;
  }

  if (themes && themes.length) {
    const weightedTotal = themes.reduce((sum, theme) => sum + (theme.num_mentions ?? 1), 0);
    const weightedCritical = themes.reduce((sum, theme) => {
      const weight = theme.num_mentions ?? 1;
      return isCritical(theme.urgency) ? sum + weight : sum;
    }, 0);
    return weightedTotal ? (weightedCritical / weightedTotal) * 100 : null;
  }

  return null;
};

export const computeTopSource = (entries: Entry[]) => {
  const counts: Record<string, number> = {};
  entries.forEach((entry) => {
    const source = normalize(entry.source);
    if (!source) return;
    counts[source] = (counts[source] ?? 0) + 1;
  });
  const top = pickTopLabel(counts);
  return top ? { source: top, count: counts[top] ?? 0 } : null;
};

export const computeTopIssueType = (entries: Entry[]) => {
  const counts: Record<string, number> = {};
  entries.forEach((entry) => {
    const issueType = normalize(entry.issueType);
    if (!issueType) return;
    counts[issueType] = (counts[issueType] ?? 0) + 1;
  });
  const top = pickTopLabel(counts);
  return top ? { issueType: top, count: counts[top] ?? 0 } : null;
};

export const computeEmergingThemes = (themes: Theme[] | null, trends: Trends | null) => {
  if (trends?.trending_up?.length) {
    return trends.trending_up.length;
  }

  if (!themes) {
    return null;
  }

  const hasEmergingFlag = (trend?: string) =>
    ['up', 'upward', 'emerging', 'spike'].some((flag) => normalize(trend).includes(flag));

  return themes.filter((theme) => hasEmergingFlag(theme.trend)).length || null;
};

export const computeEmergingThemesFromEntries = (entries: Entry[]) => {
  if (!entries.length) return null;

  const now = Date.now();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const recentStart = now - windowMs;
  const priorStart = now - windowMs * 2;

  const counts = new Map<string, { recent: number; prior: number }>();

  entries.forEach((entry) => {
  const theme = normalize(entry.issueType) || 'uncategorized';
    const timestamp = parseTimestamp(entry.timestamp);
    if (!timestamp) return;

    const bucket = counts.get(theme) ?? { recent: 0, prior: 0 };
    if (timestamp.getTime() >= recentStart) {
      bucket.recent += 1;
    } else if (timestamp.getTime() >= priorStart) {
      bucket.prior += 1;
    }
    counts.set(theme, bucket);
  });

  let emerging = 0;
  counts.forEach(({ recent, prior }) => {
    if (recent >= 3 && recent >= prior * 1.5) {
      emerging += 1;
    }
  });

  return emerging || null;
};

export const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
};

export const formatLabel = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '—';

export const getTopSourceLabel = (source: string) =>
  source ? `${source.charAt(0).toUpperCase()}${source.slice(1)}` : '—';
