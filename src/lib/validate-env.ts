export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Missing environment variables: ${missing.join(', ')}. ` +
        'The app will use mock data in development.'
      );
    } else {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
  }
}
