import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { computeEmergingThemes } from '@/utils/emergingThemes';
import { issueTypeConfig, type FeedbackItem } from '@/data/mockFeedback';

const DAY_MS = 24 * 60 * 60 * 1000;

const getTimestampMs = (item: FeedbackItem) => {
  if (item.timestamp instanceof Date) return item.timestamp.getTime();
  if (item.createdAt) return new Date(item.createdAt).getTime();
  return Date.now();
};

const getOwnerLabel = (themeId: string) => {
  if (themeId === 'performance' || themeId === 'bug') return 'Engineering';
  if (themeId === 'ux' || themeId === 'feature' || themeId === 'documentation') return 'Product';
  if (themeId === 'pricing') return 'Support';
  return 'Support';
};

export type NeedsAttentionAlert = {
  id: string;
  title: string;
  reason: string;
  severity: 'Critical' | 'High';
  entry: FeedbackItem;
};

export type NeedsAttentionData = {
  entries: FeedbackItem[];
  alerts: NeedsAttentionAlert[];
  emerging: ReturnType<typeof computeEmergingThemes>;
};

export const buildNeedsAttentionData = (feedback: FeedbackItem[]): NeedsAttentionData => {
  const now = Date.now();
  const windowStart = now - 7 * DAY_MS;
  const entries = feedback.filter((entry) => {
    const ts = getTimestampMs(entry);
    return ts >= windowStart && ts <= now;
  });

  const alerts = entries
    .filter((entry) => {
      const urgency = (entry.urgency ?? '').toLowerCase();
      if (urgency !== 'critical' && urgency !== 'high') return false;
      const status = (entry.status ?? '').toLowerCase();
      if (status === 'resolved' || status === 'ignored') return false;
      return getTimestampMs(entry) >= windowStart;
    })
    .sort((a, b) => {
      const aUrgency = (a.urgency ?? '').toLowerCase() === 'critical' ? 0 : 1;
      const bUrgency = (b.urgency ?? '').toLowerCase() === 'critical' ? 0 : 1;
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;
      return getTimestampMs(a) - getTimestampMs(b);
    })
    .slice(0, 5)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      reason:
        (entry.urgency ?? '').toLowerCase() === 'critical'
          ? 'Critical unresolved ticket in the last 7 days'
          : 'High urgency unresolved ticket in the last 7 days',
      severity:
        (entry.urgency ?? '').toLowerCase() === 'critical' ? ('Critical' as const) : ('High' as const),
      entry,
    }));

  // For emerging themes, we need entries from the last 14 days to compare current (last 7d) vs previous (7-14d ago)
  const emergingWindowStart = now - 14 * DAY_MS;
  const entriesForEmerging = feedback.filter((entry) => {
    const ts = getTimestampMs(entry);
    return ts >= emergingWindowStart && ts <= now;
  });

  const emerging = entriesForEmerging.length ? computeEmergingThemes(entriesForEmerging, [], new Date(now), 7, 4) : [];

  return { entries, alerts, emerging };
};

