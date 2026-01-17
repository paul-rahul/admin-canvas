import type { Entry, Theme } from '@/lib/apiClient';

export type EmergingReason = 'new' | 'volume_spike' | 'urgency_escalation';

export type EmergingTheme = {
  theme_id: string;
  name: string;
  currentCount: number;
  prevCount: number;
  currentAvgUrgency: number | null;
  prevAvgUrgency: number | null;
  currentNegativeRatio: number | null;
  prevNegativeRatio: number | null;
  emergingReason: EmergingReason;
  emergingScore: number;
  reasonText: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_CURRENT = 3;
const NEW_THEME_MIN = 3;
const GROWTH_MULTIPLIER = 2.0;
const MIN_ABS_INCREASE = 2;
const URGENCY_DELTA = 1.0;
const NEG_RATIO_GATE = 0.5;

export const parseTimestampSafe = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export const normalizeUrgency = (value?: string | null): number | null => {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) return null;
  if (normalized === 'low') return 1;
  if (normalized === 'medium') return 2;
  if (normalized === 'high') return 3;
  if (normalized === 'critical') return 4;
  return null;
};

export const normalizeSentiment = (
  value?: string | null
): 'positive' | 'neutral' | 'negative' | null => {
  const normalized = value?.toLowerCase().trim();
  if (normalized === 'positive') return 'positive';
  if (normalized === 'neutral') return 'neutral';
  if (normalized === 'negative') return 'negative';
  return null;
};

