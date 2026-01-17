import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { FeedbackDetail } from '@/components/dashboard/FeedbackDetail';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { EmergingThemesCard } from '@/components/dashboard/EmergingThemesCard';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { IssueTrendModal } from '@/components/dashboard/IssueTrendModal';
import { issueTypeConfig, mockFeedback, FeedbackItem, FeedbackSource } from '@/data/mockFeedback';
import { computeEmergingThemes } from '@/utils/emergingThemes';
import { formatPercent } from '@/lib/kpiUtils';
import { AlertTriangle } from 'lucide-react';

const Index = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(mockFeedback);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSource, setActiveSource] = useState<FeedbackSource | 'all'>('all');
  const [activeTime, setActiveTime] = useState<'24h' | '7d' | '30d' | 'all' | 'custom'>('7d');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [customRange, setCustomRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [trendThemeId, setTrendThemeId] = useState<string | null>(null);
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const defaultCustomRange = () => {
    const now = new Date();
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now };
  };

  const normalizeRange = (range: { from: Date | null; to: Date | null }) => {
    if (range.from && range.to && range.from > range.to) {
      return { from: range.to, to: range.from };
    }
    return range;
  };

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

    return feedback.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = activeSource === 'all' || item.source === activeSource;
      const matchesTime =
        activeTime === 'custom'
          ? (!customRange.from || (item.timestamp && item.timestamp >= customRange.from)) &&
            (!customRange.to || (item.timestamp && item.timestamp <= customRange.to))
          : !timeWindow || (item.timestamp && now - item.timestamp.getTime() <= timeWindow);

      return matchesSearch && matchesSource && matchesTime;
    });
  }, [feedback, searchQuery, activeSource, activeTime, customRange]);

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
      search: searchQuery,
    }),
    [activeSource, activeTime, searchQuery, customRange]
  );

  const feedbackForEmerging = useMemo(() => {
    return feedback.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = activeSource === 'all' || item.source === activeSource;
      return matchesSearch && matchesSource;
    });
  }, [feedback, searchQuery, activeSource]);

  const emergingThemes = useMemo(() => {
    const themes = Object.entries(issueTypeConfig).map(([theme_id, config]) => ({
      theme_id,
      name: config.label,
    }));
    const dayMs = 24 * 60 * 60 * 1000;
    const customDays =
      activeTime === 'custom' && customRange.from && customRange.to
        ? Math.max(1, Math.round((customRange.to.getTime() - customRange.from.getTime()) / dayMs))
        : null;
    const windowDays =
      customDays ??
      (activeTime === '24h' ? 1 : activeTime === '7d' ? 7 : activeTime === '30d' ? 30 : 30);
    const endDate = activeTime === 'custom' && customRange.to ? customRange.to : new Date();
    return computeEmergingThemes(feedbackForEmerging, themes, endDate, windowDays, 3);
  }, [feedbackForEmerging, activeTime, customRange]);

  const criticalPercent = useMemo(() => {
    const total = filteredFeedback.length;
    if (!total) return '—';
    const criticalCount = filteredFeedback.filter((item) => item.urgency === 'critical').length;
    return formatPercent((criticalCount / total) * 100);
  }, [filteredFeedback]);

  const criticalCount = useMemo(
    () => filteredFeedback.filter((item) => item.urgency === 'critical' && !item.resolved).length,
    [filteredFeedback]
  );

  const handleThemeSelect = (themeId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('theme_id', themeId);
    window.location.assign(`/themes?${params.toString()}`);
  };

  const handleViewTrend = (themeId: string) => {
    setTrendThemeId(themeId);
    setIsTrendOpen(true);
  };


  const loadFeedback = async () => {
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
    }
  };

  useEffect(() => {
    void loadFeedback();
  }, []);

  const handleRefresh = () => {
    void loadFeedback();
  };

  const handleResolve = (id: string) => {
    setFeedback((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
    );
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-info/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header onSearch={setSearchQuery} onRefresh={handleRefresh} />

        <main className="container mx-auto px-6 py-8 space-y-6">
          {/* Filters */}
          <FilterBar
            activeSource={activeSource}
            activeTime={activeTime}
            onSourceChange={setActiveSource}
            onTimeChange={(time) => {
              setActiveTime(time);
              if (time === 'custom') {
                setCustomRange(defaultCustomRange());
              }
            }}
            customRange={customRange}
            onCustomRangeChange={(range) => {
              setCustomRange(normalizeRange(range));
              setActiveTime('custom');
            }}
          />

          {/* KPI Strip */}
          <KpiStrip
            filters={kpiFilters}
            entries={feedback}
            onSourceSelect={(source) => {
              setActiveSource(source as FeedbackSource);
            }}
            extraCard={(issueTypesCard) => (
              <div className="grid h-full grid-rows-[1fr_auto] gap-4">
                <KpiCard
                  title="Critical Issues"
                  value={criticalPercent}
                  icon={AlertTriangle}
                  tooltip="Computed as unresolved items where urgency is critical within the current time window."
                  subtext={
                    <span>
                      <span className="font-semibold text-foreground">{criticalCount}</span>{' '}
                      <span className="font-semibold text-foreground">unresolved</span> critical tickets require
                      immediate attention.
                    </span>
                  }
                  className="h-full"
                />
                <div className="h-full">{issueTypesCard}</div>
              </div>
            )}
            secondaryCard={
              <EmergingThemesCard
                themes={emergingThemes}
                onSelectTheme={handleThemeSelect}
                onViewTrend={handleViewTrend}
              />
            }
            extraRightCard={<AIInsights feedback={filteredFeedback} />}
          />

          {/* Charts Row */}

          {/* Feedback Table */}
          <FeedbackTable feedback={filteredFeedback} onSelect={setSelectedItem} />
        </main>
      </div>

      {/* Detail Modal */}
      <FeedbackDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onResolve={handleResolve}
      />
      <IssueTrendModal
        open={isTrendOpen}
        onOpenChange={setIsTrendOpen}
        entries={feedbackForEmerging}
        summaryEntries={feedbackForEmerging}
        issueTypeId={trendThemeId}
        issueTypeLabel={
          trendThemeId
            ? issueTypeConfig[trendThemeId as keyof typeof issueTypeConfig]?.label ?? trendThemeId
            : null
        }
        onTimeRangeSelect={(range) => {
          setCustomRange(normalizeRange(range));
          setActiveTime('custom');
        }}
      />
    </div>
  );
};

export default Index;
