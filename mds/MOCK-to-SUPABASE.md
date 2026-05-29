# Mock → Supabase Migration Guide

The app currently runs in **mock mode** when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set in `.env.local`.  
This file documents everything required to migrate from mock data to a real Supabase backend.

---

## 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Restart the dev server. Mock mode auto-disables when both env vars are present.

---

## 2. Run the Database Schema

Open the Supabase **SQL Editor** and paste the entire contents of `supabase-schema.sql`.  
This creates all 10 tables, RLS policies, indexes, and seed data:

| Table | Purpose |
|---|---|
| `exams` | JENPAS-UG / JENPAS-PG exam definitions |
| `subjects` | Subjects under each exam |
| `profiles` | User profiles (XP, streak, exam preference) |
| `questions` | MCQ question bank |
| `attempts` | Per-answer attempt logs |
| `quizzes` | Pre-built quizzes (mock tests, live quizzes) |
| `quiz_questions` | Questions linked to quizzes |
| `leaderboard` | Ranked scores per period |
| `missions` | Daily/achievement mission definitions |
| `user_missions` | Per-user mission progress |

> **Important:** After running the schema, verify the seed data inserted correctly:
> - 2 exams (JENPAS-UG, JENPAS-PG)
> - 10 subjects total
> - Sample questions for each subject
> - 5 missions
> - A test quiz

---

## 3. Enable Authentication

### Email/Password (built-in)
Go to **Authentication → Providers → Email** — it's enabled by default.

### Google OAuth
1. Go to **Authentication → Providers → Google**.
2. Enable it.
3. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com):
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret into the Supabase Google provider form.

---

## 4. Files That Auto-Switch

These files detect env vars and switch automatically — **no changes needed**:

| File | What it does |
|---|---|
| `src/lib/supabase/client.ts` | Returns real `createBrowserClient` if env vars present, otherwise mock |
| `src/lib/supabase/server.ts` | Same for server-side `createServerClient` |
| `src/store/authStore.ts` | Initializes with mock user if env vars absent |

---

## 5. Mock Data Sources — Replace with Real Data

When you switch to Supabase, these mock data sources are no longer used:

| Mock Source | File | Real Data Source |
|---|---|---|
| `QUESTION_BANK` | `src/lib/supabase/mock.ts:14` | `questions` table — upload via admin panel or seed SQL |
| `MOCK_PROFILE` | `src/lib/supabase/mock.ts:143` | Created on first login via `auth/callback/route.ts` |
| `MOCK_LEADERBOARD` | `src/lib/supabase/mock.ts:152` | Populated by `attempts` → leaderboard materialized view |
| `MOCK_MISSIONS` | `src/lib/supabase/mock.ts:164` | `missions` table — seeded by `supabase-schema.sql` |

---

## 6. RLS Policies (Already in Schema)

The `supabase-schema.sql` includes RLS policies. Key rules:

| Table | Policy |
|---|---|
| `profiles` | Users can read/update their own row. Insert via trigger on auth.user creation. |
| `questions` | Public read-only. Admin-only insert/update. |
| `attempts` | Users can insert/read their own attempts. |
| `leaderboard` | Public read-only. |
| `quizzes` / `quiz_questions` | Public read. Admin write. |
| `missions` / `user_missions` | Read assigned missions. Update own progress. |

---

## 7. Manual Code Changes Required

### 7a. Remove the mock file (after verifying real Supabase works)

```bash
rm src/lib/supabase/mock.ts
```

### 7b. Simplify `client.ts` and `server.ts`

After removing mock, revert to the original simple versions:

**`src/lib/supabase/client.ts`:**
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`src/lib/supabase/server.ts`:**
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### 7c. Remove mock user from `authStore.ts`

After removing mock, revert the initial state:

```ts
// Before:
user: isMock ? mockUser : null,

// After:
user: null,
```

Delete the `mockUser` constant and `isMock` check entirely.

### 7d. Remove type casts in pages

These files have explicit type casts needed only because of the mock client's `as unknown as ReturnType<>` cast. After removing mock, revert them:

#### `src/app/(main)/live-quiz/page.tsx`
```ts
// Before (mock):
.then((res: { data: unknown }) => setLiveQuiz(res.data as Record<string, unknown>));

// After (real Supabase):
.then(({ data }) => setLiveQuiz(data));
```

#### `src/app/(main)/pyq/page.tsx`
```ts
// Before (mock):
.then((res: { data: unknown }) => {
  const data = res.data as Record<string, unknown>[] | null;

// After (real Supabase):
.then(({ data }) => {
```

### 7e. Revert the `live-quiz` page subscribe callback

```ts
// Before (mock):
.subscribe(async (status: string) => {

// After (real Supabase):
.subscribe(async (status) => {
```

---

## 8. Schema Differences (Mock vs Real)

Some mock objects use different property names than the real Supabase tables.  
These are handled automatically because mock data is hardcoded — real data comes from the SQL schema:

| Property | Mock Data | Supabase Table Column |
|---|---|---|
| Mission `condition_type` | ✅ Correct | `missions.condition_type` |
| Mission `condition_value` | ✅ Correct | `missions.condition_value` |
| Profile `streak` | ✅ Correct | `profiles.streak` |
| Profile `longest_streak` | ✅ Correct | `profiles.longest_streak` |

All mock data now matches the schema columns.

---

## 9. Testing Checklist

After migration:

- [ ] Landing page loads
- [ ] Register with email works → redirects to exam-select
- [ ] Login with email works → redirects to dashboard
- [ ] Google OAuth works → redirects to dashboard
- [ ] Dashboard shows real XP, streak, level from DB
- [ ] Subject grid loads from `subjects` table
- [ ] Starting a quiz loads questions from `questions` table
- [ ] Answering a question creates an `attempts` row
- [ ] XP updates correctly on answer submission
- [ ] Leaderboard shows real data from `leaderboard`
- [ ] Admin panel can upload questions
- [ ] Admin panel can create quizzes
- [ ] Rapid Fire mode works (10 questions)
- [ ] Live Quiz shows participant count
- [ ] PYQ filter shows distinct years from questions table
- [ ] Profile page shows correct stats
- [ ] Missions load from `missions` table
- [ ] Theme toggle persists (localStorage, not DB)

---

## 10. Rollback to Mock

At any time, delete the two env vars from `.env.local` (or rename the file) to re-enable mock mode. No code changes needed.
