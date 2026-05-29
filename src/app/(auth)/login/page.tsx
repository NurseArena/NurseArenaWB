'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import type { Profile } from '@/types/user';
import { Mail, Globe } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) {
      setError(error?.message ?? 'Invalid email or password');
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (!profile) {
      setError('Profile not found. Please register.');
      setLoading(false);
      return;
    }
    setUser(profile as Profile);
    if ((profile as Profile).isAdmin) {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <LogoIcon size={28} />
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

          <Button type="submit" className="w-full" disabled={loading}>
            <Mail size={18} />
            {loading ? 'Logging in...' : 'Log in with Email'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg px-2 text-ink-muted">or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
          <Globe size={18} />
          Continue with Google
        </Button>

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
