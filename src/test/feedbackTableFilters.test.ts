import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  applyFilters,
  parseFiltersFromSearch,
  serializeFiltersToSearch,
} from '@/utils/feedbackTableFilters';
import type { FeedbackItem } from '@/data/mockFeedback';

const makeEntry = (overrides: Partial<FeedbackItem>): FeedbackItem => ({
  id: overrides.id ?? 'id',
  source: overrides.source ?? 'email',
  title: overrides.title ?? 'default title',
  description: overrides.description ?? 'default description',
  content: overrides.content ?? 'default content',
  sentiment: overrides.sentiment ?? 'neutral',
  urgency: overrides.urgency ?? 'low',
  issueType: overrides.issueType ?? 'bug',
  owner: overrides.owner ?? 'product',
  status: overrides.status ?? 'unresolved',
  createdAt: overrides.createdAt ?? '2024-01-10T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2024-01-11T00:00:00.000Z',
  tags: overrides.tags ?? ['login'],
  productArea: overrides.productArea ?? 'auth',
  customerSegment: overrides.customerSegment ?? 'free',
  priorityScore: overrides.priorityScore ?? 42,
  externalRef: overrides.externalRef,
  externalUrl: overrides.externalUrl,
  resolution: overrides.resolution,
  timestamp: overrides.timestamp ?? new Date('2024-01-10T00:00:00Z'),
  author: overrides.author ?? 'author',
  resolved: overrides.resolved ?? false,
});

describe('applyFilters', () => {
  it('selecting urgency >= High returns only critical + high items', () => {
    const entries = [
      makeEntry({ id: 'a', urgency: 'critical' }),
      makeEntry({ id: 'b', urgency: 'high' }),
      makeEntry({ id: 'c', urgency: 'medium' }),
    ];
    const filtered = applyFilters(
      entries,
      { ...DEFAULT_FILTERS, urgencyHighPlus: true },
      new Date('2024-01-12T00:00:00Z').getTime()
    );
    expect(filtered.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('default status excludes resolved entries', () => {
    const entries = [
      makeEntry({ id: 'a', status: 'unresolved' }),
      makeEntry({ id: 'b', status: 'resolved' }),
    ];
    const filtered = applyFilters(entries, DEFAULT_FILTERS, new Date('2024-01-12T00:00:00Z').getTime());
    expect(filtered.map((item) => item.id)).toEqual(['a']);
  });

  it('search with exclude token filters correctly', () => {
    const entries = [
      makeEntry({ id: 'a', title: 'login issue on web' }),
      makeEntry({ id: 'b', title: 'login android issue' }),
    ];
    const filtered = applyFilters(
      entries,
      { ...DEFAULT_FILTERS, search: 'login -android' },
      new Date('2024-01-12T00:00:00Z').getTime()
    );
    expect(filtered.map((item) => item.id)).toEqual(['a']);
  });

  it('multiple filter categories intersect with AND logic', () => {
    const entries = [
      makeEntry({ id: 'a', source: 'email', sentiment: 'negative' }),
      makeEntry({ id: 'b', source: 'support', sentiment: 'negative' }),
    ];
    const filtered = applyFilters(
      entries,
      {
        ...DEFAULT_FILTERS,
        sources: ['email'],
        sentiments: ['negative'],
      },
      new Date('2024-01-12T00:00:00Z').getTime()
    );
    expect(filtered.map((item) => item.id)).toEqual(['a']);
  });

  it('tag filter matches any selected tag', () => {
    const entries = [
      makeEntry({ id: 'a', tags: ['login', 'android'] }),
      makeEntry({ id: 'b', tags: ['billing'] }),
    ];
    const filtered = applyFilters(
      entries,
      { ...DEFAULT_FILTERS, tags: ['billing', 'ios'] },
      new Date('2024-01-12T00:00:00Z').getTime()
    );
    expect(filtered.map((item) => item.id)).toEqual(['b']);
  });

  it('segment and product area filters apply with fallbacks', () => {
    const entries = [
      makeEntry({ id: 'a', productArea: 'billing', customerSegment: 'enterprise' }),
      makeEntry({ id: 'b', productArea: 'other', customerSegment: 'unknown' }),
    ];
    const filtered = applyFilters(
      entries,
      { ...DEFAULT_FILTERS, productAreas: ['billing'], segments: ['enterprise'] },
      new Date('2024-01-12T00:00:00Z').getTime()
    );
    expect(filtered.map((item) => item.id)).toEqual(['a']);
  });

});

describe('URL filter parsing', () => {
  it('round-trips query params', () => {
    const query =
      'sources=Email,GitHub&sentiment=Negative&urgency=Critical,High&issueTypes=Bug&productAreas=auth&owners=Engineering&segments=Enterprise&status=Unresolved,InProgress&tags=login,android&start=2024-01-01&end=2024-01-07&q=login';
    const parsed = parseFiltersFromSearch(`?${query}`);
    const serialized = serializeFiltersToSearch(parsed, new Date('2024-01-07T12:00:00Z'));
    const reparsed = parseFiltersFromSearch(`?${serialized}`);
    expect(reparsed.sources.sort()).toEqual(parsed.sources.sort());
    expect(reparsed.sentiments.sort()).toEqual(parsed.sentiments.sort());
    expect(reparsed.urgencies.sort()).toEqual(parsed.urgencies.sort());
    expect(reparsed.issueTypes.sort()).toEqual(parsed.issueTypes.sort());
    expect(reparsed.productAreas.sort()).toEqual(parsed.productAreas.sort());
    expect(reparsed.owners.sort()).toEqual(parsed.owners.sort());
    expect(reparsed.segments.sort()).toEqual(parsed.segments.sort());
    expect(reparsed.statuses.sort()).toEqual(parsed.statuses.sort());
    expect(reparsed.tags.sort()).toEqual(parsed.tags.sort());
    expect(reparsed.search).toEqual(parsed.search);
  });
});
