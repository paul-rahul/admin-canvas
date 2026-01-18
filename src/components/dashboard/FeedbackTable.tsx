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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Filter as FilterIcon,
  Github,
  Headphones,
  Mail,
  MessageCircle,
  Twitter,
  Users,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_FILTERS,
  DEFAULT_STATUSES,
  TableFilters,
  applyFilters,
  formatFilterLabel,
  normalizeOwner,
  normalizeStatus,
  parseFiltersFromSearch,
  serializeFiltersToSearch,
} from '@/utils/feedbackTableFilters';

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
const SOURCE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'support', label: 'Support' },
  { value: 'discord', label: 'Discord' },
  { value: 'github', label: 'GitHub' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'forum', label: 'Forum' },
  { value: 'other', label: 'Other' },
];
const SENTIMENT_OPTIONS = [
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'positive', label: 'Positive' },
];
const URGENCY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
const ISSUE_TYPE_OPTIONS = [
  { value: 'performance', label: 'Performance' },
  { value: 'bug', label: 'Bug' },
  { value: 'ux', label: 'UX' },
  { value: 'feature', label: 'Feature' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'documentation', label: 'Docs' },
];
const OWNER_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'support', label: 'Support' },
  { value: 'design', label: 'Design' },
  { value: 'unassigned', label: 'Unassigned/Unknown' },
];
const STATUS_OPTIONS = [
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'ignored', label: "Ignored/Won't fix" },
];
const TIME_PRESETS = [
  { value: '24h' as const, label: 'Last 24h' },
  { value: '7d' as const, label: 'Last 7d' },
  { value: '30d' as const, label: 'Last 30d' },
  { value: 'custom' as const, label: 'Custom range' },
];

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
  const initialFilters = useMemo(() => parseFiltersFromSearch(window.location.search), []);
  const hasQueryParams = useMemo(() => window.location.search.length > 1, []);
  const [filters, setFilters] = useState<TableFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [sortKey, setSortKey] = useState<'time_desc' | 'time_asc' | 'urgency' | 'sentiment'>(
    'time_desc'
  );
  const [baseDefaultFilters, setBaseDefaultFilters] = useState<TableFilters>(() => ({
    ...DEFAULT_FILTERS,
    timePreset: initialFilters.timePreset,
    startDate: initialFilters.startDate,
    endDate: initialFilters.endDate,
  }));

  const otherIssueTypes = useMemo(() => {
    const known = new Set(ISSUE_TYPE_OPTIONS.map((option) => option.value));
    const unique = new Set<string>();
    feedback.forEach((item) => {
      if (!known.has(item.issueType)) unique.add(item.issueType);
    });
    return Array.from(unique).sort();
  }, [feedback]);

  const ownerOptions = useMemo(() => {
    const present = new Set<string>();
    feedback.forEach((item) => {
      present.add(normalizeOwner(item));
    });
    return OWNER_OPTIONS.filter((option) => present.has(option.value) || option.value === 'unassigned');
  }, [feedback]);

  const statusOptions = useMemo(() => {
    const present = new Set<string>();
    feedback.forEach((item) => {
      present.add(normalizeStatus(item));
    });
    return STATUS_OPTIONS.filter(
      (option) => present.has(option.value) || DEFAULT_STATUSES.includes(option.value)
    );
  }, [feedback]);

  const otherSources = useMemo(() => {
    const known = new Set(SOURCE_OPTIONS.map((option) => option.value).filter((value) => value !== 'other'));
    const unique = new Set<string>();
    feedback.forEach((item) => {
      if (!known.has(item.source)) unique.add(item.source);
    });
    return Array.from(unique).sort();
  }, [feedback]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const query = serializeFiltersToSearch(filters);
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [filters]);

  const appliedFilters = useMemo(() => {
    if (!filters.sources.includes('other')) return filters;
    const expandedSources = filters.sources
      .filter((value) => value !== 'other')
      .concat(otherSources);
    return { ...filters, sources: expandedSources };
  }, [filters, otherSources]);

  const filteredFeedback = useMemo(() => {
    return applyFilters(feedback, appliedFilters);
  }, [feedback, appliedFilters]);

  useEffect(() => {
    if (hasQueryParams || feedback.length === 0) return;
    const timestamps = feedback
      .map((item) => item.timestamp?.getTime?.() ?? null)
      .filter((value): value is number => value !== null);
    if (!timestamps.length) return;
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const windowMs = max - min;
    const toDateString = (value: number) => {
      const date = new Date(value);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
    };
    let nextPreset: TableFilters['timePreset'] = '7d';
    let nextStart: string | null = null;
    let nextEnd: string | null = null;
    if (windowMs <= 24 * 60 * 60 * 1000) {
      nextPreset = '24h';
    } else if (windowMs <= 7 * 24 * 60 * 60 * 1000) {
      nextPreset = '7d';
    } else if (windowMs <= 30 * 24 * 60 * 60 * 1000) {
      nextPreset = '30d';
    } else {
      nextPreset = 'custom';
      nextStart = toDateString(min);
      nextEnd = toDateString(max);
    }
    setBaseDefaultFilters((prev) => ({
      ...prev,
      timePreset: nextPreset,
      startDate: nextStart,
      endDate: nextEnd,
    }));
    setFilters((prev) => {
      if (
        prev.timePreset === baseDefaultFilters.timePreset &&
        prev.startDate === baseDefaultFilters.startDate &&
        prev.endDate === baseDefaultFilters.endDate
      ) {
        return {
          ...prev,
          timePreset: nextPreset,
          startDate: nextStart,
          endDate: nextEnd,
        };
      }
      return prev;
    });
  }, [feedback, hasQueryParams, baseDefaultFilters.timePreset, baseDefaultFilters.startDate, baseDefaultFilters.endDate]);

  const sortedFeedback = useMemo(() => {
    const urgencyRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const sentimentRank: Record<string, number> = { negative: 3, neutral: 2, positive: 1 };
    const indexed = filteredFeedback.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      const aItem = a.item;
      const bItem = b.item;
      if (sortKey === 'time_desc' || sortKey === 'time_asc') {
        const aTime = aItem.timestamp?.getTime?.() ?? 0;
        const bTime = bItem.timestamp?.getTime?.() ?? 0;
        const diff = sortKey === 'time_desc' ? bTime - aTime : aTime - bTime;
        return diff !== 0 ? diff : a.index - b.index;
      }
      if (sortKey === 'urgency') {
        const diff = (urgencyRank[bItem.urgency] ?? 0) - (urgencyRank[aItem.urgency] ?? 0);
        if (diff !== 0) return diff;
      }
      if (sortKey === 'sentiment') {
        const diff =
          (sentimentRank[bItem.sentiment] ?? 0) - (sentimentRank[aItem.sentiment] ?? 0);
        if (diff !== 0) return diff;
      }
      const aTime = aItem.timestamp?.getTime?.() ?? 0;
      const bTime = bItem.timestamp?.getTime?.() ?? 0;
      const timeDiff = bTime - aTime;
      return timeDiff !== 0 ? timeDiff : a.index - b.index;
    });
    return indexed.map((entry) => entry.item);
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

  const totalCount = feedback.length;
  const filteredCount = filteredFeedback.length;

  const isSameList = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
  };

  const isDefaultFilters =
    isSameList(filters.sources, baseDefaultFilters.sources) &&
    isSameList(filters.sentiments, baseDefaultFilters.sentiments) &&
    isSameList(filters.urgencies, baseDefaultFilters.urgencies) &&
    filters.urgencyHighPlus === baseDefaultFilters.urgencyHighPlus &&
    isSameList(filters.issueTypes, baseDefaultFilters.issueTypes) &&
    isSameList(filters.owners, baseDefaultFilters.owners) &&
    isSameList(filters.statuses, baseDefaultFilters.statuses) &&
    filters.timePreset === baseDefaultFilters.timePreset &&
    filters.startDate === baseDefaultFilters.startDate &&
    filters.endDate === baseDefaultFilters.endDate &&
    filters.search === baseDefaultFilters.search;

  const activeFilterCount = [
    filters.sources.length ? 'Source' : null,
    filters.sentiments.length ? 'Sentiment' : null,
    filters.urgencyHighPlus || filters.urgencies.length ? 'Urgency' : null,
    filters.issueTypes.length ? 'Issue Type' : null,
    filters.owners.length ? 'Owner' : null,
    !isSameList(filters.statuses, baseDefaultFilters.statuses) ? 'Status' : null,
    filters.timePreset !== baseDefaultFilters.timePreset || filters.startDate || filters.endDate
      ? 'Time'
      : null,
    filters.search.trim() ? 'Search' : null,
  ].filter(Boolean).length;

  const filterSummary = isDefaultFilters
    ? 'All filters'
    : `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'}`;

  const chips = [];
  if (filters.sources.length) {
    const label = filters.sources
      .map((value) => SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'sources', label: `Source: ${label}` });
  }
  if (filters.sentiments.length) {
    const label = filters.sentiments
      .map((value) => SENTIMENT_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'sentiments', label: `Sentiment: ${label}` });
  }
  if (filters.urgencyHighPlus) {
    chips.push({ key: 'urgency_high', label: 'Urgency: High+' });
  } else if (filters.urgencies.length) {
    const label = filters.urgencies
      .map((value) => URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'urgencies', label: `Urgency: ${label}` });
  }
  if (filters.issueTypes.length) {
    const label = filters.issueTypes
      .map((value) => ISSUE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'issueTypes', label: `Issue Type: ${label}` });
  }
  if (filters.owners.length) {
    const label = filters.owners
      .map((value) => OWNER_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'owners', label: `Owner: ${label}` });
  }
  if (!isSameList(filters.statuses, baseDefaultFilters.statuses)) {
    const label = filters.statuses
      .map((value) => STATUS_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
      .join(', ');
    chips.push({ key: 'statuses', label: `Status: ${label}` });
  }
  if (
    filters.timePreset !== baseDefaultFilters.timePreset ||
    filters.startDate ||
    filters.endDate
  ) {
    const timeLabel =
      filters.timePreset === 'custom'
        ? `${filters.startDate ?? '—'} → ${filters.endDate ?? '—'}`
        : TIME_PRESETS.find((option) => option.value === filters.timePreset)?.label ?? 'Time';
    chips.push({ key: 'time', label: `Time: ${timeLabel}` });
  }
  if (filters.search.trim()) {
    chips.push({ key: 'search', label: `Search: ${filters.search.trim()}` });
  }

  type FilterListKey =
    | 'sources'
    | 'sentiments'
    | 'urgencies'
    | 'issueTypes'
    | 'owners'
    | 'statuses';

  const toggleFilterValue = (key: FilterListKey, value: string) => {
    setFilters((prev) => {
      const list = new Set(prev[key] as string[]);
      if (list.has(value)) {
        list.delete(value);
      } else {
        list.add(value);
      }
      const next = { ...prev, [key]: Array.from(list) };
      if (key === 'urgencies' && prev.urgencyHighPlus) {
        next.urgencyHighPlus = false;
      }
      return next;
    });
  };

  const toggleUrgencyHighPlus = () => {
    setFilters((prev) => ({ ...prev, urgencyHighPlus: !prev.urgencyHighPlus }));
  };

  const updateTimePreset = (value: TableFilters['timePreset']) => {
    setFilters((prev) => {
      if (value !== 'custom') {
        return { ...prev, timePreset: value, startDate: null, endDate: null };
      }
      if (prev.startDate && prev.endDate) {
        return { ...prev, timePreset: value };
      }
      const now = new Date();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
        start.getDate()
      ).padStart(2, '0')}`;
      return { ...prev, timePreset: value, startDate, endDate };
    });
  };

  const updateCustomDate = (key: 'startDate' | 'endDate', value: string) => {
    setFilters((prev) => ({
      ...prev,
      timePreset: 'custom',
      [key]: value || null,
    }));
  };

  const clearAllFilters = () => {
    setFilters(baseDefaultFilters);
    setSearchInput(baseDefaultFilters.search);
  };

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey]);

  return (
    <div className="glass rounded-xl overflow-hidden shadow-card opacity-0 animate-slide-up stagger-3">
      <div className="px-4 py-2 border-b border-border/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[180px]">
            <h3 className="text-lg font-semibold">View Tickets</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredCount} of {totalCount}
            </p>
          </div>
          <div className="flex flex-1 justify-center px-2 min-w-[240px]">
            <div className="w-full max-w-[520px]">
              <Input
                placeholder="Search in table..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-9 bg-muted/70 border-border/70 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter by</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="h-9 px-3 text-xs">
                    <FilterIcon className="mr-2 h-3.5 w-3.5" />
                    {filterSummary}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[280px]">
                  <DropdownMenuLabel>Source</DropdownMenuLabel>
                  {SOURCE_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.sources.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('sources', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sentiment</DropdownMenuLabel>
                  {SENTIMENT_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.sentiments.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('sentiments', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Urgency</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={filters.urgencyHighPlus}
                    onCheckedChange={toggleUrgencyHighPlus}
                  >
                    &gt;= High
                  </DropdownMenuCheckboxItem>
                  {URGENCY_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.urgencies.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('urgencies', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Issue Type</DropdownMenuLabel>
                  {ISSUE_TYPE_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.issueTypes.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('issueTypes', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {otherIssueTypes.length > 0 && (
                    <>
                      <DropdownMenuLabel>Other</DropdownMenuLabel>
                      {otherIssueTypes.map((value) => (
                        <DropdownMenuCheckboxItem
                          key={value}
                          checked={filters.issueTypes.includes(value)}
                          onCheckedChange={() => toggleFilterValue('issueTypes', value)}
                        >
                          {formatFilterLabel(value)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Owner</DropdownMenuLabel>
                  {ownerOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.owners.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('owners', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {statusOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.statuses.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('statuses', option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Time</DropdownMenuLabel>
                  {TIME_PRESETS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.timePreset === option.value}
                      onCheckedChange={() => updateTimePreset(option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {filters.timePreset === 'custom' && (
                    <div className="p-2 space-y-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start</label>
                        <Input
                          type="date"
                          value={filters.startDate ?? ''}
                          onChange={(event) => updateCustomDate('startDate', event.target.value)}
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">End</label>
                        <Input
                          type="date"
                          value={filters.endDate ?? ''}
                          onChange={(event) => updateCustomDate('endDate', event.target.value)}
                          className="mt-1 h-8"
                        />
                      </div>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
                    const rows = sortedFeedback.map((item) => [
                      item.source,
                      item.title,
                      item.sentiment,
                      item.urgency,
                      issueTypeConfig[item.issueType as keyof typeof issueTypeConfig]?.label ?? item.issueType,
                      formatFilterLabel(normalizeOwner(item)),
                      item.timestamp?.toISOString?.() ?? '',
                      formatFilterLabel(normalizeStatus(item)),
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
        {(chips.length > 0 || !isDefaultFilters) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-xs text-foreground"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => {
                    if (chip.key === 'sources') setFilters((prev) => ({ ...prev, sources: [] }));
                    if (chip.key === 'sentiments') setFilters((prev) => ({ ...prev, sentiments: [] }));
                    if (chip.key === 'urgency_high')
                      setFilters((prev) => ({ ...prev, urgencyHighPlus: false }));
                    if (chip.key === 'urgencies') setFilters((prev) => ({ ...prev, urgencies: [] }));
                    if (chip.key === 'issueTypes') setFilters((prev) => ({ ...prev, issueTypes: [] }));
                    if (chip.key === 'owners') setFilters((prev) => ({ ...prev, owners: [] }));
                    if (chip.key === 'statuses')
                      setFilters((prev) => ({ ...prev, statuses: baseDefaultFilters.statuses }));
                    if (chip.key === 'time')
                      setFilters((prev) => ({
                        ...prev,
                        timePreset: baseDefaultFilters.timePreset,
                        startDate: baseDefaultFilters.startDate,
                        endDate: baseDefaultFilters.endDate,
                      }));
                    if (chip.key === 'search') {
                      setSearchInput('');
                      setFilters((prev) => ({ ...prev, search: '' }));
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!isDefaultFilters && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        )}
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
              const ownerLabel = formatFilterLabel(normalizeOwner(item));
              const statusLabel = formatFilterLabel(normalizeStatus(item));

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
                    <div className="flex items-center gap-2">
                      {item.resolved ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      )}
                      <span className="text-xs text-muted-foreground truncate">{statusLabel}</span>
                    </div>
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
