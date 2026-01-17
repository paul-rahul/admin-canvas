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
  extraCard?: React.ReactNode;
  onSourceSelect?: (source: string) => void;
}

export function KpiStrip({ filters, entries, extraCard, onSourceSelect }: KpiStripProps) {
  const entriesOverride = entries ? { items: entries, total: entries.length } : null;
  const { kpis, isLoading, error } = useDashboardKpis(filters, entriesOverride);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-12 auto-rows-fr">
        <div className="xl:col-span-7">
          <KpiCard
            title="Total Entries"
            value={kpis.totalEntries ?? '—'}
            isLoading={isLoading}
            icon={ListChecks}
            tooltip="Within current filters"
          >
            {sourceData.items.length > 0 && (
              <div
                className="mt-3 grid items-stretch gap-4 [grid-template-columns:minmax(240px,1fr)_1px_auto]"
                onMouseLeave={() => setHoveredSource(null)}
              >
                <div className="min-w-[240px]">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData.items}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={44}
                          outerRadius={106}
                          paddingAngle={2}
                        >
                          {sourceData.items.map((entry) => (
                          <Cell
                            key={entry.source}
                            fill={sourceColors[entry.source] ?? sourceColors.unknown}
                            opacity={hoveredSource && hoveredSource !== entry.source ? 0.2 : 1}
                            onMouseEnter={() => setHoveredSource(entry.source)}
                            onClick={() => onSourceSelect?.(entry.source)}
                            className={onSourceSelect ? "cursor-pointer" : undefined}
                          />
                        ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-px bg-border/70" />
                <div className="space-y-1 text-xs text-muted-foreground w-fit">
                  {[...sourceData.items]
                    .sort((a, b) => b.count - a.count)
                    .map((entry) => {
                      const isHovered = hoveredSource === entry.source;
                      const isDimmed = hoveredSource && !isHovered;
                      return (
                        <div
                          key={entry.source}
                          className={[
                            "flex items-center gap-2 transition-opacity whitespace-nowrap",
                            isDimmed ? "opacity-30" : "opacity-100",
                          ].join(' ')}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: sourceColors[entry.source] ?? sourceColors.unknown }}
                          />
                          <span
                            onMouseEnter={() => setHoveredSource(entry.source)}
                            onMouseLeave={() => setHoveredSource(null)}
                            onClick={() => onSourceSelect?.(entry.source)}
                            className={[
                              isHovered ? "font-semibold text-foreground" : "",
                              !hoveredSource && entry.source === sourceData.top ? "font-semibold text-foreground" : "",
                              onSourceSelect ? "cursor-pointer" : "",
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
        <div className="xl:col-span-2">
          <KpiCard
            title="Issue Counter"
            value={kpis.totalEntries ?? '—'}
            isLoading={isLoading}
            icon={BarChart2}
            tooltip="Total issues in view"
          >
            <div className="mt-3 space-y-2">
              {issueTypeData.map((entry) => {
                const isTop = entry.issueType === kpis.topIssueType?.issueType;
                return (
                  <div key={entry.issueType} className="space-y-1">
                    <div
                      className={[
                        "flex items-center justify-between text-xs",
                        isTop ? "text-foreground font-semibold" : "text-muted-foreground",
                      ].join(' ')}
                    >
                      <span>{entry.label}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${entry.color} ${isTop ? "shadow-[0_0_12px_hsl(var(--primary)/0.6)]" : ""}`}
                        style={{ width: `${entry.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </KpiCard>
        </div>
        {extraCard && <div className="xl:col-span-3">{extraCard}</div>}
      </div>
    </div>
  );
}
