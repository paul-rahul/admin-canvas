import { useEffect, useMemo, useState } from 'react';
import type { EntriesResponse, Theme, Trends } from '@/lib/apiClient';
import { apiClient } from '@/lib/apiClient';
import {
  KpiFilters,
  applyEntryFilters,
  computeCriticalPercentage,
  computeNegativePercentage,
  computeTopIssueType,
  deriveThemesFromEntries,
} from '@/lib/kpiUtils';
import { computeEmergingThemes } from '@/utils/emergingThemes';

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
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
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
        const themesResponse = await apiClient.getThemes();
        const trendsResponse = await apiClient.getTrends();

        if (!isMounted) return;
        setEntries(entriesResponse);
        setThemes(themesResponse);
        setTrends(trendsResponse);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load KPI data');
        setEntries(null);
        setThemes(null);
        setTrends(null);
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
    const derivedThemes = filteredEntries.length ? deriveThemesFromEntries(filteredEntries) : [];
    const resolvedThemes = themes ?? (derivedThemes.length ? derivedThemes : null);
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
    const themesForKpis = hasFilters ? derivedThemes : resolvedThemes;
    const totalThemes = themesForKpis?.length ?? null;
    const negativePercent = computeNegativePercentage(filteredEntries, themesForKpis);
    const criticalPercent = computeCriticalPercentage(filteredEntries, themesForKpis);
    const topIssueType = computeTopIssueType(filteredEntries);
    const emergingThemes = computeEmergingThemes(filteredEntries, themesForKpis ?? [], new Date(), 7);

    return {
      totalEntries,
      totalThemes,
      negativePercent,
      criticalPercent,
      topIssueType,
      emergingThemes: emergingThemes.length ? emergingThemes.length : null,
    };
  }, [entries, themes, trends, filters]);

  return { kpis, isLoading, error };
};
