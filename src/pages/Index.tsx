import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FeedbackTable } from '@/components/dashboard/FeedbackTable';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { SourceDistribution } from '@/components/dashboard/SourceDistribution';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { FeedbackDetail } from '@/components/dashboard/FeedbackDetail';
import { mockFeedback, FeedbackItem, FeedbackSource, Urgency } from '@/data/mockFeedback';

type Metrics = {
  total: number;
  critical: number;
  resolved: number;
  avgResponseTime: string;
};

const Index = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>(mockFeedback);
  const [serverMetrics, setServerMetrics] = useState<Metrics | null>(null);
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

  const localMetrics = useMemo(() => {
    const total = feedback.length;
    const critical = feedback.filter((f) => f.urgency === 'critical' && !f.resolved).length;
    const resolved = feedback.filter((f) => f.resolved).length;
    const avgResponseTime = '2.4h';

    return { total, critical, resolved, avgResponseTime };
  }, [feedback]);

  const metrics = serverMetrics ?? localMetrics;

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

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }
      const payload = (await response.json()) as Metrics;
      setServerMetrics(payload);
    } catch (error) {
      setServerMetrics(null);
    }
  };

  useEffect(() => {
    void loadFeedback();
    void loadMetrics();
  }, []);

  const handleRefresh = () => {
    void loadFeedback();
    void loadMetrics();
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
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Feedback"
              value={metrics.total}
              subtitle="Last 7 days"
              icon={MessageSquare}
              trend={{ value: 12, isPositive: true }}
              delay={1}
            />
            <MetricCard
              title="Critical Issues"
              value={metrics.critical}
              subtitle="Requires attention"
              icon={AlertTriangle}
              delay={2}
            />
            <MetricCard
              title="Resolved"
              value={metrics.resolved}
              subtitle={`${Math.round((metrics.resolved / metrics.total) * 100)}% resolution rate`}
              icon={CheckCircle2}
              trend={{ value: 8, isPositive: true }}
              delay={3}
            />
            <MetricCard
              title="Avg Response"
              value={metrics.avgResponseTime}
              subtitle="Time to first response"
              icon={TrendingUp}
              trend={{ value: 15, isPositive: true }}
              delay={4}
            />
          </div>

          {/* Filters */}
          <FilterBar
            activeSource={activeSource}
            activeUrgency={activeUrgency}
            onSourceChange={setActiveSource}
            onUrgencyChange={setActiveUrgency}
          />

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
