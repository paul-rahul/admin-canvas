import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/dashboard/Header';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NeedsAttentionOverlay, buildNeedsAttentionData } from '@/components/dashboard/NeedsAttentionOverlay';
import { mockFeedback, issueTypeConfig, sourceConfig, type FeedbackItem } from '@/data/mockFeedback';
import { serializeFiltersToSearch, DEFAULT_FILTERS, type TimePreset, type TableFilters } from '@/utils/feedbackTableFilters';
import { TrendingDown, TrendingUp } from 'lucide-react';

type TimeRangeKey = '7d' | '30d' | '90d' | 'custom';
type SourceKey = FeedbackItem['source'] | 'all';

const DAY_MS = 24 * 60 * 60 * 1000;

const TIME_RANGE_OPTIONS: Array<{ value: TimeRangeKey; label: string; days: number }> = [
  { value: '7d', label: 'Last 7d', days: 7 },
  { value: '30d', label: 'Last 30d', days: 30 },
  { value: '90d', label: 'Last 90d', days: 90 },
  { value: 'custom', label: 'Custom', days: 30 },
];

const PRIORITY_BANDS = [
  { key: 'p0', min: 80, max: 100 },
  { key: 'p1', min: 60, max: 79 },
  { key: 'p2', min: 40, max: 59 },
  { key: 'p3', min: 0, max: 39 },
];

const ALL_STATUSES = ['unresolved', 'in_progress', 'resolved', 'ignored'];

const PRODUCT_AREAS = [
  'auth',
  'billing',
  'integrations',
  'performance',
  'ui',
  'notifications',
  'admin',
  'other',
];

const ISSUE_TYPE_GROUPS: Array<{ key: string; label: string; color: string }> = [
  { key: 'bug', label: 'Bug', color: 'hsl(0 84% 60%)' },
  { key: 'performance', label: 'Performance', color: 'hsl(199 89% 48%)' },
  { key: 'ux', label: 'UX', color: 'hsl(262 83% 58%)' },
  { key: 'feature', label: 'Feature', color: 'hsl(142 71% 45%)' },
];

const isOpenStatus = (status?: string) => {
  const normalized = status?.toLowerCase();
  return normalized === 'unresolved' || normalized === 'in_progress';
};

const getPriorityBand = (score?: number | null) => {
  const value = score ?? 0;
  if (value >= 80) return 'p0';
  if (value >= 60) return 'p1';
  if (value >= 40) return 'p2';
  return 'p3';
};

const getCreatedMs = (item: FeedbackItem) => {
  if (item.createdAt) return new Date(item.createdAt).getTime();
  const timestamp = item.timestamp instanceof Date ? item.timestamp.getTime() : null;
  return timestamp ?? Date.now();
};


const getUpdatedMs = (item: FeedbackItem) => {
  if (item.updatedAt) return new Date(item.updatedAt).getTime();
  if (item.createdAt) return new Date(item.createdAt).getTime();
  const timestamp = item.timestamp instanceof Date ? item.timestamp.getTime() : null;
  return timestamp ?? Date.now();
};

const formatDateParam = (date: Date) => format(date, 'yyyy-MM-dd');

const buildTicketsLink = (filters: Partial<TableFilters>) => {
  const base = {
    ...DEFAULT_FILTERS,
    ...filters,
  };
  const query = serializeFiltersToSearch(base);
  return query ? `/?${query}` : '/';
};

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getProductArea = (item: FeedbackItem) => {
  const issueType = item.issueType ?? '';
  const text = `${item.title ?? ''} ${item.description ?? ''} ${item.content ?? ''} ${item.tags?.join(' ') ?? ''}`.toLowerCase();
  if (issueType === 'account_access' || text.includes('login') || text.includes('sso') || text.includes('oauth')) {
    return 'auth';
  }
  if (issueType === 'billing' || issueType === 'pricing' || text.includes('invoice') || text.includes('payment')) {
    return 'billing';
  }
  if (issueType === 'integration' || text.includes('webhook') || text.includes('api')) {
    return 'integrations';
  }
  if (issueType === 'performance' || text.includes('latency') || text.includes('timeout')) {
    return 'performance';
  }
  if (issueType === 'ux' || text.includes('dashboard') || text.includes('export') || text.includes('search')) {
    return 'ui';
  }
  if (text.includes('notification') || text.includes('email')) {
    return 'notifications';
  }
  if (issueType === 'bug' || issueType === 'documentation') {
    return 'other';
  }
  return 'other';
};

