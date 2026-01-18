import { memo, useEffect, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

function FeedbackTableComponent({ feedback, onSelect }: FeedbackTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssueType, setFilterIssueType] = useState<'all' | string>('all');
  const [sortKey, setSortKey] = useState<'time_desc' | 'time_asc' | 'urgency' | 'sentiment'>(
    'time_desc'
  );

  const filteredFeedback = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    let scoped = feedback;
    if (filterIssueType !== 'all') {
      scoped = scoped.filter((item) => item.issueType === filterIssueType);
    }
    if (!needle) return scoped;
    return scoped.filter((item) => item.title.toLowerCase().includes(needle));
  }, [feedback, searchQuery, filterIssueType]);

  const sortedFeedback = useMemo(() => {
    const items = [...filteredFeedback];
    const urgencyRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const sentimentRank: Record<string, number> = { negative: 3, neutral: 2, positive: 1 };
    items.sort((a, b) => {
      if (sortKey === 'time_desc' || sortKey === 'time_asc') {
        const aTime = a.timestamp?.getTime?.() ?? 0;
        const bTime = b.timestamp?.getTime?.() ?? 0;
        return sortKey === 'time_desc' ? bTime - aTime : aTime - bTime;
      }
      if (sortKey === 'urgency') {
        return (urgencyRank[b.urgency] ?? 0) - (urgencyRank[a.urgency] ?? 0);
      }
      if (sortKey === 'sentiment') {
        return (sentimentRank[b.sentiment] ?? 0) - (sentimentRank[a.sentiment] ?? 0);
      }
      return 0;
    });
    return items;
  }, [filteredFeedback, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedback.length / pageSize));
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const pagedFeedback = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFeedback.slice(start, start + pageSize);
  }, [currentPage, sortedFeedback, pageSize]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterIssueType, sortKey]);

  return (
    <div className="glass rounded-xl overflow-hidden shadow-card opacity-0 animate-slide-up stagger-3">
      <div className="px-4 py-2 border-b border-border/50">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <div>
            <h3 className="text-lg font-semibold">View Tickets</h3>
          </div>
          <div className="flex justify-center px-2">
            <div className="w-full max-w-[520px]">
              <Input
                placeholder="Search by ticket name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 bg-muted/70 border-border/70 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter by</span>
              <Select value={filterIssueType} onValueChange={(value) => setFilterIssueType(value)}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Issue type" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All issue types</SelectItem>
                {Object.keys(issueTypeConfig).map((key) => (
                  <SelectItem key={key} value={key}>
                    {issueTypeConfig[key as keyof typeof issueTypeConfig]?.label ?? key}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort by</span>
              <div className="flex items-center gap-2">
                <Select value={sortKey} onValueChange={(value) => setSortKey(value as typeof sortKey)}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time_desc">Time (newest)</SelectItem>
                    <SelectItem value="time_asc">Time (oldest)</SelectItem>
                    <SelectItem value="urgency">Urgency</SelectItem>
                    <SelectItem value="sentiment">Sentiment</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  onClick={() => {
                    const headers = [
                      'Source',
                      'Description',
                      'Sentiment',
                      'Urgency',
                      'Issue Type',
                      'Owner',
                      'Time',
                      'Status',
                    ];
                    const ownerFor = (issueType?: string) =>
                      issueType === 'performance' || issueType === 'bug'
                        ? 'Engineering'
                        : issueType === 'ux' || issueType === 'feature' || issueType === 'documentation'
                        ? 'Product'
                        : 'Support';
                    const rows = sortedFeedback.map((item) => [
                      item.source,
                      item.title,
                      item.sentiment,
                      item.urgency,
                      issueTypeConfig[item.issueType as keyof typeof issueTypeConfig]?.label ?? item.issueType,
                      ownerFor(item.issueType),
                      item.timestamp?.toISOString?.() ?? '',
                      item.resolved ? 'Resolved' : 'Open',
                    ]);
                    const csv = [headers, ...rows]
                      .map((row) =>
                        row
                          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
                          .join(',')
                      )
                      .join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'recent-feedback.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="w-[64px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
              <th className="w-[280px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="w-[100px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sentiment</th>
              <th className="w-[100px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Urgency</th>
              <th className="w-[120px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Issue Type</th>
              <th className="w-[110px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
              <th className="w-[110px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
              <th className="w-[80px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
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
              const ownerLabel =
                item.issueType === 'performance' || item.issueType === 'bug'
                  ? 'Engineering'
                  : item.issueType === 'ux' || item.issueType === 'feature' || item.issueType === 'documentation'
                  ? 'Product'
                  : 'Support';

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
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.author}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-sm font-medium capitalize truncate", sentimentConf.color)}>
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
                    <span className="text-xs text-muted-foreground truncate">{ownerLabel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground truncate">
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
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredFeedback.length)} of{' '}
          {filteredFeedback.length} tickets
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

export const FeedbackTable = memo(FeedbackTableComponent);

FeedbackTable.displayName = 'FeedbackTable';
