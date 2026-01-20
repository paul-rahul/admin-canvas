import { Info, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  subtextClassName?: string;
  titleClassName?: string;
  titleRowClassName?: string;
  isLoading?: boolean;
  tooltip?: React.ReactNode;
  trendBadge?: string;
  action?: React.ReactNode;
  titleRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  valueHidden?: boolean;
  valueSpacerClassName?: string;
}

export function KpiCard({
  title,
  value,
  subtext,
  subtextClassName,
  titleClassName,
  titleRowClassName,
  isLoading = false,
  tooltip,
  trendBadge,
  action,
  titleRight,
  className,
  children,
  icon: Icon,
  valueHidden = false,
  valueSpacerClassName,
}: KpiCardProps) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className={cn("glass rounded-xl p-6 shadow-card min-w-0 h-full flex flex-col", className)}>
      <div className="flex w-full items-start justify-between gap-3">
        <div className="w-full min-w-0 flex-1">
          <div className={cn("flex flex-col", titleRowClassName)}>
            <div className="flex items-center gap-2">
              {Icon && (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <div className="inline-flex items-center gap-1">
                <p className={cn("text-lg font-semibold", titleClassName)}>{title}</p>
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
                      <TooltipContent side="top" className="z-[60] max-w-none whitespace-nowrap">
                        {tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {titleRight}
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-32" />
            ) : (
              subtext && (
                <p className={cn("mt-1 text-xs text-muted-foreground", subtextClassName)}>
                  {subtext}
                </p>
              )
            )}
          </div>
          {isLoading && !valueHidden && <Skeleton className="mt-3 h-9 w-24" />}
          {!isLoading && !valueHidden && (
            <p className="mt-3 text-3xl font-bold tracking-tight break-words">{displayValue}</p>
          )}
          {valueHidden && <div className={cn("mt-3", valueSpacerClassName ?? "h-9")} />}
          {!isLoading && children && <div className="mt-3">{children}</div>}
        </div>
        {!isLoading && (action || trendBadge) && (
          <div className="flex items-center gap-2">
            {action}
            {trendBadge && (
              <Badge variant="secondary" className="text-xs">
                {trendBadge}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
