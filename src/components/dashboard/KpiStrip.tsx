import { KpiCard } from '@/components/dashboard/KpiCard';
import { useDashboardKpis } from '@/hooks/useDashboardKpis';
import { KpiFilters, formatPercent, getTopSourceLabel } from '@/lib/kpiUtils';

import type { Entry } from '@/lib/apiClient';

interface KpiStripProps {
  filters: KpiFilters;
  entries?: Entry[];
}

export function KpiStrip({ filters, entries }: KpiStripProps) {
  const entriesOverride = entries ? { items: entries, total: entries.length } : null;
  const { kpis, isLoading, error } = useDashboardKpis(filters, entriesOverride);

  const topSourceLabel = kpis.topSource ? getTopSourceLabel(kpis.topSource.source) : '—';
  const topSourceSubtext = kpis.topSource ? `${topSourceLabel} (${kpis.topSource.count})` : undefined;

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Total Entries"
          value={kpis.totalEntries ?? '—'}
          subtext="Within current filters"
          isLoading={isLoading}
        />
        <KpiCard
          title="Percentage Critical"
          value={formatPercent(kpis.criticalPercent)}
          subtext="Critical urgency share"
          isLoading={isLoading}
        />
        <KpiCard
          title="Top Source"
          value={topSourceLabel}
          subtext={topSourceSubtext}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
