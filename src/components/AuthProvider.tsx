'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useExamStore } from '@/store/examStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setActiveExam = useExamStore((s) => s.setActiveExam);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const supabase = createClient();

    function syncActiveExam(profile: Record<string, unknown>) {
      const targetExams = (profile.targetExams ?? profile.target_exams ?? []) as string[];
      if (targetExams.length > 0) {
        setActiveExam(targetExams[0] as never);
      }
    }

    (async () => {
      const res = await supabase.auth.getUser();
      const user = res.data?.user ?? null;
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) {
        const p = profile as Record<string, unknown>;
        syncActiveExam(p);
        setUser({ ...profile, isAdmin: p.is_admin ?? p.isAdmin } as never);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user: { id: string } } | null) => {
        if (!session?.user) {
          setUser(null);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) {
          const p = profile as Record<string, unknown>;
          syncActiveExam(p);
          setUser({ ...profile, isAdmin: p.is_admin ?? p.isAdmin } as never);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [setUser, setActiveExam]);

  return children;
}
