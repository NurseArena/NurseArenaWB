'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const ALLOWED_DOMAINS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.in', 'hotmail.co.uk',
  'outlook.com', 'outlook.in', 'live.com', 'live.in',
  'yahoo.com', 'yahoo.in', 'yahoo.co.in',
  'rediffmail.com', 'icloud.com', 'me.com', 'protonmail.com', 'proton.me',
];

function isEmailAllowed(email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

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

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailAllowed(email)) {
      setError('Please use a valid email (Gmail, Outlook, Yahoo, Rediffmail, etc.)');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    const hasSession = !!data?.session;

    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        displayName: name || email,
        email: email,
        targetExams: [],
        totalMarksEarned: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalSkipped: 0,
        rapidFireUnlockedTier: 1,
        streakDays: 0,
        profileCompletePct: 0,
      }, { onConflict: 'id', ignoreDuplicates: false });

      if (profileError) {
        console.error('Register: profile upsert error', profileError);
        setError('Failed to create profile. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (hasSession) {
      setLoading(false);
    } else {
      setLoading(false);
      setConfirmed(true);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <LogoIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Check your email</h1>
          <p className="text-sm text-ink-muted">
            We sent a confirmation link to <span className="font-medium text-ink">{email}</span>.
            Click it to activate your account, then come back and log in.
          </p>
          <Link href="/login" className="block text-primary font-bold hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <LogoIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-ink">Start your journey</h1>
          <p className="text-sm text-ink-muted mt-1">Create an account to begin practicing</p>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              placeholder="Priya Das"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-[10px] text-ink-muted">Use Gmail, Outlook, Yahoo, Rediffmail, iCloud, or ProtonMail</p>
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/5 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            <Mail size={18} />
            {loading ? 'Creating account...' : 'Sign up with Email'}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
