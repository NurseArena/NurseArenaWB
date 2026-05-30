import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createMockClient } from './mock';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return createMockClient() as unknown as ReturnType<typeof createSupabaseClient>;
  }

  if (!url || !key) {
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Falling back to mock client. Set NEXT_PUBLIC_USE_MOCK=true in .env.local to use mock data.'
    );
    return createMockClient() as unknown as ReturnType<typeof createSupabaseClient>;
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
