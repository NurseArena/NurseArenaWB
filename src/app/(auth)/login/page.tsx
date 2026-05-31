'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types/user';
import { Mail } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      const targetExams = (user.targetExams ?? []) as string[];
      const isOnboarded = targetExams.length > 0;
      if (user.isAdmin) {
        router.push('/admin');
      } else if (!isOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login: form submitted');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    console.log('Login: creating supabase client');
    let supabase;
    try {
      supabase = createClient();
      console.log('Login: supabase client created');
    } catch (clientErr) {
      console.error('Login: createClient error', clientErr);
      setError('Failed to initialize auth client: ' + (clientErr instanceof Error ? clientErr.message : 'Unknown error'));
      setLoading(false);
      return;
    }
    try {
      console.log('Login: calling signInWithPassword');
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      console.log('Login: signInWithPassword started, waiting...');
      const { data, error: signInError } = await signInPromise;
      console.log('Login: signInWithPassword result', { data, error: signInError });
      if (signInError || !data?.user) {
        setError(signInError?.message ?? 'Invalid email or password');
        setLoading(false);
        return;
      }

      const user = data.user;
      console.log('Login: signed in as', user.id, user.email);

      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Login: profile fetch result', { profile });

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            displayName: user.email,
            email: user.email ?? '',
            targetExams: [],
            totalMarksEarned: 0,
            totalQuestionsAttempted: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalSkipped: 0,
            rapidFireUnlockedTier: 1,
            streakDays: 0,
            profileCompletePct: 0,
          }, { onConflict: 'id' })
          .select()
          .maybeSingle();
        if (!newProfile) {
          const { data: fallback } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          if (!fallback) {
            setError('Could not create profile.');
            setLoading(false);
            return;
          }
          profile = fallback;
        } else {
          profile = newProfile;
        }
        console.log('Login: profile after upsert', { profile });
      } else if (!profile.targetExams || (profile.targetExams as string[]).length === 0) {
        await supabase
          .from('profiles')
          .update({ targetExams: [] })
          .eq('id', user.id);
        profile.targetExams = [];
      }
      const targetExams = (profile?.targetExams ?? []) as string[];
      const isOnboarded = targetExams.length > 0;
      const isAdmin = !!(profile as any).is_admin;
      setUser({ ...profile, isAdmin } as Profile);
      console.log('Login: set user, redirecting. Admin:', isAdmin, 'Onboarded:', isOnboarded);
      setLoading(false);

      if (isAdmin) {
        router.push('/admin');
      } else if (!isOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      console.error('Login: caught error', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <LogoIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-ink-muted mt-1">Log in to continue your streak</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>
          )}

          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <div className="text-xs text-ink-muted bg-danger/5 px-3 py-2 rounded-lg space-y-1">
              <p className="font-bold text-danger">⚠ Setup Required</p>
              <p>Set <code className="bg-surface px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> &amp; <code className="bg-surface px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-surface px-1 rounded">.env</code> to use the app.</p>
              <p>Copy <code className="bg-surface px-1 rounded">.env.example</code> → <code className="bg-surface px-1 rounded">.env</code> and fill in your Supabase project credentials.</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            <Mail size={18} />
            {loading ? 'Logging in...' : 'Log in with Email'}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>


      </div>
    </div>
  );
}
