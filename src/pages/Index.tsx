import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { SourceDistribution } from '@/components/dashboard/SourceDistribution';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { FeedbackDetail } from '@/components/dashboard/FeedbackDetail';
import { KpiStrip } from '@/components/dashboard/KpiStrip';
import { EmergingThemesCard } from '@/components/dashboard/EmergingThemesCard';
import { categoryConfig, mockFeedback, FeedbackItem, FeedbackSource, Urgency } from '@/data/mockFeedback';
import { computeEmergingThemes } from '@/utils/emergingThemes';

const Index = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(mockFeedback);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSource, setActiveSource] = useState<FeedbackSource | 'all'>('all');
  const [activeUrgency, setActiveUrgency] = useState<Urgency | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);

  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = activeSource === 'all' || item.source === activeSource;
      const matchesUrgency = activeUrgency === 'all' || item.urgency === activeUrgency;

      return matchesSearch && matchesSource && matchesUrgency;
    });
  }, [feedback, searchQuery, activeSource, activeUrgency]);

  const kpiFilters = useMemo(
    () => ({
      source: activeSource === 'all' ? null : activeSource,
      urgency: activeUrgency === 'all' ? null : activeUrgency,
      search: searchQuery,
    }),
    [activeSource, activeUrgency, searchQuery]
  );

  const emergingThemes = useMemo(() => {
    const themes = Object.entries(categoryConfig).map(([theme_id, config]) => ({
      theme_id,
      name: config.label,
    }));
    return computeEmergingThemes(filteredFeedback, themes, new Date(), 7);
  }, [filteredFeedback]);

  const handleThemeSelect = (themeId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('theme_id', themeId);
    window.location.assign(`/themes?${params.toString()}`);
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
            activeUrgency={activeUrgency}
            onSourceChange={setActiveSource}
            onUrgencyChange={setActiveUrgency}
          />

          {/* KPI Strip */}
          <KpiStrip filters={kpiFilters} entries={feedback} />

          {/* Emerging Themes */}
          <EmergingThemesCard themes={emergingThemes} onSelectTheme={handleThemeSelect} />

          {/* AI Insights */}
          <AIInsights feedback={filteredFeedback} />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SentimentChart feedback={filteredFeedback} />
            <SourceDistribution feedback={filteredFeedback} />
            <CategoryChart feedback={filteredFeedback} />
          </div>

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
    </div>
  );
};

export default Index;
