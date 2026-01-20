export type FeedbackSource =
  | 'support'
  | 'discord'
  | 'github'
  | 'twitter'
  | 'email'
  | 'forum'
  | 'other';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type IssueType =
  | 'bug'
  | 'feature'
  | 'performance'
  | 'ux'
  | 'pricing'
  | 'documentation'
  | 'account_access'
  | 'billing'
  | 'reliability'
  | 'integration';
export type Owner = 'product' | 'engineering' | 'support' | 'design' | 'unassigned';
export type Status = 'unresolved' | 'in_progress' | 'resolved' | 'ignored';
export type CustomerSegment = 'free' | 'pro' | 'enterprise' | 'unknown';
export type ResolutionCode = 'fixed' | 'workaround' | 'wont_fix' | 'duplicate' | 'cannot_reproduce';

export type Resolution = {
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionCode?: ResolutionCode;
  notes?: string;
};

export interface TicketRecord {
  id: string;
  source: FeedbackSource;
  title: string;
  description: string;
  content: string;
  sentiment: Sentiment;
  urgency: Urgency;
  issueType: IssueType;
  owner: Owner;
  status: Status;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  customerSegment: CustomerSegment;
  priorityScore: number;
  externalRef?: string;
  externalUrl?: string;
  jiraKey?: string;
  jiraUrl?: string;
  mediaUrl?: string;
  resolution?: Resolution;
  author: string;
}

export type FeedbackItem = TicketRecord & {
  timestamp: Date;
  resolved: boolean;
};

const sources: FeedbackSource[] = [
  'support',
  'discord',
  'github',
  'twitter',
  'email',
  'forum',
  'other',
];
const issueTypes: IssueType[] = [
  'performance',
  'bug',
  'ux',
  'feature',
  'pricing',
  'documentation',
  'account_access',
  'billing',
  'reliability',
  'integration',
];
const sentiments: Sentiment[] = ['positive', 'negative', 'neutral'];
const urgencies: Urgency[] = ['critical', 'high', 'medium', 'low'];

const sourceTopics: Record<FeedbackSource, string[]> = {
  support: ['rate limit', 'billing', 'DNS', 'WAF', 'SSL', 'account access', 'outage', 'API auth'],
  discord: ['Workers', 'KV', 'R2', 'Pages', 'Durable Objects', 'Queues', 'D1', 'Turnstile'],
  github: ['CLI', 'docs', 'API', 'SDK', 'example repo', 'CI setup', 'TypeScript types', 'release notes'],
  twitter: ['product launch', 'docs', 'pricing', 'performance', 'status', 'feature request', 'benchmark', 'tutorial'],
  email: ['sales question', 'invoice', 'plan upgrade', 'security review', 'SLA', 'procurement', 'support ticket', 'renewal'],
  forum: ['best practices', 'migration', 'how-to', 'troubleshooting', 'case study', 'template', 'workflow', 'integration'],
  other: ['community post', 'status alert', 'migration note', 'internal note', 'partner request'],
};

const issueTypeTopics: Record<IssueType, string[]> = {
  bug: ['regression', 'error', 'crash', 'timeout', 'broken link', 'misconfiguration', 'unexpected behavior', 'edge case'],
  feature: ['request', 'enhancement', 'integration', 'automation', 'dashboard', 'API endpoint', 'flag', 'webhook'],
  performance: ['latency', 'throughput', 'cold start', 'cache hit rate', 'build time', 'query time', 'bandwidth'],
  ux: ['navigation', 'onboarding', 'dashboard layout', 'search', 'filters', 'settings', 'tooltip copy', 'empty state'],
  pricing: ['tier limit', 'overage', 'usage reporting', 'credits', 'discount', 'billing alert', 'seat count', 'invoice clarity'],
  documentation: ['guide', 'example', 'reference', 'migration doc', 'glossary', 'FAQ', 'tutorial', 'API schema'],
  account_access: ['login', 'account access', 'password reset', 'SSO', 'role assignment', 'permission issue', 'user lockout'],
  billing: ['billing', 'payment', 'invoice', 'charges', 'refund', 'pricing', 'tax'],
  reliability: ['outage', 'availability', 'incident', 'failover', 'health check', 'status page'],
  integration: ['integration', 'webhook', 'api', 'connector', 'sync', 'export', 'csv'],
};

