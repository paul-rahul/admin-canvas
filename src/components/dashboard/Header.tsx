import { Bell, RefreshCw, Brain, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { NavLink } from '@/components/NavLink';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  onRefresh: () => void;
  needsAttentionContent?: React.ReactNode;
  insightsContent?: React.ReactNode;
  overlayLock?: boolean;
  lastUpdatedAt?: Date | null;
  alertCount?: number;
}

export function Header({
  onRefresh,
  needsAttentionContent,
  insightsContent,
  overlayLock = false,
  lastUpdatedAt,
  alertCount = 0,
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const insightsRef = useRef<HTMLDivElement | null>(null);
  const insightsButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (!isOverlayOpen) return;
    const handleClose = (event: MouseEvent) => {
      if (overlayLock) return;
      const target = event.target as HTMLElement;
      
      // Check if click is within the overlay or button
      if (overlayRef.current?.contains(target) || bellRef.current?.contains(target)) {
        return;
      }
      
      // Check if click is on tooltip content (Radix UI tooltips are in portals)
      const isTooltipContent = 
        target.closest('[role="tooltip"]') !== null ||
        target.closest('[data-radix-tooltip-content]') !== null ||
        target.closest('[data-radix-popper-content-wrapper]') !== null ||
        target.getAttribute('role') === 'tooltip' ||
        target.closest('[class*="tooltip"]')?.getAttribute('role') === 'tooltip' ||
        (target.closest('[data-radix-portal]') && target.closest('[role="tooltip"]')) !== null;
      
      if (isTooltipContent) {
        return;
      }
      
      setIsOverlayOpen(false);
    };
    window.addEventListener('mousedown', handleClose);
    return () => window.removeEventListener('mousedown', handleClose);
  }, [isOverlayOpen, overlayLock]);

  useEffect(() => {
    if (!isInsightsOpen) return;
    const handleClose = (event: MouseEvent) => {
      if (overlayLock) return;
      const target = event.target as HTMLElement;
      
      // Check if click is within the overlay or button
      if (insightsRef.current?.contains(target) || insightsButtonRef.current?.contains(target)) {
        return;
      }
      
      // Check if click is on tooltip content (Radix UI tooltips are in portals)
      // Check for various tooltip-related attributes and roles
      const isTooltipContent = 
        target.closest('[role="tooltip"]') !== null ||
        target.closest('[data-radix-tooltip-content]') !== null ||
        target.closest('[data-radix-popper-content-wrapper]') !== null ||
        target.getAttribute('role') === 'tooltip' ||
        target.closest('[class*="tooltip"]')?.getAttribute('role') === 'tooltip' ||
        // Check if target is within a Radix Portal that contains tooltip content
        (target.closest('[data-radix-portal]') && target.closest('[role="tooltip"]')) !== null;
      
      if (isTooltipContent) {
        return;
      }
      
      setIsInsightsOpen(false);
    };
    window.addEventListener('mousedown', handleClose);
    return () => window.removeEventListener('mousedown', handleClose);
  }, [isInsightsOpen, overlayLock]);

  return (
    <header className="glass sticky top-0 z-50 px-6 py-2 border-b border-border/50">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <NavLink
              to="/"
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              activeClassName="text-foreground"
            >
              <h1 className="text-xl font-bold">Cloudflare-cerebro</h1>
            </NavLink>
          </div>
          <nav className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
            <NavLink
              to="/"
              className="px-2 py-1 rounded-md hover:text-foreground hover:bg-muted/30 transition"
              activeClassName="text-foreground bg-muted/40"
            >
              Overview
            </NavLink>
            <NavLink
              to="/business-metrics"
              className="px-2 py-1 rounded-md hover:text-foreground hover:bg-muted/30 transition"
              activeClassName="text-foreground bg-muted/40"
            >
              Business Metrics
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-center -ml-10">
          <div className="text-xs text-muted-foreground">
            Last updated:{' '}
            <span className="font-semibold text-foreground">
              {lastUpdatedAt ? format(lastUpdatedAt, 'MM/dd/yyyy HH:mm') : '—'}
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="relative"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click this button to refresh the database</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-[0_0_0_1px_hsl(217_91%_60%/0.6)]"
          >
            <a href="/user-guide" target="_blank" rel="noreferrer">
              User Guide
            </a>
          </Button>
          <div className="relative">
            <Button
              ref={insightsButtonRef}
              variant="default"
              size="sm"
              className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-[0_0_16px_hsl(var(--primary)/0.6)] ring-1 ring-primary/50 font-semibold gap-2 px-4"
              onClick={() => {
                const wasOpen = isInsightsOpen;
                setIsInsightsOpen((prev) => !prev);
                setIsOverlayOpen(false);
                // Trigger refetch when opening (not closing)
                if (!wasOpen && insightsContent) {
                  // Force a re-render to trigger useEffect in AIInsights
                  // Dispatch event to trigger AIInsights refetch
                  // Use setTimeout to ensure the overlay is fully rendered first
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('insights-overlay-opened'));
                  }, 100);
                }
              }}
              aria-expanded={isInsightsOpen}
              aria-label="Toggle Insights overlay"
            >
              <Sparkles className="h-4 w-4" />
              AI Insights
            </Button>
            {isInsightsOpen && insightsContent && (
              <div
                ref={insightsRef}
                className="absolute right-0 top-full mt-2 w-[85vw] z-50"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 z-10 h-8 w-8 bg-background/90 text-foreground shadow-sm ring-1 ring-border hover:bg-background"
                    onClick={() => setIsInsightsOpen(false)}
                    aria-label="Close Insights overlay"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {insightsContent}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <Button
              ref={bellRef}
              variant="ghost"
              size="icon"
              className="relative bg-warning/20 text-warning hover:bg-warning/30 shadow-[0_0_16px_hsl(var(--warning)/0.6)] ring-1 ring-warning/50"
              onClick={() => {
                setIsOverlayOpen((prev) => !prev);
                setIsInsightsOpen(false);
              }}
              aria-expanded={isOverlayOpen}
              aria-label="Toggle Needs Attention overlay"
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  {alertCount}
                </span>
              )}
            </Button>
            {isOverlayOpen && needsAttentionContent && (
              <div
                ref={overlayRef}
                className="absolute right-0 top-full mt-2 w-[min(480px,96vw)] z-50"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 z-10 h-8 w-8 bg-background/90 text-foreground shadow-sm ring-1 ring-border hover:bg-background"
                    onClick={() => setIsOverlayOpen(false)}
                    aria-label="Close Needs Attention overlay"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {needsAttentionContent}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
