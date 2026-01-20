import { mockFeedback } from '../src/data/mockFeedback';

type FeedbackApiItem = Omit<(typeof mockFeedback)[number], 'timestamp'> & {
  timestamp: string;
};

const serializeFeedback = (): FeedbackApiItem[] =>
  mockFeedback.map((item) => ({
    ...item,
    timestamp: item.timestamp.toISOString(),
  }));

async function seedD1() {
  // This script should be run with: npx wrangler d1 execute cerebro-db-data --remote --command="..."
  // But since we need to insert JSON data, we'll use a different approach
  
  console.log('Generating SQL insert statements...');
  const items = serializeFeedback();
  
  // Clear existing data
  console.log('DELETE FROM feedback_entries;');
  
  // Generate INSERT statements in batches
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const values = batch.map((item) => {
      const payload = JSON.stringify(item).replace(/'/g, "''"); // Escape single quotes
      return `('${item.id}', '${payload}')`;
    }).join(',\n  ');
    
    console.log(`INSERT OR REPLACE INTO feedback_entries (id, payload) VALUES\n  ${values};`);
  }
  
  console.error(`\n-- Total entries: ${items.length}`);
  console.error('-- Run this script and pipe output to: npx wrangler d1 execute cerebro-db-data --remote --file=-');
}

seedD1().catch(console.error);