const contentTemplates = [
  '{title}. Noticed {topic} issues when using {surface}. {keywords}.',
  '{title}. {surface} feels slow around {topic}. {keywords}.',
  '{title}. We ran into {topic} problems in {surface}. {keywords}.',
  '{title}. The current flow in {surface} is confusing for {topic}. {keywords}.',
  '{title}. {surface} is blocking us due to {topic}. {keywords}.',
  '{title}. Please improve {surface} for {topic}. {keywords}.',
  '{title}. Comparing with competitors, {surface} for {topic} could be stronger. {keywords}.',
  '{title}. Our team relies on {surface}; {topic} is the blocker. {keywords}.',
];

const sourceAuthors: Record<FeedbackSource, string[]> = {
  support: ['Enterprise Client', 'Ops Lead', 'IT Manager', 'Site Reliability', 'CTO', 'Platform Team'],
  discord: ['DevCommunity#1234', 'EdgeWizard#4821', 'APACDev#5678', 'CFfan#9001', 'HackNight#3322'],
  github: ['jsmith-dev', 'automation-guru', 'octo-user', 'build-bot', 'api-tester', 'oss-maintainer'],
  twitter: ['@clouddev_sarah', '@ai_enthusiast', '@edge_architect', '@serverless_jane', '@perf_ninja'],
  email: ['sales-lead@company.com', 'cto@startup.io', 'finance@corp.com', 'security@enterprise.com', 'it@agency.com'],
  forum: ['PowerUser99', 'WebDevPro', 'OpsExplorer', 'TemplateCrafter', 'InfraMaven', 'BuilderKim'],
  other: ['PartnerTeam', 'InternalOps', 'CommunityReport', 'FieldEngineer', 'OpsAlias'],
};

const TOKEN_REQUIREMENTS: Array<{ token: string; count: number }> = [
  { token: 'login', count: 220 },
  { token: 'android', count: 170 },
  { token: 'ios', count: 170 },
  { token: 'billing', count: 140 },
  { token: 'payment', count: 120 },
];

const TAG_REQUIREMENTS: Array<{ tag: string; count: number }> = [
  { tag: 'login', count: 200 },
  { tag: 'android', count: 150 },
  { tag: 'ios', count: 150 },
  { tag: 'billing', count: 180 },
  { tag: 'payment', count: 120 },
];

const RESOLUTION_NOTES = [
  'Patched in v1.2.3.',
  'Duplicate of a known issue.',
  'Workaround documented for support.',
  'Unable to reproduce after update.',
  'Closed after customer confirmation.',
];

const RESOLUTION_OWNERS = ['Alex', 'Jordan', 'Priya', 'Sam', 'Taylor', 'Kai', 'Morgan'];

const INCIDENTS: Array<{ issueType: IssueType; keyword: string; chance: number }> = [
  { issueType: 'performance', keyword: 'timeout', chance: 0.2 },
  { issueType: 'billing', keyword: 'payment', chance: 0.2 },
  { issueType: 'integration', keyword: 'webhook', chance: 0.2 },
  { issueType: 'reliability', keyword: 'outage', chance: 0.15 },
];

type OldTicket = {
  id: string;
  source: FeedbackSource;
  title: string;
  description: string;
  content: string;
  sentiment: Sentiment;
  urgency: Urgency;
  issueType: IssueType;
  owner: Owner;
  status: Status;
  createdAt: string;
  timestamp: Date;
  author: string;
  resolved: boolean;
};

const tagMatchers: Array<{ tag: string; match: RegExp }> = [
  { tag: 'login', match: /\blogin\b/i },
  { tag: 'account', match: /\baccount\b/i },
  { tag: 'access', match: /\baccess\b/i },
  { tag: 'password', match: /\bpassword\b/i },
  { tag: 'onboarding', match: /\bonboarding\b/i },
  { tag: 'crash', match: /\bcrash\b/i },
  { tag: 'freeze', match: /\bfreeze\b/i },
  { tag: 'timeout', match: /\btimeout\b/i },
  { tag: 'latency', match: /\blatency\b/i },
  { tag: 'slow', match: /\bslow\b/i },
  { tag: 'billing', match: /\bbilling\b/i },
  { tag: 'payment', match: /\bpayment\b/i },
  { tag: 'invoice', match: /\binvoice\b/i },
  { tag: 'pricing', match: /\bpricing\b/i },
  { tag: 'docs', match: /\bdocs?\b/i },
  { tag: 'integration', match: /\bintegration\b/i },
  { tag: 'webhook', match: /\bwebhook\b/i },
  { tag: 'api', match: /\bapi\b/i },
  { tag: 'mobile', match: /\bmobile\b/i },
  { tag: 'android', match: /\bandroid\b/i },
  { tag: 'ios', match: /\bios\b/i },
  { tag: 'dashboard', match: /\bdashboard\b/i },
  { tag: 'export', match: /\bexport\b/i },
  { tag: 'csv', match: /\bcsv\b/i },
  { tag: 'search', match: /\bsearch\b/i },
  { tag: 'filter', match: /\bfilter(s)?\b/i },
  { tag: 'notification', match: /\bnotification(s)?\b/i },
  { tag: 'sso', match: /\bsso\b/i },
  { tag: 'oauth', match: /\boauth\b/i },
];

