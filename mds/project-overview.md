# Sahara Academy (NurseNova) — Project Overview

> West Bengal nursing entrance exam preparation platform (JENPAS UG/PG, ANM/GNM, JEPBN, JEMScN, JEMAS PG).

---

## 1. Database Schema

**Platform:** Supabase PostgreSQL  
**Schema file:** `supabase-schema.sql` (329 lines)  
**No ORM** — raw `supabase-js` client used throughout.

### 1.1 Tables (17 total)

| # | Table | Purpose | Key Columns |
|---|-------|---------|-------------|
| 1 | **exams** | Exam definitions | `id, name, code (unique), pattern_mcq_count, duration_seconds, passing_score, xp_reward` |
| 2 | **subjects** | Subjects per exam | `id, exam_id (FK), name, icon, mcq_count_in_exam` |
| 3 | **profiles** | Extends `auth.users` | `id (PK/FK), name, xp, level, streak, selected_exam_id, is_admin, totalMarksEarned, totalCorrect, totalWrong, login_streak` |
| 4 | **questions** | Question bank | `id, exam_id (FK), subject_id (FK), topic, question, option_a/b/c/d, correct (A/B/C/D), explanation, difficulty, is_pyq, pyq_year, tag_id, archived` |
| 5 | **question_tags** | Tag taxonomy | `id, name, exam_id` |
| 6 | **attempts** | Answer attempts | `id, user_id (FK), question_id (FK), selected_option, is_correct, time_taken_ms, attempted_at` |
| 7 | **quizzes** | Quiz definitions | `id, exam_id (FK), type (mock|rapid_fire|live|daily|pyq), title, start_time, duration_seconds, is_live, is_active` |
| 8 | **quiz_questions** | Quiz↔Question junction | `quiz_id (FK), question_id (FK), order_index` — composite PK |
| 9 | **leaderboard** | Cached scores | `id, user_id (FK), exam_id (FK), score, rank, correct_count, period_type (daily|weekly|all_time), period_start` |
| 10 | **missions** | Daily missions | `id, exam_id, title, xp_reward, condition_type, condition_value` |
| 11 | **user_missions** | Per-user mission progress | `user_id, mission_id, assigned_date, progress, completed` — composite PK |
| 12 | **xp_transactions** | XP ledger | `id (bigserial), user_id (FK), delta, reason, reference_id, created_at` |
| 13 | **xp_levels** | XP tier config | `level (PK), min_xp, label, unlocks (jsonb)` |
| 14 | **mock_test_events** | Scheduled mock tests | `id (bigserial), exam_id (FK), scheduled_at, week_number, year, duration_min, max_participants` |
| 15 | **live_quiz_events** | Live quiz events | `id (bigserial), exam_id (FK), starts_at, duration_min, status (scheduled|live|ended), current_q_index` |
| 16 | **quiz_results** | Per-user live quiz results | `id (bigserial), quiz_event_id (FK), user_id (FK), score, correct_count, total_latency_ms, joined_at_index` |
| 17 | **quiz_answers** | Live quiz answer submissions | `id (bigserial), quiz_event_id (FK), user_id (FK), question_index, selected_option, is_correct, latency_ms` |

### 1.2 Row-Level Security (RLS)

Enabled on: `profiles`, `questions`, `attempts`, `leaderboard`, `xp_transactions`, `mock_test_events`, `live_quiz_events`, `quiz_results`, `quiz_answers`.

- Users can **read/update only their own** profile.
- All authenticated users can **read** questions, leaderboard, mock test events, live quiz events.
- Users can **insert/read only their own** attempts, quiz results, quiz answers, XP transactions.

### 1.3 Leaderboard Materialized View

```sql
leaderboard_daily -- aggregates attempts by user/exam daily with rank
-- Refreshed via pg_cron every 10 minutes (suggested)
```

### 1.4 Seed Data

- **2 exams** (JENPAS-UG, JENPAS-PG) with subjects.
- **5 XP levels**: Beginner → Explorer → Challenger → Contender → Expert.

---

## 2. Exam Config (Frontend)

**File:** `src/lib/exam-config.ts`

11 exam configurations defined in TypeScript (NOT in the database — exams in DB are a subset):

