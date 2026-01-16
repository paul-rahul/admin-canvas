import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { FeedbackItem, categoryConfig } from '@/data/mockFeedback';

interface CategoryChartProps {
  feedback: FeedbackItem[];
}

export function CategoryChart({ feedback }: CategoryChartProps) {
  const categoryCounts = feedback.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryCounts).map(([key, value]) => ({
    name: categoryConfig[key as keyof typeof categoryConfig]?.label || key,
    value,
    category: key,
  }));

  const getBarColor = (category: string) => {
    const colors: Record<string, string> = {
      bug: 'hsl(0, 72%, 51%)',
      feature: 'hsl(24, 100%, 50%)',
      performance: 'hsl(38, 92%, 50%)',
      ux: 'hsl(199, 89%, 48%)',
      pricing: 'hsl(142, 71%, 45%)',
      documentation: 'hsl(215, 20%, 55%)',
    };
    return colors[category] || 'hsl(24, 100%, 50%)';
  };

  return (
    <div className="glass rounded-xl p-6 shadow-card opacity-0 animate-slide-up stagger-5">
      <h3 className="text-lg font-semibold mb-4">Feedback by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={80}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(222, 47%, 16%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
              cursor={{ fill: 'hsl(222, 47%, 14%)' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.category)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
