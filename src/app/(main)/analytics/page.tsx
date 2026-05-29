'use client';
import { motion } from 'framer-motion';
import { useExam } from '@/hooks/useExam';
import { Card } from '@/components/ui/card';
import { AccuracyChart } from '@/components/charts/AccuracyChart';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { ExamBadge } from '@/components/exam/ExamBadge';
import { BarChart3, Brain, Target, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { subjects } = useExam();

  const fixedData = [
    { subject: 'Physics', accuracy: 68, fill: '#6366f1' },
    { subject: 'Chemistry', accuracy: 72, fill: '#a855f7' },
    { subject: 'Biology', accuracy: 81, fill: '#22d3ee' },
  ];
  const subjectData = subjects.length > 0
    ? subjects.map((s, i) => ({ subject: s.name, accuracy: i === 0 ? 68 : i === 1 ? 72 : 81, fill: i === 0 ? '#6366f1' : i === 1 ? '#a855f7' : '#22d3ee' }))
    : fixedData;

  const weakTopics = [
    { topic: 'Thermodynamics', accuracy: 34 },
    { topic: 'Organic Chemistry', accuracy: 42 },
    { topic: 'Cell Division', accuracy: 38 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Analytics</h1>
          <p className="text-sm text-ink-muted mt-1">Track your progress</p>
        </div>
        <ExamBadge />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BarChart3, label: 'Total Questions', value: '1,240' },
          { icon: Target, label: 'Accuracy', value: '72%', color: 'text-primary' },
          { icon: TrendingUp, label: 'Best Streak', value: '12d', color: 'text-success' },
          { icon: Brain, label: 'Total XP', value: '3,450', color: 'text-accent' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <stat.icon size={20} className={stat.color ?? 'text-ink-muted'} />
            <p className="text-2xl font-bold text-ink mt-2">{stat.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink mb-4">Per-Subject Accuracy</h2>
        <Card className="p-5">
          <AccuracyChart data={subjectData} />
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink mb-4">Activity (Last 30 Days)</h2>
        <Card className="p-5">
          <ActivityHeatmap />
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink mb-4">Weak Topics</h2>
        <div className="space-y-3">
          {weakTopics.map((wt) => (
            <Card key={wt.topic} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">{wt.topic}</span>
                <span className="text-sm font-bold text-danger">{wt.accuracy}%</span>
              </div>
              <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-danger rounded-full"
                  style={{ width: `${wt.accuracy}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
