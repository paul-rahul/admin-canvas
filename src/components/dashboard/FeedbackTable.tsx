import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { YearScrollCalendar } from '@/components/ui/year-scroll-calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  ArrowDownUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  Check,
  ExternalLink,
  Filter as FilterIcon,
  Github,
  Headphones,
  Info,
  Mail,
  MessageCircle,
  Plus,
  Twitter,
  Users,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
  globalSource?: FeedbackSource | 'all';
  globalTime?: '24h' | '7d' | '30d' | 'all' | 'custom';
  globalCustomRange?: { from: Date | null; to: Date | null };
  initialFiltersOverride?: Partial<TableFilters>;
  disableUrlSync?: boolean;
  stickyTableHeader?: boolean;
  bodyScrollClassName?: string;
  containerClassName?: string;
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
const PRIORITY_OPTIONS = [
  { value: 'p0', label: 'P0' },
  { value: 'p1', label: 'P1' },
  { value: 'p2', label: 'P2' },
  { value: 'p3', label: 'P3' },
];
const OWNER_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'support', label: 'Support' },
  { value: 'design', label: 'Design' },
  { value: 'unassigned', label: 'Unassigned/Unknown' },
];
const SEGMENT_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'unknown', label: 'Unknown' },
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
const SORT_OPTIONS = [
  { value: 'created', label: 'Creation Date' },
  { value: 'updated', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'sentiment', label: 'Sentiment' },
];
const CLEAR_FILTERS: TableFilters = {
  sources: [],
  sentiments: [],
  urgencies: [],
  urgencyHighPlus: false,
  issueTypes: [],
  priorityBands: [],
  owners: [],
  segments: [],
  statuses: [],
  tags: [],
  timePreset: 'all',
  startDate: null,
  endDate: null,
  search: '',
};

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

