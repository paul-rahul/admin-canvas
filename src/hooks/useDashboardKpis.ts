import { useEffect, useMemo, useState } from 'react';
import type { EntriesResponse } from '@/lib/apiClient';
import { apiClient } from '@/lib/apiClient';
import {
  KpiFilters,
  applyEntryFilters,
  computeTopIssueType,
} from '@/lib/kpiUtils';

type KpiData = {
  totalEntries: number | null;
  totalThemes: number | null;
  negativePercent: number | null;
  criticalPercent: number | null;
  topIssueType: { issueType: string; count: number } | null;
  emergingThemes: number | null;
};

export const useDashboardKpis = (filters: KpiFilters, entriesOverride?: EntriesResponse | null) => {
  const [entries, setEntries] = useState<EntriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (entriesOverride) {
      setEntries(entriesOverride);
      setIsLoading(false);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const entriesResponse = await apiClient.getEntries({
          from: filters.from ? String(filters.from) : undefined,
          to: filters.to ? String(filters.to) : undefined,
          source: filters.source ?? undefined,
          sentiment: filters.sentiment ?? undefined,
          urgency: filters.urgency ?? undefined,
          page_size: '1000',
          search: filters.search ?? undefined,
        });
        if (!isMounted) return;
        setEntries(entriesResponse);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load KPI data');
        setEntries(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [filters, entriesOverride]);

  const kpis = useMemo<KpiData>(() => {
    const entryItems = entries?.items ?? [];
    const filteredEntries = applyEntryFilters(entryItems, filters);
    const hasFilters =
      Boolean(filters.from) ||
      Boolean(filters.to) ||
      Boolean(filters.source) ||
      Boolean(filters.sentiment) ||
      Boolean(filters.urgency) ||
      Boolean(filters.search);

    const totalEntries = hasFilters
      ? filteredEntries.length
      : entries?.total ?? filteredEntries.length ?? null;
    const topIssueType = computeTopIssueType(filteredEntries);

    return {
      totalEntries,
      totalThemes: null,
      negativePercent: null,
      criticalPercent: null,
      topIssueType,
      emergingThemes: null,
    };
  }, [entries, filters]);

  return { kpis, isLoading, error };
};
