'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const supabase = createClient();

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
          setUser({ ...profile, isAdmin: p.is_admin ?? p.isAdmin } as never);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [setUser]);

  return children;
}
