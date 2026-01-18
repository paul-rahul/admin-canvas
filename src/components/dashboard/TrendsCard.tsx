import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { Activity, X } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeConfig, sourceConfig, type FeedbackItem, type FeedbackSource } from '@/data/mockFeedback';

type TimeRangeKey = '1h' | '7d' | '1m' | '3m' | '6m' | '1y';
type SourceKey = FeedbackSource | 'all';

const DAY_MS = 24 * 60 * 60 * 1000;

const timeRanges: Record<
  TimeRangeKey,
  { label: string; windowMs: number; bucketMs: number; formatString: string }
> = {
  '1h': { label: 'Hourly', windowMs: DAY_MS, bucketMs: 60 * 60 * 1000, formatString: 'ha' },
  '7d': { label: '7 days', windowMs: 7 * DAY_MS, bucketMs: 6 * 60 * 60 * 1000, formatString: 'MMM d ha' },
  '1m': { label: '1 month', windowMs: 30 * DAY_MS, bucketMs: DAY_MS, formatString: 'MMM d' },
  '3m': { label: '3 months', windowMs: 90 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '6m': { label: '6 months', windowMs: 180 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '1y': { label: '1 year', windowMs: 365 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
};

const normalizeUrgency = (value?: string | null) => {
  const normalized = value?.toLowerCase();
  if (normalized === 'low') return 1;
  if (normalized === 'medium') return 2;
  if (normalized === 'high') return 3;
  if (normalized === 'critical') return 4;
  return null;
};

type TrendPoint = {
  label: string;
  count: number;
  avgUrgency: number | null;
  startMs: number;
  endMs: number;
};

type TrendPayload = {
  count: number;
  avgUrgency: number | null;
  label: string;
};

const TrendsTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPayload }> }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-card">
      <div className="mb-1 font-medium text-foreground">{data.label}</div>
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <span>Tickets</span>
        <span className="font-semibold text-foreground">{data.count}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <span>Avg urgency</span>
        <span className="font-semibold text-foreground">
          {data.avgUrgency !== null ? data.avgUrgency.toFixed(2) : '—'}
        </span>
      </div>
    </div>
  );
};

interface TrendsCardProps {
  entries: FeedbackItem[];
  issueTypeId: string | null;
  issueTypeLabel: string | null;
  sourceValue: SourceKey;
  onSourceChange?: (source: SourceKey) => void;
  timeFilter?: '24h' | '7d' | '30d' | 'all' | 'custom';
  customRange?: { from: Date | null; to: Date | null };
  onTimeFilterChange?: (timeRange: TimeRangeKey) => void;
  clearSelectionKey?: number;
  onTimeRangeSelect?: (range: { from: Date; to: Date }) => void;
  insightsContent?: React.ReactNode;
}