const extractTags = (text: string, issueType: IssueType) => {
  const tags = new Set<string>();
  tagMatchers.forEach(({ tag, match }) => {
    if (match.test(text)) tags.add(tag);
  });
  tags.add(issueType.replace('_', ' '));
  if (issueType === 'account_access') tags.add('access');
  if (issueType === 'documentation') tags.add('docs');
  return Array.from(tags);
};

const weightedPick = <T,>(rng: () => number, entries: Array<{ value: T; weight: number }>) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
};

const pickCustomerSegment = (rng: () => number, source: FeedbackSource, urgency: Urgency): CustomerSegment => {
  const weights = {
    free: 0.4,
    pro: 0.35,
    enterprise: 0.2,
    unknown: 0.05,
  };
  if (source === 'support' || source === 'email') {
    weights.enterprise += 0.1;
    weights.free -= 0.05;
    weights.pro -= 0.05;
  }
  if (urgency === 'critical' || urgency === 'high') {
    weights.enterprise += 0.05;
    weights.free -= 0.03;
    weights.pro -= 0.02;
  }
  return weightedPick(rng, [
    { value: 'free', weight: Math.max(0.01, weights.free) },
    { value: 'pro', weight: Math.max(0.01, weights.pro) },
    { value: 'enterprise', weight: Math.max(0.01, weights.enterprise) },
    { value: 'unknown', weight: Math.max(0.01, weights.unknown) },
  ]);
};

const pickUpdatedAtMs = (
  rng: () => number,
  createdAtMs: number,
  status: Status,
  nowMs: number,
  dayMs: number
) => {
  // Ensure updatedAt is always >= createdAt and <= now
  let updatedAt = createdAtMs;
  if (status === 'unresolved' || status === 'in_progress') {
    // For open tickets, updatedAt is recent (within last 7 days) or could be older
    const recentWindow = 7 * dayMs;
    updatedAt = Math.max(createdAtMs, nowMs - rng() * recentWindow);
    if (rng() < 0.15) {
      // 15% chance of being older (up to 30 days ago)
      updatedAt = Math.max(createdAtMs, nowMs - rng() * 30 * dayMs);
    }
  } else {
    // For closed tickets, updatedAt is after creation but before now
    const timeSinceCreation = nowMs - createdAtMs;
    if (timeSinceCreation > 0) {
      const baseWindow = status === 'resolved' ? 14 * dayMs : 21 * dayMs;
      updatedAt = createdAtMs + rng() * Math.min(baseWindow, timeSinceCreation);
      if (rng() < 0.2 && timeSinceCreation > 120 * dayMs) {
        // 20% chance of being much later (up to 120 days after creation)
        updatedAt = createdAtMs + rng() * Math.min(120 * dayMs, timeSinceCreation);
      }
    } else {
      // If createdAt is in the future (shouldn't happen), set updatedAt = createdAt
      updatedAt = createdAtMs;
    }
  }
  // Final safety check: ensure updatedAt is between createdAt and now
  return Math.max(createdAtMs, Math.min(nowMs, updatedAt));
};

const randomId = (rng: () => number, min: number, max: number) =>
  Math.floor(min + rng() * (max - min + 1));

const buildExternalMeta = (rng: () => number, source: FeedbackSource) => {
  if (source === 'github') {
    if (rng() > 0.85) return {};
    const id = randomId(rng, 1000, 999999);
    return {
      externalRef: `GH-${id}`,
      externalUrl: `https://github.com/cloudflare/demo/issues/${id}`,
    };
  }
  if (source === 'support') {
    if (rng() > 0.8) return {};
    const id = randomId(rng, 10000, 999999);
    return {
      externalRef: `ZD-${id}`,
      externalUrl: `https://support.zendesk.com/agent/tickets/${id}`,
    };
  }
  if (source === 'twitter') {
    if (rng() > 0.75) return {};
    const id = randomId(rng, 1000000, 9999999);
    return {
      externalRef: `TW-${id}`,
      externalUrl: `https://x.com/cloudflare/status/${id}`,
    };
  }
  if (rng() < 0.25) {
    const id = randomId(rng, 1000, 999999);
    return {
      externalRef: `EXT-${id}`,
      externalUrl: `https://example.com/tickets/${id}`,
    };
  }
  return {};
};

