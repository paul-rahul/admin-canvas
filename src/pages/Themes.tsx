import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { mockFeedback } from '@/data/mockFeedback';
import { NeedsAttentionOverlay, buildNeedsAttentionData } from '@/components/dashboard/NeedsAttentionOverlay';

const Themes = () => {
  const [params] = useSearchParams();
  const themeId = params.get('theme_id');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const needsAttentionData = useMemo(() => buildNeedsAttentionData(mockFeedback), []);
  const needsAttentionContent = useMemo(
    () => <NeedsAttentionOverlay data={needsAttentionData} />,
    [needsAttentionData]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        onRefresh={() => setLastUpdatedAt(new Date())}
        lastUpdatedAt={lastUpdatedAt}
        needsAttentionContent={needsAttentionContent}
        alertCount={needsAttentionData.alerts.length}
      />
      <div className="container mx-auto px-6 py-10 space-y-6">
        <div className="glass rounded-xl p-6 shadow-card">
          <h1 className="text-2xl font-semibold">Themes</h1>
          <p className="text-sm text-muted-foreground">
            {themeId ? `Selected theme: ${themeId}` : 'Select a theme from the dashboard to view details.'}
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/">Back to Overview</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Themes;
