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

export interface FeedbackItem {
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
}

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

const INCIDENTS: Array<{ issueType: IssueType; keyword: string; days: number; chance: number }> = [
  { issueType: 'performance', keyword: 'timeout', days: 3, chance: 0.35 },
  { issueType: 'billing', keyword: 'payment', days: 4, chance: 0.3 },
  { issueType: 'integration', keyword: 'webhook', days: 5, chance: 0.3 },
  { issueType: 'reliability', keyword: 'outage', days: 3, chance: 0.25 },
];

const buildMockFeedback = (): FeedbackItem[] => {
  const items: FeedbackItem[] = [];
  const now = Date.now();
  const totalEntries = 6000;
  const dayMs = 24 * 60 * 60 * 1000;
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

  const bucketWeights = [
    { key: 'last24h', weight: 0.25, start: now - dayMs, end: now },
    { key: 'last7d', weight: 0.25, start: now - 7 * dayMs, end: now - dayMs },
    { key: 'last30d', weight: 0.25, start: now - 30 * dayMs, end: now - 7 * dayMs },
    { key: 'older', weight: 0.25, start: now - 365 * dayMs, end: now - 30 * dayMs },
  ];
  const bucketTotalWeight = bucketWeights.reduce((sum, item) => sum + item.weight, 0);
  const bucketCounts = bucketWeights.map((bucket) => ({
    ...bucket,
    count: Math.floor((bucket.weight / bucketTotalWeight) * totalEntries),
  }));
  let assignedBuckets = bucketCounts.reduce((sum, bucket) => sum + bucket.count, 0);
  while (assignedBuckets < totalEntries) {
    const index = Math.floor(nextRandom() * bucketCounts.length);
    bucketCounts[index].count += 1;
    assignedBuckets += 1;
  }

  const generateBucketTimestamps = (count: number, start: number, end: number, spikeDays: number) => {
    const timestamps: number[] = [];
    const dayCount = Math.max(1, Math.floor((end - start) / dayMs));
    const spikes: number[] = [];
    for (let i = 0; i < spikeDays; i += 1) {
      const dayIndex = Math.floor(nextRandom() * dayCount);
      spikes.push(start + dayIndex * dayMs);
    }
    for (let i = 0; i < count; i += 1) {
      if (spikes.length && nextRandom() < 0.35) {
        const base = spikes[Math.floor(nextRandom() * spikes.length)];
        timestamps.push(base + Math.floor(nextRandom() * dayMs));
        continue;
      }
      if (end - start <= dayMs) {
        const skew = Math.pow(nextRandom(), 2);
        timestamps.push(end - skew * (end - start));
        continue;
      }
      timestamps.push(start + Math.floor(nextRandom() * (end - start)));
    }
    return timestamps;
  };

  const timePool = bucketCounts.flatMap((bucket) =>
    generateBucketTimestamps(
      bucket.count,
      bucket.start,
      bucket.end,
      bucket.key === 'older' ? 1 : 3
    )
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

  const pickOwner = (issueType: IssueType) => {
    if (nextRandom() < 0.08) return 'unassigned';
    const roll = nextRandom();
    if (issueType === 'performance' || issueType === 'bug' || issueType === 'reliability') {
      return roll < 0.75 ? 'engineering' : roll < 0.9 ? 'product' : 'support';
    }
    if (issueType === 'ux' || issueType === 'feature') {
      return roll < 0.6 ? 'product' : roll < 0.85 ? 'design' : 'engineering';
    }
    if (issueType === 'account_access' || issueType === 'billing') {
      return roll < 0.7 ? 'support' : roll < 0.9 ? 'product' : 'engineering';
    }
    if (issueType === 'documentation') {
      return roll < 0.55 ? 'product' : roll < 0.85 ? 'support' : 'engineering';
    }
    return roll < 0.45 ? 'engineering' : roll < 0.85 ? 'product' : 'support';
  };

  const pickStatus = (ageDays: number, urgency: Urgency) => {
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
      const windowMs = incident.days * dayMs;
      timestampMs = now - Math.floor(nextRandom() * windowMs);
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
    const status = pickStatus(ageDays, urgency);
    const owner = pickOwner(issueType);
    items.push({
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
    });
  }

  validateMockFeedback(items);
  return items;
};

const validateMockFeedback = (items: FeedbackItem[]) => {
  const now = Date.now();
  const bucketCounts = { last24h: 0, last7d: 0, last30d: 0, older: 0 };
  const counts = {
    source: {} as Record<string, number>,
    issueType: {} as Record<string, number>,
    urgency: {} as Record<string, number>,
    sentiment: {} as Record<string, number>,
    status: {} as Record<string, number>,
    owner: {} as Record<string, number>,
  };
  const tokens = { login: 0, android: 0, ios: 0, billing: 0, payment: 0 };
  items.forEach((item) => {
    counts.source[item.source] = (counts.source[item.source] ?? 0) + 1;
    counts.issueType[item.issueType] = (counts.issueType[item.issueType] ?? 0) + 1;
    counts.urgency[item.urgency] = (counts.urgency[item.urgency] ?? 0) + 1;
    counts.sentiment[item.sentiment] = (counts.sentiment[item.sentiment] ?? 0) + 1;
    counts.status[item.status] = (counts.status[item.status] ?? 0) + 1;
    counts.owner[item.owner] = (counts.owner[item.owner] ?? 0) + 1;
    const age = now - item.timestamp.getTime();
    if (age <= 24 * 60 * 60 * 1000) bucketCounts.last24h += 1;
    else if (age <= 7 * 24 * 60 * 60 * 1000) bucketCounts.last7d += 1;
    else if (age <= 30 * 24 * 60 * 60 * 1000) bucketCounts.last30d += 1;
    else bucketCounts.older += 1;
    const description = item.description.toLowerCase();
    if (description.includes('login')) tokens.login += 1;
    if (description.includes('android')) tokens.android += 1;
    if (description.includes('ios')) tokens.ios += 1;
    if (description.includes('billing')) tokens.billing += 1;
    if (description.includes('payment')) tokens.payment += 1;
  });
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.info('[mockFeedback] Summary', {
      total: items.length,
      bucketCounts,
      counts,
      tokens,
    });
  }
};

export const mockFeedback: FeedbackItem[] = buildMockFeedback();

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
  account_access: { label: 'Account Access', color: 'bg-info' },
  billing: { label: 'Billing', color: 'bg-warning' },
  reliability: { label: 'Reliability', color: 'bg-destructive' },
  integration: { label: 'Integration', color: 'bg-primary' },
};