const bucketRange = (startMs: number, endMs: number) => {
  const rangeMs = endMs - startMs;
  if (rangeMs <= 30 * DAY_MS) return DAY_MS;
  if (rangeMs <= 90 * DAY_MS) return 7 * DAY_MS;
  return 7 * DAY_MS;
};

const buildBuckets = (
  entries: FeedbackItem[],
  startMs: number,
  endMs: number,
  bucketMs: number,
  filter: (item: FeedbackItem) => boolean
) => {
  const bucketCount = Math.max(1, Math.ceil((endMs - startMs) / bucketMs));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: startMs + index * bucketMs,
    count: 0,
    highPriority: 0,
    negative: 0,
    byType: Object.fromEntries(ISSUE_TYPE_GROUPS.map((group) => [group.key, 0])) as Record<
      string,
      number
    >,
  }));

  entries.forEach((entry) => {
    if (!filter(entry)) return;
    const createdMs = getCreatedMs(entry);
    if (createdMs < startMs || createdMs >= endMs) return;
    const index = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((createdMs - startMs) / bucketMs))
    );
    const bucket = buckets[index];
    bucket.count += 1;
    const priority = getPriorityBand(entry.priorityScore);
    if (priority === 'p0' || priority === 'p1') {
      bucket.highPriority += 1;
    }
    if ((entry.sentiment ?? '').toLowerCase() === 'negative') {
      bucket.negative += 1;
    }
    const typeKey = (entry.issueType ?? '').toLowerCase();
    if (bucket.byType[typeKey] !== undefined) {
      bucket.byType[typeKey] += 1;
    }
  });

  return buckets.map((bucket) => ({
    label: format(new Date(bucket.start), bucketMs >= 7 * DAY_MS ? 'MMM d' : 'MMM d'),
    total: bucket.count,
    highPriority: bucket.highPriority,
    negative: bucket.negative,
    ...bucket.byType,
  }));
};

const buildIssueStats = (entries: FeedbackItem[], filter: (item: FeedbackItem) => boolean) => {
  const counts: Record<string, number> = {};
  const urgencySum: Record<string, number> = {};
  const urgencyCount: Record<string, number> = {};
  const negativeCounts: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};

  entries.forEach((entry) => {
    if (!filter(entry)) return;
    const key = entry.issueType ?? 'other';
    counts[key] = (counts[key] ?? 0) + 1;
    const urgency = (entry.urgency ?? '').toLowerCase();
    const urgencyScore =
      urgency === 'critical' ? 4 : urgency === 'high' ? 3 : urgency === 'medium' ? 2 : urgency === 'low' ? 1 : 0;
    if (urgencyScore) {
      urgencySum[key] = (urgencySum[key] ?? 0) + urgencyScore;
      urgencyCount[key] = (urgencyCount[key] ?? 0) + 1;
    }
    const sentiment = (entry.sentiment ?? '').toLowerCase();
    if (sentiment) {
      sentimentCounts[key] = (sentimentCounts[key] ?? 0) + 1;
      if (sentiment === 'negative') {
        negativeCounts[key] = (negativeCounts[key] ?? 0) + 1;
      }
    }
  });

  return Object.entries(counts).map(([key, count]) => {
    const avgUrgency = urgencyCount[key] ? urgencySum[key] / urgencyCount[key] : 0;
    const negativeRatio = sentimentCounts[key]
      ? (negativeCounts[key] ?? 0) / sentimentCounts[key]
      : 0;
    return {
      issueType: key,
      count,
      avgUrgency,
      negativeRatio,
    };
  });
};

