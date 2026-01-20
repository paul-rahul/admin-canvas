import { mockFeedback } from '../src/data/mockFeedback';

const analyzeDateDistribution = () => {
  const yearCounts: Record<number, number> = {};
  const yearRanges: Record<string, number> = {
    '2012-2014': 0,
    '2015-2017': 0,
    '2018-2020': 0,
    '2021-2023': 0,
    '2024-2026': 0,
  };

  mockFeedback.forEach((item) => {
    const timestamp = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
    const year = timestamp.getFullYear();
    
    yearCounts[year] = (yearCounts[year] || 0) + 1;

    if (year >= 2012 && year <= 2014) {
      yearRanges['2012-2014']++;
    } else if (year >= 2015 && year <= 2017) {
      yearRanges['2015-2017']++;
    } else if (year >= 2018 && year <= 2020) {
      yearRanges['2018-2020']++;
    } else if (year >= 2021 && year <= 2023) {
      yearRanges['2021-2023']++;
    } else if (year >= 2024 && year <= 2026) {
      yearRanges['2024-2026']++;
    }
  });

  console.log('\n=== Year-wise Distribution of Mock Data Creation Dates ===\n');
  console.log('Individual Years:');
  console.log('─────────────────────────────────────────');
  
  const sortedYears = Object.keys(yearCounts)
    .map(Number)
    .sort((a, b) => a - b);
  
  sortedYears.forEach((year) => {
    const count = yearCounts[year];
    const percentage = ((count / mockFeedback.length) * 100).toFixed(2);
    const bar = '█'.repeat(Math.floor((count / mockFeedback.length) * 50));
    console.log(`${year}: ${count.toString().padStart(5)} (${percentage.padStart(6)}%) ${bar}`);
  });

  console.log('\nYear Ranges:');
  console.log('─────────────────────────────────────────');
  Object.entries(yearRanges).forEach(([range, count]) => {
    const percentage = ((count / mockFeedback.length) * 100).toFixed(2);
    const bar = '█'.repeat(Math.floor((count / mockFeedback.length) * 50));
    console.log(`${range}: ${count.toString().padStart(5)} (${percentage.padStart(6)}%) ${bar}`);
  });

  console.log(`\nTotal entries: ${mockFeedback.length}`);
  console.log(`Date range: ${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}\n`);

  // Show earliest and latest dates
  const dates = mockFeedback.map((item) => {
    const timestamp = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
    return timestamp.getTime();
  });
  const earliest = new Date(Math.min(...dates));
  const latest = new Date(Math.max(...dates));
  
  console.log(`Earliest ticket: ${earliest.toISOString().split('T')[0]}`);
  console.log(`Latest ticket: ${latest.toISOString().split('T')[0]}\n`);

  // Show recent time period counts
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const last7d = now - 7 * 24 * 60 * 60 * 1000;
  const last30d = now - 30 * 24 * 60 * 60 * 1000;
  const lastYear = now - 365 * 24 * 60 * 60 * 1000;

  const last24hCount = dates.filter((d) => d >= last24h).length;
  const last7dCount = dates.filter((d) => d >= last7d).length;
  const last30dCount = dates.filter((d) => d >= last30d).length;
  const lastYearCount = dates.filter((d) => d >= lastYear).length;

  console.log('Recent Time Periods:');
  console.log('─────────────────────────────────────────');
  console.log(`Last 24 hours: ${last24hCount.toString().padStart(5)} entries`);
  console.log(`Last 7 days:   ${last7dCount.toString().padStart(5)} entries`);
  console.log(`Last 30 days:  ${last30dCount.toString().padStart(5)} entries`);
  console.log(`Last 1 year:   ${lastYearCount.toString().padStart(5)} entries\n`);
};

analyzeDateDistribution();