export function NeedsAttentionOverlay({
  data,
  onAlertSelect,
  variant = 'all',
  onViewCriticalTickets,
}: {
  data: NeedsAttentionData;
  onAlertSelect?: (alert: NeedsAttentionAlert) => void;
  variant?: 'all' | 'alerts' | 'insights';
  onViewCriticalTickets?: () => void;
}) {
  const emerging = data.emerging;
  const alertItems = data.alerts;
  const showAlerts = variant !== 'insights';
  const showInsights = variant !== 'alerts';
  const title = variant === 'insights' ? 'Insights' : 'Needs Attention Now';
  const emergingCardClass =
    variant === 'insights' ? 'w-full' : 'w-full';

  const content = useMemo(
    () => (
      <section className="space-y-3 rounded-xl border border-border/60 bg-background p-4 shadow-card max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {showAlerts && showInsights ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
            <div className="rounded-xl border border-border/60 p-4">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-foreground">Active Alerts</h4>
                <p className="text-xs text-muted-foreground">
                  Unresolved critical issues from the last 7 days
                </p>
              </div>
              {alertItems.length ? (
                <div className="space-y-3 max-h-[calc(6*88px+5*12px)] overflow-y-auto pr-1">
                  {alertItems.map((alert) => {
                    const severityClass =
                      alert.severity === 'Critical'
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-warning/20 text-warning';
                    const ownerLabel = getOwnerLabel(alert.entry.issueType ?? '');
                    return (
                      <TooltipProvider key={alert.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onAlertSelect?.(alert)}
                              className="h-[88px] w-full rounded-lg border border-border/60 p-3 text-left transition hover:bg-muted/20"
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {alert.title}
                                  </p>
                                  <div className="text-xs text-muted-foreground">
                                    Owner:{' '}
                                    <span className="font-semibold text-foreground">{ownerLabel}</span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    Open since{' '}
                                    <span className="font-semibold text-foreground">
                                      {formatDistanceToNow(new Date(getTimestampMs(alert.entry)), {
                                        addSuffix: false,
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className={`text-[10px] ${severityClass}`}>
                                    {alert.severity}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] text-primary-foreground ${
                                      issueTypeConfig[
                                        alert.entry.issueType as keyof typeof issueTypeConfig
                                      ]?.color ?? ''
                                    }`}
                                  >
                                    {issueTypeConfig[
                                      alert.entry.issueType as keyof typeof issueTypeConfig
                                    ]?.label ?? alert.entry.issueType}
                                  </Badge>
                                </div>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {alert.reason} compared to the previous period.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                  No alerts triggered in the current window.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <AIInsights feedback={data.entries} compact />
              <div className={`rounded-xl border border-border/60 p-4 ${emergingCardClass}`}>
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">Emerging Issues</h4>
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
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          <div className="space-y-1">
                            <p>• Compares last 7 days vs the prior 7 days.</p>
                            <p>• Emerging if mentions rise or urgency increases meaningfully.</p>
                            <p>• Δ urgency = avg urgency (current) − avg urgency (previous).</p>
                            <p>• % Negative compares negative ratio now vs previous window.</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground">Last 7 days only</p>
                </div>
                {emerging.length ? (
                  <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1 md:grid-cols-2">
                    {emerging.slice(0, 4).map((theme) => {
                      const mentionDeltaPercent =
                        theme.prevCount > 0
                          ? ((theme.currentCount - theme.prevCount) / theme.prevCount) * 100
                          : 100;
                      const mentionTrendIcon =
                        mentionDeltaPercent >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        );
                      const urgencyDelta =
                        (theme.currentAvgUrgency ?? 0) - (theme.prevAvgUrgency ?? 0);
                      const urgencyTrendIcon =
                        urgencyDelta >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-success" />
                        );
                      return (
                        <div key={theme.theme_id} className="rounded-lg border-2 border-solid border-border p-3">
                          <div className="text-sm font-semibold text-foreground">{theme.name}</div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                              {mentionTrendIcon}
                              Mentions: {theme.prevCount} → {theme.currentCount}
                            </div>
                            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                              {urgencyTrendIcon}
                              Δ urgency: {urgencyDelta.toFixed(1)}
                            </div>
                            <div className="inline-flex items-center gap-1 whitespace-nowrap">
                              % Negative: {((theme.prevNegativeRatio ?? 0) * 100).toFixed(0)} →{' '}
                              {((theme.currentNegativeRatio ?? 0) * 100).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                    No emerging issues in the current window.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {showAlerts && !showInsights ? (
          <div className="rounded-xl border border-border/60 p-4">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-foreground">Active Alerts</h4>
              <p className="text-xs text-muted-foreground">
                Unresolved critical issues from the last 7 days
              </p>
            </div>
            {alertItems.length ? (
              <div className="space-y-3 max-h-[calc(6*88px+5*12px)] overflow-y-auto pr-1">
                {alertItems.map((alert) => {
                  const severityClass =
                    alert.severity === 'Critical'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-warning/20 text-warning';
                  const ownerLabel = getOwnerLabel(alert.entry.issueType ?? '');
                  return (
                    <TooltipProvider key={alert.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onAlertSelect?.(alert)}
                            className="h-[88px] w-full rounded-lg border border-border/60 p-3 text-left transition hover:bg-muted/20"
                          >
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {alert.title}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  Owner:{' '}
                                  <span className="font-semibold text-foreground">{ownerLabel}</span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  Open since{' '}
                                  <span className="font-semibold text-foreground">
                                    {formatDistanceToNow(new Date(getTimestampMs(alert.entry)), {
                                      addSuffix: false,
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge className={`text-[10px] ${severityClass}`}>
                                  {alert.severity}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] text-primary-foreground ${
                                    issueTypeConfig[
                                      alert.entry.issueType as keyof typeof issueTypeConfig
                                    ]?.color ?? ''
                                  }`}
                                >
                                  {issueTypeConfig[
                                    alert.entry.issueType as keyof typeof issueTypeConfig
                                  ]?.label ?? alert.entry.issueType}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {alert.reason} compared to the previous period.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                No alerts triggered in the current window.
              </div>
            )}
          </div>
        ) : null}
        {!showAlerts && showInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-[5fr_6fr] gap-4">
            <div className={`rounded-xl border border-border/60 p-4 ${emergingCardClass}`}>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground">Emerging Issues</h4>
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
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        <div className="space-y-1">
                          <p>• Compares last 7 days vs the prior 7 days.</p>
                          <p>• Emerging if mentions rise or urgency increases meaningfully.</p>
                          <p>• Δ urgency = avg urgency (current) − avg urgency (previous).</p>
                          <p>• % Negative compares negative ratio now vs previous window.</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days only</p>
              </div>
              {emerging.length ? (
                <div className="grid gap-3 max-h-[280px] overflow-y-auto pr-1 md:grid-cols-2">
                  {emerging.slice(0, 4).map((theme) => {
                    const mentionDeltaPercent =
                      theme.prevCount > 0
                        ? ((theme.currentCount - theme.prevCount) / theme.prevCount) * 100
                        : 100;
                    const mentionTrendIcon =
                      mentionDeltaPercent >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                      );
                    const urgencyDelta =
                      (theme.currentAvgUrgency ?? 0) - (theme.prevAvgUrgency ?? 0);
                    const urgencyTrendIcon =
                      urgencyDelta >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-success" />
                      );
                    return (
                      <div key={theme.theme_id} className="rounded-lg border-2 border-solid border-border p-3">
                        <div className="text-sm font-semibold text-foreground">{theme.name}</div>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            {mentionTrendIcon}
                            Mentions: {theme.prevCount} → {theme.currentCount}
                          </div>
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            {urgencyTrendIcon}
                            Δ urgency: {urgencyDelta.toFixed(1)}
                          </div>
                          <div className="inline-flex items-center gap-1 whitespace-nowrap">
                            % Negative: {((theme.prevNegativeRatio ?? 0) * 100).toFixed(0)} →{' '}
                            {((theme.currentNegativeRatio ?? 0) * 100).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                  No emerging issues in the current window.
                </div>
              )}
            </div>
            <AIInsights feedback={data.entries} compact onViewCriticalTickets={onViewCriticalTickets} />
          </div>
        ) : null}
      </section>
    ),
    [alertItems, emerging, data.entries, onAlertSelect, showAlerts, showInsights, title, onViewCriticalTickets]
  );

  return content;
}
