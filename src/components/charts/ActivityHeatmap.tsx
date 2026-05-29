'use client';

interface ActivityHeatmapProps {
  data?: Record<string, number>;
  days?: number;
}

export function ActivityHeatmap({ data = {}, days = 30 }: ActivityHeatmapProps) {
  const today = new Date();
  const dayData = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split('T')[0];
    return {
      date: key,
      count: data[key] ?? 0,
      day: d.getDay(),
    };
  });

  const maxCount = Math.max(...dayData.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-surface2';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.75) return 'bg-primary';
    if (intensity > 0.5) return 'bg-primary/70';
    if (intensity > 0.25) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  const weeks: typeof dayData[] = [];
  for (let i = 0; i < dayData.length; i += 7) {
    weeks.push(dayData.slice(i, i + 7));
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, di) => {
              const day = week[di];
              if (!day) return <div key={di} className="w-3 h-3" />;
              return (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                  title={`${day.date}: ${day.count} attempts`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-ink-muted">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-surface2" />
        <div className="w-3 h-3 rounded-sm bg-primary/20" />
        <div className="w-3 h-3 rounded-sm bg-primary/40" />
        <div className="w-3 h-3 rounded-sm bg-primary/70" />
        <div className="w-3 h-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
