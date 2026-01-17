import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { EmergingTheme } from '@/utils/emergingThemes';
import { Info } from 'lucide-react';

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Emerging / Escalating Issues</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Emerging themes info"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Compared last 7 days vs prior 7 days; flagged on volume or urgency increases.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground">Top 5 emerging themes by recent change</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Emerging
        </Badge>
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
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {theme.prevCount} → {theme.currentCount}
                    </span>
                    <span>Δ urgency {urgencyDelta}</span>
                    <Badge variant="outline" className="text-xs">
                      Emerging
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      {!isLoading && themes.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTheme?.(themes[0].theme_id)}
            disabled={!onSelectTheme}
          >
            View themes
          </Button>
        </div>
      )}
    </div>
  );
}
