'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '@/hooks/useExam';
import { useExamStore } from '@/store/examStore';
import { useAuthStore } from '@/store/authStore';
import { useXP } from '@/hooks/useXP';
import { Card } from '@/components/ui/card';
import { Swords, Zap, ScrollText, TrendingUp, Trophy, Target, BookOpen, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EXAMS } from '@/lib/exam-config';
import { SpeedSeekerBadge } from '@/components/gamification/SpeedSeekerBadge';
import { PracticePickerModal } from '@/components/exam/PracticePickerModal';

export default function DashboardPage() {
  const router = useRouter();
  const { examName, examColor, config } = useExam();
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const user = useAuthStore((s) => s.user);
  const { marks, xp, currentTier, nextTier } = useXP();
  const [showPicker, setShowPicker] = useState(false);

  const totalMarks = user?.totalMarksEarned ?? 0;
  const totalCorrect = user?.totalCorrect ?? 0;
  const totalAttempted = user?.totalQuestionsAttempted ?? 0;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const bestMockScore = user?.bestMockScore ?? 0;
  const targetExams = user?.targetExams ?? [];

  const stats = [
    { icon: Target, label: 'Accuracy', value: `${accuracy}%`, color: 'text-primary' },
    { icon: Trophy, label: 'Total Marks', value: totalMarks.toFixed(1), color: 'text-accent' },
    { icon: Star, label: 'XP', value: xp.toLocaleString(), color: 'text-warning' },
    { icon: Trophy, label: 'Best Mock', value: `${bestMockScore}%`, color: 'text-success' },
  ];

  const quickLinks = [
    { icon: Swords, label: 'Practice', href: targetExams.length > 1 ? undefined : '/subjects', color: 'text-primary', onClick: targetExams.length > 1 ? () => setShowPicker(true) : undefined },
    { icon: Zap, label: 'Rapid Fire', href: '/rapid-fire', color: 'text-warning' },
    { icon: BookOpen, label: 'Mock Test', href: '/mock-test', color: 'text-accent' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <PracticePickerModal open={showPicker} onClose={() => setShowPicker(false)} targetExams={targetExams} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">
            Let&apos;s continue where you left off
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: examColor + '15', color: examColor }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: examColor }} />
          {examName}
        </div>
        {targetExams.filter(e => e !== config?.code).map((e) => {
          const exam = EXAMS[e as keyof typeof EXAMS];
          return (
            <button
              key={e}
              onClick={() => {
                setActiveExam(e as keyof typeof EXAMS);
                router.push('/subjects');
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-all cursor-pointer"
              title={`Practice ${exam?.name ?? e}`}
            >
              <div className="w-2 h-2 rounded-full bg-accent" />
              {exam?.shortName ?? e}
            </button>
          );
        })}
        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-warning/10 text-warning">
          <Zap size={12} />
          {currentTier.name} — {currentTier.timerSeconds}s
        </div>
        <SpeedSeekerBadge />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-2xl p-4 shadow-card border-t-2 border-t-primary/20">
            <div className={`${stat.color} mb-2`}>
              <stat.icon size={20} />
            </div>
            <span className="text-2xl font-bold text-ink block">{stat.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted/60">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-bold text-ink mb-4">Quick Practice</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            if (link.href) {
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex flex-col items-center gap-2 bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-all"
                >
                  <link.icon size={28} className={link.color} />
                  <span className="text-xs font-bold text-ink">{link.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={link.label}
                onClick={link.onClick}
                className="flex flex-col items-center gap-2 bg-surface border border-border rounded-2xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <link.icon size={28} className={link.color} />
                <span className="text-xs font-bold text-ink">{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Rapid Fire Progress
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Tier {currentTier.tier}: {currentTier.name}</span>
          <span className="text-ink font-bold">{marks} marks</span>
        </div>
        {nextTier && (
          <p className="text-xs text-ink-muted mt-1">
            {nextTier.marksMilestone - marks} marks to unlock Tier {nextTier.tier}: {nextTier.name} ({nextTier.timerSeconds}s)
          </p>
        )}
      </Card>
    </motion.div>
  );
}
