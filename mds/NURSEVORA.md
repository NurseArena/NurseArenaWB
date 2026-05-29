# 🏥 Nursevora — JENPAS Mock Test Platform

Gamified MCQ practice platform for **JENPAS-UG** (Undergraduate) and **JENPAS-PG** (Postgraduate) nursing entrance exams built with **Next.js App Router + Supabase + Tailwind CSS**.

---

## 📁 File Structure

```
sahara-academy/
├── NURSEVORA.md                    ← This file (documentation)
├── supabase-schema.sql             ← Full DB schema + seed data (run in Supabase SQL Editor)
├── next.config.ts                  ← Next.js config (image domains, etc.)
├── package.json                    ← Dependencies and scripts
├── tsconfig.json                   ← TypeScript config
├── postcss.config.mjs              ← PostCSS with Tailwind
├── eslint.config.mjs               ← ESLint config
├── .env.example                    ← Environment variables template
├── public/
│   ├── sounds/                     ← Quiz sound effects (correct.mp3, wrong.mp3, levelup.mp3)
│   └── icons/                      ← Subject icons (SVG)
└── src/
    ├── app/
    │   ├── globals.css             ← Theme CSS variables (dark + light)
    │   ├── layout.tsx              ← Root layout (theme script, fonts, providers)
    │   ├── page.tsx                ← Landing page (public, no auth required)
    │   ├── (auth)/
    │   │   ├── login/page.tsx      ← Login (Google + Email)
    │   │   └── register/page.tsx   ← Register (Google + Email)
    │   ├── (main)/
    │   │   ├── layout.tsx          ← Protected layout (Sidebar + Navbar + BottomNav)
    │   │   ├── dashboard/page.tsx  ← Streak, XP, missions, upcoming quiz
    │   │   ├── exam-select/page.tsx← JENPAS-UG / JENPAS-PG picker
    │   │   ├── subjects/
    │   │   │   ├── page.tsx        ← Subject grid filtered by active exam
    │   │   │   └── [subjectId]/page.tsx ← Subject detail + practice options
    │   │   ├── quiz/
    │   │   │   ├── [quizId]/page.tsx   ← Active quiz session (timer, cards, explanations)
    │   │   │   └── result/page.tsx ← Score, XP earned, confetti, retry
    │   │   ├── rapid-fire/page.tsx ← Fullscreen 10Q mode (keyboard shortcuts)
    │   │   ├── mock-test/page.tsx  ← Full exam simulation overview
    │   │   ├── live-quiz/page.tsx  ← 9 PM live quiz room (Supabase Realtime)
    │   │   ├── pyq/page.tsx        ← PYQ section, year-filtered
    │   │   ├── leaderboard/page.tsx← Daily/weekly/all-time + podium
    │   │   ├── analytics/page.tsx  ← Per-subject accuracy, heatmap, weak topics
    │   │   └── profile/page.tsx    ← User profile + exam switch + theme toggle + logout
    │   ├── admin/
    │   │   ├── layout.tsx          ← Admin layout (no sidebar)
    │   │   ├── page.tsx            ← Admin dashboard
    │   │   ├── questions/page.tsx  ← JSON upload form
    │   │   └── quizzes/page.tsx    ← Quiz creator
    │   ├── api/
    │   │   ├── quiz/
    │   │   │   ├── start/route.ts  ← Fetch questions for a quiz
    │   │   │   └── submit/route.ts ← Log attempt + calculate XP
    │   │   ├── leaderboard/route.ts ← Fetch leaderboard entries
    │   │   └── admin/
    │   │       ├── questions/route.ts ← CRUD questions
    │   │       └── quizzes/route.ts   ← CRUD quizzes
    │   └── auth/
    │       └── callback/route.ts   ← Supabase OAuth callback handler
    ├── components/
    │   ├── ThemeProvider.tsx       ← Dark/light theme context provider
    │   ├── ui/                     ← Reusable UI primitives
    │   │   ├── button.tsx          ← Button (primary, secondary, ghost, danger, outline)
    │   │   ├── card.tsx            ← Card + CardHeader + CardContent
    │   │   ├── badge.tsx           ← Badge (default, success, warning, danger, accent)
    │   │   ├── input.tsx           ← Styled input
    │   │   ├── select.tsx          ← Styled select
    │   │   └── label.tsx           ← Styled label
    │   ├── layout/
    │   │   ├── Sidebar.tsx         ← Desktop sidebar (10 nav links)
    │   │   ├── BottomNav.tsx       ← Mobile bottom navigation (5 tabs)
    │   │   └── Navbar.tsx          ← Top bar (exam badge, theme toggle, notifications, avatar)
    │   ├── quiz/
    │   │   ├── QuizCard.tsx        ← MCQ card with option states (default, selected, correct, wrong)
    │   │   ├── QuizTimer.tsx       ← Animated SVG countdown ring (pulses at <10s)
    │   │   ├── QuizProgress.tsx    ← Progress bar + accuracy display
    │   │   └── ExplanationPanel.tsx← Accordion-style post-answer explanation
    │   ├── gamification/
    │   │   ├── XPBar.tsx           ← XP progress bar with level info
    │   │   ├── StreakBadge.tsx     ← Fire streak counter
    │   │   ├── LevelBadge.tsx      ← Level title badge
    │   │   ├── XPToast.tsx         ← (Placeholder) "+10 XP" popup
    │   │   └── ConfettiOverlay.tsx ← Confetti burst on milestones
    │   ├── leaderboard/
    │   │   ├── LeaderboardTable.tsx ← Full leaderboard with rank, name, score, streak, trend
    │   │   ├── RankRow.tsx          ← Single rank row
    │   │   └── ExamToggle.tsx       ← Tab switcher (period + exam filter)
    │   ├── exam/
    │   │   ├── ExamSelector.tsx     ← Big card picker for UG vs PG
    │   │   ├── ExamBadge.tsx        ← Active exam badge
    │   │   └── SubjectGrid.tsx      ← Grid of subject cards
    │   ├── dashboard/
    │   │   ├── MissionCard.tsx      ← Daily mission with progress bar
    │   │   ├── UpcomingQuiz.tsx     ← Live quiz countdown card
    │   │   └── StatsRow.tsx         ← Quick stats (accuracy, rank, streak, XP boost)
    │   └── charts/
    │       ├── AccuracyChart.tsx    ← Recharts RadialBar per subject
    │       └── ActivityHeatmap.tsx  ← GitHub-style activity heatmap
    ├── hooks/
    │   ├── useQuiz.ts              ← Quiz state machine + timer + XP calculation
    │   ├── useStreak.ts            ← Streak read/update logic
    │   ├── useLeaderboard.ts       ← Fetch + subscribe leaderboard
    │   ├── useExam.ts              ← Active exam context + config
    │   ├── useXP.ts                ← XP level calculation
    │   └── useMissions.ts          ← Daily mission fetch + progress
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts           ← Browser Supabase client
    │   │   └── server.ts           ← Server-side Supabase client
    │   ├── exam-config.ts          ← JENPAS-UG / PG subjects, patterns, colors
    │   ├── xp.ts                   ← XP formula, level thresholds, actions
    │   └── utils.ts                ← cn(), formatTime(), formatNumber(), etc.
    ├── services/
    │   ├── questions.ts            ← Supabase queries for questions
    │   ├── attempts.ts             ← Log + fetch attempts + stats
    │   ├── leaderboard.ts          ← Leaderboard queries
    │   └── profiles.ts             ← Profile read/update + streak logic
    ├── store/
    │   ├── examStore.ts            ← Zustand (persisted): active exam
    │   ├── quizStore.ts            ← Zustand: current quiz state
    │   └── authStore.ts            ← Zustand: user session + profile
    └── types/
        ├── exam.ts                 ← Exam, Subject, Question interfaces
        ├── quiz.ts                 ← Quiz, Attempt, QuizSession, QuizState
        ├── user.ts                 ← Profile, Mission, UserMission
        └── leaderboard.ts          ← LeaderboardEntry, LeaderboardRow, PeriodType
```