| Code | Name | Qs | Max Marks | Duration | Negative Marking |
|------|------|----|-----------|----------|-----------------|
| `JENPAS_UG_P1` | JENPAS (UG) Paper I | 100 | 115 | 120 min | Yes |
| `JENPAS_UG_P2` | JENPAS (UG) Paper II | 100 | 115 | 120 min | Yes |
| `ANM_GNM` | ANM & GNM | 100 | 115 | 120 min | Yes |
| `JEPBN` | JEPBN 2026 | 100 | 100 | 90 min | Yes |
| `JEMSCN` | JEMScN 2026 | 100 | 100 | 90 min | Yes |
| `JEMAS_MHA` | JEMAS PG — MHA | 100 | 100 | 90 min | Yes |
| `JEMAS_MPH` | JEMAS PG — MPH | 100 | 100 | 90 min | Yes |
| `JEMAS_MLT` | JEMAS PG — M.Sc. MLT | 100 | 100 | 90 min | Yes |
| `JEMAS_MAN` | JEMAS PG — MAN | 100 | 100 | 90 min | Yes |
| `JEMAS_MBT` | JEMAS PG — M.Sc. MBT | 100 | 100 | 90 min | Yes |
| `JEMAS_MPHILCP` | JEMAS PG — M.Phil CP | 100 | 100 | 90 min | Yes |
| `JEMAS_MPHILPSW` | JEMAS PG — M.Phil PSW | 100 | 100 | 90 min | Yes |

**Marking Scheme:**
- **Category I** (single correct): +1 correct, -0.25 wrong.
- **Category II** (multi-select): +2 all correct, partial credit based on ratio, no negative for wrong selections.

---

## 3. User Dashboard

### 3.1 Layout

All authenticated pages wrapped in `src/app/(main)/layout.tsx`:

| Component | File | Purpose |
|-----------|------|---------|
| **Sidebar** | `src/components/layout/Sidebar.tsx` | Desktop nav: Dashboard, Subjects, Mock Test, Rapid Fire, PYQs, Leaderboard, Analytics, Live Quiz, Profile |
| **Navbar** | `src/components/layout/Navbar.tsx` | Top bar: exam badge, XP counter, notification bell, theme toggle, avatar |
| **BottomNav** | `src/components/layout/BottomNav.tsx` | Mobile bottom nav bar |

### 3.2 Dashboard Page (`/dashboard`)

**File:** `src/app/(main)/dashboard/page.tsx`

Shows:
- **Greeting** + current exam badge.
- **Exam switcher buttons** for multi-exam users (clicking switches active exam via Zustand `examStore` and navigates to `/subjects`).
- **4 stat cards** — Accuracy %, Total Marks, XP, Best Mock Score.
- **Quick Practice** — 3 cards (Practice → `/subjects`, Rapid Fire → `/rapid-fire`, Mock Test → `/mock-test`). For multi-exam users, Practice opens a picker modal.
- **Rapid Fire Progress card** — current tier name, timer seconds, marks until next tier.

### 3.3 User-Facing Pages

| Route | File | Purpose |
|-------|------|---------|
| `/subjects` | `(main)/subjects/page.tsx` | Subject grid for active exam |
| `/subjects/[id]` | `(main)/subjects/[subjectId]/page.tsx` | Subject detail / topic list |
| `/practice` | `(main)/practice/page.tsx` | Exam picker (multi-exam) → redirects to `/subjects` for single-exam |
| `/quiz/[id]` | `(main)/quiz/[quizId]/page.tsx` | Active quiz UI (questions, timer, submit) |
| `/quiz/result` | `(main)/quiz/result/page.tsx` | Quiz result display |
| `/mock-test` | `(main)/mock-test/page.tsx` | Mock test info + available tests |
| `/rapid-fire` | `(main)/rapid-fire/page.tsx` | 10 Qs, per-Q timer, keyboard shortcuts (1-4 answer, Enter confirm), tiers |
| `/live-quiz` | `(main)/live-quiz/page.tsx` | Lobby with upcoming events at 9 PM |
| `/leaderboard` | `(main)/leaderboard/page.tsx` | Daily/Weekly/All-Time tabs, podium for top 3 |
| `/analytics` | `(main)/analytics/page.tsx` | Per-subject accuracy chart (Recharts), activity heatmap, weak topics |
| `/pyq` | `(main)/pyq/page.tsx` | Previous year questions by year |
| `/profile` | `(main)/profile/page.tsx` | Stats, enrolled exams, tier progress, theme toggle, logout |
| `/exam-select` | `(main)/exam-select/page.tsx` | Initial exam selection |

