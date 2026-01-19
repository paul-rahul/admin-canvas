import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { mockFeedback } from "@/data/mockFeedback";
import { NeedsAttentionOverlay, buildNeedsAttentionData } from "@/components/dashboard/NeedsAttentionOverlay";

const NotFound = () => {
  const location = useLocation();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const needsAttentionData = useMemo(() => buildNeedsAttentionData(mockFeedback), []);
  const needsAttentionContent = useMemo(
    () => <NeedsAttentionOverlay data={needsAttentionData} />,
    [needsAttentionData]
  );

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted">
      <Header
        onRefresh={() => setLastUpdatedAt(new Date())}
        lastUpdatedAt={lastUpdatedAt}
        needsAttentionContent={needsAttentionContent}
        alertCount={needsAttentionData.alerts.length}
      />
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
