'use client';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface SubjectAccuracy {
  subject: string;
  accuracy: number;
  fill: string;
}

interface AccuracyChartProps {
  data: SubjectAccuracy[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  if (!data.length) {
    return <div className="text-center py-12 text-ink-muted italic">No data yet</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {data.map((item) => (
        <div key={item.subject} className="flex flex-col items-center">
          <div className="relative w-24 h-24">
            <RadialBarChart
              width={96}
              height={96}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={8}
              data={[item]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                dataKey="accuracy"
                cornerRadius={4}
                fill={item.fill}
                background={{ fill: 'var(--color-border, #e2e8f0)' }}
              />
            </RadialBarChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-ink">{item.accuracy}%</span>
            </div>
          </div>
          <span className="text-xs font-medium text-ink-muted mt-2 text-center">
            {item.subject}
          </span>
        </div>
      ))}
    </div>
  );
}
