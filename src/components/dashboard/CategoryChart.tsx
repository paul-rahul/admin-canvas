import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import { FeedbackItem, issueTypeConfig } from '@/data/mockFeedback';

interface CategoryChartProps {
  feedback: FeedbackItem[];
  embedded?: boolean;
  showTooltip?: boolean;
}

export function CategoryChart({ feedback, embedded = false, showTooltip = true }: CategoryChartProps) {
  const issueTypeCounts = feedback.reduce((acc, item) => {
    const issueType = item.issueType ?? 'unknown';
    acc[issueType] = (acc[issueType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(issueTypeCounts).map(([key, value]) => ({
    name: issueTypeConfig[key as keyof typeof issueTypeConfig]?.label || 'Unknown',
    value,
    issueType: key,
  }));

  const getBarColor = (issueType: string) => {
    const colors: Record<string, string> = {
      bug: 'hsl(0, 72%, 51%)',
      feature: 'hsl(24, 100%, 50%)',
      performance: 'hsl(38, 92%, 50%)',
      ux: 'hsl(199, 89%, 48%)',
      pricing: 'hsl(142, 71%, 45%)',
      documentation: 'hsl(215, 20%, 55%)',
      unknown: 'hsl(215, 20%, 55%)',
    };
    return colors[issueType] || 'hsl(24, 100%, 50%)';
  };

  const chart = (
    <div className={embedded ? "h-40" : "h-64"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: embedded ? 48 : 20 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={embedded ? 100 : 80}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: embedded ? 11 : 12 }}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 16%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
              cursor={{ fill: 'hsl(222, 47%, 14%)' }}
            />
          )}
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.issueType)} />
            ))}
            <LabelList dataKey="value" position="right" fill="hsl(215, 20%, 70%)" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (embedded) {
    return chart;
  }

  return (
    <div className="glass rounded-xl p-6 shadow-card animate-slide-up stagger-5">
      <h3 className="text-lg font-semibold mb-4">Feedback by Issue Type</h3>
      {chart}
    </div>
  );
}
