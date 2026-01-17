import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart2, ListChecks } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { KpiFilters, applyEntryFilters } from '@/lib/kpiUtils';
import { FeedbackItem, issueTypeConfig, sourceConfig } from '@/data/mockFeedback';

import type { Entry } from '@/lib/apiClient';

interface KpiStripProps {
  filters: KpiFilters;
  entries?: Entry[];
  extraCard?: React.ReactNode | ((issueTypesCard: React.ReactNode) => React.ReactNode);
  secondaryCard?: React.ReactNode;
  onSourceSelect?: (source: string) => void;
  extraRightCard?: React.ReactNode;
}

export function KpiStrip({
  filters,
  entries,
  extraCard,
  secondaryCard,
  onSourceSelect,
  extraRightCard,
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
    feedbackEntries.forEach((entry) => {
      const issueType = entry.issueType ?? 'unknown';
      counts[issueType] = (counts[issueType] ?? 0) + 1;
    });
    const total = feedbackEntries.length || 1;
    return Object.entries(counts)
      .map(([issueType, count]) => ({
        issueType,
        count,
        percent: Math.max(2, Math.round((count / total) * 100)),
        label: issueTypeConfig[issueType as keyof typeof issueTypeConfig]?.label ?? issueType,
        color:
          issueTypeConfig[issueType as keyof typeof issueTypeConfig]?.color ??
          'bg-muted-foreground',
      }))
      .sort((a, b) => b.count - a.count);
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

  const issueTypesCard = (
    <KpiCard
      title="Issue Types"
      value={null}
      isLoading={isLoading}
      icon={BarChart2}
      tooltip="Total issues in view"
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
                  <span>{entry.label}</span>
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

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-[4.5fr_2.5fr_2.5fr_2.5fr] auto-rows-fr">
        <div className="xl:col-span-1">
          <KpiCard
            title="Ticket Counter"
            value={
              <span>
                {kpis.totalEntries ?? '—'} <span className="text-base font-semibold">tickets</span>
              </span>
            }
            isLoading={isLoading}
            icon={ListChecks}
            tooltip="Within current filters"
          >
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
        <div className="xl:col-span-1">{secondaryCard ?? issueTypesCard}</div>
        {extraRightCard && <div className="xl:col-span-1">{extraRightCard}</div>}
      </div>
    </div>
  );
}
