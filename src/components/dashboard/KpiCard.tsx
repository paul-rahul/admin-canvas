import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number | null;
  subtext?: string;
  isLoading?: boolean;
  tooltip?: string;
  trendBadge?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtext,
  isLoading = false,
  tooltip,
  trendBadge,
  className,
}: KpiCardProps) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className={cn("glass rounded-xl p-6 shadow-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full text-muted-foreground hover:text-foreground"
                      aria-label={`${title} info`}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{tooltip}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{displayValue}</p>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            subtext && <p className="text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        {trendBadge && !isLoading && (
          <Badge variant="secondary" className="text-xs">
            {trendBadge}
          </Badge>
        )}
      </div>
    </div>
  );
}