const buildMediaUrl = (rng: () => number) => {
  if (rng() > 0.18) return undefined;
  const id = randomId(rng, 1000, 9999);
  return `https://media.example.com/assets/${id}.png`;
};

const buildResolution = (
  rng: () => number,
  status: Status,
  createdAtMs: number,
  updatedAtMs: number,
  dayMs: number
): Resolution | undefined => {
  if (status !== 'resolved' && status !== 'ignored') return undefined;
  
  // Ensure resolvedAt is always >= createdAt and <= updatedAt
  const timeWindow = Math.max(dayMs, updatedAtMs - createdAtMs);
  const resolvedAtMs = createdAtMs + rng() * timeWindow;
  // Ensure resolvedAt doesn't exceed updatedAt
  const finalResolvedAt = Math.max(createdAtMs, Math.min(updatedAtMs, resolvedAtMs));
  
  const resolutionCode =
    status === 'resolved'
      ? weightedPick(rng, [
          { value: 'fixed', weight: 0.55 },
          { value: 'workaround', weight: 0.15 },
          { value: 'duplicate', weight: 0.15 },
          { value: 'cannot_reproduce', weight: 0.1 },
          { value: 'wont_fix', weight: 0.05 },
        ])
      : weightedPick(rng, [
          { value: 'wont_fix', weight: 0.5 },
          { value: 'duplicate', weight: 0.3 },
          { value: 'cannot_reproduce', weight: 0.2 },
        ]);
  return {
    resolvedAt: new Date(finalResolvedAt).toISOString(),
    resolvedBy: RESOLUTION_OWNERS[Math.floor(rng() * RESOLUTION_OWNERS.length)],
    resolutionCode,
    notes: RESOLUTION_NOTES[Math.floor(rng() * RESOLUTION_NOTES.length)],
  };
};

const computePriorityScore = (
  urgency: Urgency,
  sentiment: Sentiment,
  status: Status,
  updatedAtMs: number,
  segment: CustomerSegment,
  nowMs: number,
  dayMs: number
) => {
  const urgencyScore =
    urgency === 'critical' ? 40 : urgency === 'high' ? 28 : urgency === 'medium' ? 16 : 8;
  const sentimentScore = sentiment === 'negative' ? 18 : sentiment === 'neutral' ? 8 : 0;
  const statusScore = status === 'unresolved' ? 12 : status === 'in_progress' ? 6 : 0;
  const ageHours = Math.max(0, (nowMs - updatedAtMs) / (60 * 60 * 1000));
  const recencyScore = ageHours <= 72 ? 15 : ageHours >= 720 ? 0 : 15 * (1 - (ageHours - 72) / (720 - 72));
  const segmentScore = segment === 'enterprise' ? 8 : 0;
  const total = urgencyScore + sentimentScore + statusScore + recencyScore + segmentScore;
  return Math.max(0, Math.min(100, Math.round(total)));
};

export const migrateTicket = (old: OldTicket, options?: { forcedTags?: string[]; rng?: () => number; nowMs?: number }): TicketRecord => {
  const rng = options?.rng ?? Math.random;
  const nowMs = options?.nowMs ?? Date.now();
  const createdAtMs = old.createdAt ? new Date(old.createdAt).getTime() : old.timestamp.getTime();
  const updatedAtMs = pickUpdatedAtMs(rng, createdAtMs, old.status, nowMs, 24 * 60 * 60 * 1000);
  const baseText = `${old.title} ${old.description} ${old.content}`.toLowerCase();
  const tagSet = new Set(extractTags(baseText, old.issueType));
  (options?.forcedTags ?? []).forEach((tag) => tagSet.add(tag));
  const tags = Array.from(tagSet);
  const customerSegment = pickCustomerSegment(rng, old.source, old.urgency);
  const priorityScore = computePriorityScore(
    old.urgency,
    old.sentiment,
    old.status,
    updatedAtMs,
    customerSegment,
    nowMs,
    24 * 60 * 60 * 1000
  );
  const externalMeta = buildExternalMeta(rng, old.source);
  const jiraKey = `CB-${randomId(rng, 1000, 9999)}`;
  const jiraUrl = `https://jira.example.com/browse/${jiraKey}`;
  const mediaUrl = buildMediaUrl(rng);
  const resolution = buildResolution(rng, old.status, createdAtMs, updatedAtMs, 24 * 60 * 60 * 1000);
  return {
    id: old.id,
    source: old.source,
    title: old.title,
    description: old.description,
    content: old.content,
    sentiment: old.sentiment,
    urgency: old.urgency,
    issueType: old.issueType,
    owner: old.owner,
    status: old.status,
    createdAt: new Date(createdAtMs).toISOString(),
    updatedAt: new Date(updatedAtMs).toISOString(),
    tags,
    customerSegment,
    priorityScore,
    externalRef: externalMeta.externalRef,
    externalUrl: externalMeta.externalUrl,
    jiraKey,
    jiraUrl,
    mediaUrl,
    resolution,
    author: old.author,
  };
};

