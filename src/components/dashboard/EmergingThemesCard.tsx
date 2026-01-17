import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { EmergingTheme } from '@/utils/emergingThemes';
import { Info, Flame } from 'lucide-react';

interface EmergingThemesCardProps {
  themes: EmergingTheme[];
  isLoading?: boolean;
  onSelectTheme?: (themeId: string) => void;
}

export function EmergingThemesCard({
  themes,
  isLoading = false,
  onSelectTheme,
}: EmergingThemesCardProps) {
  return (
    <div className="glass rounded-xl p-6 shadow-card">
      <div>
        <div className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Flame className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-semibold">Emerging Issues</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label="Emerging issues info"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                Compared last 7 days vs prior 7 days; flagged on volume or urgency increases.
                Change in urgency is the change in average criticality between the current time window and the previous one.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        )}

        {!isLoading && themes.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            No emerging themes detected in the last two weeks.
          </div>
        )}

        {!isLoading &&
          themes.map((theme) => {
            const urgencyDelta =
              theme.currentAvgUrgency !== null && theme.prevAvgUrgency !== null
                ? (theme.currentAvgUrgency - theme.prevAvgUrgency).toFixed(1)
                : '—';

            return (
              <button
                key={theme.theme_id}
                type="button"
                onClick={() => onSelectTheme?.(theme.theme_id)}
                disabled={!onSelectTheme}
                className={cn(
                  "w-full rounded-lg border border-border/50 px-3 py-2 text-left transition hover:bg-muted/30",
                  !onSelectTheme && "cursor-default opacity-80"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{theme.name}</p>
                    <p className="text-xs text-muted-foreground">{theme.reasonText}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {theme.prevCount} → {theme.currentCount}
                    </span>
                    <span>|</span>
                    <span>Δ urgency {urgencyDelta}</span>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
