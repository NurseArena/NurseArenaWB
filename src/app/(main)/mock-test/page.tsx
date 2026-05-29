'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useExam } from '@/hooks/useExam';
import { Card } from '@/components/ui/card';
import { Clock, ListChecks, Swords, CalendarDays } from 'lucide-react';
import { EXAMS } from '@/lib/exam-config';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function MockTestPage() {
  const { examName, activeExam } = useExam();
  const config = EXAMS[activeExam];
  const [quizzes, setQuizzes] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('quizzes')
        .select('id, title, type, question_count, duration_seconds, created_at')
        .eq('exam_id', `exam-${activeExam.toLowerCase().replace(/_/g, '-')}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setQuizzes(data);
    };
    fetch();
  }, [activeExam]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Mock Test</h1>
        <p className="text-sm text-ink-muted mt-1">
          Full exam simulation for {examName}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Swords size={32} className="text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">{examName} Mock</h2>
            <p className="text-sm text-ink-muted">
              {config.totalQuestions} questions · {Math.floor(config.durationSeconds / 60)} minutes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-surface2 rounded-xl">
            <Clock size={20} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-ink">{Math.floor(config.durationSeconds / 60)} min</p>
              <p className="text-[10px] text-ink-muted">Duration</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface2 rounded-xl">
            <ListChecks size={20} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-ink">{config.totalQuestions}</p>
              <p className="text-[10px] text-ink-muted">Questions</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">Subjects</p>
          {config.subjects.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">
                {s.icon} {s.name}
              </span>
              <span className="text-ink font-bold">{s.totalQ} Q · {s.marks} marks</span>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <CalendarDays size={20} />
          Available Tests
        </h2>
        {quizzes.length === 0 ? (
          <p className="text-sm text-ink-muted">No mock tests available yet. Weekly mocks are uploaded every Monday.</p>
        ) : (
          <div className="space-y-3">
            {quizzes.map((q: Record<string, unknown>) => (
              <Card key={String(q.id)} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink">{String(q.title)}</p>
                    <p className="text-xs text-ink-muted">
                      {q.type === 'weekly_mock' ? 'Auto-generated weekly mock' : 'Practice test'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