### 3.4 State Management (Zustand)

| Store | File | Purpose |
|-------|------|---------|
| `authStore` | `src/store/authStore.ts` | Current user profile |
| `examStore` | `src/store/examStore.ts` | Active exam selection (persisted to localStorage) |
| `quizStore` | `src/store/quizStore.ts` | Quiz session state (questions, answers, timer) |

### 3.5 Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useExam` | `src/hooks/useExam.ts` | Read/write active exam from store |
| `useQuiz` | `src/hooks/useQuiz.ts` | Quiz lifecycle: start, answer, timer, finish, marks calc |
| `useLiveQuiz` | `src/hooks/useLiveQuiz.ts` | Fetch upcoming events, join, submit, poll leaderboard |
| `useMockTest` | `src/hooks/useMockTest.ts` | Fetch upcoming mock tests, countdown |
| `useLeaderboard` | `src/hooks/useLeaderboard.ts` | Fetch leaderboard by exam/period |
| `useXP` | `src/hooks/useXP.ts` | Rapid Fire tier, XP conversion |
| `useStreak` | `src/hooks/useStreak.ts` | Streak checking/updating |
| `useMissions` | `src/hooks/useMissions.ts` | Load/update daily missions |

---

## 4. Admin Dashboard

### 4.1 Layout & Landing

**File:** `src/app/admin/page.tsx`

Grid of 8 admin cards:

| # | Feature | Route | Description |
|---|---------|-------|-------------|
| 1 | **Upload Questions** | `/admin/questions` | One-click CSV/Excel bulk upload |
| 2 | **Question Bank** | `/admin/questions/bank` | Browse, search, inline edit, archive questions |
| 3 | **Quiz Management** | `/admin/quizzes` | Create quizzes (type, exam, title, duration, question count) |
| 4 | **Exam Mapping** | `/admin/exam-mapping` | View Exam → Subject → Topic hierarchy |
| 5 | **Schedule Events** | `/admin/scheduler` | Schedule mock tests + live quizzes with conflict detection |
| 6 | **Analytics** | `/admin/analytics` | Users per exam, daily active users (30d), marks distribution, top wrong Qs |
| 7 | **Users** | `/admin/users` | Search users, view stats, reset scores, export CSV |
| 8 | **Notifications** | `/admin/notifications` | Send to all / by exam / single user |

### 4.2 Admin Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdminQuestionUpload` | `src/components/admin/AdminQuestionUpload.tsx` | CSV upload with 5 categories, row validation, preview, batch upload |
| `AdminDashboard` | `src/components/admin/AdminDashboard.tsx` | Analytics charts (Recharts): user counts, DAU, marks distribution, top wrong Qs |
| `AdminScheduler` | `src/components/admin/AdminScheduler.tsx` | Calendar scheduler: mock tests (max 2/week/exam), 9 PM live quizzes; 30-min conflict detection |

### 4.3 Admin Service Layer

**File:** `src/services/admin.ts`

| Function | Purpose |
|----------|---------|
| `bulkUploadQuestions()` | INSERT multiple questions |
| `createQuestion()` | INSERT single question |
| `updateQuestion(id, updates)` | UPDATE question by ID |
| `softDeleteQuestion(id)` | SET `archived = true` |
| `fetchQuestionsAdmin(filters)` | SELECT with optional search/filter |
| `fetchAdminStats()` | Aggregate user/attempt data for analytics |

### 4.4 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/questions` | POST | Insert questions (server-side) |
| `/api/admin/questions` | GET | Fetch questions with subject/exam joins |
| `/api/admin/quizzes` | POST | Create a quiz |
| `/api/admin/quizzes` | GET | Fetch all quizzes |
| `/api/quiz/start` | POST | Start quiz (load questions) |
| `/api/quiz/submit` | POST | Submit answer + update profile marks |
| `/api/leaderboard` | GET | Fetch leaderboard by period + exam |

