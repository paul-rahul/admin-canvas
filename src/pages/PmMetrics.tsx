import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { Header } from '@/components/dashboard/Header';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NeedsAttentionOverlay, buildNeedsAttentionData } from '@/components/dashboard/NeedsAttentionOverlay';
import { mockFeedback, issueTypeConfig, sourceConfig, type FeedbackItem } from '@/data/mockFeedback';
import { serializeFiltersToSearch, DEFAULT_FILTERS, type TimePreset, type TableFilters } from '@/utils/feedbackTableFilters';
import { Calendar as CalendarIcon, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type TimeRangeKey = '7d' | '30d' | '90d' | 'all' | 'custom';
type SourceKey = FeedbackItem['source'] | 'all';

const DAY_MS = 24 * 60 * 60 * 1000;

const TIME_RANGE_OPTIONS: Array<{ value: TimeRangeKey; label: string; days: number }> = [
  { value: '7d', label: 'Last 7d', days: 7 },
  { value: '30d', label: 'Last 30d', days: 30 },
  { value: '90d', label: 'Last 90d', days: 90 },
  { value: 'all', label: 'All', days: 0 },
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


const isOpenStatus = (status?: string) => {
  const normalized = status?.toLowerCase();
  return normalized === 'unresolved' || normalized === 'in_progress';
};

const isClosedStatus = (status?: string) => {
  const normalized = status?.toLowerCase();
  return normalized === 'resolved' || normalized === 'ignored';
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
    byType: Object.fromEntries(Object.keys(issueTypeConfig).map((key) => [key, 0])) as Record<
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

const buildClosedBuckets = (entries: FeedbackItem[], startMs: number, endMs: number, bucketMs: number) => {
  const bucketCount = Math.max(1, Math.ceil((endMs - startMs) / bucketMs));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: startMs + index * bucketMs,
    count: 0,
  }));

  entries.forEach((entry) => {
    if (!isClosedStatus(entry.status)) return;
    const updatedMs = getUpdatedMs(entry);
    if (updatedMs < startMs || updatedMs >= endMs) return;
    const index = Math.min(buckets.length - 1, Math.max(0, Math.floor((updatedMs - startMs) / bucketMs)));
    buckets[index].count += 1;
  });

  return buckets.map((bucket) => ({
    label: format(new Date(bucket.start), bucketMs >= 7 * DAY_MS ? 'MMM d' : 'MMM d'),
    total: bucket.count,
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

const getDeltaPercent = (current: number, previous: number | null) => {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

const formatTime = (value: Date | null) => {
  if (!value) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const applyTimeToDate = (date: Date | null, timeValue: string) => {
  if (!date) return null;
  if (!timeValue) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const [hour, minute] = timeValue.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return date;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
};

const CreatedClosedTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; total: number; closed: number } }>;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{data.label}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Created Tickets</span>
        <span className="font-semibold text-foreground">{data.total}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Closed Tickets</span>
        <span className="font-semibold text-foreground">{data.closed}</span>
      </div>
    </div>
  );
};

const StatusByIssueTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const valueMap = new Map(payload.map((entry) => [entry.name ?? '', entry.value ?? 0]));
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{label}</div>
      {['Unresolved', 'In Progress', 'Resolved', 'Ignored'].map((key) => (
        <div key={key} className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>{key}</span>
          <span className="font-semibold text-foreground">{valueMap.get(key) ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

const NegativeTrendTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { negative?: number; enterprise?: number; pro?: number; free?: number; unknown?: number } }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{label}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Total Negative</span>
        <span className="font-semibold text-foreground">{data.negative ?? 0}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Enterprise</span>
        <span className="font-semibold text-foreground">{data.enterprise ?? 0}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Pro</span>
        <span className="font-semibold text-foreground">{data.pro ?? 0}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Free</span>
        <span className="font-semibold text-foreground">{data.free ?? 0}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Unknown</span>
        <span className="font-semibold text-foreground">{data.unknown ?? 0}</span>
      </div>
    </div>
  );
};

const SegmentImpactTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { count?: number } }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{label}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Count</span>
        <span className="font-semibold text-foreground">{data.count ?? 0}</span>
      </div>
    </div>
  );
};

const ThemeUserTypeTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | null }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const valueMap = new Map(payload.map((entry) => [entry.name ?? '', entry.value ?? 0]));
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{label}</div>
      {['Free', 'Pro', 'Enterprise', 'Unknown'].map((key) => (
        <div key={key} className="flex items-center justify-between gap-4 text-muted-foreground">
          <span>{key}</span>
          <span className="font-semibold text-foreground">{valueMap.get(key) ?? 0}</span>
        </div>
      ))}
    </div>
  );
};

const BacklogAgingTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { count?: number } }>;
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 text-xs shadow-card">
      <div className="mb-2 text-sm font-semibold text-foreground">{label}</div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Open Tickets</span>
        <span className="font-semibold text-foreground">{data.count ?? 0}</span>
      </div>
    </div>
  );
};


export default function PmMetrics() {
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 24 }, (_, index) => currentYear - index);
  }, []);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('7d');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceKey>('all');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [customStartMonth, setCustomStartMonth] = useState<Date | undefined>(undefined);
  const [customEndMonth, setCustomEndMonth] = useState<Date | undefined>(undefined);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [negativeSeriesVisibility, setNegativeSeriesVisibility] = useState({
    total: true,
    enterprise: true,
    pro: true,
    free: true,
    unknown: true,
  });
  const [isThemeTicketsOpen, setIsThemeTicketsOpen] = useState(false);
  const [themeTicketsFilters, setThemeTicketsFilters] = useState<TableFilters | null>(null);

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

  useEffect(() => {
    if (customStart) {
      setCustomStartMonth(customStart);
    }
  }, [customStart]);

  useEffect(() => {
    if (customEnd) {
      setCustomEndMonth(customEnd);
    }
  }, [customEnd]);

  const toggleNegativeSeries = useCallback(
    (key: keyof typeof negativeSeriesVisibility) => {
      setNegativeSeriesVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const getTableTimePreset = (range: TimeRangeKey): TimePreset => {
    if (range === '7d') return '7d';
    if (range === '30d') return '30d';
    if (range === 'all') return 'all';
    return 'custom';
  };

  const handleTimeRangeChange = useCallback(
    (value: TimeRangeKey) => {
      setTimeRange(value);
      if (value !== 'custom') return;
      if (customStart && customEnd) return;
      const now = new Date();
      setCustomStart(new Date(now.getTime() - 7 * DAY_MS));
      setCustomEnd(now);
    },
    [customEnd, customStart]
  );

  const timeBounds = useMemo(() => {
    const now = new Date();
    if (timeRange === 'custom' && customStart && customEnd) {
      return { startMs: customStart.getTime(), endMs: customEnd.getTime() };
    }
    if (timeRange === 'all' && feedback.length) {
      const minCreated = feedback.reduce((min, entry) => {
        const createdMs = getCreatedMs(entry);
        return createdMs < min ? createdMs : min;
      }, Number.POSITIVE_INFINITY);
      return { startMs: minCreated, endMs: now.getTime() };
    }
    const option = TIME_RANGE_OPTIONS.find((entry) => entry.value === timeRange) ?? TIME_RANGE_OPTIONS[1];
    const endMs = now.getTime();
    const startMs = endMs - option.days * DAY_MS;
    return { startMs, endMs };
  }, [timeRange, customStart, customEnd, feedback]);

  const previousBounds = useMemo(() => {
    if (!compareEnabled) return null;
    const windowMs = timeBounds.endMs - timeBounds.startMs;
    return {
      startMs: timeBounds.startMs - windowMs,
      endMs: timeBounds.startMs,
    };
  }, [compareEnabled, timeBounds.endMs, timeBounds.startMs]);

  const openThemeTickets = useCallback(
    (issueType: string) => {
      const timePreset = getTableTimePreset(timeRange);
      const nextFilters: TableFilters = {
        ...DEFAULT_FILTERS,
        issueTypes: [issueType],
        sources: sourceFilter === 'all' ? [] : [sourceFilter],
        timePreset,
        startDate: timePreset === 'custom' ? formatDateParam(new Date(timeBounds.startMs)) : null,
        endDate: timePreset === 'custom' ? formatDateParam(new Date(timeBounds.endMs)) : null,
      };
      setThemeTicketsFilters(nextFilters);
      setIsThemeTicketsOpen(true);
    },
    [sourceFilter, timeBounds.endMs, timeBounds.startMs, timeRange]
  );

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

  const rangeLabel = useMemo(() => {
    const option = TIME_RANGE_OPTIONS.find((entry) => entry.value === timeRange);
    const label =
      timeRange === 'custom'
        ? 'Custom range'
        : timeRange === 'all'
        ? 'All time'
        : option
        ? `Last ${option.days} days`
        : 'Custom range';
    const startLabel = format(new Date(timeBounds.startMs), 'MMM d, yyyy');
    const endLabel = format(new Date(timeBounds.endMs), 'MMM d, yyyy');
    return `${label} (${startLabel} - ${endLabel})`;
  }, [timeBounds.endMs, timeBounds.startMs, timeRange]);


  const createdCount = currentEntries.length;
  const prevCreatedCount = previousBounds ? previousEntries.length : null;
  const createdDeltaPercent = getDeltaPercent(createdCount, prevCreatedCount);

  const closedEntries = useMemo(
    () =>
      feedback.filter((entry) => {
        if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
        if (!isClosedStatus(entry.status)) return false;
        const updatedMs = getUpdatedMs(entry);
        return updatedMs >= timeBounds.startMs && updatedMs < timeBounds.endMs;
      }),
    [feedback, sourceFilter, timeBounds]
  );

  const previousClosedEntries = useMemo(() => {
    if (!previousBounds) return [];
    return feedback.filter((entry) => {
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
      if (!isClosedStatus(entry.status)) return false;
      const updatedMs = getUpdatedMs(entry);
      return updatedMs >= previousBounds.startMs && updatedMs < previousBounds.endMs;
    });
  }, [feedback, previousBounds, sourceFilter]);

  const closedCount = closedEntries.length;
  const prevClosedCount = previousBounds ? previousClosedEntries.length : null;
  const closedDeltaPercent = getDeltaPercent(closedCount, prevClosedCount);

  const needsAttentionContent = useMemo(
    () => (
      <NeedsAttentionOverlay
        data={needsAttentionData}
        variant="alerts"
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
  const insightsContent = useMemo(
    () => <NeedsAttentionOverlay data={needsAttentionData} variant="insights" />,
    [needsAttentionData]
  );


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

  const userSegmentStats = useMemo(() => {
    const segments: Array<{ key: string; label: string }> = [
      { key: 'free', label: 'Free' },
      { key: 'pro', label: 'Pro' },
      { key: 'enterprise', label: 'Enterprise' },
      { key: 'unknown', label: 'Unknown' },
    ];
    const counts: Record<string, number> = {};
    const criticalCounts: Record<string, number> = {};
    segments.forEach((segment) => {
      counts[segment.key] = 0;
      criticalCounts[segment.key] = 0;
    });
    currentEntries.forEach((entry) => {
      const segment = (entry.customerSegment ?? 'unknown').toLowerCase();
      if (!(segment in counts)) return;
      counts[segment] += 1;
      if ((entry.urgency ?? '').toLowerCase() === 'critical') {
        criticalCounts[segment] += 1;
      }
    });
    const maxCount = Math.max(1, ...Object.values(counts));
    return segments
      .map((segment) => {
        const count = counts[segment.key] ?? 0;
        const critical = criticalCounts[segment.key] ?? 0;
        return {
          key: segment.key,
          label: segment.label,
          count,
          percent: (count / maxCount) * 100,
          criticalPercent: count ? Math.round((critical / count) * 100) : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [currentEntries]);

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

  const createdTrendData = useMemo(() => {
    const bucketMs = bucketRange(timeBounds.startMs, timeBounds.endMs);
    const createdBuckets = buildBuckets(
      currentEntries,
      timeBounds.startMs,
      timeBounds.endMs,
      bucketMs,
      () => true
    );
    const closedBuckets = buildClosedBuckets(closedEntries, timeBounds.startMs, timeBounds.endMs, bucketMs);
    const closedByLabel = Object.fromEntries(closedBuckets.map((bucket) => [bucket.label, bucket.total]));
    return createdBuckets.map((bucket) => ({
      label: bucket.label,
      total: bucket.total,
      closed: closedByLabel[bucket.label] ?? 0,
    }));
  }, [closedEntries, currentEntries, timeBounds]);

  const statusByIssueType = useMemo(() => {
    type StatusCounts = { unresolved: number; in_progress: number; resolved: number; ignored: number };
    const counts: Record<string, StatusCounts> = {};
    currentEntries.forEach((entry) => {
      const key = entry.issueType ?? 'other';
      if (!counts[key]) {
        counts[key] = { unresolved: 0, in_progress: 0, resolved: 0, ignored: 0 };
      }
      const status = entry.status ?? 'unresolved';
      if (status in counts[key]) {
        counts[key][status as keyof StatusCounts] += 1;
      }
    });
    return Object.keys(issueTypeConfig)
      .map((key) => ({
        label: issueTypeConfig[key as keyof typeof issueTypeConfig]?.label ?? key,
        ...counts[key],
      }))
      .filter((item) => item.unresolved || item.in_progress || item.resolved || item.ignored);
  }, [currentEntries]);


  const sourceDotData = useMemo(() => {
    const counts: Record<string, number> = {};
    currentEntries.forEach((entry) => {
      counts[entry.source] = (counts[entry.source] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    return Object.entries(sourceConfig)
      .map(([key, value]) => {
        const count = counts[key] ?? 0;
        const dots = Math.max(3, Math.round((count / total) * 48));
        return {
          key,
          label: value.label,
          color: value.color,
          count,
          dots,
        };
      })
      .filter((item) => item.count > 0);
  }, [currentEntries]);

  const sourceColors: Record<string, string> = {
    support: 'hsl(142 71% 45%)',
    discord: 'hsl(199 89% 48%)',
    github: 'hsl(215 20% 60%)',
    twitter: 'hsl(199 89% 48%)',
    email: 'hsl(38 92% 50%)',
    forum: 'hsl(142 71% 45%)',
    other: 'hsl(215 20% 55%)',
    unknown: 'hsl(215 20% 55%)',
  };

  const priorityDotData = useMemo(() => {
    const counts: Record<string, number> = { p0: 0, p1: 0, p2: 0, p3: 0 };
    closedEntries.forEach((entry) => {
      const band = getPriorityBand(entry.priorityScore);
      counts[band] += 1;
    });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    const priorityColors: Record<string, string> = {
      p0: 'hsl(0 84% 60%)',
      p1: 'hsl(38 92% 50%)',
      p2: 'hsl(199 89% 48%)',
      p3: 'hsl(215 20% 60%)',
    };
    return Object.entries(counts).map(([key, count]) => ({
      key,
      label: key.toUpperCase(),
      color: priorityColors[key] ?? 'hsl(215 20% 60%)',
      count,
      dots: Math.max(3, Math.round((count / total) * 48)),
    }));
  }, [closedEntries]);

  const resolutionRows = useMemo(() => {
    const currentCounts: Record<string, number> = {};
    const prevCounts: Record<string, number> = {};
    const labelMap: Record<string, string> = {
      fixed: 'Fixed',
      workaround: 'Workaround',
      wont_fix: "Won't fix",
      duplicate: 'Duplicate',
      cannot_reproduce: 'Cannot reproduce',
    };
    closedEntries.forEach((entry) => {
      const code = entry.resolution?.resolutionCode ?? 'unknown';
      currentCounts[code] = (currentCounts[code] ?? 0) + 1;
    });
    previousClosedEntries.forEach((entry) => {
      const code = entry.resolution?.resolutionCode ?? 'unknown';
      prevCounts[code] = (prevCounts[code] ?? 0) + 1;
    });
    return Object.keys(currentCounts)
      .map((key) => {
        const current = currentCounts[key] ?? 0;
        const prev = previousBounds ? prevCounts[key] ?? 0 : null;
        const deltaPercent = getDeltaPercent(current, prev);
        return {
          key,
          label: labelMap[key] ?? 'Other',
          current,
          deltaPercent,
        };
      })
      .sort((a, b) => b.current - a.current)
      .slice(0, 5);
  }, [closedEntries, previousClosedEntries, previousBounds]);

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
    const bucketCount = Math.max(1, Math.ceil((timeBounds.endMs - timeBounds.startMs) / bucketMs));
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      start: timeBounds.startMs + index * bucketMs,
      negative: 0,
      free: 0,
      pro: 0,
      enterprise: 0,
      unknown: 0,
    }));
    currentEntries.forEach((entry) => {
      if ((entry.sentiment ?? '').toLowerCase() !== 'negative') return;
      const createdMs = getCreatedMs(entry);
      if (createdMs < timeBounds.startMs || createdMs >= timeBounds.endMs) return;
      const index = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor((createdMs - timeBounds.startMs) / bucketMs))
      );
      const bucket = buckets[index];
      bucket.negative += 1;
      const segment = (entry.customerSegment ?? 'unknown') as 'free' | 'pro' | 'enterprise' | 'unknown';
      if (segment in bucket) {
        bucket[segment] += 1;
      }
    });
    return buckets.map((bucket) => ({
      label: format(new Date(bucket.start), bucketMs >= 7 * DAY_MS ? 'MMM d' : 'MMM d'),
      negative: bucket.negative,
      free: bucket.free,
      pro: bucket.pro,
      enterprise: bucket.enterprise,
      unknown: bucket.unknown,
    }));
  }, [currentEntries, timeBounds]);

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

  const maxPainIncrease = useMemo(() => {
    if (painThemes.length === 0) return null;
    return painThemes.reduce((best, theme) => {
      if (!best) return theme;
      return theme.delta > best.delta ? theme : best;
    }, null as (typeof painThemes)[number] | null);
  }, [painThemes]);

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

  const topThemeSegmentDistribution = useMemo(() => {
    const segments = ['free', 'pro', 'enterprise', 'unknown'] as const;
    const currentStats = buildIssueStats(currentEntries, () => true)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    return currentStats.map((stat) => {
      const counts: Record<(typeof segments)[number], number> = {
        free: 0,
        pro: 0,
        enterprise: 0,
        unknown: 0,
      };
      currentEntries.forEach((entry) => {
        if (entry.issueType !== stat.issueType) return;
        const segment = (entry.customerSegment ?? 'unknown') as (typeof segments)[number];
        counts[segment] += 1;
      });
      const total = segments.reduce((sum, key) => sum + counts[key], 0);
      return {
        issueType: stat.issueType,
        label: issueTypeConfig[stat.issueType as keyof typeof issueTypeConfig]?.label ?? stat.issueType,
        total,
        counts,
      };
    });
  }, [currentEntries]);

  const themeUserTypeStacked = useMemo(() => {
    return topThemeSegmentDistribution.map((theme) => ({
      label: theme.label,
      free: theme.counts.free,
      pro: theme.counts.pro,
      enterprise: theme.counts.enterprise,
      unknown: theme.counts.unknown,
    }));
  }, [topThemeSegmentDistribution]);

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
          insightsContent={insightsContent}
          alertCount={needsAttentionData.alerts.length}
        />
        <section className="fixed top-[48px] left-0 right-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-6 py-3">
            <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Time range</span>
                  <Select value={timeRange} onValueChange={(value) => handleTimeRangeChange(value as TimeRangeKey)}>
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
                  <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-6 w-[120px] justify-start gap-1 border-border/60 bg-transparent px-2 text-xs",
                            !customStart && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {customStart ? format(customStart, 'MMM d, yyyy') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-2">
                        <div className="flex gap-3">
                          <div className="h-full max-h-[300px] w-20 overflow-y-auto rounded-md border border-border/60 bg-background/60 p-1 text-[11px]">
                            {yearOptions.map((year) => {
                              const isActive = (customStartMonth ?? customStart)?.getFullYear() === year;
                              return (
                                <button
                                  key={year}
                                  type="button"
                                  className={cn(
                                    "w-full rounded px-2 py-1 text-left transition",
                                    isActive
                                      ? "bg-primary/20 text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  )}
                                  onClick={() => {
                                    const base = customStartMonth ?? customStart ?? new Date();
                                    const next = new Date(base);
                                    next.setFullYear(year);
                                    setCustomStartMonth(next);
                                  }}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>
                          <Calendar
                            mode="single"
                            selected={customStart ?? undefined}
                            onSelect={(date) => {
                              const nextDate = date ? applyTimeToDate(date, formatTime(customStart)) : null;
                              setCustomStart(nextDate);
                              if (date) {
                                setCustomStartMonth(date);
                              }
                            }}
                            month={customStartMonth}
                            onMonthChange={setCustomStartMonth}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formatTime(customStart)}
                      onChange={(event) => {
                        const baseDate = customStart ?? new Date();
                        const next = applyTimeToDate(baseDate, event.target.value);
                        setCustomStart(next);
                      }}
                      className="h-6 w-[48px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <span>to</span>
                  <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-6 w-[120px] justify-start gap-1 border-border/60 bg-transparent px-2 text-xs",
                            !customEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {customEnd ? format(customEnd, 'MMM d, yyyy') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-2">
                        <div className="flex gap-3">
                          <div className="h-full max-h-[300px] w-20 overflow-y-auto rounded-md border border-border/60 bg-background/60 p-1 text-[11px]">
                            {yearOptions.map((year) => {
                              const isActive = (customEndMonth ?? customEnd)?.getFullYear() === year;
                              return (
                                <button
                                  key={year}
                                  type="button"
                                  className={cn(
                                    "w-full rounded px-2 py-1 text-left transition",
                                    isActive
                                      ? "bg-primary/20 text-foreground"
                                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  )}
                                  onClick={() => {
                                    const base = customEndMonth ?? customEnd ?? new Date();
                                    const next = new Date(base);
                                    next.setFullYear(year);
                                    setCustomEndMonth(next);
                                  }}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>
                          <Calendar
                            mode="single"
                            selected={customEnd ?? undefined}
                            onSelect={(date) => {
                              const nextDate = date ? applyTimeToDate(date, formatTime(customEnd)) : null;
                              setCustomEnd(nextDate);
                              if (date) {
                                setCustomEndMonth(date);
                              }
                            }}
                            month={customEndMonth}
                            onMonthChange={setCustomEndMonth}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={formatTime(customEnd)}
                      onChange={(event) => {
                        const baseDate = customEnd ?? new Date();
                        const next = applyTimeToDate(baseDate, event.target.value);
                        setCustomEnd(next);
                      }}
                      className="h-6 w-[48px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Source</span>
                <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceKey)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
                <span>Compare to previous period</span>
              </div>
            </div>
            </div>
          </div>
        </section>

        <main className="container mx-auto px-6 pt-24 pb-10 space-y-6">

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Product Health Snapshot</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                title="High-Priority Open"
                titleClassName="line-clamp-2 leading-tight"
                titleRowClassName="min-h-[44px] items-start"
                value={
                  <span className="flex items-center gap-2">
                    <span>{openHighPriority.current}</span>
                    {compareEnabled && renderDelta(openHighPriority.delta, openHighPriority.direction)}
                  </span>
                }
                subtext="P0 + P1, open status"
                subtextClassName="min-h-[16px] line-clamp-1"
                tooltip={
                  <div className="space-y-1 text-xs">
                    <p>• Counts P0/P1 tickets with status not resolved/ignored</p>
                    <p>• Delta compares current window vs previous window</p>
                  </div>
                }
              />
              <KpiCard
                title="Negative Feedback"
                titleClassName="line-clamp-2 leading-tight"
                titleRowClassName="min-h-[44px] items-start"
                value={
                  <span className="flex items-center gap-2">
                    <span>{negativeVolume.current}</span>
                    {compareEnabled && renderDelta(negativeVolume.delta, negativeVolume.direction)}
                  </span>
                }
                subtext="Sentiment = negative"
                subtextClassName="min-h-[16px] line-clamp-1"
                tooltip={
                  <div className="space-y-1 text-xs">
                    <p>• Counts tickets with sentiment = Negative</p>
                    <p>• Delta compares current window vs previous window</p>
                  </div>
                }
              />
              <KpiCard
                title="Resolution Time"
                titleClassName="line-clamp-2 leading-tight"
                titleRowClassName="min-h-[44px] items-start"
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
                subtextClassName="min-h-[16px] line-clamp-1"
                tooltip={
                  <div className="space-y-1 text-xs">
                    <p>Median days between creation and resolution</p>
                  </div>
                }
              />
              <KpiCard
                title="Escalating Theme"
                titleClassName="line-clamp-2 leading-tight"
                titleRowClassName="min-h-[44px] items-start"
                value={topEscalatingTheme.label}
                subtext={`Delta ${topEscalatingTheme.delta >= 0 ? '+' : ''}${topEscalatingTheme.delta}`}
                subtextClassName="min-h-[16px] line-clamp-1"
                tooltip={
                  <div className="space-y-1 text-xs">
                    <p>• Theme with highest weighted change</p>
                    <p>• Uses mention growth + urgency + negative shift</p>
                  </div>
                }
              />
              <KpiCard
                title="Ticket Volume"
                value={null}
                valueHidden
                tooltip={
                  <div className="text-xs">
                    Delta compares the current period to the previous period.
                  </div>
                }
                valueSpacerClassName="mt-1 h-1"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created Tickets</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{createdCount}</span>
                      {compareEnabled && prevCreatedCount !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            createdCount - prevCreatedCount >= 0
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {createdCount - prevCreatedCount >= 0 ? "▲" : "▼"} {Math.abs(createdCount - prevCreatedCount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Closed Tickets</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{closedCount}</span>
                      {compareEnabled && prevClosedCount !== null && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            closedCount - prevClosedCount >= 0
                              ? "bg-success/20 text-success"
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {closedCount - prevClosedCount >= 0 ? "▲" : "▼"} {Math.abs(closedCount - prevClosedCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </KpiCard>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Customer Impact & Sentiment</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr_1fr_1fr]">
              <div className="rounded-xl border border-border/60 p-4 xl:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Negative Feedback Trend</h3>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={negativeTrendData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} width={26} />
                      <ChartTooltip content={<NegativeTrendTooltip />} />
                      {negativeSeriesVisibility.total && (
                        <Line
                          type="monotone"
                          dataKey="negative"
                          name="Total Negative"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {negativeSeriesVisibility.enterprise && (
                        <Line
                          type="monotone"
                          dataKey="enterprise"
                          name="Enterprise"
                          stroke="hsl(199 89% 48%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {negativeSeriesVisibility.pro && (
                        <Line
                          type="monotone"
                          dataKey="pro"
                          name="Pro"
                          stroke="hsl(142 71% 45%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {negativeSeriesVisibility.free && (
                        <Line
                          type="monotone"
                          dataKey="free"
                          name="Free"
                          stroke="hsl(38 92% 50%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {negativeSeriesVisibility.unknown && (
                        <Line
                          type="monotone"
                          dataKey="unknown"
                          name="Unknown"
                          stroke="hsl(215 20% 55%)"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleNegativeSeries('total')}
                      className={`flex items-center gap-2 underline-offset-4 hover:underline ${
                        negativeSeriesVisibility.total ? 'text-foreground' : 'opacity-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--destructive))]" />
                      Total Negative
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNegativeSeries('enterprise')}
                      className={`flex items-center gap-2 underline-offset-4 hover:underline ${
                        negativeSeriesVisibility.enterprise ? 'text-foreground' : 'opacity-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(199_89%_48%)]" />
                      Enterprise
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNegativeSeries('pro')}
                      className={`flex items-center gap-2 underline-offset-4 hover:underline ${
                        negativeSeriesVisibility.pro ? 'text-foreground' : 'opacity-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" />
                      Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNegativeSeries('free')}
                      className={`flex items-center gap-2 underline-offset-4 hover:underline ${
                        negativeSeriesVisibility.free ? 'text-foreground' : 'opacity-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(38_92%_50%)]" />
                      Free
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleNegativeSeries('unknown')}
                      className={`flex items-center gap-2 underline-offset-4 hover:underline ${
                        negativeSeriesVisibility.unknown ? 'text-foreground' : 'opacity-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[hsl(215_20%_55%)]" />
                      Unknown
                    </button>
                  </div>
                  <div className="mt-1 flex justify-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Click legend elements to show/hide
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4 flex flex-col">
                <h3 className="text-sm font-semibold">Segment Impact</h3>
                <p className="mt-1 text-xs text-muted-foreground">Showing only P0+P1 counts</p>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentImpact} margin={{ left: 0, right: 8, bottom: 12 }}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis
                        dataKey="segment"
                        tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={52}
                      />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} width={26} />
                      <ChartTooltip content={<SegmentImpactTooltip />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <h3 className="text-sm font-semibold mb-2">Themes</h3>
                <div className="space-y-2 text-xs">
                  {painThemes.map((theme) => (
                    <div key={theme.issueType} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{theme.label}</p>
                        <p
                          className={cn(
                            "flex items-center gap-1 text-[11px]",
                            theme.delta > 0
                              ? "text-success"
                              : theme.delta < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          {theme.delta > 0 && <TrendingUp className="h-3 w-3" />}
                          {theme.delta < 0 && <TrendingDown className="h-3 w-3" />}
                          {theme.delta === 0 ? "No change" : Math.abs(theme.delta)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => openThemeTickets(theme.issueType)}
                      >
                        View tickets
                      </Button>
                    </div>
                  ))}
                </div>
                {maxPainIncrease && (
                  <p className="mt-3 text-center text-xs font-semibold text-foreground">
                    Max increase seen in {maxPainIncrease.label}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Theme & Area Deep Dive</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-7 auto-rows-fr">
              <div className="rounded-xl border border-border/60 p-4 h-full flex flex-col xl:col-span-2">
                <h3 className="text-sm font-semibold mb-2">Volume Distribution</h3>
                <div className="mt-0.5 space-y-2 text-xs flex-1">
                  {topThemes.map((theme) => (
                    <div key={theme.issueType} className="flex items-center justify-between gap-3">
                      <span className="truncate">{theme.label}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-muted-foreground">
                          {theme.count}{' '}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1",
                              theme.delta > 0
                                ? "text-success"
                                : theme.delta < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            (
                            {theme.delta > 0 && <TrendingUp className="h-3 w-3" />}
                            {theme.delta < 0 && <TrendingDown className="h-3 w-3" />}
                            {theme.delta === 0 ? "0" : Math.abs(theme.delta)})
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => openThemeTickets(theme.issueType)}
                        >
                          View Tickets
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-4 h-full flex flex-col xl:col-span-2">
                <h3 className="text-sm font-semibold mb-2">Priority Heatmap</h3>
                <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,48px)] gap-2 text-[11px] flex-1">
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
              <div className="rounded-xl border border-border/60 p-4 h-full flex flex-col xl:col-span-3">
                <h3 className="text-sm font-semibold mb-2">User Distribution for top Themes</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={themeUserTypeStacked} layout="vertical" margin={{ left: 0 }}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }}
                        width={90}
                      />
                      <ChartTooltip content={<ThemeUserTypeTooltip />} />
                      <Bar dataKey="free" stackId="segment" fill="hsl(38 92% 50%)" name="Free" />
                      <Bar dataKey="pro" stackId="segment" fill="hsl(199 89% 48%)" name="Pro" />
                      <Bar dataKey="enterprise" stackId="segment" fill="hsl(142 71% 45%)" name="Enterprise" />
                      <Bar dataKey="unknown" stackId="segment" fill="hsl(215 20% 55%)" name="Unknown" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(38_92%_50%)]" />
                    Free
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(199_89%_48%)]" />
                    Pro
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" />
                    Enterprise
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(215_20%_55%)]" />
                    Unknown
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Product Quality & Stability</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Ticket Status by Issue Type</h3>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusByIssueType} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }}
                        width={90}
                      />
                      <ChartTooltip content={<StatusByIssueTooltip />} />
                      <Bar dataKey="unresolved" stackId="status" fill="hsl(0 84% 60%)" name="Unresolved" />
                      <Bar dataKey="in_progress" stackId="status" fill="hsl(38 92% 50%)" name="In Progress" />
                      <Bar dataKey="resolved" stackId="status" fill="hsl(142 71% 45%)" name="Resolved" />
                      <Bar dataKey="ignored" stackId="status" fill="hsl(215 20% 50%)" name="Ignored" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(0_84%_60%)]" />
                    Unresolved
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(38_92%_50%)]" />
                    In Progress
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" />
                    Resolved
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(215_20%_50%)]" />
                    Ignored
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 shadow-card h-full">
                <h3 className="text-sm font-semibold">Resolution Rationale</h3>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_72px_64px] gap-3 text-xs text-muted-foreground">
                  <span>Resolution</span>
                  <span className="text-right">Count</span>
                  <span className="text-right">vs prev</span>
                  {resolutionRows.map((row) => (
                    <div key={row.key} className="contents text-foreground">
                      <span className="truncate">{row.label}</span>
                      <span className="text-right text-base font-semibold">{row.current}</span>
                      <span
                        className={cn(
                          "inline-flex items-center justify-end gap-1 text-right text-xs font-semibold",
                          row.deltaPercent === null
                            ? "text-muted-foreground"
                            : row.deltaPercent >= 0
                            ? "text-success"
                            : "text-destructive"
                        )}
                      >
                        {row.deltaPercent === null ? (
                          '—'
                        ) : (
                          <>
                            {row.deltaPercent >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(row.deltaPercent).toFixed(0)}%
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
              <div className="rounded-xl border border-border/60 p-4 flex flex-col h-full">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Backlog Aging</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full text-muted-foreground hover:text-foreground"
                          aria-label="Backlog aging info"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs whitespace-normal">
                        Shows open tickets grouped by age since creation for unresolved/in-progress items.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                  <div className="mt-6 flex-1 min-h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={backlogAging} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid stroke="transparent" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,20%,60%)' }} width={28} />
                        <ChartTooltip content={<BacklogAgingTooltip />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 shadow-card">
                <h3 className="text-sm font-semibold">Closed Tickets by Priority</h3>
                <div className="mt-4 flex flex-col items-center">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityDotData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={36}
                          outerRadius={64}
                          paddingAngle={2}
                        >
                          {priorityDotData.map((entry) => (
                            <Cell key={entry.key} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-foreground">
                    {priorityDotData.map((item) => (
                      <span key={item.key} className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
      <Dialog open={isThemeTicketsOpen} onOpenChange={setIsThemeTicketsOpen}>
        <DialogContent className="w-[90vw] max-w-none max-h-[80vh] overflow-hidden">
          <FeedbackTable
            key={themeTicketsFilters?.issueTypes?.join(',') ?? 'all'}
            feedback={feedback}
            initialFiltersOverride={themeTicketsFilters ?? undefined}
            disableUrlSync
            stickyTableHeader
            containerClassName="flex flex-col max-h-[72vh]"
            bodyScrollClassName="flex-1 overflow-y-auto"
          />
        </DialogContent>
      </Dialog>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
          Loading PM Metrics…
        </div>
      )}
    </div>
  );
}