const formatThemeName = (value: string) => {
  if (!value) return 'Theme';
  const cleaned = value.replace(/[_-]+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

type WindowStats = {
  count: number;
  urgencySum: number;
  urgencyCount: number;
  negativeCount: number;
  sentimentCount: number;
};

const createStats = (): WindowStats => ({
  count: 0,
  urgencySum: 0,
  urgencyCount: 0,
  negativeCount: 0,
  sentimentCount: 0,
});

const toAverage = (sum: number, count: number) => (count ? sum / count : null);

const buildReasonText = (
  reason: EmergingReason,
  prevCount: number,
  currentCount: number,
  prevUrgency: number | null,
  currentUrgency: number | null
) => {
  if (reason === 'new') {
    return `New theme (0 → ${currentCount} mentions)`;
  }
  if (reason === 'volume_spike') {
    return `Mentions increased (${prevCount} → ${currentCount})`;
  }
  if (reason === 'urgency_escalation') {
    const prev = prevUrgency?.toFixed(1) ?? '—';
    const current = currentUrgency?.toFixed(1) ?? '—';
    return `Urgency increased (${prev} → ${current})`;
  }
  return 'Emerging trend detected';
};

const computeScore = (
  currentCount: number,
  prevCount: number,
  currentUrgency: number | null,
  prevUrgency: number | null,
  currentNegative: number | null,
  prevNegative: number | null
) => {
  const volumeGrowthRate = (currentCount + 1) / (prevCount + 1);
  const absIncrease = currentCount - prevCount;
  const urgencyDelta = (currentUrgency ?? 0) - (prevUrgency ?? 0);
  const negDelta = (currentNegative ?? 0) - (prevNegative ?? 0);

  return 2.0 * Math.log(volumeGrowthRate) + 0.5 * absIncrease + 1.0 * urgencyDelta + 0.5 * negDelta;
};

export const computeEmergingThemes = (
  entries: Entry[],
  themes: Theme[] = [],
  now: Date,
  windowDays = 7
): EmergingTheme[] => {
  const nowMs = now.getTime();
  const currentStart = nowMs - windowDays * DAY_MS;
  const prevStart = nowMs - windowDays * 2 * DAY_MS;
  const prevEnd = currentStart;

  const themeLookup = new Map<string, Theme>();
  themes.forEach((theme) => {
    if (theme.theme_id) {
      themeLookup.set(theme.theme_id, theme);
    }
  });

  const stats = new Map<string, { current: WindowStats; previous: WindowStats }>();
  let hasTimestamp = false;

  entries.forEach((entry) => {
    const themeId = (entry as { theme_id?: string }).theme_id ?? entry.issueType ?? 'uncategorized';
    const normalizedId = String(themeId).toLowerCase();
    const timestamp = parseTimestampSafe(entry.timestamp);
    if (!timestamp) {
      return;
    }

    hasTimestamp = true;
    const bucket = stats.get(normalizedId) ?? { current: createStats(), previous: createStats() };
    const target = timestamp >= currentStart && timestamp < nowMs ? bucket.current : timestamp >= prevStart && timestamp < prevEnd ? bucket.previous : null;

    if (!target) {
      return;
    }

    target.count += 1;

    const urgencyValue = normalizeUrgency(entry.urgency);
    if (urgencyValue !== null) {
      target.urgencySum += urgencyValue;
      target.urgencyCount += 1;
    }

    const sentimentValue = normalizeSentiment(entry.sentiment);
    if (sentimentValue) {
      target.sentimentCount += 1;
      if (sentimentValue === 'negative') {
        target.negativeCount += 1;
      }
    }

    stats.set(normalizedId, bucket);
  });

  if (!hasTimestamp) {
    return themes
      .filter((theme) => theme.trend && ['up', 'upward', 'emerging', 'spike'].some((flag) => theme.trend?.toLowerCase().includes(flag)))
      .map((theme) => ({
        theme_id: theme.theme_id ?? 'unknown',
        name: theme.name ?? formatThemeName(theme.theme_id ?? 'Theme'),
        currentCount: theme.num_mentions ?? 0,
        prevCount: 0,
        currentAvgUrgency: null,
        prevAvgUrgency: null,
        currentNegativeRatio: null,
        prevNegativeRatio: null,
        emergingReason: 'new',
        emergingScore: 0,
        reasonText: 'Theme flagged as emerging',
      }));
  }

  const emerging: EmergingTheme[] = [];

  stats.forEach((data, themeId) => {
    const currentCount = data.current.count;
    const prevCount = data.previous.count;
    if (currentCount < MIN_CURRENT) return;

    const currentAvgUrgency = toAverage(data.current.urgencySum, data.current.urgencyCount);
    const prevAvgUrgency = toAverage(data.previous.urgencySum, data.previous.urgencyCount);
    const currentNegativeRatio = data.current.sentimentCount
      ? data.current.negativeCount / data.current.sentimentCount
      : null;
    const prevNegativeRatio = data.previous.sentimentCount
      ? data.previous.negativeCount / data.previous.sentimentCount
      : null;

    let reason: EmergingReason | null = null;
    if (prevCount === 0 && currentCount >= NEW_THEME_MIN) {
      reason = 'new';
    } else if (
      prevCount > 0 &&
      currentCount >= prevCount * GROWTH_MULTIPLIER &&
      currentCount - prevCount >= MIN_ABS_INCREASE
    ) {
      reason = 'volume_spike';
    } else if (
      currentAvgUrgency !== null &&
      prevAvgUrgency !== null &&
      currentAvgUrgency - prevAvgUrgency >= URGENCY_DELTA &&
      (currentNegativeRatio === null || currentNegativeRatio >= NEG_RATIO_GATE)
    ) {
      reason = 'urgency_escalation';
    }

    if (!reason) return;

    const themeMeta = themeLookup.get(themeId);
    const name = themeMeta?.name ?? formatThemeName(themeMeta?.theme_id ?? themeId);
    const score = computeScore(
      currentCount,
      prevCount,
      currentAvgUrgency,
      prevAvgUrgency,
      currentNegativeRatio,
      prevNegativeRatio
    );

    emerging.push({
      theme_id: themeId,
      name,
      currentCount,
      prevCount,
      currentAvgUrgency,
      prevAvgUrgency,
      currentNegativeRatio,
      prevNegativeRatio,
      emergingReason: reason,
      emergingScore: score,
      reasonText: buildReasonText(reason, prevCount, currentCount, prevAvgUrgency, currentAvgUrgency),
    });
  });

  return emerging.sort((a, b) => b.emergingScore - a.emergingScore).slice(0, 5);
};
