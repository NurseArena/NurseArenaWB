# Supabase + Vercel Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from **Settings > API**

## 2. Run Database Schema

In the Supabase SQL Editor, run these files **in order**:

1. `supabase/migrations/20260528000001_initial_schema.sql` — all tables, RLS, seed data
2. `supabase/migrations/20260528000002_missing_tables.sql` — notifications & quiz_attempts

Or run the combined schema directly: `supabase-schema.sql`

## 3. Configure Environment Variables

Create `.env` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

For reference, see `.env.example`.

## 4. Enable Auth Providers

In Supabase Dashboard > Authentication > Providers:
- **Email** — enable (required for sign-up/login)
- **Google / GitHub** — optional social login

## 5. Deploy to Vercel

1. Push code to GitHub
2. Import repo in Vercel
3. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## 6. Post-Deployment

- Set up `pg_cron` for leaderboard refresh if needed (see comment in schema)
- Configure custom domain in Vercel
- Set up Supabase Branching for preview deployments
