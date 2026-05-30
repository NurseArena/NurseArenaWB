'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useXP } from '@/hooks/useXP';
import { LogOut, User, Sun, Moon, Trophy, Target, Zap, Star } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { useTheme } from '@/components/ThemeProvider';
import { RAPID_FIRE_TIERS } from '@/lib/xp';
import { EXAMS } from '@/lib/exam-config';
import { SpeedSeekerBadge } from '@/components/gamification/SpeedSeekerBadge';

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [fetchedUser, setFetchedUser] = useState<typeof storeUser>(null);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { marks, xp, currentTier } = useXP();

  const user = fetchedUser ?? storeUser;

  useEffect(() => {
    if (storeUser) return;
    (async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      if (profile) {
        const p = profile as Record<string, unknown>;
        setFetchedUser({ ...profile, isAdmin: p.is_admin ?? p.isAdmin } as never);
        setUser({ ...profile, isAdmin: p.is_admin ?? p.isAdmin } as never);
      }
    })();
  }, [storeUser, setUser]);

  const totalCorrect = user?.totalCorrect ?? 0;
  const totalWrong = user?.totalWrong ?? 0;
  const totalSkipped = user?.totalSkipped ?? 0;
  const totalAttempted = user?.totalQuestionsAttempted ?? 0;
  const bestMockScore = user?.bestMockScore ?? 0;
  const streakDays = user?.streakDays ?? 0;
  const displayName = user?.displayName ?? user?.email ?? 'Student';
  const targetExams = user?.targetExams ?? [];
  const currentStage = user?.currentStage ?? '';
  const district = user?.district ?? '';
  const institution = user?.institution ?? '';
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <User size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-ink">{displayName}</h1>
        <p className="text-sm text-ink-muted">{currentStage || 'Student'}{district ? ` · ${district}` : ''}</p>
        {institution && <p className="text-xs text-ink-muted">{institution}</p>}
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-ink">{marks.toFixed(1)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total Marks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{accuracy}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{xp.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">XP</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-success">{bestMockScore}%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Best Mock</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{streakDays}d</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Streak</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <SpeedSeekerBadge />
          </div>
        </div>
      </Card>

      {targetExams.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <LogoIcon size={18} /> Enrolled Exams
          </h2>
          <div className="space-y-2">
            {targetExams.map((e) => {
              const exam = EXAMS[e as keyof typeof EXAMS];
              return (
                <div
                  key={e}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface2"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (exam?.color ?? '#6366f1') + '20' }}>
                    <LogoIcon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{exam?.shortName ?? e}</p>
                    <p className="text-xs text-ink-muted">{exam?.name ?? e}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <Zap size={18} className="text-warning" /> Rapid Fire Progress
        </h2>
        <div className="space-y-2">
          {RAPID_FIRE_TIERS.map((t) => {
            const isUnlocked = marks >= t.marksMilestone;
            const isCompleted = isUnlocked && t.tier > 1;
            return (
              <div
                key={t.tier}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
                  isCompleted ? 'bg-success/10 text-success' : 'bg-surface2 text-ink-muted'
                }`}
              >
                <span className="font-bold">Tier {t.tier}: {t.name}</span>
                <span className="text-xs">
                  {isCompleted ? `${t.timerSeconds}s ✓` : t.tier === 1 ? `${t.timerSeconds}s ● Active` : `${t.timerSeconds}s (${t.marksMilestone} marks)`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <Target size={18} className="text-primary" /> Your Stats
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface2 rounded-xl p-3">
            <p className="text-xs text-ink-muted">Correct</p>
            <p className="text-lg font-bold text-success">{totalCorrect}</p>
          </div>
          <div className="bg-surface2 rounded-xl p-3">
            <p className="text-xs text-ink-muted">Wrong</p>
            <p className="text-lg font-bold text-danger">{totalWrong}</p>
          </div>
          <div className="bg-surface2 rounded-xl p-3">
            <p className="text-xs text-ink-muted">Skipped</p>
            <p className="text-lg font-bold text-ink-muted">{totalSkipped}</p>
          </div>
          <div className="bg-surface2 rounded-xl p-3">
            <p className="text-xs text-ink-muted">Attempted</p>
            <p className="text-lg font-bold text-ink">{totalAttempted}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {mounted && (theme === 'light' ? (
                <Sun size={20} className="text-ink-muted" />
              ) : (
                <Moon size={20} className="text-ink-muted" />
              ))}
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                {mounted && <p className="text-xs text-ink-muted capitalize">{theme} mode</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              Toggle
            </Button>
          </div>
        </div>
      </Card>

      <Button variant="danger" className="w-full" onClick={handleLogout}>
        <LogOut size={18} />
        Log Out
      </Button>
    </motion.div>
  );
}
