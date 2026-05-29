# Architecture & Performance Rules

> Apply these rules to every file, API route, component, and database query in this project. No exceptions.

---

## Stack

- Frontend: React (Vite)
- Backend: Node.js API routes (Vercel serverless functions)
- Database + Auth + Realtime: Supabase
- Deployment: Vercel
- Data fetching: TanStack Query (React Query)

---

## 1. Database — Mandatory Rules

### Always add indexes for every filtered/sorted column

Every table that is queried with WHERE or ORDER BY must have indexes. Add these in migrations, not after the fact.

```sql
-- Required pattern for every new table:
CREATE INDEX idx_{table}_{column} ON {table}({column});

-- Common required indexes already defined in schema:
-- questions: exam_id, topic_id, mock_test_id, quiz_pool_status
-- quiz_sessions: user_id, quiz_id
-- session_answers: session_id
-- mock_test_attempts: mock_test_id, user_id
-- attempts: user_id, exam_id, created_at
```

### Never use `select("*")`

Always specify only the columns the UI actually needs.

```typescript
// WRONG
supabase.from('questions').select('*')

// CORRECT
supabase.from('questions').select('id, question, option_a, option_b, option_c, option_d, correct, difficulty')
```

### Always paginate — never load full tables

```typescript
// WRONG
supabase.from('quiz_sessions').select('id, score')

// CORRECT
supabase.from('quiz_sessions').select('id, score').range(0, 19)
```

Default page size: **20 rows**. Maximum allowed: **50 rows**. Never load an entire table in one query.

### No N+1 queries — always use joins

```typescript
// WRONG — loads users then fetches score for each separately
const users = await getUsers();
for (const user of users) {
  const score = await getScore(user.id); // N+1
}

// CORRECT — single joined query
supabase
  .from('quiz_sessions')
  .select('id, score, user:profiles(id, name)')
  .eq('exam_id', examId)
  .range(0, 19)
```

---

## 2. Supabase Realtime — Strict Scope Rules

Never subscribe to an entire table. Every subscription must be scoped to the minimum required filter.

```typescript
// WRONG — entire table subscription
supabase.channel('all').on('postgres_changes', { table: 'attempts' }, handler)

// CORRECT — scoped to current quiz/room only
supabase
  .channel(`quiz-${quizId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'attempts',
    filter: `quiz_id=eq.${quizId}`
  }, handler)
  .subscribe()
```

Always unsubscribe on component unmount:

```typescript
useEffect(() => {
  const channel = supabase.channel(...).subscribe();
  return () => { supabase.removeChannel(channel); };
}, [quizId]);
```

---

## 3. TanStack Query — Caching Rules

Use TanStack Query for every data fetch. No raw `useEffect + fetch` patterns.

```typescript
// CORRECT pattern for all data fetching:
const { data, isLoading } = useQuery({
  queryKey: ['questions', examId, page],
  queryFn: () => fetchQuestions(examId, page),
  staleTime: 5 * 60 * 1000,   // 5 min for semi-static data
  gcTime: 10 * 60 * 1000,
})
```

**Cache durations by data type:**

| Data | staleTime |
|------|-----------|
| Exam list, subject list, topic list | 30 minutes |
| Quiz metadata | 10 minutes |
| Leaderboard snapshot | 2 minutes |
| User profile | 5 minutes |
| Live quiz state | 0 (always fresh) |
| Questions during a session | Infinity (never refetch mid-session) |

---

## 4. Leaderboard — Never Compute Live

Never run `ORDER BY score DESC` on the full attempts table on every request.

```typescript
// WRONG — live full-table sort on every leaderboard view
supabase.from('attempts').select('user_id, score').order('score', { ascending: false })

