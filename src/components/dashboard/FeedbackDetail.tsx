import { FeedbackItem, sourceConfig, sentimentConfig, urgencyConfig, issueTypeConfig } from '@/data/mockFeedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, ExternalLink, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FeedbackDetailProps {
  item: FeedbackItem | null;
  onClose: () => void;
  onResolve: (id: string) => void;
}

export function FeedbackDetail({ item, onClose, onResolve }: FeedbackDetailProps) {
  if (!item) return null;

  const sourceConf = sourceConfig[item.source];
  const sentimentConf = sentimentConfig[item.sentiment];
  const urgencyConf = urgencyConfig[item.urgency];
  const issueTypeConf =
    issueTypeConfig[item.issueType] ?? { label: 'Unknown', color: 'bg-muted-foreground' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass rounded-2xl w-full max-w-lg shadow-card border border-border/50 animate-slide-up">
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
            <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
            <p className="text-muted-foreground">{item.content}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={cn("capitalize border-none", urgencyConf.bgColor, urgencyConf.color)}
            >
              {item.urgency}
            </Badge>
            <Badge 
              variant="secondary"
              className={cn("capitalize", issueTypeConf.color, "text-primary-foreground")}
            >
              {issueTypeConf.label}
            </Badge>
            <Badge variant="outline" className={cn("capitalize", sentimentConf.color)}>
              {item.sentiment}
            </Badge>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Received {format(item.timestamp, 'PPpp')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-border/50 bg-muted/20">
          {!item.resolved && (
            <Button className="flex-1 gradient-primary" onClick={() => onResolve(item.id)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          )}
          {item.resolved && (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
