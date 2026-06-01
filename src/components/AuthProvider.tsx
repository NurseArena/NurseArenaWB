'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';
import type { Profile } from '@/types/user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && !error) {
        const targetExams = (profile.targetexams ?? profile.targetExams ?? profile.target_exams ?? []) as string[];
        if (targetExams.length > 0) {
          setActiveExam(targetExams[0] as never);
        }
        setUser({ ...profile, isAdmin: profile.is_admin ?? false } as Profile);
      } else {
        setUser({
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email ?? '',
          displayName:
            (session.user.user_metadata?.full_name as string) ??
            session.user.email?.split('@')[0] ??
            'User',
          targetExams: [],
          totalMarksEarned: 0,
          totalQuestionsAttempted: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalSkipped: 0,
          bestMockScore: 0,
          rapidFireUnlockedTier: 1,
          streakDays: 0,
          profileCompletePct: 0,
          isAdmin: false,
        } as Profile);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setActiveExam]);

  return children;
}