export function TrendsCard({
  entries,
  issueTypeId,
  issueTypeLabel,
  sourceValue,
  onSourceChange,
  timeFilter = '7d',
  customRange,
  onTimeFilterChange,
  clearSelectionKey,
  onTimeRangeSelect,
  insightsContent,
}: TrendsCardProps) {
  const [selectedRangeMs, setSelectedRangeMs] = useState<{ from: number; to: number } | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [lastPresetRangeKey, setLastPresetRangeKey] = useState<TimeRangeKey>('7d');
  const insightsPanelRef = useRef<HTMLDivElement | null>(null);
  const selectedSource = sourceValue;
  const chartRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const chartWidthRef = useRef(0);
  const chartRectRef = useRef<{ left: number; width: number } | null>(null);
  const plotRectRef = useRef<{ left: number; width: number; top: number; height: number } | null>(
    null
  );
  const dragStartIndexRef = useRef<number | null>(null);
  const dragEndIndexRef = useRef<number | null>(null);
  const isSelectingRef = useRef(false);
  const dragPixelStartRef = useRef<number | null>(null);
  const dragPixelEndRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const syncedRangeKey = useMemo<TimeRangeKey>(() => {
    if (timeFilter === '24h') return '1h';
    if (timeFilter === '7d') return '7d';
    if (timeFilter === '30d') return '1m';
    if (timeFilter === 'all') return '1y';
    if (timeFilter === 'custom' && customRange?.from && customRange?.to) {
      const windowMs = Math.max(1, customRange.to.getTime() - customRange.from.getTime());
      if (windowMs <= 2 * DAY_MS) return '1h';
      if (windowMs <= 14 * DAY_MS) return '7d';
      if (windowMs <= 60 * DAY_MS) return '1m';
      if (windowMs <= 90 * DAY_MS) return '3m';
      if (windowMs <= 180 * DAY_MS) return '6m';
      return '1y';
    }
    return '7d';
  }, [timeFilter, customRange]);

  useEffect(() => {
    if (timeFilter !== 'custom') {
      setLastPresetRangeKey(syncedRangeKey);
    }
  }, [timeFilter, syncedRangeKey]);

  useEffect(() => {
    if (timeFilter === 'custom' && customRange?.from && customRange?.to) {
      setLastPresetRangeKey(syncedRangeKey);
    }
  }, [timeFilter, customRange, syncedRangeKey]);

  const displayRangeKey = timeFilter === 'custom' ? lastPresetRangeKey : syncedRangeKey;

  const trendEntries = useMemo(() => {
    if (!issueTypeId) return [];
    return entries.filter((entry) => {
      if (entry.issueType !== issueTypeId) return false;
      if (selectedSource !== 'all' && entry.source !== selectedSource) return false;
      return true;
    });
  }, [entries, issueTypeId, selectedSource]);

  const trendData = useMemo<TrendPoint[]>(() => {
    if (!issueTypeId) return [];

    const customFrom = customRange?.from?.getTime?.() ?? null;
    const customTo = customRange?.to?.getTime?.() ?? null;
    const useCustom = timeFilter === 'custom' && customFrom !== null && customTo !== null;
    const rangeKey = timeFilter === 'custom' ? lastPresetRangeKey : syncedRangeKey;
    const baseConfig = timeRanges[rangeKey];
    const windowMs = useCustom ? Math.max(1, customTo - customFrom) : baseConfig.windowMs;
    const bucketMs = useCustom ? baseConfig.bucketMs : baseConfig.bucketMs;
    const formatString = useCustom ? baseConfig.formatString : baseConfig.formatString;

    let start = 0;
    let endMs = 0;
    if (useCustom) {
      start = customFrom;
      endMs = customTo;
    } else {
      const now = new Date();
      const alignedEnd = new Date(now);
      if (bucketMs >= DAY_MS) {
        alignedEnd.setHours(0, 0, 0, 0);
        alignedEnd.setTime(alignedEnd.getTime() + DAY_MS);
      } else {
        alignedEnd.setMinutes(0, 0, 0);
        alignedEnd.setTime(alignedEnd.getTime() + 60 * 60 * 1000);
      }
      endMs = alignedEnd.getTime();
      start = endMs - windowMs;
    }

    const bucketCount = Math.max(1, Math.ceil((endMs - start) / bucketMs));
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      start: start + index * bucketMs,
      count: 0,
      urgencySum: 0,
      urgencyCount: 0,
    }));

    trendEntries.forEach((entry) => {
      const timestamp = entry.timestamp?.getTime?.() ?? null;
      if (!timestamp || timestamp < start || timestamp >= endMs) return;
      const bucketIndex = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor((timestamp - start) / bucketMs))
      );
      const bucket = buckets[bucketIndex];
      bucket.count += 1;
      const urgencyValue = normalizeUrgency(entry.urgency);
      if (urgencyValue !== null) {
        bucket.urgencySum += urgencyValue;
        bucket.urgencyCount += 1;
      }
    });

    return buckets.map((bucket) => ({
      label: format(new Date(bucket.start), formatString),
      count: bucket.count,
      avgUrgency: bucket.urgencyCount ? bucket.urgencySum / bucket.urgencyCount : null,
      startMs: bucket.start,
      endMs: bucket.start + bucketMs,
    }));
  }, [issueTypeId, timeFilter, syncedRangeKey, lastPresetRangeKey, customRange, trendEntries]);

  const hasData = trendData.some((point) => point.count > 0);

  const topSourceTheme = useMemo(() => {
    if (!entries.length) return '—';
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      const source = entry.source ?? 'unknown';
      counts[source] = (counts[source] ?? 0) + 1;
    });
    const total = entries.length;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return '—';
    const [sourceKey, count] = top;
    const label = sourceConfig[sourceKey as keyof typeof sourceConfig]?.label ?? sourceKey;
    const percent = Math.round((count / total) * 100);
    const themeCounts: Record<string, number> = {};
    entries.forEach((entry) => {
      const theme = entry.issueType ?? 'unknown';
      themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
    });
    const topThemeEntry = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0];
    if (!topThemeEntry) return `Top source: ${label} (${percent}%) | Top theme: —`;
    const [topTheme, themeCount] = topThemeEntry;
    const themeLabel =
      issueTypeConfig[topTheme as keyof typeof issueTypeConfig]?.label ?? topTheme;
    const themePercent = Math.round((themeCount / total) * 100);
    return `Top source: ${label} (${percent}%) | Top theme: ${themeLabel} (${themePercent}%)`;
  }, [entries]);

  const derivedRange = useMemo(() => {
    if (!selectedRangeMs || trendData.length === 0) return null;
    const { from, to } = selectedRangeMs;
    const windowStart = trendData[0]?.startMs ?? null;
    const windowEnd = trendData[trendData.length - 1]?.endMs ?? null;
    if (windowStart === null || windowEnd === null) return null;
    if (from < windowStart || to > windowEnd) return null;
    const startIndex = trendData.findIndex((point) => point.endMs >= from);
    const endIndex = [...trendData].reverse().findIndex((point) => point.startMs <= to);
    if (startIndex === -1 || endIndex === -1) return null;
    const normalizedEndIndex = trendData.length - 1 - endIndex;
    return { startIndex, endIndex: Math.max(startIndex, normalizedEndIndex) };
  }, [selectedRangeMs, trendData]);

  useEffect(() => {
    dragStartIndexRef.current = null;
    dragEndIndexRef.current = null;
    isSelectingRef.current = false;
    dragPixelStartRef.current = null;
    dragPixelEndRef.current = null;
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
    }
  }, [issueTypeId, timeFilter, customRange]);

  useEffect(() => {
    if (!isInsightsOpen) return;
    const handleClose = (event: MouseEvent) => {
      if (insightsPanelRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsInsightsOpen(false);
    };
    window.addEventListener('mousedown', handleClose);
    return () => window.removeEventListener('mousedown', handleClose);
  }, [isInsightsOpen]);

  const hideOverlay = () => {
    if (!overlayRef.current) return;
    overlayRef.current.style.opacity = '0';
  };

  useEffect(() => {
    if (!clearSelectionKey) return;
    setSelectedRangeMs(null);
    hideOverlay();
  }, [clearSelectionKey]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartWidthRef.current = chartRef.current.clientWidth;
    const updatePlotRect = () => {
      if (!chartRef.current) return;
      const containerRect = chartRef.current.getBoundingClientRect();
      const grid = chartRef.current.querySelector('.recharts-cartesian-grid') as HTMLElement | null;
      if (grid) {
        const gridRect = grid.getBoundingClientRect();
        plotRectRef.current = {
          left: Math.max(0, gridRect.left - containerRect.left),
          width: Math.max(0, gridRect.width),
          top: Math.max(0, gridRect.top - containerRect.top),
          height: Math.max(0, gridRect.height),
        };
      } else {
        plotRectRef.current = {
          left: 0,
          width: containerRect.width,
          top: 0,
          height: containerRect.height,
        };
      }
    };
    updatePlotRect();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chartWidthRef.current = entry.contentRect.width;
        updatePlotRect();
      }
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const updatePlotRect = () => {
    if (!chartRef.current) return;
    const containerRect = chartRef.current.getBoundingClientRect();
    const grid = chartRef.current.querySelector('.recharts-cartesian-grid') as HTMLElement | null;
    if (grid) {
      const gridRect = grid.getBoundingClientRect();
      plotRectRef.current = {
        left: Math.max(0, gridRect.left - containerRect.left),
        width: Math.max(0, gridRect.width),
        top: Math.max(0, gridRect.top - containerRect.top),
        height: Math.max(0, gridRect.height),
      };
    } else {
      plotRectRef.current = {
        left: 0,
        width: containerRect.width,
        top: 0,
        height: containerRect.height,
      };
    }
  };

  const updateOverlayByIndexRange = (startIndex: number, endIndex: number) => {
    if (!overlayRef.current || trendData.length === 0) return;
    const plotRect =
      plotRectRef.current ?? { left: 0, width: chartWidthRef.current || 0, top: 0, height: 0 };
    const width = plotRect.width;
    if (!width) return;
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const bucketWidth = width / trendData.length;
    const left = Math.max(plotRect.left, plotRect.left + (start - 0.5) * bucketWidth);
    const right = Math.min(
      plotRect.left + width,
      plotRect.left + (end + 0.5) * bucketWidth
    );
    const overlayWidth = Math.max(1, right - left);
    overlayRef.current.style.opacity = '1';
    overlayRef.current.style.left = `${left}px`;
    overlayRef.current.style.width = `${overlayWidth}px`;
    overlayRef.current.style.top = `${plotRect.top}px`;
    overlayRef.current.style.height = `${plotRect.height}px`;
  };

  const updateOverlayPixels = (startPx: number, endPx: number) => {
    const plotRect =
      plotRectRef.current ?? { left: 0, width: chartWidthRef.current || 0, top: 0, height: 0 };
    const plotWidth = plotRect.width;
    if (!plotWidth || trendData.length === 0) return;
    const bucketWidth = plotWidth / trendData.length;
    const startIndex = getIndexFromPixel(startPx, bucketWidth);
    const endIndex = getIndexFromPixel(endPx, bucketWidth);
    updateOverlayByIndexRange(startIndex, endIndex);
  };

  const updateOverlayByTimeRange = () => {
    if (!derivedRange) return;
    updateOverlayByIndexRange(derivedRange.startIndex, derivedRange.endIndex);
  };

  const getPlotMetrics = (clientX: number) => {
    const rect = chartRectRef.current ?? { left: 0, width: chartWidthRef.current || 1 };
    const plotRect = plotRectRef.current ?? { left: 0, width: rect.width, top: 0, height: 0 };
    const plotWidth = Math.max(1, plotRect.width);
    const pixel = Math.min(plotWidth, Math.max(0, clientX - rect.left - plotRect.left));
    return { pixel, plotWidth };
  };

  const getIndexFromPixel = (pixel: number, bucketWidth: number) => {
    const index = Math.floor(pixel / Math.max(1, bucketWidth) + 0.5);
    return Math.min(trendData.length - 1, Math.max(0, index));
  };

  useEffect(() => {
    if (!selectedRangeMs || !derivedRange) {
      hideOverlay();
      return;
    }
    updateOverlayByTimeRange();
  }, [derivedRange, selectedRangeMs, trendData]);

  useEffect(() => {
    if (!selectedRangeMs || trendData.length === 0) return;
    const { from, to } = selectedRangeMs;
    const windowStart = trendData[0]?.startMs ?? null;
    const windowEnd = trendData[trendData.length - 1]?.endMs ?? null;
    if (windowStart === null || windowEnd === null) return;
    if (from < windowStart || to > windowEnd) {
      setSelectedRangeMs(null);
      hideOverlay();
    }
  }, [selectedRangeMs, trendData]);

  return (
    <KpiCard
      title="Trends"
      value={null}
      icon={Activity}
      valueHidden
      valueSpacerClassName="h-1"
      className="relative"
    >
      <div className="absolute right-6 top-6">
        <Button
          onClick={() => setIsInsightsOpen(true)}
          className="h-9 px-5 text-sm font-semibold bg-warning text-warning-foreground hover:bg-warning/90 shadow-md shadow-warning/30"
        >
          AI Insights
        </Button>
      </div>
      <div className="flex w-full flex-col gap-1">
        <div className="flex w-full items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm font-bold text-foreground">
            Drag on the chart to select a time range.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Select
              value={selectedSource}
              onValueChange={(value) => onSourceChange?.(value as SourceKey)}
            >
              <SelectTrigger className="h-7 w-[120px] text-[11px] focus:ring-0 focus:ring-offset-0 ring-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {Object.entries(sourceConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            <Select
              value={displayRangeKey}
              onValueChange={(value) => onTimeFilterChange?.(value as TimeRangeKey)}
            >
              <SelectTrigger className="h-7 w-[120px] text-[11px] focus:ring-0 focus:ring-offset-0 ring-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeRanges).map(([key, range]) => (
                  <SelectItem key={key} value={key}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div
          className={[
            "relative h-96 w-full min-w-0 select-none",
            hasData ? "cursor-crosshair" : "",
            isInsightsOpen ? "pointer-events-none" : "",
          ].join(' ')}
          ref={chartRef}
          onMouseDown={(event) => {
            if (!chartRef.current || trendData.length === 0) return;
            window.getSelection?.()?.removeAllRanges();
            const rect = chartRef.current.getBoundingClientRect();
            chartRectRef.current = { left: rect.left, width: rect.width };
            chartWidthRef.current = rect.width;
            updatePlotRect();
            const { pixel, plotWidth } = getPlotMetrics(event.clientX);
            const bucketWidth = plotWidth / trendData.length;
            const index = getIndexFromPixel(pixel, bucketWidth);
            isSelectingRef.current = true;
            dragStartIndexRef.current = index;
            dragEndIndexRef.current = index;
            dragPixelStartRef.current = pixel;
            dragPixelEndRef.current = pixel;
            updateOverlayPixels(pixel, pixel);
          }}
          onMouseMove={(event) => {
            if (!isSelectingRef.current || !chartRef.current || trendData.length === 0) return;
            const { pixel, plotWidth } = getPlotMetrics(event.clientX);
            const bucketWidth = plotWidth / trendData.length;
            const index = getIndexFromPixel(pixel, bucketWidth);
            if (dragStartIndexRef.current === null) return;
            dragEndIndexRef.current = index;
            dragPixelEndRef.current = pixel;
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = null;
              if (dragPixelStartRef.current !== null && dragPixelEndRef.current !== null) {
                updateOverlayPixels(dragPixelStartRef.current, dragPixelEndRef.current);
              }
            });
          }}
          onMouseUp={() => {
            if (
              dragStartIndexRef.current === null ||
              dragEndIndexRef.current === null ||
              trendData.length === 0
            ) {
              isSelectingRef.current = false;
              hideOverlay();
              window.getSelection?.()?.removeAllRanges();
              return;
            }
            if (dragPixelStartRef.current === null || dragPixelEndRef.current === null) {
              isSelectingRef.current = false;
              hideOverlay();
              window.getSelection?.()?.removeAllRanges();
              return;
            }
            const plotWidth = plotRectRef.current?.width ?? chartRef.current?.clientWidth ?? 1;
            const bucketWidth = plotWidth / trendData.length;
            const startIndex = getIndexFromPixel(
              Math.min(dragPixelStartRef.current, dragPixelEndRef.current),
              bucketWidth
            );
            const endIndex = getIndexFromPixel(
              Math.max(dragPixelStartRef.current, dragPixelEndRef.current),
              bucketWidth
            );
            dragStartIndexRef.current = null;
            dragEndIndexRef.current = null;
            dragPixelStartRef.current = null;
            dragPixelEndRef.current = null;
            isSelectingRef.current = false;
            const startPoint = trendData[startIndex];
            const endPoint = trendData[endIndex];
            if (startPoint && endPoint) {
              setSelectedRangeMs({ from: startPoint.startMs, to: endPoint.endMs - 1 });
            }
            if (startPoint && endPoint && onTimeRangeSelect) {
              onTimeRangeSelect({
                from: new Date(startPoint.startMs),
                to: new Date(endPoint.endMs - 1),
              });
            }
            setSelectedRangeMs(null);
            hideOverlay();
            window.getSelection?.()?.removeAllRanges();
          }}
          onMouseLeave={() => {
            if (!isSelectingRef.current) return;
            isSelectingRef.current = false;
            dragStartIndexRef.current = null;
            dragEndIndexRef.current = null;
            dragPixelStartRef.current = null;
            dragPixelEndRef.current = null;
            hideOverlay();
            window.getSelection?.()?.removeAllRanges();
          }}
        >
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
                  width={24}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 4]}
                  tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
                  width={24}
                />
                <Tooltip content={<TrendsTooltip />} />
                <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                name="Tickets"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgUrgency"
                name="Avg Urgency"
                stroke="hsl(199 89% 48%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 text-xs text-muted-foreground">
              No trend data available.
            </div>
          )}
          {hasData && (
            <div
              ref={overlayRef}
              className="absolute z-20 rounded-md border border-primary/50 pointer-events-none"
              style={{
                left: 0,
                width: 0,
                opacity: 0,
                top: 0,
                height: 0,
                backgroundColor: 'hsl(var(--primary) / 0.2)',
              }}
            />
          )}
        </div>
        {isInsightsOpen && (
          <div className="absolute inset-0 z-40 pointer-events-auto">
            <div className="absolute inset-0 bg-background" />
            <div
              className="absolute left-6 right-6 bottom-6 top-16 overflow-auto rounded-lg border border-border/60 bg-background/90 p-4"
              ref={insightsPanelRef}
            >
              <button
                type="button"
                className="absolute right-5 top-5 z-10 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                aria-label="Close AI Insights"
                onClick={() => setIsInsightsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              {insightsContent ? (
                insightsContent
              ) : (
                <div className="text-xs text-muted-foreground">No insights available.</div>
              )}
            </div>
          </div>
        )}
        <div className="mt-2 text-sm font-semibold text-foreground text-center">{topSourceTheme}</div>
      </div>
    </KpiCard>
  );
}
