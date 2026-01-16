import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FeedbackItem } from '@/data/mockFeedback';

interface SentimentChartProps {
  feedback: FeedbackItem[];
}

export function SentimentChart({ feedback }: SentimentChartProps) {
  const sentimentCounts = feedback.reduce((acc, item) => {
    acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    { name: 'Positive', value: sentimentCounts.positive || 0, color: 'hsl(142, 71%, 45%)' },
    { name: 'Negative', value: sentimentCounts.negative || 0, color: 'hsl(0, 72%, 51%)' },
    { name: 'Neutral', value: sentimentCounts.neutral || 0, color: 'hsl(215, 20%, 55%)' },
  ];

  return (
    <div className="glass rounded-xl p-6 shadow-card opacity-0 animate-slide-up stagger-4">
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 16%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
