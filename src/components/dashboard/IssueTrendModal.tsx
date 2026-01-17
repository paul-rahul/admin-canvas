import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, ReferenceArea } from 'recharts';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeConfig, sourceConfig, type FeedbackItem } from '@/data/mockFeedback';

type TimeRangeKey = '1d' | '7d' | '1m' | '3m' | '6m' | '1y';

const DAY_MS = 24 * 60 * 60 * 1000;

const timeRanges: Record<
  TimeRangeKey,
  { label: string; windowMs: number; bucketMs: number; formatString: string }
> = {
  '1d': { label: '1 day', windowMs: DAY_MS, bucketMs: 60 * 60 * 1000, formatString: 'ha' },
  '7d': { label: '7 days', windowMs: 7 * DAY_MS, bucketMs: DAY_MS, formatString: 'MMM d' },
  '1m': { label: '1 month', windowMs: 30 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '3m': { label: '3 months', windowMs: 90 * DAY_MS, bucketMs: 7 * DAY_MS, formatString: 'MMM d' },
  '6m': { label: '6 months', windowMs: 180 * DAY_MS, bucketMs: 14 * DAY_MS, formatString: 'MMM d' },
  '1y': { label: '1 year', windowMs: 365 * DAY_MS, bucketMs: 30 * DAY_MS, formatString: 'MMM d' },
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

interface IssueTrendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: FeedbackItem[];
  summaryEntries: FeedbackItem[];
  issueTypeId: string | null;
  issueTypeLabel: string | null;
  onTimeRangeSelect?: (range: { from: Date; to: Date }) => void;
}

export function IssueTrendModal({
  open,
  onOpenChange,
  entries,
  summaryEntries,
  issueTypeId,
  issueTypeLabel,
  onTimeRangeSelect,
}: IssueTrendModalProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('7d');
  const [selectedRangeMs, setSelectedRangeMs] = useState<{ from: number; to: number } | null>(null);
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

  const trendData = useMemo<TrendPoint[]>(() => {
    if (!issueTypeId) return [];
    const config = timeRanges[timeRange];
    const now = new Date();
    const alignedEnd = new Date(now);
    if (config.bucketMs >= DAY_MS) {
      alignedEnd.setHours(0, 0, 0, 0);
      alignedEnd.setTime(alignedEnd.getTime() + DAY_MS);
    } else {
      alignedEnd.setMinutes(0, 0, 0);
      alignedEnd.setTime(alignedEnd.getTime() + 60 * 60 * 1000);
    }
    const endMs = alignedEnd.getTime();
    const start = endMs - config.windowMs;
    const bucketCount = Math.max(1, Math.ceil(config.windowMs / config.bucketMs));

    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      start: start + index * config.bucketMs,
      count: 0,
      urgencySum: 0,
      urgencyCount: 0,
    }));

    entries.forEach((entry) => {
      if (entry.issueType !== issueTypeId) return;
      const timestamp = entry.timestamp?.getTime?.() ?? null;
      if (!timestamp || timestamp < start || timestamp >= endMs) return;
      const bucketIndex = Math.min(
        buckets.length - 1,
        Math.max(0, Math.floor((timestamp - start) / config.bucketMs))
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
      label: format(new Date(bucket.start), config.formatString),
      count: bucket.count,
      avgUrgency: bucket.urgencyCount ? bucket.urgencySum / bucket.urgencyCount : null,
      startMs: bucket.start,
      endMs: bucket.start + config.bucketMs,
    }));
  }, [entries, issueTypeId, timeRange]);

  const hasData = trendData.some((point) => point.count > 0);

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

  const selectedRangeData = useMemo(() => {
    if (!derivedRange || !selectedRangeMs) return null;
    return { startMs: selectedRangeMs.from, endMs: selectedRangeMs.to };
  }, [derivedRange, selectedRangeMs]);

  const summary = useMemo(() => {
    if (!selectedRangeData) return null;
    const { startMs, endMs } = selectedRangeData;
    const entriesInRange = summaryEntries.filter((entry) => {
      const timestamp = entry.timestamp?.getTime?.() ?? null;
      if (!timestamp) return false;
      return timestamp >= startMs && timestamp <= endMs;
    });

    const total = entriesInRange.length;
    const bucketCount =
      derivedRange && derivedRange.endIndex >= derivedRange.startIndex
        ? derivedRange.endIndex - derivedRange.startIndex + 1
        : 0;
    const avgPerBucket = bucketCount ? total / bucketCount : 0;

    const sourceCounts: Record<string, number> = {};
    const issueTypeCounts: Record<string, number> = {};
    entriesInRange.forEach((entry) => {
      if (entry.source) {
        sourceCounts[entry.source] = (sourceCounts[entry.source] ?? 0) + 1;
      }
      if (entry.issueType) {
        issueTypeCounts[entry.issueType] = (issueTypeCounts[entry.issueType] ?? 0) + 1;
      }
    });

    const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] ?? null;
    const topIssueType = Object.entries(issueTypeCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

    return {
      total,
      avgPerBucket,
      topSource,
      topIssueType,
    };
  }, [derivedRange, selectedRangeData, summaryEntries]);

  useEffect(() => {
    dragStartIndexRef.current = null;
    dragEndIndexRef.current = null;
    isSelectingRef.current = false;
    dragPixelStartRef.current = null;
    dragPixelEndRef.current = null;
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
    }
  }, [issueTypeId, timeRange]);

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
    if (!plotWidth) return;
    const bucketWidth = plotWidth / trendData.length;
    const startIndex = getIndexFromPixel(startPx, bucketWidth);
    const endIndex = getIndexFromPixel(endPx, bucketWidth);
    updateOverlayByIndexRange(startIndex, endIndex);
  };

  const updateOverlayByTimeRange = (from: number, to: number) => {
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

  const hideOverlay = () => {
    if (!overlayRef.current) return;
    overlayRef.current.style.opacity = '0';
  };

  useEffect(() => {
    if (!selectedRangeMs || !derivedRange) {
      hideOverlay();
      return;
    }
    updateOverlayByTimeRange(selectedRangeMs.from, selectedRangeMs.to);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-10">
            <DialogTitle>Trend</DialogTitle>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeKey)}>
              <SelectTrigger className="h-8 w-[140px]">
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
          <p className="text-xs text-muted-foreground">
            {issueTypeLabel ? `${issueTypeLabel} · ` : ''}Ticket count and average urgency are shown over the selected time range.
          </p>
        </DialogHeader>

        <div className="relative h-72 w-full select-none" ref={chartRef}>
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 4]}
                  tick={{ fontSize: 11, fill: 'hsl(215, 20%, 55%)' }}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(222, 47%, 10%)',
                    border: '1px solid hsl(222, 47%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Avg Urgency') {
                      return [value.toFixed(2), 'Avg Urgency'];
                    }
                    return [value, 'Tickets'];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Tickets"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgUrgency"
                  name="Avg Urgency"
                  stroke="hsl(199 89% 48%)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
              No data available for this time range.
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
          {hasData && (
            <div
              className="absolute inset-0 z-30 cursor-crosshair"
              role="presentation"
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
            />
          )}
        </div>
        {summary && (
          <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Total tickets</span>
              <span className="font-semibold text-foreground">{summary.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg per bucket</span>
              <span className="font-semibold text-foreground">{summary.avgPerBucket.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Top source</span>
              <span className="font-semibold text-foreground">
                {summary.topSource
                  ? `${sourceConfig[summary.topSource[0] as keyof typeof sourceConfig]?.label ?? summary.topSource[0]} (${summary.topSource[1]})`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Top issue type</span>
              <span className="font-semibold text-foreground">
                {summary.topIssueType
                  ? `${issueTypeConfig[summary.topIssueType[0] as keyof typeof issueTypeConfig]?.label ?? summary.topIssueType[0]} (${summary.topIssueType[1]})`
                  : '—'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
