import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { FeedbackDetail } from '@/components/dashboard/FeedbackDetail';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { IssueTrendModal } from '@/components/dashboard/IssueTrendModal';
import { TrendsCard } from '@/components/dashboard/TrendsCard';
import { issueTypeConfig, mockFeedback, FeedbackItem, FeedbackSource } from '@/data/mockFeedback';
import { formatPercent } from '@/lib/kpiUtils';
import { AlertTriangle, TrendingDown, TrendingUp, Loader2, Info } from 'lucide-react';
import { NeedsAttentionOverlay, buildNeedsAttentionData } from '@/components/dashboard/NeedsAttentionOverlay';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Index = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const searchNeedle = useMemo(() => deferredSearch.trim().toLowerCase(), [deferredSearch]);
  const [activeSource, setActiveSource] = useState<FeedbackSource | 'all'>('all');
  const [activeTime, setActiveTime] = useState<'24h' | '7d' | '30d' | 'all' | 'custom'>('7d');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [customRange, setCustomRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [trendThemeId, setTrendThemeId] = useState<string | null>(null);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [trendSelectionKey, setTrendSelectionKey] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const filterTimerRef = useRef<number | null>(null);
  const defaultCustomRange = useCallback(() => {
    const now = new Date();
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
  }, []);

  const normalizeRange = useCallback((range: { from: Date | null; to: Date | null }) => {
    if (range.from && range.to && range.from > range.to) {
      return { from: range.to, to: range.from };
    }
    return range;
  }, []);

  const markFiltering = useCallback(() => {
    if (filterTimerRef.current) {
      window.clearTimeout(filterTimerRef.current);
    }
    setIsFiltering(true);
    filterTimerRef.current = window.setTimeout(() => {
      setIsFiltering(false);
      filterTimerRef.current = null;
    }, 250);
  }, []);

  const indexedFeedback = useMemo(
    () =>
      feedback.map((item) => ({
        item,
        timestampMs: item.timestamp?.getTime?.() ?? null,
        searchText: `${item.title} ${item.content} ${item.author} ${item.issueType} ${
          issueTypeConfig[item.issueType]?.label ?? ''
        }`.toLowerCase(),
      })),
    [feedback]
  );

  const needsAttentionData = useMemo(() => buildNeedsAttentionData(feedback), [feedback]);

  const baseFiltered = useMemo(() => {
    return indexedFeedback.filter(({ item, searchText }) => {
      const matchesSearch = searchNeedle === '' || searchText.includes(searchNeedle);
      const matchesSource = activeSource === 'all' || item.source === activeSource;
      return matchesSearch && matchesSource;
    });
  }, [indexedFeedback, searchNeedle, activeSource]);

  const filteredFeedback = useMemo(() => {
    const now = Date.now();
    const timeWindow =
      activeTime === '24h'
        ? 24 * 60 * 60 * 1000
        : activeTime === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : activeTime === '30d'
        ? 30 * 24 * 60 * 60 * 1000
        : null;

    const filtered: FeedbackItem[] = [];
    baseFiltered.forEach(({ item, timestampMs }) => {
      if (activeTime === 'custom') {
        const withinFrom = !customRange.from || (timestampMs !== null && timestampMs >= customRange.from.getTime());
        const withinTo = !customRange.to || (timestampMs !== null && timestampMs <= customRange.to.getTime());
        if (withinFrom && withinTo) {
          filtered.push(item);
        }
        return;
      }

      if (!timeWindow || (timestampMs !== null && now - timestampMs <= timeWindow)) {
        filtered.push(item);
      }
    });

    return filtered;
  }, [baseFiltered, activeTime, customRange]);

  const kpiFilters = useMemo(
    () => ({
      source: activeSource === 'all' ? null : activeSource,
      from:
        activeTime === 'custom'
          ? customRange.from
          : activeTime === 'all'
          ? null
          : new Date(
              Date.now() -
                (activeTime === '24h' ? 1 : activeTime === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000
            ),
      to: activeTime === 'custom' ? customRange.to : activeTime === 'all' ? null : new Date(),
      search: searchNeedle,
    }),
    [activeSource, activeTime, searchNeedle, customRange]
  );

  const baseFilteredItems = useMemo(
    () => baseFiltered.map(({ item }) => item),
    [baseFiltered]
  );

  const { criticalPercent, criticalCount, criticalHighCount, criticalDelta } = useMemo(() => {
    const total = filteredFeedback.length;
    if (!total) {
      return { criticalPercent: '—', criticalCount: 0, criticalHighCount: 0, criticalDelta: null as number | null };
    }
    let criticalTotal = 0;
    let criticalOpen = 0;
    let highOpen = 0;
    filteredFeedback.forEach((item) => {
      if (item.urgency === 'critical') {
        criticalTotal += 1;
        if (!item.resolved) {
          criticalOpen += 1;
        }
      } else if (item.urgency === 'high' && !item.resolved) {
        highOpen += 1;
      }
    });
    let delta: number | null = null;
    if (activeTime !== 'all') {
      const now = Date.now();
      const windowMs =
        activeTime === 'custom' && customRange.from && customRange.to
          ? customRange.to.getTime() - customRange.from.getTime()
          : activeTime === '24h'
          ? 24 * 60 * 60 * 1000
          : activeTime === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : activeTime === '30d'
          ? 30 * 24 * 60 * 60 * 1000
          : null;
      if (windowMs && windowMs > 0) {
        const prevEnd =
          activeTime === 'custom' && customRange.from
            ? customRange.from.getTime()
            : now - windowMs;
        const prevStart = prevEnd - windowMs;
        let prevCriticalOpen = 0;
        baseFiltered.forEach(({ item, timestampMs }) => {
          if (timestampMs === null) return;
          if (timestampMs < prevStart || timestampMs >= prevEnd) return;
          if (item.urgency === 'critical' && !item.resolved) {
            prevCriticalOpen += 1;
          }
        });
        if (prevCriticalOpen > 0) {
          delta = ((criticalOpen - prevCriticalOpen) / prevCriticalOpen) * 100;
        }
      }
    }
    return {
      criticalPercent: formatPercent((criticalTotal / total) * 100),
      criticalCount: criticalOpen,
      criticalHighCount: highOpen,
      criticalDelta: delta,
    };
  }, [filteredFeedback, baseFiltered, activeTime, customRange]);

  const topIssueType = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredFeedback.forEach((item) => {
      const issueType = item.issueType ?? 'unknown';
      counts[issueType] = (counts[issueType] ?? 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? null;
  }, [filteredFeedback]);





  const loadFeedback = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback');
      if (!response.ok) {
        throw new Error('Failed to load feedback');
      }
      const payload = (await response.json()) as Array<
        Omit<FeedbackItem, 'timestamp'> & { timestamp: string }
      >;
      setFeedback(
        payload.map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      );
    } catch (error) {
      setFeedback(mockFeedback);
    } finally {
      setLastUpdatedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, []);

  useEffect(() => {
    return () => {
      if (filterTimerRef.current) {
        window.clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  const handleTimeChange = useCallback(
    (time: '24h' | '7d' | '30d' | 'all' | 'custom') => {
      markFiltering();
      setActiveTime(time);
      if (time === 'custom') {
        setCustomRange(defaultCustomRange());
      } else {
        setTrendSelectionKey((prev) => prev + 1);
      }
    },
    [defaultCustomRange, markFiltering]
  );

  const handleCustomRangeChange = useCallback(
    (range: { from: Date | null; to: Date | null }) => {
      markFiltering();
      setCustomRange(normalizeRange(range));
      setActiveTime('custom');
    },
    [markFiltering, normalizeRange]
  );

  const handleKpiSourceSelect = useCallback((source: string) => {
    setActiveSource(source as FeedbackSource);
  }, []);

  const handleTrendSourceChange = useCallback(
    (source: FeedbackSource | 'all') => {
      markFiltering();
      setActiveSource(source as FeedbackSource);
    },
    [markFiltering]
  );

  const handleTrendTimeFilterChange = useCallback(
    (rangeKey: '1h' | '7d' | '1m' | '3m' | '6m' | '1y') => {
      markFiltering();
      const now = new Date();
      if (rangeKey === '1h' || rangeKey === '7d' || rangeKey === '1m') {
        const nextTime = rangeKey === '1h' ? '24h' : rangeKey === '7d' ? '7d' : '30d';
        setActiveTime(nextTime);
        setTrendSelectionKey((prev) => prev + 1);
        return;
      }
      const days = rangeKey === '3m' ? 90 : rangeKey === '6m' ? 180 : 365;
      setActiveTime('custom');
      setCustomRange({ from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), to: now });
    },
    [markFiltering]
  );

  const handleTrendRangeSelect = useCallback(
    (range: { from: Date; to: Date }) => {
      markFiltering();
      setCustomRange(normalizeRange(range));
      setActiveTime('custom');
    },
    [markFiltering, normalizeRange]
  );

  const handleRefresh = useCallback(() => {
    void loadFeedback();
  }, [loadFeedback]);


  const needsAttentionContent = useMemo(
    () => (
      <NeedsAttentionOverlay
        data={needsAttentionData}
        onAlertSelect={(alert) => {
          setSearchQuery(alert.title);
          setSelectedItem(alert.entry);
        }}
      />
    ),
    [needsAttentionData]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-info/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header
          onRefresh={handleRefresh}
          overlayLock={Boolean(selectedItem) || isTrendOpen}
          lastUpdatedAt={lastUpdatedAt}
          alertCount={needsAttentionData.alerts.length}
          needsAttentionContent={needsAttentionContent}
        />

        <main className="container mx-auto px-6 pt-3 pb-0 space-y-6">
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {/* Filters */}
              <FilterBar
                activeSource={activeSource}
                activeTime={activeTime}
                onSourceChange={setActiveSource}
                onTimeChange={handleTimeChange}
                customRange={customRange}
                onCustomRangeChange={handleCustomRangeChange}
                isFiltering={isFiltering}
              />

              {/* KPI Strip */}
              <KpiStrip
                filters={kpiFilters}
                entries={baseFilteredItems}
                prefilteredEntries={filteredFeedback}
                isFiltering={isFiltering}
                onSourceSelect={handleKpiSourceSelect}
                extraCard={(issueTypesCard) => (
                  <div className="grid h-full grid-rows-[1fr_auto] gap-4">
                <KpiCard
                  title="Critical Issues"
                  titleRight={
                    isFiltering ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null
                  }
                  value={
                    <span className="flex items-center gap-2">
                      <span>{criticalPercent}</span>
                      {criticalDelta !== null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {criticalDelta >= 0 ? (
                            <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-success" />
                          )}
                          {Math.abs(criticalDelta).toFixed(1)}%
                          {criticalDelta >= 0 ? ' increase' : ' decrease'}
                        </span>
                      )}
                    </span>
                  }
                  icon={AlertTriangle}
                  className="h-full"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Critical: <span className="font-semibold text-foreground">{criticalCount}</span> | High:{' '}
                      <span className="font-semibold text-foreground">{criticalHighCount}</span>
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="rounded-full text-muted-foreground hover:text-foreground"
                            aria-label="Critical issues info"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="z-[60] max-w-none whitespace-nowrap">
                          <div className="space-y-1 text-xs">
                            <p>• % critical = critical / total tickets in current window</p>
                            <p>• Trend % = (current critical - previous critical) / previous critical</p>
                            <p>• Counts unresolved Critical and High urgency tickets</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{criticalCount}</span>{' '}
                    <span className="font-semibold text-foreground">unresolved</span> critical tickets require
                    immediate attention.
                  </p>
                </KpiCard>
                    <div className="h-full">{issueTypesCard}</div>
                  </div>
                )}
                secondaryCard={null}
              />
            </div>

            <div className="space-y-6">
              <TrendsCard
                entries={baseFilteredItems}
                issueTypeId={topIssueType}
                issueTypeLabel={
                  topIssueType
                    ? issueTypeConfig[topIssueType as keyof typeof issueTypeConfig]?.label ??
                      topIssueType
                    : null
                }
                sourceValue={activeSource}
                onSourceChange={handleTrendSourceChange}
                timeFilter={activeTime}
                customRange={customRange}
                onTimeFilterChange={handleTrendTimeFilterChange}
                clearSelectionKey={trendSelectionKey}
                onTimeRangeSelect={handleTrendRangeSelect}
              />
            </div>
          </div>

          <div className="space-y-0"></div>

          {/* Feedback Table */}
          <div className="-mt-10">
            <FeedbackTable
              feedback={feedback}
              onSelect={setSelectedItem}
              globalSource={activeSource}
              globalTime={activeTime}
              globalCustomRange={customRange}
            />
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <FeedbackDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
      <IssueTrendModal
        open={isTrendOpen}
        onOpenChange={setIsTrendOpen}
        entries={baseFilteredItems}
        summaryEntries={baseFilteredItems}
        issueTypeId={trendThemeId}
        issueTypeLabel={
          trendThemeId
            ? issueTypeConfig[trendThemeId as keyof typeof issueTypeConfig]?.label ?? trendThemeId
            : null
        }
        onTimeRangeSelect={handleTrendRangeSelect}
      />
    </div>
  );
};

export default Index;
