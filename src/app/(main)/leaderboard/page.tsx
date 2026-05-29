'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useExam } from '@/hooks/useExam';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { ExamToggle } from '@/components/leaderboard/ExamToggle';
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardRow, PeriodType } from '@/types/leaderboard';

const periodTabs = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'All-Time', value: 'all_time' },
];

const medals = [
  { icon: Trophy, color: 'text-warning' },
  { icon: Medal, color: 'text-ink-muted' },
  { icon: Award, color: 'text-primary' },
];

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [period, setPeriod] = useState<PeriodType>('all_time');
  const user = useAuthStore((s) => s.user);
  const { examName, config } = useExam();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const examId = config?.code;

      let query = supabase
        .from('leaderboard')
        .select('user_id, marksEarned, percentage, wrong, profiles(displayName, photoURL, totalMarksEarned)')
        .order('marksEarned', { ascending: false })
        .limit(50);

      if (examId) query = query.eq('exam_id', examId);

      const { data } = await query;
      if (data) {
        const mapped: LeaderboardRow[] = data.map((entry: Record<string, unknown>, i: number) => {
          const profile = entry.profiles as Record<string, unknown> | null;
          return {
            rank: i + 1,
            userId: entry.user_id as string,
            name: (profile?.displayName as string) ?? 'Anonymous',
            avatar: profile?.photoURL as string | undefined,
            marksEarned: (entry.marksEarned as number) ?? 0,
            percentage: (entry.percentage as number) ?? 0,
            wrong: (entry.wrong as number) ?? 0,
            totalMarksEarned: (profile?.totalMarksEarned as number) ?? 0,
          };
        });
        setRows(mapped);
      }
    }
    load();
  }, [period]);

  const topThree = rows.slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Leaderboard</h1>
        <p className="text-sm text-ink-muted mt-1">{examName} — See where you stand</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <ExamToggle tabs={periodTabs} active={period} onChange={(v) => setPeriod(v as PeriodType)} />
      </div>

      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-4 h-48">
          {[1, 0, 2].map((idx) => {
            const user = topThree[idx];
            if (!user) return null;
            const isFirst = idx === 0;
            const medal = medals[idx] ?? medals[2];

            return (
              <div
                key={user.userId}
                className={`flex flex-col items-center ${isFirst ? 'scale-110' : 'scale-90'}`}
              >
                <medal.icon size={isFirst ? 32 : 24} className={`${medal.color} mb-2`} />
                <div
                  className={`rounded-full border-2 mb-2 ${isFirst ? 'w-16 h-16 border-primary' : 'w-12 h-12 border-border'}`}
                >
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user.name[0]}
                  </div>
                </div>
                <p className="text-sm font-bold text-ink">{user.name}</p>
                <p className="text-lg font-black text-primary">{user.marksEarned.toFixed(1)}</p>
                <p className="text-[10px] text-ink-muted">Marks</p>
              </div>
            );
          })}
        </div>
      )}

      <LeaderboardTable rows={rows} />
    </motion.div>
  );
}
