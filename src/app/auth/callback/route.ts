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
        displayname: user.user_metadata?.full_name ?? user.email,
        email: user.email ?? '',
        photourl: user.user_metadata?.avatar_url,
        targetexams: [],
        totalmarksearned: 0,
        totalquestionsattempted: 0,
        totalcorrect: 0,
        totalwrong: 0,
        totalskipped: 0,
        rapidfireunlockedtier: 1,
        streakdays: 0,
        profilecompletepct: 0,
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('targetexams')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.targetexams as string[] ?? []).length === 0) {
      return NextResponse.redirect(new URL('/onboarding', origin));
    }
  }

  return NextResponse.redirect(new URL('/dashboard', origin));
}
