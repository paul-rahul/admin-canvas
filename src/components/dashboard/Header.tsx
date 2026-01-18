import { Bell, RefreshCw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

interface HeaderProps {
  onRefresh: () => void;
  needsAttentionContent?: React.ReactNode;
  overlayLock?: boolean;
  lastUpdatedAt?: Date | null;
  alertCount?: number;
}

export function Header({
  onRefresh,
  needsAttentionContent,
  overlayLock = false,
  lastUpdatedAt,
  alertCount = 0,
}: HeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    if (!isOverlayOpen) return;
    const handleClose = (event: MouseEvent) => {
      if (overlayLock) return;
      const target = event.target as Node;
      if (overlayRef.current?.contains(target) || bellRef.current?.contains(target)) {
        return;
      }
      setIsOverlayOpen(false);
    };
    window.addEventListener('mousedown', handleClose);
    return () => window.removeEventListener('mousedown', handleClose);
  }, [isOverlayOpen, overlayLock]);

  return (
    <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cerebro</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">
            Last updated:{' '}
            <span className="font-semibold text-foreground">
              {lastUpdatedAt ? format(lastUpdatedAt, 'MM/dd/yyyy HH:mm') : '—'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="relative"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          <div className="relative">
            <Button
              ref={bellRef}
              variant="ghost"
              size="icon"
              className="relative bg-warning/20 text-warning hover:bg-warning/30 shadow-[0_0_16px_hsl(var(--warning)/0.6)] ring-1 ring-warning/50"
              onClick={() => setIsOverlayOpen((prev) => !prev)}
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
                className="absolute right-0 top-full mt-2 w-[min(980px,90vw)] z-50"
              >
                {needsAttentionContent}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
