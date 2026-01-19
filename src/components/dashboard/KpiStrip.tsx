import { memo, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart2, Info, ListChecks, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { KpiFilters, applyEntryFilters } from '@/lib/kpiUtils';
import { FeedbackItem, issueTypeConfig, sourceConfig } from '@/data/mockFeedback';

import type { Entry } from '@/lib/apiClient';

interface KpiStripProps {
  filters: KpiFilters;
  entries?: Entry[];
  extraCard?: React.ReactNode | ((issueTypesCard: React.ReactNode) => React.ReactNode);
  secondaryCard?: React.ReactNode | null;
  onSourceSelect?: (source: string) => void;
  extraRightCard?: React.ReactNode;
  isFiltering?: boolean;
}

function KpiStripComponent({
  filters,
  entries,
  extraCard,
  secondaryCard,
  onSourceSelect,
  extraRightCard,
  isFiltering = false,
}: KpiStripProps) {
  const entriesOverride = entries ? { items: entries, total: entries.length } : null;
  const { kpis, isLoading, error } = useDashboardKpis(filters, entriesOverride);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => applyEntryFilters(entries ?? [], filters),
    [entries, filters]
  );
  const feedbackEntries = filteredEntries as FeedbackItem[];
  const issueTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    const criticalCounts: Record<string, number> = {};
    feedbackEntries.forEach((entry) => {
      const issueType = entry.issueType ?? 'unknown';
      counts[issueType] = (counts[issueType] ?? 0) + 1;
      if (entry.urgency === 'critical') {
        criticalCounts[issueType] = (criticalCounts[issueType] ?? 0) + 1;
      }
    });
    const total = feedbackEntries.length || 1;
    const sorted = Object.entries(counts)
      .map(([issueType, count]) => ({
        issueType,
        count,
        percent: Math.max(2, Math.round((count / total) * 100)),
        criticalPercent: count ? Math.round(((criticalCounts[issueType] ?? 0) / count) * 100) : 0,
        label: issueTypeConfig[issueType as keyof typeof issueTypeConfig]?.label ?? issueType,
        color:
          issueTypeConfig[issueType as keyof typeof issueTypeConfig]?.color ??
          'bg-muted-foreground',
      }))
      .sort((a, b) => b.count - a.count);
    if (sorted.length <= 4) return sorted;
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4);
    const restCount = rest.reduce((sum, entry) => sum + entry.count, 0);
    const restPercent = Math.max(2, Math.round((restCount / total) * 100));
    return [
      ...top,
      {
        issueType: 'other',
        count: restCount,
        percent: restPercent,
        criticalPercent: restCount
          ? Math.round(
              (rest.reduce((sum, entry) => sum + entry.criticalPercent * entry.count, 0) / restCount)
            )
          : 0,
        label: 'Others',
        color: 'bg-muted-foreground',
        breakdown: rest.map((entry) => ({
          label: entry.label,
          count: entry.count,
          criticalPercent: entry.criticalPercent,
        })),
      },
    ];
  }, [feedbackEntries]);

  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const source = entry.source ?? 'unknown';
      counts[source] = (counts[source] ?? 0) + 1;
    });
    const total = filteredEntries.length || 1;
    const items = Object.entries(counts).map(([source, count]) => ({
      source,
      count,
      percent: Math.round((count / total) * 100),
      label: sourceConfig[source as keyof typeof sourceConfig]?.label ?? source,
    }));
    const top = [...items].sort((a, b) => b.count - a.count)[0]?.source ?? null;
    return { items, top };
  }, [filteredEntries]);

  const sentimentSummary = useMemo(() => {
    if (!filteredEntries.length) {
      return { text: '—', negativeDelta: null as number | null };
    }
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const key = (entry.sentiment ?? 'unknown').toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const total = filteredEntries.length;
    const build = (key: string, label: string) => {
      const value = counts[key] ?? 0;
      return `${label} ${Math.round((value / total) * 100)}%`;
    };
    return {
      text: [build('positive', 'Positive'), build('neutral', 'Neutral'), build('negative', 'Negative')].join(' | '),
      negativeDelta: null as number | null,
    };
  }, [filteredEntries]);

  const topSourceSummary = useMemo(() => {
    if (!filteredEntries.length) return '—';
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const source = entry.source ?? 'unknown';
      counts[source] = (counts[source] ?? 0) + 1;
    });
    const total = filteredEntries.length;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return '—';
    const [sourceKey, count] = top;
    const label = sourceConfig[sourceKey as keyof typeof sourceConfig]?.label ?? sourceKey;
    const percent = Math.round((count / total) * 100);
    const themeCounts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
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
  }, [filteredEntries]);

  const negativeDelta = useMemo(() => {
    if (!entries || !filters.from || !filters.to) return null;
    const from = new Date(filters.from);
    const to = new Date(filters.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
    const windowMs = to.getTime() - from.getTime();
    if (windowMs <= 0) return null;
    const previousFrom = new Date(from.getTime() - windowMs);
    const previousTo = new Date(from.getTime());
    const previousFilters: KpiFilters = {
      ...filters,
      from: previousFrom,
      to: previousTo,
    };
    const previousEntries = applyEntryFilters(entries, previousFilters);
    const previousTotal = previousEntries.length;
    if (!previousTotal) return null;
    const prevNegative = previousEntries.filter((entry) => entry.sentiment === 'negative').length;
    const prevPercent = (prevNegative / previousTotal) * 100;
    const currentNegative =
      filteredEntries.filter((entry) => entry.sentiment === 'negative').length;
    const currentPercent = (currentNegative / filteredEntries.length) * 100;
    return currentPercent - prevPercent;
  }, [entries, filters, filteredEntries]);

  const topIssueTypeLabel = kpis.topIssueType
    ? issueTypeConfig[kpis.topIssueType.issueType as keyof typeof issueTypeConfig]?.label ??
      kpis.topIssueType.issueType
    : '—';

  const sourceColors: Record<string, string> = {
    support: 'hsl(var(--info))',
    discord: '#5865F2',
    github: 'hsl(var(--foreground))',
    twitter: 'hsl(199 89% 48%)',
    email: 'hsl(var(--warning))',
    forum: 'hsl(var(--success))',
    unknown: 'hsl(var(--muted-foreground))',
  };

  const deltaInfo = useMemo(() => {
    if (!entries || !filters.from || !filters.to) {
      return null;
    }
    const from = new Date(filters.from);
    const to = new Date(filters.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return null;
    }
    const windowMs = to.getTime() - from.getTime();
    if (windowMs <= 0) {
      return null;
    }
    const previousFrom = new Date(from.getTime() - windowMs);
    const previousTo = new Date(from.getTime());
    const previousFilters: KpiFilters = {
      ...filters,
      from: previousFrom,
      to: previousTo,
    };
    const previousEntries = applyEntryFilters(entries, previousFilters);
    const previousCount = previousEntries.length;
    const currentCount = filteredEntries.length;
    if (previousCount === 0) {
      return { percent: null, direction: 'up' as const };
    }
    const percent = ((currentCount - previousCount) / previousCount) * 100;
    return {
      percent,
      direction: percent >= 0 ? 'up' : 'down',
    };
  }, [entries, filters, filteredEntries.length]);

  const issueTypesCard = (
    <KpiCard
      title="Themes"
      value={null}
      isLoading={isLoading}
      icon={BarChart2}
      titleRight={
        isFiltering ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null
      }
      valueHidden
      valueSpacerClassName="h-1"
    >
      <div className="mt-2 flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-xs space-y-1">
          {issueTypeData.map((entry) => {
            const isTop = entry.issueType === kpis.topIssueType?.issueType;
            return (
              <div key={entry.issueType} className="w-full space-y-0.5">
                <div
                  className={[
                    "flex items-center justify-between text-xs",
                    isTop ? "text-foreground font-semibold" : "text-muted-foreground",
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {entry.label}
                    {entry.issueType !== 'other' && (
                      <span className="text-[10px] text-muted-foreground">
                        ({entry.criticalPercent}% critical)
                      </span>
                    )}
                    {entry.issueType === 'other' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Other themes info"
                            >
                              <Info className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-xs whitespace-normal">
                            <div className="space-y-1">
                              {'breakdown' in entry &&
                                entry.breakdown?.map((item: { label: string; count: number; criticalPercent: number }) => (
                                  <p key={item.label}>
                                    {item.label}: {item.count} ({item.criticalPercent}% critical)
                                  </p>
                                ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                  <span>{entry.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${entry.color} ${isTop ? "shadow-[0_0_12px_hsl(var(--primary)/0.6)]" : ""}`}
                    style={{ width: `${entry.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </KpiCard>
  );

  const resolvedExtraCard =
    typeof extraCard === 'function' ? extraCard(issueTypesCard) : extraCard;

  const hasSecondary = secondaryCard !== null;
  const resolvedSecondaryCard = secondaryCard ?? issueTypesCard;
  const gridClassName = extraRightCard
    ? "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-[4.5fr_2.5fr_2.5fr_2.5fr] auto-rows-fr"
    : hasSecondary
    ? "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-[4fr_2fr_5fr] auto-rows-fr"
    : "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-[2.6fr_1.6fr] auto-rows-fr";

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className={gridClassName}>
        <div className="xl:col-span-1">
          <KpiCard
            title="Ticket Counter"
            value={
              <span className="flex items-center gap-2">
                <span>
                  {kpis.totalEntries ?? '—'}{' '}
                  <span className="text-base font-semibold">tickets</span>
                </span>
                {deltaInfo && deltaInfo.percent !== null && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {deltaInfo.direction === 'up' ? (
                      <TrendingUp className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {Math.abs(deltaInfo.percent).toFixed(1)}%
                    {deltaInfo.direction === 'up' ? ' increase' : ' decrease'}
                  </span>
                )}
              </span>
            }
            isLoading={isLoading}
            icon={ListChecks}
            titleRight={
              isFiltering ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null
            }
            tooltip={
              <div className="space-y-1 text-xs">
                <p>• Total tickets = entries after Source and Time filters</p>
                <p>• Delta % = (current - previous) / previous using the prior window</p>
                <p>• Sentiment % = sentiment / total</p>
                <p>• Negative % change = current Negative% - previous Negative%</p>
              </div>
            }
          >
            <div className="text-[11px] font-semibold text-foreground whitespace-nowrap">
              {topSourceSummary}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>{sentimentSummary.text}</span>
              {negativeDelta !== null && (
                <span className="inline-flex items-center gap-1">
                  {negativeDelta >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-success" />
                  )}
                  {Math.abs(negativeDelta).toFixed(1)}% Negative
                </span>
              )}
            </div>
            {sourceData.items.length > 0 && (
              <div
                className="mt-3 grid items-center gap-4 [grid-template-columns:minmax(240px,1fr)_1px_auto]"
                onMouseLeave={() => {
                  setHoveredSource(null);
                  setActiveSource(null);
                }}
              >
                <div className="min-w-[240px]">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart
                        onClick={(state: { activePayload?: Array<{ payload?: { source?: string } }> }) => {
                          const source = state?.activePayload?.[0]?.payload?.source;
                          if (source) {
                            setActiveSource(source);
                            onSourceSelect?.(source);
                          }
                        }}
                        onPointerDown={(state: { activePayload?: Array<{ payload?: { source?: string } }> }) => {
                          const source = state?.activePayload?.[0]?.payload?.source;
                          if (source) {
                            setActiveSource(source);
                            onSourceSelect?.(source);
                          }
                        }}
                      >
                        <Pie
                          data={sourceData.items}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={44}
                          outerRadius={106}
                          paddingAngle={2}
                          onClick={(data) => {
                            const source =
                              (data as { source?: string })?.source ??
                              (data as { payload?: { source?: string } })?.payload?.source;
                            if (source) {
                              setActiveSource(source);
                              onSourceSelect?.(source);
                            }
                          }}
                          onPointerDown={(data) => {
                            const source =
                              (data as { source?: string })?.source ??
                              (data as { payload?: { source?: string } })?.payload?.source;
                            if (source) {
                              setActiveSource(source);
                              onSourceSelect?.(source);
                            }
                          }}
                          style={onSourceSelect ? { cursor: 'pointer' } : undefined}
                        >
                          {sourceData.items.map((entry) => (
                            <Cell
                              key={entry.source}
                              fill={sourceColors[entry.source] ?? sourceColors.unknown}
                              opacity={
                                (hoveredSource && hoveredSource !== entry.source) ||
                                (activeSource && activeSource !== entry.source)
                                  ? 0.2
                                  : 1
                              }
                              onMouseEnter={() => setHoveredSource(entry.source)}
                              onClick={() => {
                                setActiveSource(entry.source);
                                onSourceSelect?.(entry.source);
                              }}
                              onPointerDown={() => {
                                setActiveSource(entry.source);
                                onSourceSelect?.(entry.source);
                              }}
                              className={onSourceSelect ? "cursor-pointer" : undefined}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-px bg-border/70" />
                <div className="space-y-1 text-xs text-muted-foreground w-fit self-center">
                  {[...sourceData.items]
                    .sort((a, b) => b.count - a.count)
                    .map((entry) => {
                      const isHovered = hoveredSource === entry.source;
                      const isActive = activeSource === entry.source;
                      const isDimmed = (hoveredSource && !isHovered) || (activeSource && !isActive);
                      return (
                        <div
                          key={entry.source}
                          onClick={() => {
                            setActiveSource(entry.source);
                            onSourceSelect?.(entry.source);
                          }}
                          className={[
                            "flex items-center gap-2 transition-opacity whitespace-nowrap",
                            isDimmed ? "opacity-30" : "opacity-100",
                            onSourceSelect ? "cursor-pointer" : "",
                          ].join(' ')}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sourceColors[entry.source] ?? sourceColors.unknown }}
                          />
                          <span
                            onMouseEnter={() => setHoveredSource(entry.source)}
                            onMouseLeave={() => setHoveredSource(null)}
                            className={[
                              isHovered || isActive ? "font-semibold text-foreground" : "",
                              !hoveredSource && !activeSource && entry.source === sourceData.top ? "font-semibold text-foreground" : "",
                            ].join(' ')}
                          >
                            {entry.label} {entry.percent}% ({entry.count})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </KpiCard>
        </div>
        {resolvedExtraCard && <div className="xl:col-span-1">{resolvedExtraCard}</div>}
        {hasSecondary && <div className="xl:col-span-1">{resolvedSecondaryCard}</div>}
        {extraRightCard && <div className="xl:col-span-1">{extraRightCard}</div>}
      </div>
    </div>
  );
}

export const KpiStrip = memo(KpiStripComponent);

KpiStrip.displayName = 'KpiStrip';
