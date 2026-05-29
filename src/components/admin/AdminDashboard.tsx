'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Activity, Award, HelpCircle } from 'lucide-react';
import type { AdminStats } from '@/types/leaderboard';

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalRegisteredUsers: 0,
    totalUsersPerExam: [],
    dailyActiveUsers: [],
    averageScores: [],
    marksDistribution: [],
    topWrongQuestions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: users } = await supabase.from('profiles').select('id, targetExams, totalMarksEarned');
        const totalUsers = (users ?? []).length;
        const perExam: Record<string, number> = {};
        (users ?? []).forEach((u: Record<string, unknown>) => {
          const exams = (u.targetExams as string[]) ?? [];
          exams.forEach((e: string) => {
            perExam[e] = (perExam[e] ?? 0) + 1;
          });
        });

        const { data: attempts } = await supabase
          .from('attempts')
          .select('attempted_at')
          .gte('attempted_at', new Date(Date.now() - 30 * 86400000).toISOString());

        const dailyMap: Record<string, number> = {};
        (attempts ?? []).forEach((a: Record<string, unknown>) => {
          const day = new Date(a.attempted_at as string).toISOString().split('T')[0];
          dailyMap[day] = (dailyMap[day] ?? 0) + 1;
        });

        const marksRanges = [
          { label: '0-99', min: 0, max: 99 },
          { label: '100-499', min: 100, max: 499 },
          { label: '500-999', min: 500, max: 999 },
          { label: '1000+', min: 1000, max: Infinity },
        ];
        const marksDist = marksRanges.map(r => ({
          marksRange: r.label,
          count: (users ?? []).filter((u: Record<string, unknown>) => {
            const m = (u.totalMarksEarned as number) ?? 0;
            return m >= r.min && m <= r.max;
          }).length,
        }));

        const { data: wrongAttempts } = await supabase
          .from('attempts')
          .select('question_id, questions(questionText)')
          .eq('is_correct', false)
          .limit(1000);

        const wrongCount: Record<string, { count: number; question: string }> = {};
        (wrongAttempts ?? []).forEach((a: Record<string, unknown>) => {
          const qId = a.question_id as string;
          const qText = ((a.questions as Record<string, unknown>)?.questionText as string) ?? 'Unknown';
          if (!wrongCount[qId]) wrongCount[qId] = { count: 0, question: qText };
          wrongCount[qId].count++;
        });

        const topWrong = Object.entries(wrongCount)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .map(([id, val]) => ({
            id,
            question: val.question,
            wrongRate: 0,
            totalAttempts: val.count,
          }));

        if (!cancelled) {
          setStats({
            totalRegisteredUsers: totalUsers,
            totalUsersPerExam: Object.entries(perExam).map(([exam, count]) => ({ exam, count })),
            dailyActiveUsers: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
            averageScores: [],
            marksDistribution: marksDist,
            topWrongQuestions: topWrong,
          });
        }
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch stats:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summaryCards = [
    { icon: Users, label: 'Total Users', value: stats.totalRegisteredUsers, color: 'text-primary' },
    { icon: Activity, label: 'Active (30d)', value: stats.dailyActiveUsers.length, color: 'text-accent' },
    { icon: Award, label: 'Exams', value: stats.totalUsersPerExam.length, color: 'text-warning' },
    { icon: HelpCircle, label: 'Wrong Qs Tracked', value: stats.topWrongQuestions.length, color: 'text-danger' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-ink">Dashboard Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`${c.color} mb-2`}><c.icon size={24} /></div>
            <p className="text-3xl font-bold text-ink">{c.value}</p>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-widest">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Users per Exam</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.totalUsersPerExam}>
                <XAxis dataKey="exam" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Daily Active Users (30d)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyActiveUsers}>
                <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Marks Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.marksDistribution}>
                <XAxis dataKey="marksRange" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Top Wrong Questions</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.topWrongQuestions.length === 0 && (
              <p className="text-sm text-ink-muted italic">No data yet</p>
            )}
            {stats.topWrongQuestions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 p-2 bg-surface2 rounded-xl">
                <span className="text-xs font-bold text-ink-muted w-6 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink truncate">{q.question}</p>
                  <p className="text-[10px] text-ink-muted">{q.totalAttempts} wrong attempts</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
