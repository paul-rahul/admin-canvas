export type FeedbackSource = 'support' | 'discord' | 'github' | 'twitter' | 'email' | 'forum';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type Category = 'bug' | 'feature' | 'performance' | 'ux' | 'pricing' | 'documentation';

export interface FeedbackItem {
  id: string;
  source: FeedbackSource;
  title: string;
  content: string;
  sentiment: Sentiment;
  urgency: Urgency;
  category: Category;
  timestamp: Date;
  author: string;
  resolved: boolean;
}

const sources: FeedbackSource[] = ['support', 'discord', 'github', 'twitter', 'email', 'forum'];
const categories: Category[] = ['bug', 'feature', 'performance', 'ux', 'pricing', 'documentation'];
const sentiments: Sentiment[] = ['positive', 'negative', 'neutral'];
const urgencies: Urgency[] = ['critical', 'high', 'medium', 'low'];

const sourceTopics: Record<FeedbackSource, string[]> = {
  support: ['rate limit', 'billing', 'DNS', 'WAF', 'SSL', 'account access', 'outage', 'API auth'],
  discord: ['Workers', 'KV', 'R2', 'Pages', 'Durable Objects', 'Queues', 'D1', 'Turnstile'],
  github: ['CLI', 'docs', 'API', 'SDK', 'example repo', 'CI setup', 'TypeScript types', 'release notes'],
  twitter: ['product launch', 'docs', 'pricing', 'performance', 'status', 'feature request', 'benchmark', 'tutorial'],
  email: ['sales question', 'invoice', 'plan upgrade', 'security review', 'SLA', 'procurement', 'support ticket', 'renewal'],
  forum: ['best practices', 'migration', 'how-to', 'troubleshooting', 'case study', 'template', 'workflow', 'integration'],
};

const categoryTopics: Record<Category, string[]> = {
  bug: ['regression', 'error', 'crash', 'timeout', 'broken link', 'misconfiguration', 'unexpected behavior', 'edge case'],
  feature: ['request', 'enhancement', 'integration', 'automation', 'dashboard', 'API endpoint', 'flag', 'webhook'],
  performance: ['latency', 'throughput', 'cold start', 'cache hit rate', 'build time', 'query time', 'bandwidth'],
  ux: ['navigation', 'onboarding', 'dashboard layout', 'search', 'filters', 'settings', 'tooltip copy', 'empty state'],
  pricing: ['tier limit', 'overage', 'usage reporting', 'credits', 'discount', 'billing alert', 'seat count', 'invoice clarity'],
  documentation: ['guide', 'example', 'reference', 'migration doc', 'glossary', 'FAQ', 'tutorial', 'API schema'],
};

const contentTemplates = [
  'Noticed {topic} issues when using {surface}. This blocks our rollout and needs a fix.',
  'Would love improvements to {surface} around {topic}. Happy to share more context.',
  'We tried {surface} for {topic} and ran into unexpected behavior. Repro steps available.',
  'The current flow in {surface} feels confusing for {topic}. Suggest a clearer path.',
  'Great progress on {surface}, but {topic} still feels rough at scale.',
  'Please add better visibility for {topic} in {surface}; logs are hard to trace.',
  'Comparing with competitors, {surface} for {topic} could be stronger.',
  'Our team relies on {surface}; {topic} is the main blocker right now.',
];

const sourceAuthors: Record<FeedbackSource, string[]> = {
  support: ['Enterprise Client', 'Ops Lead', 'IT Manager', 'Site Reliability', 'CTO', 'Platform Team'],
  discord: ['DevCommunity#1234', 'EdgeWizard#4821', 'APACDev#5678', 'CFfan#9001', 'HackNight#3322'],
  github: ['jsmith-dev', 'automation-guru', 'octo-user', 'build-bot', 'api-tester', 'oss-maintainer'],
  twitter: ['@clouddev_sarah', '@ai_enthusiast', '@edge_architect', '@serverless_jane', '@perf_ninja'],
  email: ['sales-lead@company.com', 'cto@startup.io', 'finance@corp.com', 'security@enterprise.com', 'it@agency.com'],
  forum: ['PowerUser99', 'WebDevPro', 'OpsExplorer', 'TemplateCrafter', 'InfraMaven', 'BuilderKim'],
};

const buildMockFeedback = (): FeedbackItem[] => {
  const items: FeedbackItem[] = [];
  const now = Date.now();
  const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const entryCount = 200;
  let seed = 42;

  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  sources.forEach((source) => {
    for (let i = 1; i <= entryCount; i += 1) {
      const category = categories[(i + source.length) % categories.length];
      const sentiment = sentiments[(i + category.length) % sentiments.length];
      const urgency = urgencies[(i + sourceTopics[source][0].length) % urgencies.length];
      const topic = categoryTopics[category][i % categoryTopics[category].length];
      const surface = sourceTopics[source][i % sourceTopics[source].length];
      const template = contentTemplates[i % contentTemplates.length];
      const author = sourceAuthors[source][i % sourceAuthors[source].length];
      const randomOffset = Math.floor(nextRandom() * twoYearsMs);
      const bucketShift = (i % 8) * 3 * 24 * 60 * 60 * 1000;
      const timestamp = new Date(now - randomOffset - bucketShift);

      items.push({
        id: `${source}-${i}`,
        source,
        title: `${surface} ${topic} ${i}`.replace('  ', ' '),
        content: template.replace('{topic}', topic).replace('{surface}', surface),
        sentiment,
        urgency,
        category,
        timestamp,
        author,
        resolved: i % 5 === 0 || sentiment === 'positive',
      });
    }
  });

  return items;
};

export const mockFeedback: FeedbackItem[] = buildMockFeedback();

export const sourceConfig: Record<FeedbackSource, { label: string; color: string; icon: string }> = {
  support: { label: 'Support', color: 'bg-info', icon: 'headphones' },
  discord: { label: 'Discord', color: 'bg-[#5865F2]', icon: 'message-circle' },
  github: { label: 'GitHub', color: 'bg-foreground', icon: 'github' },
  twitter: { label: 'Twitter', color: 'bg-info', icon: 'twitter' },
  email: { label: 'Email', color: 'bg-warning', icon: 'mail' },
  forum: { label: 'Forum', color: 'bg-success', icon: 'users' },
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

export const categoryConfig: Record<Category, { label: string; color: string }> = {
  bug: { label: 'Bug', color: 'bg-destructive' },
  feature: { label: 'Feature', color: 'bg-primary' },
  performance: { label: 'Performance', color: 'bg-warning' },
  ux: { label: 'UX', color: 'bg-info' },
  pricing: { label: 'Pricing', color: 'bg-success' },
  documentation: { label: 'Docs', color: 'bg-muted-foreground' },
};
