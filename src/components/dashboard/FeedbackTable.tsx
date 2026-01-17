import { useEffect, useMemo, useState } from 'react';
import { FeedbackItem, sourceConfig, sentimentConfig, urgencyConfig, issueTypeConfig } from '@/data/mockFeedback';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const PAGE_SIZE_OPTIONS = [10, 50, 100];

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  pages.add(Math.max(2, current - 1));
  pages.add(Math.min(total - 1, current + 1));

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const withEllipsis: Array<number | 'ellipsis'> = [];

  sorted.forEach((page, index) => {
    const prev = sorted[index - 1];
    if (prev && page - prev > 1) {
      withEllipsis.push('ellipsis');
    }
    withEllipsis.push(page);
  });

  return withEllipsis;
};

export function FeedbackTable({ feedback, onSelect }: FeedbackTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const totalPages = Math.max(1, Math.ceil(feedback.length / pageSize));
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const pagedFeedback = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return feedback.slice(start, start + pageSize);
  }, [currentPage, feedback, pageSize]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

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
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Issue Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {pagedFeedback.map((item) => {
              const sourceConf = sourceConfig[item.source];
              const IconComponent = sourceIcons[sourceConf.icon];
              const sentimentConf = sentimentConfig[item.sentiment];
              const urgencyConf = urgencyConfig[item.urgency];
              const issueTypeConf =
                issueTypeConfig[item.issueType] ?? { label: 'Unknown', color: 'bg-muted-foreground' };

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
                      className={cn("capitalize", issueTypeConf.color, "text-primary-foreground")}
                    >
                      {issueTypeConf.label}
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
      <div className="flex flex-col gap-3 border-t border-border/50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, feedback.length)} of{' '}
          {feedback.length} tickets
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination className="w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  }}
                />
              </PaginationItem>
              {pageNumbers.map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={`page-${page}`}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