---

## 🚀 How to Run

### 1. Install dependencies
```bash
cd sahara-academy
npm install
```

### 2. Set up environment variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up Supabase

#### a. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project → Note your project URL and anon key.

#### b. Run the database schema
1. Open Supabase Dashboard → SQL Editor
2. Copy-paste the entire contents of `supabase-schema.sql`
3. Click **Run** — this creates all tables, RLS policies, materialized views, and seed data

#### c. Enable Google Auth (optional, can use email-only)
1. Supabase Dashboard → Authentication → Providers → Google
2. Enable it → Add your Google OAuth Client ID and Secret
3. Add the redirect URL: `https://your-domain.vercel.app/auth/callback`

#### d. Enable pg_cron (for leaderboard auto-refresh)
1. Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension
3. Run the scheduled refresh (in SQL Editor):
```sql
select cron.schedule('refresh-leaderboard', '*/10 * * * *', 'refresh materialized view leaderboard_daily');
```

### 4. Start the development server
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Build for production
```bash
npm run build
npm start
```

### 6. Deploy to Vercel
```bash
npx vercel --prod
```
Set the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel dashboard.

---

## 🎨 How to Customize

### Theme (Dark/Light)
- Theme toggle is available in the Navbar (top-right) and Profile page
- Preferences persist in `localStorage` (key: `nursevora-theme`)
- CSS variables for both themes are in `src/app/globals.css`
- Light: white surfaces with indigo accents
- Dark: near-black surfaces with lighter indigo