function FeedbackTableComponent({
  feedback,
  onSelect,
  globalSource,
  globalTime,
  globalCustomRange,
  initialFiltersOverride,
  disableUrlSync = false,
  stickyTableHeader = false,
  bodyScrollClassName,
  containerClassName,
}: FeedbackTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const initialFilters = useMemo(() => {
    const base = disableUrlSync ? { ...DEFAULT_FILTERS } : parseFiltersFromSearch(window.location.search);
    if (!initialFiltersOverride) return base;
    return { ...base, ...initialFiltersOverride };
  }, [disableUrlSync, initialFiltersOverride]);
  const hasQueryParams = useMemo(
    () => (!disableUrlSync ? window.location.search.length > 1 : false),
    [disableUrlSync]
  );
  const [filters, setFilters] = useState<TableFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<TableFilters>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState<'icon' | 'plus' | null>(null);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [sortKey, setSortKey] = useState<'created' | 'updated' | 'urgency' | 'sentiment'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [baseDefaultFilters, setBaseDefaultFilters] = useState<TableFilters>(() => ({
    ...DEFAULT_FILTERS,
    timePreset: initialFilters.timePreset,
    startDate: initialFilters.startDate,
    endDate: initialFilters.endDate,
  }));
  const appliedDefaultFilters = useMemo(
    () => ({
      ...DEFAULT_FILTERS,
      timePreset: baseDefaultFilters.timePreset,
      startDate: baseDefaultFilters.startDate,
      endDate: baseDefaultFilters.endDate,
    }),
    [baseDefaultFilters.timePreset, baseDefaultFilters.startDate, baseDefaultFilters.endDate]
  );

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

  const segmentOptions = useMemo(() => {
    const present = new Set<string>();
    feedback.forEach((item) => {
      present.add((item.customerSegment ?? 'unknown').toLowerCase());
    });
    return SEGMENT_OPTIONS.filter(
      (option) => present.has(option.value) || option.value === 'unknown'
    );
  }, [feedback]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    feedback.forEach((item) => {
      (item.tags ?? []).forEach((tag) => {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
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
    if (disableUrlSync) return;
    const query = serializeFiltersToSearch(filters);
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [disableUrlSync, filters]);

  useEffect(() => {
    if (!isFilterOpen) return;
    setDraftFilters(filters);
  }, [isFilterOpen, filters]);

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
  }, [feedback, hasQueryParams, baseDefaultFilters.timePreset, baseDefaultFilters.startDate, baseDefaultFilters.endDate]);

  const getUpdatedAtMs = useCallback((item: FeedbackItem) => {
    const updated = item.updatedAt ? new Date(item.updatedAt).getTime() : NaN;
    if (!Number.isNaN(updated)) return updated;
    const created = item.createdAt ? new Date(item.createdAt).getTime() : NaN;
    if (!Number.isNaN(created)) return created;
    return item.timestamp?.getTime?.() ?? 0;
  }, []);

  const getCreatedAtMs = useCallback((item: FeedbackItem) => {
    const created = item.createdAt ? new Date(item.createdAt).getTime() : NaN;
    if (!Number.isNaN(created)) return created;
    return item.timestamp?.getTime?.() ?? 0;
  }, []);

  const sortedFeedback = useMemo(() => {
    const urgencyRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const sentimentRank: Record<string, number> = { negative: 3, neutral: 2, positive: 1 };
    const indexed = filteredFeedback.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      const aItem = a.item;
      const bItem = b.item;
      if (sortKey === 'updated') {
        const diff = sortDir === 'desc' ? getUpdatedAtMs(bItem) - getUpdatedAtMs(aItem) : getUpdatedAtMs(aItem) - getUpdatedAtMs(bItem);
        if (diff !== 0) return diff;
      }
      if (sortKey === 'created') {
        const diff = sortDir === 'desc' ? getCreatedAtMs(bItem) - getCreatedAtMs(aItem) : getCreatedAtMs(aItem) - getCreatedAtMs(bItem);
        if (diff !== 0) return diff;
      }
      if (sortKey === 'urgency') {
        const diff =
          (urgencyRank[bItem.urgency] ?? 0) - (urgencyRank[aItem.urgency] ?? 0);
        const ordered = sortDir === 'desc' ? diff : -diff;
        if (ordered !== 0) return ordered;
      }
      if (sortKey === 'sentiment') {
        const diff =
          (sentimentRank[bItem.sentiment] ?? 0) - (sentimentRank[aItem.sentiment] ?? 0);
        const ordered = sortDir === 'desc' ? diff : -diff;
        if (ordered !== 0) return ordered;
      }
      if (sortKey === 'priority') {
        const aScore = aItem.priorityScore ?? 0;
        const bScore = bItem.priorityScore ?? 0;
        const diff = sortDir === 'desc' ? bScore - aScore : aScore - bScore;
        if (diff !== 0) return diff;
        const updatedDiff = getUpdatedAtMs(bItem) - getUpdatedAtMs(aItem);
        if (updatedDiff !== 0) return updatedDiff;
      }
      const timeDiff = getUpdatedAtMs(bItem) - getUpdatedAtMs(aItem);
      return timeDiff !== 0 ? timeDiff : a.index - b.index;
    });
    return indexed.map((entry) => entry.item);
  }, [filteredFeedback, sortKey, sortDir, getUpdatedAtMs, getCreatedAtMs]);

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
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortKey)?.label ?? 'Sort';
  const filterRowClass = "flex items-center gap-2 text-sm leading-none min-h-[28px]";
  const safeOpenExternal = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const formatShortRelative = (date: Date | null) => {
    if (!date) return '—';
    const diffMs = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < minute) return 'now';
    if (diffMs < hour) return `${Math.round(diffMs / minute)}m ago`;
    if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`;
    if (diffMs < 30 * day) return `${Math.round(diffMs / day)}d ago`;
    return `${Math.round(diffMs / (30 * day))}mo ago`;
  };
  const formatTime = (value: Date | null) => {
    if (!value) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  };

  const applyTimeToDate = (date: Date | null, timeValue: string) => {
    if (!date) return null;
    if (!timeValue) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    const [hour, minute] = timeValue.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return date;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
  };

  const parseDateTimeValue = (value: string | null) => {
    if (!value) return null;
    const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const toDateTimeString = useCallback(
    (value: Date | null) => (value ? format(value, "yyyy-MM-dd'T'HH:mm") : null),
    []
  );
  const customFrom = parseDateTimeValue(draftFilters.startDate);
  const customTo = parseDateTimeValue(draftFilters.endDate);

  useEffect(() => {
    if (!globalTime && !globalSource) return;
    const nextSources = globalSource && globalSource !== 'all' ? [globalSource] : [];
    const nextTimePreset = globalTime ?? null;
    const nextStart =
      globalTime === 'custom' ? toDateTimeString(globalCustomRange?.from ?? null) : null;
    const nextEnd =
      globalTime === 'custom' ? toDateTimeString(globalCustomRange?.to ?? null) : null;
    setFilters((prev) => ({
      ...prev,
      sources: nextSources,
      timePreset: (nextTimePreset ?? prev.timePreset) as TableFilters['timePreset'],
      startDate: nextStart,
      endDate: nextEnd,
    }));
    setDraftFilters((prev) => ({
      ...prev,
      sources: nextSources,
      timePreset: (nextTimePreset ?? prev.timePreset) as TableFilters['timePreset'],
      startDate: nextStart,
      endDate: nextEnd,
    }));
  }, [globalSource, globalTime, globalCustomRange, toDateTimeString]);

  const isSameList = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
  };

  const isDefaultFilters =
    isSameList(filters.sources, appliedDefaultFilters.sources) &&
    isSameList(filters.sentiments, appliedDefaultFilters.sentiments) &&
    isSameList(filters.urgencies, appliedDefaultFilters.urgencies) &&
    filters.urgencyHighPlus === appliedDefaultFilters.urgencyHighPlus &&
    isSameList(filters.issueTypes, appliedDefaultFilters.issueTypes) &&
    isSameList(filters.priorityBands, appliedDefaultFilters.priorityBands) &&
    isSameList(filters.owners, appliedDefaultFilters.owners) &&
    isSameList(filters.segments, appliedDefaultFilters.segments) &&
    isSameList(filters.statuses, appliedDefaultFilters.statuses) &&
    isSameList(filters.tags, appliedDefaultFilters.tags) &&
    filters.timePreset === appliedDefaultFilters.timePreset &&
    filters.startDate === appliedDefaultFilters.startDate &&
    filters.endDate === appliedDefaultFilters.endDate &&
    filters.search === appliedDefaultFilters.search;

  const activeFilterCount = [
    filters.sources.length ? 'Source' : null,
    filters.sentiments.length ? 'Sentiment' : null,
    filters.urgencyHighPlus || filters.urgencies.length ? 'Urgency' : null,
    filters.issueTypes.length ? 'Issue Type' : null,
    filters.priorityBands.length ? 'Priority' : null,
    filters.owners.length ? 'Owner' : null,
    filters.segments.length ? 'User Type' : null,
    filters.statuses.length ? 'Status' : null,
    filters.tags.length ? 'Tags' : null,
    filters.timePreset !== 'all' || filters.startDate || filters.endDate
      ? 'Time'
      : null,
    filters.search.trim() ? 'Search' : null,
  ].filter(Boolean).length;

  const filterSummary = isDefaultFilters
    ? 'All filters'
    : `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'}`;

  const allSelected = (selected: string[], allOptions: string[]) =>
    selected.length > 0 &&
    selected.length === allOptions.length &&
    selected.every((value) => allOptions.includes(value));

  const allSources = Array.from(
    new Set([...SOURCE_OPTIONS.map((option) => option.value), ...otherSources])
  );
  const allIssueTypes = [
    ...ISSUE_TYPE_OPTIONS.map((option) => option.value),
    ...otherIssueTypes,
  ];
  const allSegments = segmentOptions.map((option) => option.value);
  const allTags = tagOptions;

  const selectionSummary = (
    selected: string[],
    allOptions: string[],
    formatValue: (value: string) => string,
    forceCount = false
  ) => {
    if (!selected.length || allSelected(selected, allOptions)) return 'All';
    if (forceCount) return String(selected.length);
    if (selected.length === 1) return formatValue(selected[0]);
    return String(selected.length);
  };

  const chips = [];
  if (filters.sources.length) {
    const label = allSelected(filters.sources, allSources)
      ? 'All'
      : filters.sources
          .map(
            (value) =>
              SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'sources', label: `Source: ${label}` });
  }
  if (filters.sentiments.length) {
    const label = allSelected(
      filters.sentiments,
      SENTIMENT_OPTIONS.map((option) => option.value)
    )
      ? 'All'
      : filters.sentiments
          .map(
            (value) =>
              SENTIMENT_OPTIONS.find((option) => option.value === value)?.label ??
              formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'sentiments', label: `Sentiment: ${label}` });
  }
  if (filters.urgencyHighPlus) {
    chips.push({ key: 'urgency_high', label: 'Urgency: High+' });
  } else if (filters.urgencies.length) {
    const label = allSelected(
      filters.urgencies,
      URGENCY_OPTIONS.map((option) => option.value)
    )
      ? 'All'
      : filters.urgencies
          .map(
            (value) =>
              URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'urgencies', label: `Urgency: ${label}` });
  }
  if (filters.issueTypes.length) {
    const label = allSelected(filters.issueTypes, allIssueTypes)
      ? 'All'
      : filters.issueTypes
          .map(
            (value) =>
              ISSUE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
              formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'issueTypes', label: `Issue Type: ${label}` });
  }
  if (filters.priorityBands.length) {
    const label = allSelected(filters.priorityBands, PRIORITY_OPTIONS.map((option) => option.value))
      ? 'All'
      : filters.priorityBands
          .map(
            (value) =>
              PRIORITY_OPTIONS.find((option) => option.value === value)?.label ??
              formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'priorityBands', label: `Priority: ${label}` });
  }
  if (filters.owners.length) {
    const label = allSelected(
      filters.owners,
      ownerOptions.map((option) => option.value)
    )
      ? 'All'
      : filters.owners
          .map((value) => OWNER_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value))
          .join(', ');
    chips.push({ key: 'owners', label: `Owner: ${label}` });
  }
  if (filters.segments.length) {
    const label = allSelected(filters.segments, allSegments)
      ? 'All'
      : filters.segments
          .map(
            (value) =>
              SEGMENT_OPTIONS.find((option) => option.value === value)?.label ??
              formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'segments', label: `User Type: ${label}` });
  }
  if (filters.statuses.length) {
    const label = allSelected(
      filters.statuses,
      statusOptions.map((option) => option.value)
    )
      ? 'All'
      : filters.statuses
          .map(
            (value) =>
              STATUS_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
          )
          .join(', ');
    chips.push({ key: 'statuses', label: `Status: ${label}` });
  }
  if (filters.tags.length) {
    const label = allSelected(filters.tags, allTags)
      ? 'All'
      : filters.tags.map((value) => formatFilterLabel(value)).join(', ');
    chips.push({ key: 'tags', label: `Issue Type: ${label}` });
  }
  if (filters.timePreset !== 'all' || filters.startDate || filters.endDate) {
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
    | 'priorityBands'
    | 'owners'
    | 'segments'
    | 'statuses'
    | 'tags';

  const toggleFilterValue = (key: FilterListKey, value: string) => {
    setDraftFilters((prev) => {
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
    setDraftFilters((prev) => ({ ...prev, urgencyHighPlus: !prev.urgencyHighPlus }));
  };

  const updateTimePreset = (value: TableFilters['timePreset']) => {
    setDraftFilters((prev) => {
      if (value !== 'custom') {
        return { ...prev, timePreset: value, startDate: null, endDate: null };
      }
      if (prev.startDate && prev.endDate) {
        return { ...prev, timePreset: value };
      }
      const now = new Date();
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = toDateTimeString(start);
      const endDate = toDateTimeString(now);
      return { ...prev, timePreset: value, startDate, endDate };
    });
  };

  const updateCustomDateTime = (key: 'startDate' | 'endDate', value: Date | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      timePreset: 'custom',
      [key]: toDateTimeString(value),
    }));
  };

  const selectAllOptions = (
    key:
      | 'sources'
      | 'sentiments'
      | 'urgencies'
      | 'issueTypes'
      | 'priorityBands'
      | 'owners'
      | 'segments'
      | 'statuses'
      | 'tags',
    values: string[]
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  const clearAllOptions = (
    key:
      | 'sources'
      | 'sentiments'
      | 'urgencies'
      | 'issueTypes'
      | 'priorityBands'
      | 'owners'
      | 'segments'
      | 'statuses'
      | 'tags'
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const selectAllTime = () => {
    setDraftFilters((prev) => ({
      ...prev,
      timePreset: 'all',
      startDate: null,
      endDate: null,
    }));
  };

  const clearAllTime = () => {
    setDraftFilters((prev) => ({
      ...prev,
      timePreset: 'all',
      startDate: null,
      endDate: null,
    }));
  };

  const clearAllDraftFilters = () => {
    setDraftFilters(CLEAR_FILTERS);
  };

  const clearAllAppliedFilters = () => {
    setFilters(CLEAR_FILTERS);
    setSearchInput('');
  };

  const applyDraftFilters = () => {
    setFilters(draftFilters);
    setSearchInput(draftFilters.search);
    setIsFilterOpen(null);
  };

  const filterPopoverContent = (
    <PopoverContent className="w-[460px] p-3">
      <Accordion type="multiple" className="max-h-[440px] overflow-y-auto pr-1">
        <AccordionItem value="time" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Time</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {draftFilters.timePreset === 'custom'
                ? 'Custom'
                : draftFilters.timePreset === 'all'
                ? 'All'
                : TIME_PRESETS.find((option) => option.value === draftFilters.timePreset)?.label ?? 'All'}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {TIME_PRESETS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.timePreset === option.value}
                      onCheckedChange={() => updateTimePreset(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                {draftFilters.timePreset === 'custom' && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-6 w-[104px] justify-start gap-1 border-border/60 bg-transparent px-2 text-xs",
                              !customFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {customFrom ? format(customFrom, 'MMM d, yyyy') : 'From'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-2">
                          <YearScrollCalendar
                            value={customFrom}
                            onChange={(date) => {
                              const nextDate = date ? applyTimeToDate(date, formatTime(customFrom)) : null;
                              updateCustomDateTime('startDate', nextDate);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={formatTime(customFrom)}
                        onChange={(event) => {
                          const baseDate = customFrom ?? new Date();
                          const next = applyTimeToDate(baseDate, event.target.value);
                          updateCustomDateTime('startDate', next);
                        }}
                        className="h-6 w-[48px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">to</span>
                    <div className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 shadow-sm">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-6 w-[104px] justify-start gap-1 border-border/60 bg-transparent px-2 text-xs",
                              !customTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {customTo ? format(customTo, 'MMM d, yyyy') : 'To'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-2">
                          <YearScrollCalendar
                            value={customTo}
                            onChange={(date) => {
                              const nextDate = date ? applyTimeToDate(date, formatTime(customTo)) : null;
                              updateCustomDateTime('endDate', nextDate);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={formatTime(customTo)}
                        onChange={(event) => {
                          const baseDate = customTo ?? new Date();
                          const next = applyTimeToDate(baseDate, event.target.value);
                          updateCustomDateTime('endDate', next);
                        }}
                        className="h-6 w-[48px] border-0 bg-transparent px-1 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={selectAllTime}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAllTime}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="source" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Source</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.sources,
                allSources,
                (value) => SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {SOURCE_OPTIONS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.sources.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('sources', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('sources', SOURCE_OPTIONS.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('sources')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sentiment" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Sentiment</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.sentiments,
                SENTIMENT_OPTIONS.map((option) => option.value),
                (value) => SENTIMENT_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {SENTIMENT_OPTIONS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.sentiments.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('sentiments', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('sentiments', SENTIMENT_OPTIONS.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('sentiments')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="urgency" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Urgency</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {draftFilters.urgencyHighPlus
                ? 'High+'
                : selectionSummary(
                    draftFilters.urgencies,
                    URGENCY_OPTIONS.map((option) => option.value),
                    (value) => URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
                  )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <label className={filterRowClass}>
                  <Checkbox
                    checked={draftFilters.urgencyHighPlus}
                    onCheckedChange={toggleUrgencyHighPlus}
                  />
                  <span>&gt;= High</span>
                </label>
                {URGENCY_OPTIONS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.urgencies.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('urgencies', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setDraftFilters((prev) => ({
                      ...prev,
                      urgencies: URGENCY_OPTIONS.map((option) => option.value),
                      urgencyHighPlus: false,
                    }));
                  }}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      urgencies: [],
                      urgencyHighPlus: false,
                    }))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="issueType" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Issue Type</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.issueTypes,
                allIssueTypes,
                (value) => ISSUE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {ISSUE_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.issueTypes.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('issueTypes', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                {otherIssueTypes.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-muted-foreground">Other</p>
                    <div className="mt-1 space-y-1">
                      {otherIssueTypes.map((value) => (
                        <label key={value} className={filterRowClass}>
                          <Checkbox
                            checked={draftFilters.issueTypes.includes(value)}
                            onCheckedChange={() => toggleFilterValue('issueTypes', value)}
                          />
                          <span>{formatFilterLabel(value)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('issueTypes', [
                      ...ISSUE_TYPE_OPTIONS.map((option) => option.value),
                      ...otherIssueTypes,
                    ])
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('issueTypes')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="priority" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Priority</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.priorityBands,
                PRIORITY_OPTIONS.map((option) => option.value),
                (value) => PRIORITY_OPTIONS.find((option) => option.value === value)?.label ?? value
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.priorityBands.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('priorityBands', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('priorityBands', PRIORITY_OPTIONS.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('priorityBands')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="owner" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Owner</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.owners,
                ownerOptions.map((option) => option.value),
                (value) => OWNER_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {ownerOptions.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.owners.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('owners', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('owners', ownerOptions.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('owners')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="segment" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">User Type</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.segments,
                allSegments,
                (value) => SEGMENT_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {segmentOptions.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.segments.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('segments', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('segments', segmentOptions.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('segments')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="status" className="border-b border-border/60">
          <AccordionTrigger className="py-2 text-sm">
            <span className="inline-flex w-[110px] whitespace-nowrap">Status</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {selectionSummary(
                draftFilters.statuses,
                statusOptions.map((option) => option.value),
                (value) => STATUS_OPTIONS.find((option) => option.value === value)?.label ?? formatFilterLabel(value)
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className={filterRowClass}>
                    <Checkbox
                      checked={draftFilters.statuses.includes(option.value)}
                      onCheckedChange={() => toggleFilterValue('statuses', option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <div className="w-[96px] shrink-0 space-y-2 text-right">
                <button
                  type="button"
                  onClick={() =>
                    selectAllOptions('statuses', statusOptions.map((option) => option.value))
                  }
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => clearAllOptions('statuses')}
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 border border-border/60 px-2"
          onClick={clearAllDraftFilters}
        >
          Remove All
        </Button>
        <Button size="sm" className="h-8 px-3" onClick={applyDraftFilters}>
          Apply filters
        </Button>
      </div>
    </PopoverContent>
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey, sortDir]);

  return (
    <div
      className={cn(
        "glass rounded-xl overflow-hidden shadow-card opacity-0 animate-slide-up stagger-3",
        containerClassName
      )}
    >
      <div className="sticky top-0 z-20 bg-background px-4 py-2 border-b border-border/50 shadow-sm">
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
                placeholder="Search within filtered results"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-9 bg-muted/70 border-border/70 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <Popover
                open={isFilterOpen === 'icon'}
                onOpenChange={(open) => setIsFilterOpen(open ? 'icon' : null)}
              >
                <PopoverTrigger asChild>
                  <Button variant="secondary" className="h-9 w-9 px-0" aria-label="Filter by">
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                {filterPopoverContent}
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center overflow-hidden rounded-md border border-border bg-secondary">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none bg-primary/15 text-primary hover:bg-primary/25"
                  onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  aria-label={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
                >
                  <ArrowDownUp
                    className={cn(
                      'h-4.5 w-4.5 text-primary transition-transform',
                      sortDir === 'asc' ? 'rotate-180' : 'rotate-0'
                    )}
                  />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-9 w-[96px] justify-center px-2 text-xs rounded-none border-l border-border"
                    >
                      {sortLabel}
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-[200px] p-2">
                  <div className="space-y-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSortKey(option.value as typeof sortKey)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm text-foreground hover:bg-muted/40"
                      >
                        <span>{option.label}</span>
                        {sortKey === option.value && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              </div>
              <Button
                variant="secondary"
                className="h-9 px-3 text-xs"
                onClick={() => {
                  const headers = [
                    'Source',
                    'Description',
                    'Sentiment',
                    'Priority',
                    'Urgency',
                    'User Type',
                    'Issue Type',
                    'Owner',
                    'Created',
                    'Updated',
                    'Status',
                    'External Ref',
                    'External Url',
                    'User Type',
                    'Tags',
                  ];
                  const rows = sortedFeedback.map((item) => [
                    item.source,
                    item.title,
                    item.sentiment,
                    item.priorityScore ?? '',
                    item.urgency,
                    formatFilterLabel(item.customerSegment ?? 'unknown'),
                    issueTypeConfig[item.issueType as keyof typeof issueTypeConfig]?.label ?? item.issueType,
                    formatFilterLabel(normalizeOwner(item)),
                    item.createdAt ?? '',
                    item.updatedAt ?? item.createdAt ?? '',
                    formatFilterLabel(normalizeStatus(item)),
                    item.externalRef ?? '',
                    item.externalUrl ?? '',
                    item.customerSegment ?? '',
                    item.tags?.join('|') ?? '',
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
        {chips.length > 0 && (
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
                    if (chip.key === 'sources') {
                      setFilters((prev) => ({ ...prev, sources: [] }));
                      setDraftFilters((prev) => ({ ...prev, sources: [] }));
                    }
                    if (chip.key === 'sentiments') {
                      setFilters((prev) => ({ ...prev, sentiments: [] }));
                      setDraftFilters((prev) => ({ ...prev, sentiments: [] }));
                    }
                    if (chip.key === 'urgency_high') {
                      setFilters((prev) => ({ ...prev, urgencyHighPlus: false }));
                      setDraftFilters((prev) => ({ ...prev, urgencyHighPlus: false }));
                    }
                    if (chip.key === 'urgencies') {
                      setFilters((prev) => ({ ...prev, urgencies: [] }));
                      setDraftFilters((prev) => ({ ...prev, urgencies: [] }));
                    }
                    if (chip.key === 'issueTypes') {
                      setFilters((prev) => ({ ...prev, issueTypes: [] }));
                      setDraftFilters((prev) => ({ ...prev, issueTypes: [] }));
                    }
                    if (chip.key === 'priorityBands') {
                      setFilters((prev) => ({ ...prev, priorityBands: [] }));
                      setDraftFilters((prev) => ({ ...prev, priorityBands: [] }));
                    }
                    if (chip.key === 'owners') {
                      setFilters((prev) => ({ ...prev, owners: [] }));
                      setDraftFilters((prev) => ({ ...prev, owners: [] }));
                    }
                    if (chip.key === 'segments') {
                      setFilters((prev) => ({ ...prev, segments: [] }));
                      setDraftFilters((prev) => ({ ...prev, segments: [] }));
                    }
                    if (chip.key === 'statuses') {
                      setFilters((prev) => ({ ...prev, statuses: [] }));
                      setDraftFilters((prev) => ({ ...prev, statuses: [] }));
                    }
                    if (chip.key === 'tags') {
                      setFilters((prev) => ({ ...prev, tags: [] }));
                      setDraftFilters((prev) => ({ ...prev, tags: [] }));
                    }
                    if (chip.key === 'time') {
                      setFilters((prev) => ({
                        ...prev,
                        timePreset: 'all',
                        startDate: null,
                        endDate: null,
                      }));
                      setDraftFilters((prev) => ({
                        ...prev,
                        timePreset: 'all',
                        startDate: null,
                        endDate: null,
                      }));
                    }
                    if (chip.key === 'search') {
                      setSearchInput('');
                      setFilters((prev) => ({ ...prev, search: '' }));
                      setDraftFilters((prev) => ({ ...prev, search: '' }));
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {chips.length > 0 && (
              <div className="flex items-center gap-2">
                <Popover
                  open={isFilterOpen === 'plus'}
                  onOpenChange={(open) => setIsFilterOpen(open ? 'plus' : null)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                      aria-label="Add filters"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  {filterPopoverContent}
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 border border-border/60 px-2 text-xs"
                  onClick={clearAllAppliedFilters}
                >
                  Remove All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={cn("overflow-x-auto", bodyScrollClassName)}>
        <table className="w-full table-fixed">
          <thead>
            <tr
              className={cn(
                "border-b border-border/50 bg-muted",
                stickyTableHeader && "sticky top-0 z-10"
              )}
            >
              <th className="w-[64px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Source</th>
              <th className="w-[240px] text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
              <th className="w-[90px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sentiment</th>
              <th className="w-[90px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  Priority
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
                </span>
              </th>
              <th className="w-[90px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  Urgency
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
                </span>
              </th>
              <th className="w-[130px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User Type</th>
              <th className="w-[120px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Issue Type</th>
              <th className="w-[110px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
              <th className="w-[120px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
              <th className="w-[110px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</th>
              <th className="w-[90px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="w-[70px] text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Link</th>
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
              const priorityScore = item.priorityScore ?? 0;
              const priorityLabel =
                priorityScore >= 80 ? 'P0' : priorityScore >= 60 ? 'P1' : priorityScore >= 40 ? 'P2' : 'P3';
              const priorityClass =
                priorityLabel === 'P0'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : priorityLabel === 'P1'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : priorityLabel === 'P2'
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  : 'bg-slate-500/15 text-slate-300 border-slate-500/30';
              const statusValue = normalizeStatus(item);
              const statusBadgeClass =
                statusValue === 'resolved'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : statusValue === 'in_progress'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : statusValue === 'ignored'
                  ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30';
              const createdAt = item.createdAt ?? null;
              const createdDate = createdAt ? new Date(createdAt) : null;
              const updatedAt = item.updatedAt ?? item.createdAt;
              const updatedDate = updatedAt ? new Date(updatedAt) : null;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect?.(item)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-center">
                    <span className={cn("text-sm font-medium capitalize truncate", sentimentConf.color)}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn("capitalize border text-[10px] whitespace-nowrap", priorityClass)}
                      title={`Priority score: ${priorityScore}`}
                    >
                      {priorityLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-[10px] whitespace-nowrap border",
                        item.customerSegment === 'enterprise'
                          ? 'bg-primary/15 text-primary border-primary/30'
                          : item.customerSegment === 'pro'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : item.customerSegment === 'free'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                      )}
                    >
                      {formatFilterLabel(item.customerSegment ?? 'unknown')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize text-[10px] whitespace-nowrap",
                        issueTypeConf.color,
                      "text-primary-foreground"
                    )}
                  >
                    {issueTypeConf.label}
                  </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-muted-foreground truncate">{ownerLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-muted-foreground truncate">
                      {formatShortRelative(createdDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-muted-foreground truncate">
                      {formatShortRelative(updatedDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                  <Badge
                    variant="outline"
                    className={cn("capitalize border text-[10px] whitespace-nowrap", statusBadgeClass)}
                  >
                    {statusLabel}
                  </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.externalUrl ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 mx-auto"
                        title={item.externalRef ?? 'Open source'}
                        onClick={(event) => {
                          event.stopPropagation();
                          safeOpenExternal(item.externalUrl);
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
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