---

## 5. Admin Question Upload & Update Propagation

### 5.1 Upload Flow (Bulk CSV)

The upload happens entirely **client-side** in `AdminQuestionUpload.tsx`:

1. **Select category** — 5 options (General, Subject-wise, Topic-wise, PYQs, Rapid Fire). Each defines required/optional CSV columns.
2. **Upload CSV** — drag-and-drop or file picker. File is read client-side via `FileReader`.
3. **Parse & validate** — CSV parsed line-by-line:
   - Headers mapped (case-insensitive).
   - Required fields checked.
   - `correct_option` validated as `a/b/c/d`.
   - `difficulty` validated as `easy/medium/hard`.
   - `pyq_year` validated as 4-digit (for PYQ category).
   - **If >10% rows invalid, entire batch rejected.**
4. **Preview table** — shows each row with valid/invalid status, error messages.
5. **Upload** — admin clicks "Upload X Valid Questions". Each valid row is inserted via `supabase.from('questions').insert(insertData)` one row at a time (sequential loop).
6. **Result** — "X uploaded, Y failed" message shown.

### 5.2 Single Question Create/Edit (Question Bank)

`/admin/questions/bank`:

- Fetches questions from Supabase with search/filter.
- Each question card has inline edit — expands editable fields (question text, options, explanation, difficulty).
- **Soft-delete** via archive button (sets `archived = true`, never hard-deleted).

### 5.3 How Updates Propagate to Users

**There is NO real-time mechanism for question updates.** Here is how data flows:

```
Admin uploads/edits questions
        ↓
   Supabase `questions` table (updated immediately)
        ↓
   User starts a quiz (via useQuiz hook)
        ↓
   Questions fetched fresh from Supabase:
     - From `quiz_questions` junction table (if pre-assigned)
     - OR random selection filtered by exam_id / subject_id
        ↓
   Questions stored in Zustand `quizStore` (client-side)
        ↓
   User answers — no further question fetch during the quiz
```

**Key implications:**
- If an admin modifies a question **while a user is actively taking a quiz**, the user sees the **old version** (already loaded into client state).
- Questions are only fetched **once at quiz start time**.
- The live quiz leaderboard uses **5-second polling** (`setInterval` in `useLiveQuiz.ts`), but this only updates the leaderboard scores — not questions.
- **No Supabase Realtime subscriptions** are configured anywhere in the codebase.
- The mock client (`mock.ts`) includes a stub `channel()` method, but the real client never subscribes.

### 5.4 What DOES Have Periodic Refresh

| Feature | Mechanism | Interval |
|---------|-----------|----------|
| Live Quiz Leaderboard | `setInterval` polling | 5 seconds |
| Leaderboard Page | On mount + `refresh()` | On demand |
| Admin Question Bank | On mount, filter change, edit/archive | On demand |
| Admin Analytics | On mount | On demand |
| Leaderboard Materialized View | pg_cron suggested | 10 minutes |

### 5.5 Architecture Summary

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Admin Panel    │     │   Supabase DB    │     │   User App       │
│                  │     │                  │     │                  │
│ CSV Upload ──────┼────>│ questions table  │<────│ Quiz Start       │
│ Inline Edit ─────┼────>│ (immediate)      │     │ (fetch on mount) │
│ Soft Delete ─────┼────>│                  │     │                  │
│                  │     │ leaderboard MV   │<────│ Quiz Submit      │
│ Analytics ───────┼────>│ (pg_cron 10 min) │     │                  │
│ Scheduler ───────┼────>│ mock/live events │────>│ Live Quiz Polling│
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

**No real-time question update propagation.** For live features, the app relies on **polling** (5s for live leaderboard) rather than WebSockets or Supabase Realtime.

---

## 6. App Startup & Entry Point

### 6.1 Request Flow

