import { useMemo, useState } from 'react';
import { FeedbackItem, sourceConfig, sentimentConfig, urgencyConfig, issueTypeConfig } from '@/data/mockFeedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, MessageSquare, Copy, Image, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface FeedbackDetailProps {
  item: FeedbackItem | null;
  onClose: () => void;
}

const PRIORITY_LABELS = [
  { label: 'P0', min: 80, className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { label: 'P1', min: 60, className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { label: 'P2', min: 40, className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { label: 'P3', min: 0, className: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
];

const formatLabel = (value?: string | null) =>
  value
    ? value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Unknown';

export function FeedbackDetail({ item, onClose }: FeedbackDetailProps) {
  if (!item) return null;

  const sourceConf = sourceConfig[item.source];
  const sentimentConf = sentimentConfig[item.sentiment];
  const urgencyConf = urgencyConfig[item.urgency];
  const issueTypeConf =
    issueTypeConfig[item.issueType] ?? { label: 'Unknown', color: 'bg-muted-foreground' };
  const statusLabel = formatLabel(item.status);
  const ownerLabel = formatLabel(item.owner);
  const segmentLabel = formatLabel(item.customerSegment ?? 'unknown');
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
  const hasUpdates = Boolean(updatedAt && item.createdAt && item.updatedAt !== item.createdAt);
  const priorityScore = item.priorityScore ?? 0;
  const priorityMeta = PRIORITY_LABELS.find((entry) => priorityScore >= entry.min) ?? PRIORITY_LABELS[3];
  const tags = item.tags ?? [];
  const [showAllTags, setShowAllTags] = useState(false);
  const visibleTags = showAllTags ? tags : tags.slice(0, 6);
  const hiddenCount = Math.max(0, tags.length - visibleTags.length);
  const resolutionVisible = item.status === 'resolved' || item.status === 'ignored' || Boolean(item.resolution);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl w-full max-w-xl shadow-card border border-border/50 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", sourceConf.color)}>
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground capitalize">{sourceConf.label}</p>
              <p className="text-sm font-medium">{item.author}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="text-muted-foreground">{item.content}</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Badge 
              variant="secondary"
              className={cn("capitalize", issueTypeConf.color, "text-primary-foreground")}
            >
              {issueTypeConf.label}
            </Badge>
            <Badge variant="outline" className={cn("capitalize", sentimentConf.color)}>
              {item.sentiment}
            </Badge>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>id: {item.id}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => navigator.clipboard.writeText(item.id)}
                aria-label="Copy ticket id"
              >
                <Copy className="h-3 w-3 text-blue-400 hover:text-blue-300" />
              </Button>
              {(item.jiraUrl || item.mediaUrl) && (
                <span className="text-xs text-muted-foreground">|</span>
              )}
              {item.jiraUrl && (
                <a
                  href={item.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-blue-400/60 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300 hover:bg-blue-500/20"
                >
                  JIRA{item.jiraKey ? `: ${item.jiraKey}` : ''}
                </a>
              )}
              <span className="text-xs text-muted-foreground">|</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-6 px-2 text-[11px] text-blue-300 hover:text-blue-200 disabled:opacity-100 disabled:text-blue-300/60"
                onClick={() =>
                  item.mediaUrl && window.open(item.mediaUrl, '_blank', 'noopener,noreferrer')
                }
                disabled={!item.mediaUrl}
              >
                <Image className="mr-1.5 h-3.5 w-3.5 text-blue-300" />
                View attached media
              </Button>
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t border-border/50 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Priority</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full text-muted-foreground hover:text-foreground"
                          aria-label="Priority info"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-none whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <p>• PriorityScore = urgency + sentiment + status + recency + segment</p>
                          <div className="pl-3 space-y-1">
                            <p>• Urgency: Critical 40, High 28, Medium 16, Low 8</p>
                            <p>• Sentiment: Negative 18, Neutral 8, Positive 0</p>
                            <p>• Status: Unresolved 12, In Progress 6, Resolved/Ignored 0</p>
                            <p>• Recency: up to +15 (last 72h, tapering to 0 by 30d)</p>
                            <p>• Enterprise segment: +8</p>
                          </div>
                          <div className="pt-1">
                            <p>• Score mapping</p>
                            <div className="pl-3">
                              <p>• P0: 80–100</p>
                              <p>• P1: 60–79</p>
                              <p>• P2: 40–59</p>
                              <p>• P3: 0–39</p>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge
                  variant="outline"
                  className={cn("border text-xs", priorityMeta.className)}
                  title={`Priority score: ${priorityScore}`}
                >
                  {priorityMeta.label}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{statusLabel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">User Type</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-xs capitalize",
                    item.customerSegment === 'enterprise'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {segmentLabel}
                </Badge>
              </div>
              {tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs capitalize">
                        {tag}
                      </Badge>
                    ))}
                    {hiddenCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={() => setShowAllTags((prev) => !prev)}
                      >
                        {showAllTags ? 'Show less' : `+${hiddenCount} more`}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Urgency</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full text-muted-foreground hover:text-foreground"
                          aria-label="Urgency info"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-none whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <p>• Urgency reflects the ticket’s severity label</p>
                          <p>• Ordered: Critical &gt; High &gt; Medium &gt; Low</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge
                  variant="outline"
                  className={cn("capitalize border text-xs", urgencyConf.bgColor, urgencyConf.color)}
                >
                  {item.urgency}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">{ownerLabel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium" title={createdAt ? format(createdAt, 'PPpp') : undefined}>
                  {createdAt ? `${formatDistanceToNow(createdAt, { addSuffix: true })}` : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="text-sm font-medium" title={updatedAt ? format(updatedAt, 'PPpp') : undefined}>
                  {updatedAt && hasUpdates
                    ? `${formatDistanceToNow(updatedAt, { addSuffix: true })}`
                    : 'No updates'}
                </p>
              </div>
            </div>
            {resolutionVisible && item.resolution && (
              <div className="space-y-2 md:col-span-2">
                <p className="text-xs text-muted-foreground">Resolution</p>
                <div className="flex flex-wrap items-center gap-2">
                  {item.resolution.resolutionCode && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {formatLabel(item.resolution.resolutionCode)}
                    </Badge>
                  )}
                  {item.resolution.resolvedAt && (
                    <span className="text-xs text-muted-foreground">
                      Resolved {formatDistanceToNow(new Date(item.resolution.resolvedAt), { addSuffix: true })}
                    </span>
                  )}
                  {item.resolution.resolvedBy && (
                    <span className="text-xs text-muted-foreground">by {item.resolution.resolvedBy}</span>
                  )}
                </div>
                {item.resolution.notes && (
                  <p className="text-sm text-muted-foreground">{item.resolution.notes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/20" />
      </div>
    </div>
  );
}