### Colors
Edit `src/app/globals.css` to change the color palette:
```css
@theme {
  --color-primary: #6366f1;   /* Indigo — main brand */
  --color-accent: #a855f7;    /* Purple — secondary */
  --color-highlight: #22d3ee; /* Cyan — highlights */
  --color-success: #4ade80;   /* Green — correct answers */
  --color-warning: #facc15;   /* Yellow — warnings */
  --color-danger: #f87171;    /* Red — wrong answers */
}
```

### Adding New Pages
1. Create a folder in `src/app/` matching the URL path
2. Add a `page.tsx` inside it
3. If it's under the main app layout, place it inside `(main)/`
4. For protected routes, add auth checks in the page or layout

### Changing Exam Config
Edit `src/lib/exam-config.ts`:
- Add/remove subjects
- Change exam duration or MCQ count
- Modify colors per exam

### XP & Level System
Edit `src/lib/xp.ts`:
- `XP_ACTIONS` — points for different actions
- `LEVELS` — level thresholds and titles

---

## 🗄️ Supabase Integration

### Connection (already set up in code)
```typescript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server-side (API routes, server components)
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

### Database Tables
The schema creates 10 tables:
1. `exams` — JENPAS-UG, JENPAS-PG
2. `subjects` — Physics, Chemistry, Biology, Anatomy, etc.
3. `profiles` — Extends auth.users with XP, streaks, exam selection
4. `questions` — MCQ bank (10,000+ target)
5. `attempts` — Per-question attempt log
6. `quizzes` — Mock tests, rapid fire, live quizzes
7. `quiz_questions` — Junction table mapping quizzes to questions
8. `leaderboard` — Pre-computed rankings (daily/weekly/all_time)
9. `missions` — Available daily missions
10. `user_missions` — Per-user mission progress

### Auth Flow
- Login: Google OAuth or Email/Password via Supabase Auth
- Auth callback route at `/auth/callback`:
  1. Exchanges OAuth code for session
  2. Upserts profile in `profiles` table
  3. Redirects to `/exam-select` if no exam chosen, else `/dashboard`

### RLS Policies (Security)
- `profiles`: users can only read/update their own row
- `questions`: anyone authenticated can read
- `attempts`: users can insert/view only their own
- `leaderboard`: anyone authenticated can read

---

## 🎯 XP & Gamification Details

| Action | XP | Notes |
|--------|----|----|
| Correct answer | +10 | Per question |
| Fast answer (<10s) | +5 bonus | Stacked with correct |
| 5-streak bonus | +20 | Every 5 consecutive correct |
| Daily login | +15 | First visit of the day |
| Complete daily mission | +25–50 | Varies by mission |
| Attend live quiz | +30 | On join |

**Levels:** 10 levels total (Beginner → Topper), 12,000 max XP

**Streak:** Resets if inactive for >1 day. Longest streak tracked separately.

---

## 🖼️ Icons

This project uses **lucide-react** for all icons. Import from `lucide-react`:

```tsx
import { Home, User, Settings, Zap, Trophy, Swords, BarChart3 } from 'lucide-react';

// Usage
<Home size={20} />
<User size={24} className="text-primary" />
<Settings size={18} onClick={handleClick} />
```

### Available icon categories used in this app:
- **Navigation:** Home, User, Settings, LogOut, ArrowLeft, ArrowRight, ChevronDown, ChevronUp
- **Quiz & Practice:** Zap (Rapid Fire), Swords (Mock Test), BookOpen, GraduationCap, Target, Brain
- **Gamification:** Trophy, Medal, Award, Flame, TrendingUp, TrendingDown, BarChart3
- **UI:** Bell, Sun, Moon, Mail, Chrome, Clock, Users, CheckCircle2, XCircle, ListChecks, Radio, ScrollText, Archive, Plus, Upload, CalendarPlus, SkipForward, Flag, Play, RotateCcw, Home
- **Actions:** ArrowRight, Plus, Upload, SkipForward, Flag, Play, RotateCcw

### Adding more icons
Browse all available icons at [lucide.dev/icons](https://lucide.dev/icons)

### Subject icons
Subject icons are emojis defined in `src/lib/exam-config.ts`:
- Physics: ⚛️, Chemistry: 🧪, Biology: 🧬
- Anatomy: 🦴, Physiology: 🫀, Microbiology: 🦠, Biochemistry: 🔬, Pathology: 🩺, Pharmacology: 💊, Nursing Foundation: 🏥

To change them, edit the `icon` field in the `EXAMS` config.

---

## 🛠️ Adding Features

### New Quiz Type
1. Add the type to the `type` check constraint in `quiz` table
2. Create a new page in `src/app/(main)/`
3. Add it to `Sidebar.tsx` nav items
4. Build any new components in `src/components/`

### New Admin Feature
1. Add route in `src/app/admin/`
2. The admin layout is separate from main layout
3. Add admin-only checks using `profiles.is_admin` field

### New Mission Type
1. Add condition type to `missions.condition_type`
2. Handle the new condition in mission hooks/components

---

## 📝 License
Private — built for nursing exam preparation.