const buildMockFeedback = (): TicketRecord[] => {
  const items: TicketRecord[] = [];
  const now = Date.now();
  const totalEntries = 6000;
  const dayMs = 24 * 60 * 60 * 1000;
  // Data spans from 2012 to 2026 (14 years) with weighted distribution (more recent = more data)
  const earliestDate = new Date('2012-01-01T00:00:00Z').getTime();
  let seed = 42;

  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const shuffle = <T,>(list: T[]) => {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(nextRandom() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const allocateCounts = <T extends string>(
    keys: T[],
    total: number,
    weights: Record<T, number>,
    minCounts: Partial<Record<T, number>> = {}
  ) => {
    const counts: Record<T, number> = {} as Record<T, number>;
    let used = 0;
    keys.forEach((key) => {
      const min = minCounts[key] ?? 0;
      counts[key] = min;
      used += min;
    });
    const remaining = Math.max(0, total - used);
    const weightSum = keys.reduce((sum, key) => sum + (weights[key] ?? 0), 0);
    let assigned = 0;
    keys.forEach((key) => {
      if (remaining <= 0) return;
      const share = weightSum ? (weights[key] ?? 0) / weightSum : 1 / keys.length;
      const add = Math.floor(remaining * share);
      counts[key] += add;
      assigned += add;
    });
    let leftovers = remaining - assigned;
    while (leftovers > 0) {
      const key = keys[Math.floor(nextRandom() * keys.length)];
      counts[key] += 1;
      leftovers -= 1;
    }
    return counts;
  };

  const buildPool = <T extends string>(
    keys: T[],
    counts: Record<T, number>
  ) => keys.flatMap((key) => Array.from({ length: counts[key] ?? 0 }, () => key));

  const sourceWeights: Record<FeedbackSource, number> = {
    email: 0.2,
    discord: 0.2,
    github: 0.2,
    support: 0.15,
    forum: 0.13,
    twitter: 0.12,
    other: 0.02,
  };
  const issueWeights: Record<IssueType, number> = {
    performance: 0.28,
    bug: 0.23,
    ux: 0.18,
    feature: 0.12,
    pricing: 0.06,
    documentation: 0.05,
    account_access: 0.04,
    billing: 0.04,
    reliability: 0.04,
    integration: 0.04,
  };
  const issueMins: Partial<Record<IssueType, number>> = {
    pricing: 50,
    documentation: 50,
    account_access: 50,
    billing: 50,
    reliability: 50,
    integration: 50,
  };
  const urgencyWeights: Record<Urgency, number> = {
    low: 0.44,
    medium: 0.33,
    high: 0.18,
    critical: 0.05,
  };

  const sourceCounts = allocateCounts(sources, totalEntries, sourceWeights);
  const issueCounts = allocateCounts(issueTypes, totalEntries, issueWeights, issueMins);
  const urgencyCounts = allocateCounts(urgencies, totalEntries, urgencyWeights, { critical: 180 });

  const sourcePool = shuffle(buildPool(sources, sourceCounts));
  const issuePool = shuffle(buildPool(issueTypes, issueCounts));
  const urgencyPool = shuffle(buildPool(urgencies, urgencyCounts));

  const assignTokens = () => {
    const tokenMap = new Map<number, string[]>();
    TOKEN_REQUIREMENTS.forEach(({ token, count }) => {
      const indices = shuffle(Array.from({ length: totalEntries }, (_, index) => index));
      indices.slice(0, count).forEach((index) => {
        const list = tokenMap.get(index) ?? [];
        list.push(token);
        tokenMap.set(index, list);
      });
    });
    return tokenMap;
  };

  const tokenAssignments = assignTokens();

  const assignTags = () => {
    const tagMap = new Map<number, string[]>();
    TAG_REQUIREMENTS.forEach(({ tag, count }) => {
      const indices = shuffle(Array.from({ length: totalEntries }, (_, index) => index));
      indices.slice(0, count).forEach((index) => {
        const list = tagMap.get(index) ?? [];
        list.push(tag);
        tagMap.set(index, list);
      });
    });
    return tagMap;
  };

  const tagAssignments = assignTags();

  // Distribute data across 2012-2026 (14 years) with weighted distribution (more recent = more data)
  const fourteenYearsMs = 14 * 365 * dayMs;
  const bucketCounts = [
    {
      key: 'lastYear',
      start: now - 365 * dayMs,
      end: now,
      count: Math.floor(totalEntries * 0.35), // 35% in last year
    },
    {
      key: 'year2to3',
      start: now - 3 * 365 * dayMs,
      end: now - 365 * dayMs,
      count: Math.floor(totalEntries * 0.25), // 25% in years 2-3
    },
    {
      key: 'year4to6',
      start: now - 6 * 365 * dayMs,
      end: now - 3 * 365 * dayMs,
      count: Math.floor(totalEntries * 0.2), // 20% in years 4-6
    },
    {
      key: 'year7to14',
      start: earliestDate,
      end: now - 6 * 365 * dayMs,
      count: totalEntries - Math.floor(totalEntries * 0.35) - Math.floor(totalEntries * 0.25) - Math.floor(totalEntries * 0.2), // Remaining in years 7-14 (2012-2018)
    },
  ];

  const generateBucketTimestamps = (count: number, start: number, end: number, spikeDays: number) => {
    const timestamps: number[] = [];
    const dayCount = Math.max(1, Math.floor((end - start) / dayMs));
    const spikes: number[] = [];
    for (let i = 0; i < spikeDays; i += 1) {
      const dayIndex = Math.floor(nextRandom() * dayCount);
      spikes.push(start + dayIndex * dayMs);
    }
    for (let i = 0; i < count; i += 1) {
      if (spikes.length && nextRandom() < 0.2) {
        const base = spikes[Math.floor(nextRandom() * spikes.length)];
        timestamps.push(base + Math.floor(nextRandom() * dayMs));
        continue;
      }
      if (end - start <= dayMs) {
        timestamps.push(start + Math.floor(nextRandom() * (end - start)));
        continue;
      }
      timestamps.push(start + Math.floor(nextRandom() * (end - start)));
    }
    return timestamps;
  };

  const timePool = bucketCounts.flatMap((bucket) =>
    generateBucketTimestamps(bucket.count, bucket.start, bucket.end, 0)
  );
  const shuffledTimePool = shuffle(timePool);

  const pickSentiment = (urgency: Urgency) => {
    const roll = nextRandom();
    if (urgency === 'critical') {
      return roll < 0.75 ? 'negative' : roll < 0.9 ? 'neutral' : 'positive';
    }
    if (urgency === 'high') {
      return roll < 0.55 ? 'negative' : roll < 0.8 ? 'neutral' : 'positive';
    }
    if (urgency === 'medium') {
      return roll < 0.4 ? 'negative' : roll < 0.7 ? 'neutral' : 'positive';
    }
    return roll < 0.3 ? 'negative' : roll < 0.65 ? 'neutral' : 'positive';
  };

  const pickOwner = (issueType: IssueType, index: number) => {
    // Ensure all owners are well represented: guarantee each appears at least 5% of the time
    const ownerCycle = index % 20;
    if (ownerCycle === 0) return 'unassigned'; // Guarantee ~5% unassigned
    if (ownerCycle === 19) return 'design'; // Guarantee ~5% design
    
    const roll = nextRandom();
    // Issue-type based assignment with probability distribution
    if (issueType === 'performance' || issueType === 'bug' || issueType === 'reliability') {
      return roll < 0.7 ? 'engineering' : roll < 0.9 ? 'product' : 'support';
    }
    if (issueType === 'ux' || issueType === 'feature') {
      return roll < 0.55 ? 'product' : roll < 0.8 ? 'design' : 'engineering';
    }
    if (issueType === 'account_access' || issueType === 'billing') {
      return roll < 0.65 ? 'support' : roll < 0.9 ? 'product' : 'engineering';
    }
    if (issueType === 'documentation') {
      return roll < 0.5 ? 'product' : roll < 0.8 ? 'support' : 'engineering';
    }
    // Default distribution ensuring all owners appear
    return roll < 0.4 ? 'engineering' : roll < 0.75 ? 'product' : 'support';
  };

  const pickStatus = (ageDays: number, urgency: Urgency, index: number) => {
    let unresolved = 0.4;
    let inProgress = 0.3;
    let resolved = 0.25;
    let ignored = 0.05;
    
    if (ageDays > 60) {
      unresolved = 0.2;
      inProgress = 0.1;
      resolved = 0.6;
      ignored = 0.1;
    } else if (ageDays > 30) {
      unresolved = 0.25;
      inProgress = 0.2;
      resolved = 0.5;
      ignored = 0.05;
    } else if (ageDays > 7) {
      unresolved = 0.3;
      inProgress = 0.3;
      resolved = 0.35;
      ignored = 0.05;
    }
    
    if (urgency === 'critical') {
      unresolved += 0.15;
      resolved -= 0.1;
    }
    
    // Ensure minimum representation: use index to guarantee all statuses appear
    // Every 20th ticket cycles through all statuses to ensure variability
    const statusCycle = index % 20;
    if (statusCycle === 19) return 'ignored'; // Guarantee at least 5% ignored
    if (statusCycle === 18) return 'resolved'; // Guarantee resolved appears
    if (statusCycle === 17) return 'in_progress'; // Guarantee in_progress appears
    
    // For other tickets, use probability-based distribution
    const total = unresolved + inProgress + resolved + ignored;
    const roll = nextRandom() * total;
    if (roll < unresolved) return 'unresolved';
    if (roll < unresolved + inProgress) return 'in_progress';
    if (roll < unresolved + inProgress + resolved) return 'resolved';
    return 'ignored';
  };

  for (let i = 0; i < totalEntries; i += 1) {
    const source = sourcePool[i % sourcePool.length];
    const issueType = issuePool[i % issuePool.length];
    const urgency = urgencyPool[i % urgencyPool.length];
    const sentiment = pickSentiment(urgency);
    let timestampMs = shuffledTimePool[i % shuffledTimePool.length];
    const incident = INCIDENTS.find((entry) => entry.issueType === issueType);
    const keywordTokens: string[] = [];
    if (incident && nextRandom() < incident.chance) {
      keywordTokens.push(incident.keyword);
    }
    const tokens = tokenAssignments.get(i) ?? [];
    keywordTokens.push(...tokens);
    const topicPool = issueTypeTopics[issueType];
    const topic = topicPool[Math.floor(nextRandom() * topicPool.length)];
    const surfacePool = sourceTopics[source];
    const surface = surfacePool[Math.floor(nextRandom() * surfacePool.length)];
    const author = sourceAuthors[source][Math.floor(nextRandom() * sourceAuthors[source].length)];
    const title = `${surface} ${topic} issue`.replace('  ', ' ');
    const keywordText = keywordTokens.length ? `Keywords: ${keywordTokens.join(', ')}` : 'Needs review';
    const template = contentTemplates[i % contentTemplates.length];
    const description = template
      .replace('{title}', title)
      .replace('{topic}', topic)
      .replace('{surface}', surface)
      .replace('{keywords}', keywordText);
    const content = `${description} Please prioritize.`;
    const timestamp = new Date(timestampMs);
    const ageDays = Math.max(0, (now - timestampMs) / dayMs);
    const status = pickStatus(ageDays, urgency, i);
    const owner = pickOwner(issueType, i);
    const oldTicket: OldTicket = {
      id: `${source}-${issueType}-${i}`,
      source,
      title,
      description,
      content,
      sentiment,
      urgency,
      issueType,
      owner,
      status,
      createdAt: timestamp.toISOString(),
      timestamp,
      author,
      resolved: status === 'resolved' || status === 'ignored',
    };
    const forcedTags = tagAssignments.get(i) ?? [];
    items.push(migrateTicket(oldTicket, { forcedTags, rng: nextRandom, nowMs: now }));
  }

  validateMockFeedback(items);
  return items;
};

const validateMockFeedback = (items: TicketRecord[]) => {
  const now = Date.now();
  const bucketCounts = { last24h: 0, last7d: 0, last30d: 0, older: 0 };
  const counts = {
    source: {} as Record<string, number>,
    issueType: {} as Record<string, number>,
    urgency: {} as Record<string, number>,
    sentiment: {} as Record<string, number>,
    status: {} as Record<string, number>,
    owner: {} as Record<string, number>,
    customerSegment: {} as Record<string, number>,
  };
  const tokens = { login: 0, android: 0, ios: 0, billing: 0, payment: 0 };
  let resolutionMismatch = 0;
  let timestampLeak = 0;
  let missingFields = 0;
  let externalUrlCount = 0;
  items.forEach((item) => {
    if (!item.updatedAt || !item.tags?.length || !item.customerSegment) {
      missingFields += 1;
    }
    if ('timestamp' in (item as Record<string, unknown>)) {
      timestampLeak += 1;
    }
    counts.source[item.source] = (counts.source[item.source] ?? 0) + 1;
    counts.issueType[item.issueType] = (counts.issueType[item.issueType] ?? 0) + 1;
    counts.urgency[item.urgency] = (counts.urgency[item.urgency] ?? 0) + 1;
    counts.sentiment[item.sentiment] = (counts.sentiment[item.sentiment] ?? 0) + 1;
    counts.status[item.status] = (counts.status[item.status] ?? 0) + 1;
    counts.owner[item.owner] = (counts.owner[item.owner] ?? 0) + 1;
    counts.customerSegment[item.customerSegment] = (counts.customerSegment[item.customerSegment] ?? 0) + 1;
    if (item.externalUrl) externalUrlCount += 1;
    const createdAtMs = new Date(item.createdAt).getTime();
    const age = now - createdAtMs;
    if (age <= 24 * 60 * 60 * 1000) bucketCounts.last24h += 1;
    else if (age <= 7 * 24 * 60 * 60 * 1000) bucketCounts.last7d += 1;
    else if (age <= 30 * 24 * 60 * 60 * 1000) bucketCounts.last30d += 1;
    else bucketCounts.older += 1;
    const tagSet = new Set(item.tags);
    if (tagSet.has('login')) tokens.login += 1;
    if (tagSet.has('android')) tokens.android += 1;
    if (tagSet.has('ios')) tokens.ios += 1;
    if (tagSet.has('billing')) tokens.billing += 1;
    if (tagSet.has('payment')) tokens.payment += 1;
    if (item.status === 'resolved' || item.status === 'ignored') {
      if (!item.resolution) resolutionMismatch += 1;
    } else if (item.resolution) {
      resolutionMismatch += 1;
    }
  });
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.info('[mockFeedback] Summary', {
      total: items.length,
      bucketCounts,
      counts,
      tokens,
      externalUrlCount,
      missingFields,
      resolutionMismatch,
      timestampLeak,
    });
  }
};

const buildFeedbackWithDates = (items: TicketRecord[]): FeedbackItem[] =>
  items.map((item) => ({
    ...item,
    timestamp: new Date(item.createdAt),
    resolved: item.status === 'resolved',
  }));

const mockFeedbackRaw: TicketRecord[] = buildMockFeedback();

export const mockFeedback: FeedbackItem[] = buildFeedbackWithDates(mockFeedbackRaw);

export const sourceConfig: Record<FeedbackSource, { label: string; color: string; icon: string }> = {
  support: { label: 'Support', color: 'bg-info', icon: 'headphones' },
  discord: { label: 'Discord', color: 'bg-[#5865F2]', icon: 'message-circle' },
  github: { label: 'GitHub', color: 'bg-foreground', icon: 'github' },
  twitter: { label: 'Twitter', color: 'bg-info', icon: 'twitter' },
  email: { label: 'Email', color: 'bg-warning', icon: 'mail' },
  forum: { label: 'Forum', color: 'bg-success', icon: 'users' },
  other: { label: 'Other', color: 'bg-muted-foreground', icon: 'users' },
};

export const sentimentConfig: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: 'Positive', color: 'text-success' },
  negative: { label: 'Negative', color: 'text-destructive' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground' },
};

export const urgencyConfig: Record<Urgency, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critical', color: 'text-destructive', bgColor: 'bg-destructive/20' },
  high: { label: 'High', color: 'text-warning', bgColor: 'bg-warning/20' },
  medium: { label: 'Medium', color: 'text-info', bgColor: 'bg-info/20' },
  low: { label: 'Low', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export const issueTypeConfig: Record<IssueType, { label: string; color: string }> = {
  bug: { label: 'Bug', color: 'bg-destructive' },
  feature: { label: 'Feature', color: 'bg-primary' },
  performance: { label: 'Performance', color: 'bg-warning' },
  ux: { label: 'UX', color: 'bg-info' },
  pricing: { label: 'Pricing', color: 'bg-success' },
  documentation: { label: 'Docs', color: 'bg-muted-foreground' },
  account_access: { label: 'Account', color: 'bg-info' },
  billing: { label: 'Billing', color: 'bg-warning' },
  reliability: { label: 'Reliability', color: 'bg-destructive' },
  integration: { label: 'Integration', color: 'bg-primary' },
};