```
User hits vercel.app domain
        ↓
Vercel routes to Next.js server (serverless function)
        ↓
next.config.ts — Next.js config (Turbopack, image domains)
        ↓
src/app/layout.tsx — Root Layout (Server Component)
  - Loads Inter + JetBrains Mono fonts
  - Injects theme init script (reads localStorage before React hydrates)
  - Wraps children in <ThemeProvider>
        ↓
src/app/page.tsx — Landing Page (Server Component)
  - Static marketing page (features, exam list, CTAs)
  - Links to /login and /register
        ↓
User authenticates → routed to:
  - /dashboard (student) → src/app/(main)/layout.tsx (Sidebar + Navbar + BottomNav)
  - /admin (admin) → src/app/admin/layout.tsx (centered layout)
```

### 6.2 Startup Commands

| Command | Script | Description |
|---------|--------|-------------|
| `npm run dev` | `next dev` | Development server with Turbopack |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Start production server |
| `npm run lint` | `eslint` | Lint all files |

### 6.3 Key Config Files

| File | Role |
|------|------|
| `next.config.ts` | Turbopack, image remote patterns (DiceBear, Google, Unsplash) |
| `tsconfig.json` | Path alias `@/*` → `./src/*`, JSX react-jsx, bundler module resolution |
| `postcss.config.mjs` | Tailwind CSS v4 via `@tailwindcss/postcss` |
| `.gitignore` | Ignores `.env*`, `.next`, `node_modules`, `.vercel` |

### 6.4 Route Groups

| Group | Prefix | Layout |
|-------|--------|--------|
| `(auth)` | `/login`, `/register`, `/onboarding` | No layout (standalone centered pages) |
| `(main)` | `/dashboard`, `/subjects`, etc. | Sidebar + Navbar + BottomNav |
| `admin` | `/admin/*` | Simple centered max-width layout |
| `api` | `/api/*` | Server-side API routes |
| `auth` | `/auth/callback` | OAuth callback handler |

---

## 7. Vercel Deployment Requirements

### 7.1 Build Configuration

Vercel auto-detects Next.js — **no manual framework override needed.** Default settings work:

| Setting | Value |
|---------|-------|
| **Framework** | Next.js (auto-detected from `package.json`) |
| **Build Command** | `next build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` (auto-detected from `package-lock.json`) |
| **Node.js Version** | **^20** (set in Vercel Project Settings → Node.js Version) |

> ⚠️ This project uses **Next.js 16** (requires Node.js 20+). Ensure Vercel is set to Node.js 20.x.

### 7.2 Environment Variables (Required)

These must be set in Vercel Project Dashboard → Settings → Environment Variables:

| Variable | Required | Source | Purpose |
|----------|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase Project → Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase Project → Settings → API | Supabase anon/public key (safe for client) |

**If these are missing**, the app falls back to a mock client (`src/lib/supabase/mock.ts`) with hardcoded sample data. For production, they **must** be set.

### 7.3 Database Setup (Supabase)

1. Create a Supabase project.
2. Run `supabase-schema.sql` in Supabase SQL Editor to create all 17 tables, RLS policies, and seed data.
3. Enable **Email/Password + Google OAuth** in Supabase Auth → Providers.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.

### 7.4 Optional Environment Variables

| Variable | Purpose |
|----------|---------|
| Any Supabase OAuth redirect config | Set `SITE_URL` or redirect URLs in Supabase Auth settings to your Vercel domain |

### 7.5 Deployment Steps

```bash
# 1. Push code to GitHub
git push origin main

# 2. Import repo in Vercel
#    - Connect GitHub repository
#    - Framework: Next.js (auto)
#    - Root Directory: ./
#    - Build: next build (auto)

# 3. Add environment variables
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Set Node.js version to 20.x
#    Vercel Project Settings → General → Node.js Version → 20.x

# 5. Deploy
#    Vercel automatically deploys on git push to main/production branch

# 6. (Optional) Configure custom domain
#    Vercel Project Settings → Domains
```

### 7.6 Supabase Auth URLs (Crucial for OAuth)

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

### 7.7 Files NOT Deployed (via `.gitignore`)

- `.env*` files (env vars set via Vercel dashboard)
- `.next/` (build output)
- `node_modules/` (installed during `npm install` on Vercel)
- `.vercel/` (local Vercel config)

### 7.8 Files That ARE Deployed

Everything tracked in git — primarily `src/`, `public/`, `supabase-schema.sql`, config files (`next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `package.json`).

