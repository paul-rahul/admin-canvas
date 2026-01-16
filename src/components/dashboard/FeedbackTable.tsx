import { FeedbackItem, sourceConfig, sentimentConfig, urgencyConfig, categoryConfig } from '@/data/mockFeedback';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Headphones, MessageCircle, Github, Twitter, Mail, Users, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const sourceIcons: Record<string, React.ElementType> = {
  headphones: Headphones,
  'message-circle': MessageCircle,
  github: Github,
  twitter: Twitter,
  mail: Mail,
  users: Users,
};

interface FeedbackTableProps {
  feedback: FeedbackItem[];
  onSelect?: (item: FeedbackItem) => void;
}

export function FeedbackTable({ feedback, onSelect }: FeedbackTableProps) {
  return (
    <div className="glass rounded-xl overflow-hidden shadow-card opacity-0 animate-slide-up stagger-3">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold">Recent Feedback</h3>
        <p className="text-sm text-muted-foreground">Click on an item to view details</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sentiment</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Urgency</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {feedback.map((item) => {
              const sourceConf = sourceConfig[item.source];
              const IconComponent = sourceIcons[sourceConf.icon];
              const sentimentConf = sentimentConfig[item.sentiment];
              const urgencyConf = urgencyConfig[item.urgency];
              const categoryConf = categoryConfig[item.category];

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect?.(item)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className={cn("p-2 rounded-lg w-fit", sourceConf.color)}>
                      <IconComponent className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.author}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-medium capitalize", sentimentConf.color)}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "capitalize border-none font-medium",
                        urgencyConf.bgColor,
                        urgencyConf.color
                      )}
                    >
                      {item.urgency}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="secondary"
                      className={cn("capitalize", categoryConf.color, "text-primary-foreground")}
                    >
                      {categoryConf.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.resolved ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