// CORRECT — read from precomputed leaderboard_cache table
supabase.from('leaderboard_cache').select('rank, user_id, name, score').eq('exam_id', examId).range(0, 49)
```

The `leaderboard_cache` table is refreshed by a scheduled function (cron), not on every user request. Refresh interval: every 5 minutes for active quizzes, every 30 minutes otherwise.

---

## 5. API Routes — Validation and Rate Limiting

Every API route must:

1. Validate input before touching the database
2. Return only what the client needs
3. Never expose service_role key logic

```typescript
// Required structure for every API route:
export default async function handler(req, res) {
  // 1. Method check
  if (req.method !== 'POST') return res.status(405).end();

  // 2. Auth check
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 3. Input validation (zod or manual)
  const { quizId } = req.body;
  if (!quizId || typeof quizId !== 'number') return res.status(400).json({ error: 'Invalid quizId' });

  // 4. DB operation — scoped, paginated, indexed
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id, score, status')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .single();

  // 5. Return only what client needs
  return res.status(200).json({ session: data });
}
```

---

## 6. Security — Non-Negotiable

```typescript
// NEVER in any frontend file (.tsx, .ts, .jsx, .js):
SUPABASE_SERVICE_ROLE_KEY   // server only
Admin API calls             // server only

// ONLY in frontend:
SUPABASE_ANON_KEY           // public, RLS-protected
```

RLS must be enabled on every table. No table is publicly readable/writable without a policy. All policies already defined in schema files — do not remove them.

---

## 7. Search and Input — Always Debounce

```typescript
// WRONG — fires on every keystroke
<input onChange={(e) => searchQuestions(e.target.value)} />

// CORRECT — debounced
import { useDebouncedCallback } from 'use-debounce';
const search = useDebouncedCallback((value) => searchQuestions(value), 300);
<input onChange={(e) => search(e.target.value)} />
```

300ms debounce on all search inputs. 500ms on heavy filter changes.

---

## 8. React Performance

### Split components — never put everything in one component

Each quiz screen is split into:
- `QuizHeader` (timer, progress)
- `QuizQuestion` (current question display)
- `QuizOptions` (answer choices)
- `QuizNavigation` (prev/next/flag)

### Memoize expensive components

```typescript
// Wrap any component that receives stable props but re-renders often:
export const QuizOption = React.memo(({ option, selected, onSelect }) => {
  ...
});
```

### useMemo for derived values

```typescript
// WRONG — recalculates on every render
const score = answers.filter(a => a.is_correct).length * profile.marks_correct;

// CORRECT
const score = useMemo(() =>
  answers.filter(a => a.is_correct).length * profile.marks_correct,
  [answers, profile]
);
```

---

## 9. Images and Assets

- All images: WebP format, max 200KB per image
- All images use lazy loading: `<img loading="lazy" />`
- No autoplay video anywhere
- Icons: use lucide-react, not image files
- Fonts: load only weights actually used

---

## 10. Vercel Serverless — Function Rules

- No synchronous heavy loops inside API routes
- No AI inference inside API routes (use background jobs)
- API route timeout budget: keep under 8 seconds
- Heavy operations (rankings, analytics, notifications) go into cron jobs, not request handlers

---

## 11. Environment Variables

```
# Frontend (.env.local) — safe to expose
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server only — NEVER in frontend
SUPABASE_SERVICE_ROLE_KEY=
```

Never prefix service_role key with `VITE_`. Vercel will expose it to the browser if you do.

---

## 12. What Goes Where — Quick Reference

| Operation | Where it runs |
|-----------|--------------|
| Auth, basic CRUD | Supabase client (frontend, RLS-protected) |
| Score calculation | Server API route |
| Question selection for quiz | Server API route (`/api/quiz/start`) |
| Quiz submission | Server API route (`/api/quiz/submit`) |
| Leaderboard refresh | Cron job |
| Pool status update (used/reserved) | Server API route + DB trigger |
| Notifications on mock test publish | DB trigger or server route |
| Analytics, reporting | Cron job → precomputed table |
| Realtime quiz events | Supabase Realtime (scoped channel) |

---

## 13. Monitoring

- Use Vercel Analytics (already available on Vercel dashboard) — enable it
- Use Supabase dashboard → Logs → slow queries (anything > 500ms needs an index)
- Add Sentry for error tracking in both frontend and API routes

```typescript
// In every API route:
import * as Sentry from '@sentry/node';
try {
  // handler logic
} catch (err) {
  Sentry.captureException(err);
  res.status(500).json({ error: 'Internal error' });
}
```