export default function PmMetrics() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('30d');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceKey>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [negativeSegment, setNegativeSegment] = useState<'all' | 'enterprise'>('all');

  const loadFeedback = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) throw new Error('Failed to load feedback');
      const payload = (await response.json()) as Array<
        Omit<FeedbackItem, 'timestamp'> & { timestamp: string }
      >;
      setFeedback(
        payload.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      );
    } catch {
      setFeedback(mockFeedback);
    } finally {
      setIsLoading(false);
      setLastUpdatedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const timeBounds = useMemo(() => {
    const now = new Date();
    if (timeRange === 'custom' && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00`);
      const end = new Date(`${customEnd}T23:59:59.999`);
      return { startMs: start.getTime(), endMs: end.getTime() };
    }
    const option = TIME_RANGE_OPTIONS.find((entry) => entry.value === timeRange) ?? TIME_RANGE_OPTIONS[1];
    const endMs = now.getTime();
    const startMs = endMs - option.days * DAY_MS;
    return { startMs, endMs };
  }, [timeRange, customStart, customEnd]);

  const previousBounds = useMemo(() => {
    if (!compareEnabled) return null;
    const windowMs = timeBounds.endMs - timeBounds.startMs;
    return {
      startMs: timeBounds.startMs - windowMs,
      endMs: timeBounds.startMs,
    };
  }, [compareEnabled, timeBounds.endMs, timeBounds.startMs]);

  const baseFilter = (entry: FeedbackItem, startMs: number, endMs: number) => {
    if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
    const createdMs = getCreatedMs(entry);
    return createdMs >= startMs && createdMs < endMs;
  };

  const currentEntries = useMemo(
    () => feedback.filter((entry) => baseFilter(entry, timeBounds.startMs, timeBounds.endMs)),
    [feedback, sourceFilter, timeBounds]
  );

  const previousEntries = useMemo(() => {
    if (!previousBounds) return [];
    return feedback.filter((entry) => baseFilter(entry, previousBounds.startMs, previousBounds.endMs));
  }, [feedback, previousBounds, sourceFilter]);
  const needsAttentionData = useMemo(() => buildNeedsAttentionData(feedback), [feedback]);

  const needsAttentionContent = useMemo(
    () => (
      <NeedsAttentionOverlay
        data={needsAttentionData}
        onAlertSelect={(alert) => {
          const query = serializeFiltersToSearch({
            ...DEFAULT_FILTERS,
            issueTypes: alert.entry.issueType ? [alert.entry.issueType] : [],
            statuses: ['unresolved', 'in_progress'],
            timePreset: '7d',
          });
          window.location.assign(query ? `/?${query}` : '/');
        }}
      />
    ),
    [needsAttentionData]
  );

const deltaValue = (current: number, previous: number | null) => {
  if (previous === null) return { delta: 0, direction: 'up' as const };
  const diff = current - previous;
  return { delta: diff, direction: diff >= 0 ? ('up' as const) : ('down' as const) };
};

const renderDelta = (delta: number | null, direction: 'up' | 'down') => {
  if (delta === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {direction === 'up' ? (
        <TrendingUp className="h-3.5 w-3.5 text-success" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
      )}
      {Math.abs(delta).toFixed(0)}
    </span>
  );
};

  const openHighPriority = useMemo(() => {
    const filter = (entries: FeedbackItem[]) =>
      entries.filter(
        (entry) => isOpenStatus(entry.status) && ['p0', 'p1'].includes(getPriorityBand(entry.priorityScore))
      );
    const current = filter(currentEntries).length;
    const prev = previousBounds ? filter(previousEntries).length : null;
    return { current, ...deltaValue(current, prev) };
  }, [currentEntries, previousEntries, previousBounds]);

  const negativeVolume = useMemo(() => {
    const filter = (entries: FeedbackItem[]) =>
      entries.filter((entry) => (entry.sentiment ?? '').toLowerCase() === 'negative').length;
    const current = filter(currentEntries);
    const prev = previousBounds ? filter(previousEntries) : null;
    return { current, ...deltaValue(current, prev) };
  }, [currentEntries, previousEntries, previousBounds]);

  const medianResolution = useMemo(() => {
    const build = (entries: FeedbackItem[]) =>
      entries
        .filter(
          (entry) =>
            ['p0', 'p1'].includes(getPriorityBand(entry.priorityScore)) &&
            !isOpenStatus(entry.status) &&
            entry.updatedAt
        )
        .map((entry) => (getUpdatedMs(entry) - getCreatedMs(entry)) / DAY_MS);
    const currentValues = build(currentEntries);
    const prevValues = previousBounds ? build(previousEntries) : [];
    const current = median(currentValues);
    const previous = previousBounds ? median(prevValues) : null;
    return { current, previous };
  }, [currentEntries, previousEntries, previousBounds]);

  const enterpriseOpen = useMemo(() => {
    const filter = (entries: FeedbackItem[]) =>
      entries.filter(
        (entry) =>
          isOpenStatus(entry.status) &&
          ['p0', 'p1'].includes(getPriorityBand(entry.priorityScore)) &&
          (entry.customerSegment ?? 'unknown') === 'enterprise'
      ).length;
    const current = filter(currentEntries);
    const prev = previousBounds ? filter(previousEntries) : null;
    return { current, ...deltaValue(current, prev) };
  }, [currentEntries, previousEntries, previousBounds]);

  const medianResolutionDelta = useMemo(() => {
    if (!compareEnabled) return null;
    if (medianResolution.current === null || medianResolution.previous === null) return null;
    return medianResolution.current - medianResolution.previous;
  }, [compareEnabled, medianResolution.current, medianResolution.previous]);

  const topEscalatingTheme = useMemo(() => {
    const weights = { mentions: 1.2, urgency: 1.0, sentiment: 0.8 };
    const currentStats = buildIssueStats(currentEntries, () => true);
    const prevStats = buildIssueStats(previousEntries, () => true);
    const prevMap = Object.fromEntries(prevStats.map((stat) => [stat.issueType, stat]));
    const scored = currentStats.map((stat) => {
      const prev = prevMap[stat.issueType];
      const prevCount = prev?.count ?? 0;
      const mentionDelta = prevCount ? ((stat.count - prevCount) / prevCount) * 100 : 100;
      const urgencyDelta = stat.avgUrgency - (prev?.avgUrgency ?? 0);
      const negativeDelta = stat.negativeRatio - (prev?.negativeRatio ?? 0);
      const score =
        weights.mentions * mentionDelta + weights.urgency * urgencyDelta * 10 + weights.sentiment * negativeDelta * 100;
      return {
        issueType: stat.issueType,
        count: stat.count,
        delta: stat.count - prevCount,
        score,
      };
    });
    const top = scored.sort((a, b) => b.score - a.score)[0];
    if (!top) return { label: '—', delta: 0 };
    const label = issueTypeConfig[top.issueType as keyof typeof issueTypeConfig]?.label ?? top.issueType;
    return { label, delta: top.delta };
  }, [currentEntries, previousEntries]);

  const qualityTrendData = useMemo(() => {
    const bucketMs = bucketRange(timeBounds.startMs, timeBounds.endMs);
    return buildBuckets(currentEntries, timeBounds.startMs, timeBounds.endMs, bucketMs, () => true);
  }, [currentEntries, timeBounds]);

  const mixTrendData = useMemo(() => {
    const bucketMs = bucketRange(timeBounds.startMs, timeBounds.endMs);
    return buildBuckets(currentEntries, timeBounds.startMs, timeBounds.endMs, bucketMs, () => true);
  }, [currentEntries, timeBounds]);

  const regressionIndicator = useMemo(() => {
    const keywordMatcher = (entry: FeedbackItem) => {
      const text = `${entry.title ?? ''} ${entry.description ?? ''} ${entry.content ?? ''}`.toLowerCase();
      return text.includes('regression') || text.includes('broke again') || text.includes('used to work');
    };
    const current = currentEntries.filter(keywordMatcher).length;
    const prev = previousBounds ? previousEntries.filter(keywordMatcher).length : null;
    return { current, ...deltaValue(current, prev) };
  }, [currentEntries, previousEntries, previousBounds]);

  const negativeTrendData = useMemo(() => {
    const bucketMs = bucketRange(timeBounds.startMs, timeBounds.endMs);
    const filter = (entry: FeedbackItem) => {
      if (negativeSegment === 'enterprise' && entry.customerSegment !== 'enterprise') return false;
      return true;
    };
    return buildBuckets(currentEntries, timeBounds.startMs, timeBounds.endMs, bucketMs, filter);
  }, [currentEntries, negativeSegment, timeBounds]);

  const segmentImpact = useMemo(() => {
    const counts: Record<string, number> = { free: 0, pro: 0, enterprise: 0, unknown: 0 };
    currentEntries.forEach((entry) => {
      if (!isOpenStatus(entry.status)) return;
      const priority = getPriorityBand(entry.priorityScore);
      if (priority !== 'p0' && priority !== 'p1') return;
      const segment = (entry.customerSegment ?? 'unknown') as keyof typeof counts;
      counts[segment] = (counts[segment] ?? 0) + 1;
    });
    return Object.entries(counts).map(([segment, count]) => ({ segment, count }));
  }, [currentEntries]);

  const painThemes = useMemo(() => {
    const currentStats = buildIssueStats(currentEntries, () => true);
    const prevStats = buildIssueStats(previousEntries, () => true);
    const prevMap = Object.fromEntries(prevStats.map((stat) => [stat.issueType, stat.count]));
    return currentStats
      .map((stat) => ({
        issueType: stat.issueType,
        label: issueTypeConfig[stat.issueType as keyof typeof issueTypeConfig]?.label ?? stat.issueType,
        count: stat.count,
        delta: stat.count - (prevMap[stat.issueType] ?? 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [currentEntries, previousEntries]);

  const topThemes = useMemo(() => {
    const currentStats = buildIssueStats(currentEntries, () => true);
    const prevStats = buildIssueStats(previousEntries, () => true);
    const prevMap = Object.fromEntries(prevStats.map((stat) => [stat.issueType, stat.count]));
    return currentStats
      .map((stat) => ({
        issueType: stat.issueType,
        label: issueTypeConfig[stat.issueType as keyof typeof issueTypeConfig]?.label ?? stat.issueType,
        count: stat.count,
        delta: stat.count - (prevMap[stat.issueType] ?? 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [currentEntries, previousEntries]);

  const fastEscalations = useMemo(() => {
    const currentStats = buildIssueStats(currentEntries, () => true);
    const prevStats = buildIssueStats(previousEntries, () => true);
    const prevMap = Object.fromEntries(prevStats.map((stat) => [stat.issueType, stat.count]));
    return currentStats
      .map((stat) => {
        const prevCount = prevMap[stat.issueType] ?? 0;
        const delta = stat.count - prevCount;
        const rate = prevCount ? delta / prevCount : delta;
        return {
          issueType: stat.issueType,
          label: issueTypeConfig[stat.issueType as keyof typeof issueTypeConfig]?.label ?? stat.issueType,
          delta,
          rate,
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
  }, [currentEntries, previousEntries]);

  const productAreaHeatmap = useMemo(() => {
    const grid: Record<string, Record<string, number>> = {};
    PRODUCT_AREAS.forEach((area) => {
      grid[area] = { p0: 0, p1: 0, p2: 0, p3: 0 };
    });
    currentEntries.forEach((entry) => {
      if (!isOpenStatus(entry.status)) return;
      const area = getProductArea(entry);
      const band = getPriorityBand(entry.priorityScore);
      if (!grid[area]) {
        grid[area] = { p0: 0, p1: 0, p2: 0, p3: 0 };
      }
      grid[area][band] += 1;
    });
    return grid;
  }, [currentEntries]);

  const timeToFirstAction = useMemo(() => {
    const hours = currentEntries
      .filter((entry) => isOpenStatus(entry.status))
      .map((entry) => (getUpdatedMs(entry) - getCreatedMs(entry)) / (60 * 60 * 1000));
    return median(hours);
  }, [currentEntries]);

  const resolutionStats = useMemo(() => {
    const values = currentEntries
      .filter((entry) => !isOpenStatus(entry.status))
      .filter((entry) => ['p0', 'p1'].includes(getPriorityBand(entry.priorityScore)))
      .map((entry) => (getUpdatedMs(entry) - getCreatedMs(entry)) / DAY_MS);
    return median(values);
  }, [currentEntries]);

  const backlogAging = useMemo(() => {
    const buckets = [
      { key: '0-3d', label: '0-3d', count: 0 },
      { key: '4-7d', label: '4-7d', count: 0 },
      { key: '8-14d', label: '8-14d', count: 0 },
      { key: '15d+', label: '15d+', count: 0 },
    ];
    const now = Date.now();
    currentEntries.forEach((entry) => {
      if (!isOpenStatus(entry.status)) return;
      const ageDays = (now - getCreatedMs(entry)) / DAY_MS;
      if (ageDays <= 3) buckets[0].count += 1;
      else if (ageDays <= 7) buckets[1].count += 1;
      else if (ageDays <= 14) buckets[2].count += 1;
      else buckets[3].count += 1;
    });
    return buckets;
  }, [currentEntries]);

  const viewTicketsLink = (filters: Partial<TableFilters>) =>
    buildTicketsLink({
      ...filters,
      statuses: filters.statuses ?? ALL_STATUSES,
      timePreset: 'custom' as TimePreset,
      startDate: formatDateParam(new Date(timeBounds.startMs)),
      endDate: formatDateParam(new Date(timeBounds.endMs)),
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-info/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <Header
          onRefresh={loadFeedback}
          lastUpdatedAt={lastUpdatedAt}
          needsAttentionContent={needsAttentionContent}
          alertCount={needsAttentionData.alerts.length}
        />
        <main className="container mx-auto px-6 pt-3 pb-10 space-y-6">
          <section className="rounded-xl border border-border/60 bg-background/60 p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Time range</span>
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeKey)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {timeRange === 'custom' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="h-8 w-[140px]"
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="h-8 w-[140px]"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
                <span>Compare to previous period</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    More
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Source</div>
                    <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceKey)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {Object.entries(sourceConfig).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Product Health Snapshot</h2>
              <p className="text-xs text-muted-foreground">Core signals for weekly health reviews.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                title="High-Priority Open"
                value={
                  <span className="flex items-center gap-2">
                    <span>{openHighPriority.current}</span>
                    {compareEnabled && renderDelta(openHighPriority.delta, openHighPriority.direction)}
                  </span>
                }
                subtext="P0 + P1, open status"
              />
              <KpiCard
                title="Negative Feedback Volume"
                value={
                  <span className="flex items-center gap-2">
                    <span>{negativeVolume.current}</span>
                    {compareEnabled && renderDelta(negativeVolume.delta, negativeVolume.direction)}
                  </span>
                }
                subtext="Sentiment = negative"
              />
              <KpiCard
                title="Median Time to Resolution"
                value={
                  <span className="flex items-center gap-2">
                    <span>{medianResolution.current ? `${medianResolution.current.toFixed(1)}d` : '—'}</span>
                    {compareEnabled && medianResolutionDelta !== null && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {medianResolutionDelta >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-success" />
                        )}
                        {Math.abs(medianResolutionDelta).toFixed(1)}d
                      </span>
                    )}
                  </span>
                }
                subtext="P0/P1 resolved tickets"
              />
              <KpiCard
                title="Enterprise Impacting Open"
                value={
                  <span className="flex items-center gap-2">
                    <span>{enterpriseOpen.current}</span>
                    {compareEnabled && renderDelta(enterpriseOpen.delta, enterpriseOpen.direction)}
                  </span>
                }
                subtext="P0/P1 open, enterprise"
              />
              <KpiCard
                title="Top Escalating Theme"
                value={topEscalatingTheme.label}
                subtext={`Delta ${topEscalatingTheme.delta >= 0 ? '+' : ''}${topEscalatingTheme.delta}`}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Product Quality & Stability</h2>
              <p className="text-xs text-muted-foreground">Absolute volume trends across priorities and themes.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1.4fr_1fr]">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Issue Volume Over Time</h3>
                    <p className="text-xs text-muted-foreground">Total vs high priority tickets per day</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <a href={viewTicketsLink({ priorityBands: ['p0', 'p1'] })}>View tickets</a>
                  </Button>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={qualityTrendData}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="highPriority"
                        name="High Priority"
                        stroke="hsl(29 90% 55%)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Mix Over Time</h3>
                    <p className="text-xs text-muted-foreground">Bug vs Performance vs UX vs Feature</p>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mixTrendData}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <ChartTooltip />
                      {ISSUE_TYPE_GROUPS.map((group) => (
                        <Bar key={group.key} dataKey={group.key} stackId="mix" fill={group.color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <KpiCard
                title="Regression Indicator"
                value={regressionIndicator.current}
                subtext="Keyword-based regression signal"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Customer Impact & Sentiment</h2>
              <p className="text-xs text-muted-foreground">How signals shift across segments.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr_1fr]">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Negative Feedback Trend</h3>
                    <p className="text-xs text-muted-foreground">Absolute negative tickets</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Button
                      variant={negativeSegment === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setNegativeSegment('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={negativeSegment === 'enterprise' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setNegativeSegment('enterprise')}
                    >
                      Enterprise
                    </Button>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={negativeTrendData}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        name="Negative"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Segment Impact (Open P0/P1)</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentImpact}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="segment" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <ChartTooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Top Customer Pain Themes</h3>
                <div className="space-y-2 text-xs">
                  {painThemes.map((theme) => (
                    <div key={theme.issueType} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{theme.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Delta {theme.delta >= 0 ? '+' : ''}
                          {theme.delta}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="text-xs">
                        <a href={viewTicketsLink({ issueTypes: [theme.issueType] })}>View tickets</a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Theme & Area Deep Dive</h2>
              <p className="text-xs text-muted-foreground">Theme movement and surface-level heat.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1.4fr_1.2fr_1.4fr]">
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Top Themes by Volume</h3>
                <div className="space-y-2 text-xs">
                  {topThemes.map((theme) => (
                    <div key={theme.issueType} className="flex items-center justify-between gap-3">
                      <span className="truncate">{theme.label}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>
                          {theme.count} ({theme.delta >= 0 ? '+' : ''}{theme.delta})
                        </span>
                        <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[11px]">
                          <a href={viewTicketsLink({ issueTypes: [theme.issueType] })}>View</a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Fastest Escalating Themes</h3>
                <div className="space-y-2 text-xs">
                  {fastEscalations.map((theme) => (
                    <div key={theme.issueType} className="flex items-center justify-between gap-3">
                      <span className="truncate">{theme.label}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>
                          {theme.delta >= 0 ? '+' : ''}
                          {theme.delta} ({Math.round(theme.rate * 100)}%)
                        </span>
                        <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[11px]">
                          <a href={viewTicketsLink({ issueTypes: [theme.issueType] })}>View</a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Product Area Heatmap</h3>
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,48px)] gap-2 text-[11px]">
                  <span className="text-muted-foreground">Area</span>
                  <span className="text-muted-foreground text-center">P0</span>
                  <span className="text-muted-foreground text-center">P1</span>
                  <span className="text-muted-foreground text-center">P2</span>
                  <span className="text-muted-foreground text-center">P3</span>
                  {PRODUCT_AREAS.map((area) => (
                    <div key={area} className="contents">
                      <span className="text-foreground capitalize">{area}</span>
                      {PRIORITY_BANDS.map((band) => {
                        const value = productAreaHeatmap[area]?.[band.key] ?? 0;
                        const intensity = Math.min(0.85, value / 10);
                        return (
                          <span
                            key={`${area}-${band.key}`}
                            className="rounded-md border border-border/50 text-center"
                            style={{ backgroundColor: `hsl(var(--primary) / ${0.1 + intensity})` }}
                          >
                            {value}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Delivery & Execution Health</h2>
              <p className="text-xs text-muted-foreground">Speed and aging across open work.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1fr_1fr_1.4fr_1fr]">
              <KpiCard
                title="Time to First Action"
                value={timeToFirstAction ? `${timeToFirstAction.toFixed(1)}h` : '—'}
                subtext="Median hours (open tickets)"
              />
              <KpiCard
                title="Time to Resolution"
                value={resolutionStats ? `${resolutionStats.toFixed(1)}d` : '—'}
                subtext="Median days (P0/P1)"
              />
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Backlog Aging</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={backlogAging}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <ChartTooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <KpiCard title="Reopen Rate" value="Coming soon" subtext="Requires status history" />
            </div>
          </section>
        </main>
      </div>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
          Loading PM Metrics…
        </div>
      )}
    </div>
  );
}
