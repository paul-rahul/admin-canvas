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

export const mockFeedback: FeedbackItem[] = [
  {
    id: '1',
    source: 'support',
    title: 'API rate limiting is too aggressive',
    content: 'We hit rate limits even with minimal traffic. This is blocking our production deployment. Need urgent review of our limits.',
    sentiment: 'negative',
    urgency: 'critical',
    category: 'performance',
    timestamp: new Date('2024-01-15T10:30:00'),
    author: 'Enterprise Client',
    resolved: false,
  },
  {
    id: '2',
    source: 'discord',
    title: 'Workers AI is amazing!',
    content: 'Just migrated from AWS Lambda and the cold start improvement is incredible. Love the edge computing approach!',
    sentiment: 'positive',
    urgency: 'low',
    category: 'feature',
    timestamp: new Date('2024-01-15T09:15:00'),
    author: 'DevCommunity#1234',
    resolved: true,
  },
  {
    id: '3',
    source: 'github',
    title: 'R2 bucket CORS configuration not working',
    content: 'Following the docs exactly but still getting CORS errors. Tested in Chrome and Firefox. Attaching reproduction repo.',
    sentiment: 'negative',
    urgency: 'high',
    category: 'bug',
    timestamp: new Date('2024-01-15T08:45:00'),
    author: 'jsmith-dev',
    resolved: false,
  },
  {
    id: '4',
    source: 'twitter',
    title: 'Documentation needs examples',
    content: 'The Workers docs are comprehensive but lack real-world examples. Would love to see more tutorials.',
    sentiment: 'neutral',
    urgency: 'medium',
    category: 'documentation',
    timestamp: new Date('2024-01-14T16:20:00'),
    author: '@clouddev_sarah',
    resolved: false,
  },
  {
    id: '5',
    source: 'email',
    title: 'Pricing tier confusion',
    content: 'Having trouble understanding the difference between Pro and Business plans. The comparison table is confusing.',
    sentiment: 'neutral',
    urgency: 'medium',
    category: 'pricing',
    timestamp: new Date('2024-01-14T14:00:00'),
    author: 'sales-lead@company.com',
    resolved: true,
  },
  {
    id: '6',
    source: 'forum',
    title: 'Dashboard UX improvement suggestion',
    content: 'Would be great to have a dark mode toggle in the header instead of buried in settings. Small but impactful change.',
    sentiment: 'positive',
    urgency: 'low',
    category: 'ux',
    timestamp: new Date('2024-01-14T11:30:00'),
    author: 'PowerUser99',
    resolved: false,
  },
  {
    id: '7',
    source: 'support',
    title: 'SSL certificate not auto-renewing',
    content: 'Our custom domain SSL expired without warning. Site was down for 2 hours. Need immediate escalation.',
    sentiment: 'negative',
    urgency: 'critical',
    category: 'bug',
    timestamp: new Date('2024-01-14T03:45:00'),
    author: 'CTO @ StartupX',
    resolved: true,
  },
  {
    id: '8',
    source: 'github',
    title: 'Feature request: Cron trigger improvements',
    content: 'Would love to see sub-minute cron scheduling and better logging for scheduled workers.',
    sentiment: 'positive',
    urgency: 'low',
    category: 'feature',
    timestamp: new Date('2024-01-13T22:10:00'),
    author: 'automation-guru',
    resolved: false,
  },
  {
    id: '9',
    source: 'discord',
    title: 'KV storage latency spikes',
    content: 'Seeing intermittent latency spikes (500ms+) on KV reads in Asia Pacific region. Anyone else experiencing this?',
    sentiment: 'negative',
    urgency: 'high',
    category: 'performance',
    timestamp: new Date('2024-01-13T19:00:00'),
    author: 'APACDev#5678',
    resolved: false,
  },
  {
    id: '10',
    source: 'email',
    title: 'Great onboarding experience',
    content: 'Just wanted to say the new onboarding flow is much improved. Got my first Worker deployed in under 10 minutes!',
    sentiment: 'positive',
    urgency: 'low',
    category: 'ux',
    timestamp: new Date('2024-01-13T15:30:00'),
    author: 'new-customer@techcorp.io',
    resolved: true,
  },
  {
    id: '11',
    source: 'twitter',
    title: 'Workers AI model selection limited',
    content: 'Would love to see more LLM options in Workers AI. Current selection is good but competitors have more variety.',
    sentiment: 'neutral',
    urgency: 'medium',
    category: 'feature',
    timestamp: new Date('2024-01-13T12:45:00'),
    author: '@ai_enthusiast',
    resolved: false,
  },
  {
    id: '12',
    source: 'forum',
    title: 'Pages deployment failing silently',
    content: 'Deployments sometimes fail without error messages. Have to check build logs manually to find issues.',
    sentiment: 'negative',
    urgency: 'high',
    category: 'bug',
    timestamp: new Date('2024-01-12T20:00:00'),
    author: 'WebDevPro',
    resolved: false,
  },
];

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
