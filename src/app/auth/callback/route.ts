import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        displayName: user.user_metadata?.full_name ?? user.email,
        email: user.email ?? '',
        photoURL: user.user_metadata?.avatar_url,
        targetExams: [],
        totalMarksEarned: 0,
        totalQuestionsAttempted: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalSkipped: 0,
        rapidFireUnlockedTier: 1,
        streakDays: 0,
        profileCompletePct: 0,
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('targetExams')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.targetExams as string[] ?? []).length === 0) {
      return NextResponse.redirect(new URL('/onboarding', origin));
    }
  }

  return NextResponse.redirect(new URL('/dashboard', origin));
}
