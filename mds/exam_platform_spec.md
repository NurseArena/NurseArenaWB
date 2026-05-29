# Exam Platform — Full Feature Specification & Implementation Prompt

> Drop this entire file into your AI code editor (Cursor / Windsurf / OpenCode) as the system prompt or first message. It describes every feature delta on top of your existing codebase.

---

## 0. Project Context

You are extending an existing exam/quiz platform codebase. Do **not** rewrite what already works. Add, modify, or wire up only the features described below. Ask the developer to share relevant existing files (models, routes, components) before touching them.

---

## 1. Admin Panel

### 1.1 Question Upload & Management

- **Bulk CSV/Excel upload** — Admin uploads a `.csv` or `.xlsx` file. Columns: `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option` (a/b/c/d), `explanation` (optional), `difficulty` (easy/medium/hard), `topic_tag`, `exam_id`.
- On upload: validate every row, show a preview table with row-level error highlighting before committing. Reject the whole batch if >10% rows are malformed.
- **Single question form** — rich text editor for question body (supports LaTeX via KaTeX), 4 option fields, correct answer radio, explanation textarea, tag multi-select.
- **Question bank table** — searchable/filterable by exam, tag, difficulty. Inline edit. Soft-delete (archive, not hard delete).
- **Duplicate detection** — before saving, fuzzy-match new question text against existing ones in the same exam (Levenshtein distance ≤ 15%). Warn admin, allow override.

### 1.2 Exam & Schedule Management

- **Create exam** — name, description, syllabus PDF upload, total questions, passing score, XP reward on completion.
- **Mock test scheduler** — Admin picks exam → picks date/time → sets duration (minutes) → sets max participants. A mock test may only be scheduled **once or twice per week per exam** (enforce this constraint server-side with a unique index on `(exam_id, week_number, year)`; reject a third slot with a 409).
- **9 PM live quiz slots** — Admin can create a "live quiz" event: start time locked to 21:00 local, duration ≤ 60 min, question set selected from bank. Multiple exams can have overlapping live quizzes on different nights.
- **Dashboard widgets** (read-only, no controls needed here):
  - Total registered users per exam (bar chart)
  - Daily active users (line chart, last 30 days)
  - Average score per mock test (line chart)
  - XP distribution histogram
  - Questions with highest wrong-answer rate (top 10 table)

### 1.3 User Management

- Table: name, email, enrolled exam, XP balance, last active, account status.
- Admin can: change enrolled exam, grant/revoke XP, ban/unban, reset password link.
- Bulk export to CSV.

---

## 2. Exam Enrollment & Persistence

### 2.1 Single-exam lock

- During registration, user selects exactly **one exam** from a dropdown.
- After registration, `users.active_exam_id` is set and does **not** change unless the user explicitly triggers "Change exam" from Settings.
- All daily practice, mock tests, and live quizzes shown to the user are scoped to `active_exam_id`. No content from other exams leaks in.

### 2.2 Changing exam from Settings

- Settings → "Enrolled exam" section → "Switch exam" button.
- Show a confirmation modal: *"Switching exam will reset your progress and XP streak. Your XP balance is kept. Continue?"*
- On confirm: update `active_exam_id`, archive current progress rows (do not delete), reset streak counter.
- Rate-limit: user may switch exam at most **once every 30 days** (store `last_exam_switch_at`; show countdown if within window).

---

## 3. XP System & Level Gating

### 3.1 Starting XP

- Every new user receives **10 XP** on account creation (insert a `xp_transactions` row with `reason = 'signup_bonus'`).

### 3.2 Earning XP

| Action | XP Earned |
|---|---|
| Complete a daily practice session (≥ 5 questions) | +5 |
| Score ≥ 70% on a practice session | +3 bonus |
| Complete a scheduled mock test | +20 |
| Score ≥ passing threshold on mock test | +15 bonus |
| Win (top 10%) a live quiz | +25 |
| 7-day login streak | +10 |
| Refer a friend who registers | +20 |

Store every transaction in `xp_transactions (id, user_id, delta, reason, reference_id, created_at)`. Current balance = `SUM(delta)` per user (materialise into `users.xp_balance` for fast reads, recompute nightly).

### 3.3 Levels & Unlock Gates

Define levels in a config table `xp_levels (level, min_xp, label, unlocks)`:

| Level | Min XP | Label | Unlocks |
|---|---|---|---|
| 1 | 0 | Beginner | Daily practice (5 Q/day) |
| 2 | 50 | Explorer | Daily practice (10 Q/day), topic filters |
| 3 | 150 | Challenger | Full chapter tests, performance analytics |
| 4 | 350 | Contender | Previous-year paper tests |
| 5 | 700 | Expert | All content; priority mock test slot booking |

- Gate enforcement is **server-side**. API returns 403 with `{ "error": "xp_gate", "required": 150, "current": 80 }` if user tries to access locked content.
- Frontend shows a lock icon + XP needed on locked items. Never hide them — show as disabled with progress indicator.

### 3.4 Mock Test Access

- Full mock tests are **only accessible during a scheduled window** created by admin (section 1.2).
- Outside a window: show "Next mock test: [date/time]" countdown.
- Inside window: "Join now" button active.
- XP gate still applies (level ≥ 2 required to attempt a mock test).

---

## 4. Live 9 PM Quiz — Real-time Sync

### 4.1 Late-join behaviour

- When a user opens a live quiz that has already started, **do not start from question 1**.
- Server tracks `quiz_sessions.current_question_index` (incremented for all participants simultaneously by a server-side timer).
- On join: fetch `current_question_index` and deliver that question with the **remaining time on its timer**.
- User sees: *"You joined late — you're at question N of M."*
- Answered questions before join are marked as **skipped** (0 points, not wrong), preserving leaderboard fairness.
- If quiz is already in the last 2 minutes, show: *"Quiz is almost over. You can observe but cannot submit answers."* (read-only mode).

### 4.2 Real-time infrastructure

- Use **WebSocket** (or Socket.io if already in stack) for live quiz rooms.
- Room name: `live_quiz:{quiz_event_id}`.
- Server emits events: `question_start { index, question, options, duration_ms }`, `question_end { index, correct_option, explanation }`, `leaderboard_update { top10 }`, `quiz_end { final_leaderboard }`.
- Client emits: `submit_answer { quiz_event_id, question_index, selected_option, latency_ms }`.
- Server validates: answer only accepted within the question's time window. Late submissions are silently dropped.
- Reconnect logic: on socket reconnect, client immediately calls REST `GET /api/live-quiz/{id}/state` to re-sync position before re-attaching socket listeners.

### 4.3 Leaderboard

- Scoring: correct answer = 10 pts + speed bonus (max 5 pts, linear decay over question timer).
- Leaderboard updates pushed every 5 seconds during question review window.
- Final leaderboard persisted to `quiz_results` table.

---

## 5. Edge Cases & Guardrails

### 5.1 Concurrency & race conditions

- Answer submission: use DB-level upsert with `ON CONFLICT (user_id, quiz_event_id, question_index) DO NOTHING` — prevents double-submission if client retries.
- XP award: wrap in a transaction; award XP only after result is committed.
- Mock test slot booking: pessimistic lock or DB-unique constraint (see 1.2) prevents overbooking.

### 5.2 Network dropout during live quiz

- Client polls `GET /api/live-quiz/{id}/state` every 10 s as a fallback if WebSocket is disconnected.
- If user misses >3 consecutive questions due to disconnection, a `disconnection_flag` is set on their result row (admin can see this).
- Answers submitted after reconnect during the *same* question window are still accepted.

### 5.3 Exam switch during an active session

- If user is mid-quiz or mid-practice and triggers exam switch, block the action: *"Please finish or exit your current session before switching exams."*

### 5.4 XP balance going negative

- XP balance cannot go below 0. If a penalty (e.g. future feature) would cause negative, floor at 0.

### 5.5 Mock test — user closes tab mid-test

- Auto-save answer state to `mock_test_responses` every answer submission (not on a timer — per answer).
- On re-open within the active window: resume from last answered question. Show "Resuming your test…" toast.
- After window closes: auto-submit whatever was answered; do not allow re-entry.

### 5.6 Duplicate registrations

- Unique constraint on `users.email`. On duplicate attempt show: *"An account with this email already exists."* — never leak whether it's a social or password account.

### 5.7 Admin scheduling conflicts

- If admin tries to schedule a mock test within 30 minutes of an existing live quiz for the same exam, show a warning (not a hard block — admin can override).

### 5.8 Zero-participant quiz

- If a live quiz reaches its start time with 0 registered participants, automatically cancel it and notify admin via in-app alert. Do not leave an empty socket room open.

### 5.9 Time zone handling

- All datetimes stored as UTC in the DB.
- "9 PM quiz" means 21:00 in the **user's local timezone**, resolved at display time. Admin sets the event in their local timezone with an explicit timezone selector (IANA tz string stored alongside the event).

### 5.10 Leaderboard ties

- Ties broken by: 1) total correct answers, 2) sum of answer latencies (lower = better), 3) registration timestamp (earlier = better). Deterministic — no random tie-breaking.

---

## 6. Database Schema Additions

Add these tables/columns without breaking existing schema:

```sql
-- XP ledger
CREATE TABLE xp_transactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  delta         INT NOT NULL,
  reason        VARCHAR(64) NOT NULL,
  reference_id  BIGINT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- XP level config (seed data, admin-editable)
CREATE TABLE xp_levels (
  level       SMALLINT PRIMARY KEY,
  min_xp      INT NOT NULL,
  label       VARCHAR(64),
  unlocks     JSONB
);

-- Scheduled mock tests
CREATE TABLE mock_test_events (
  id              BIGSERIAL PRIMARY KEY,
  exam_id         BIGINT NOT NULL REFERENCES exams(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    SMALLINT NOT NULL,
  max_participants INT,
  week_number     SMALLINT NOT NULL,
  year            SMALLINT NOT NULL,
  created_by      BIGINT REFERENCES users(id),
  UNIQUE (exam_id, week_number, year, scheduled_at)
);

-- Live quiz events
CREATE TABLE live_quiz_events (
  id              BIGSERIAL PRIMARY KEY,
  exam_id         BIGINT NOT NULL REFERENCES exams(id),
  question_set_id BIGINT,
  starts_at       TIMESTAMPTZ NOT NULL,
  timezone        VARCHAR(64) NOT NULL,
  duration_min    SMALLINT NOT NULL DEFAULT 60,
  status          VARCHAR(16) DEFAULT 'scheduled', -- scheduled | live | ended | cancelled
  current_q_index SMALLINT DEFAULT 0
);

-- Live quiz per-user results
CREATE TABLE quiz_results (
  id              BIGSERIAL PRIMARY KEY,
  quiz_event_id   BIGINT REFERENCES live_quiz_events(id),
  user_id         BIGINT REFERENCES users(id),
  score           INT DEFAULT 0,
  correct_count   SMALLINT DEFAULT 0,
  total_latency_ms INT DEFAULT 0,
  joined_at_index SMALLINT DEFAULT 0,
  disconnection_flag BOOLEAN DEFAULT false,
  UNIQUE (quiz_event_id, user_id)
);

-- Answer submissions (live quiz)
CREATE TABLE quiz_answers (
  id              BIGSERIAL PRIMARY KEY,
  quiz_event_id   BIGINT REFERENCES live_quiz_events(id),
  user_id         BIGINT REFERENCES users(id),
  question_index  SMALLINT NOT NULL,
  selected_option CHAR(1),
  is_correct      BOOLEAN,
  latency_ms      INT,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, quiz_event_id, question_index)
);

-- Columns to add to existing `users` table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active_exam_id      BIGINT REFERENCES exams(id),
  ADD COLUMN IF NOT EXISTS xp_balance          INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS xp_level            SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_exam_switch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_streak        SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date     DATE;
```

---

## 7. API Endpoints to Add

```
POST   /api/admin/questions/bulk-upload
POST   /api/admin/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id          (soft delete)

POST   /api/admin/mock-test-events
GET    /api/admin/mock-test-events
DELETE /api/admin/mock-test-events/:id

POST   /api/admin/live-quiz-events
PUT    /api/admin/live-quiz-events/:id/cancel

GET    /api/admin/stats/users
GET    /api/admin/stats/engagement
GET    /api/admin/stats/scores

POST   /api/users/switch-exam            (user-facing, rate-limited)
GET    /api/users/xp-history

GET    /api/live-quiz/:id/state          (REST sync endpoint)
POST   /api/live-quiz/:id/join
POST   /api/live-quiz/:id/answer         (fallback for non-WS clients)

GET    /api/mock-tests/upcoming
POST   /api/mock-tests/:eventId/start
POST   /api/mock-tests/:eventId/submit
```

---

## 8. Frontend Components to Add/Modify

| Component | Notes |
|---|---|
| `<AdminQuestionUpload>` | Drag-drop zone, preview table, row error highlight |
| `<AdminScheduler>` | Calendar view, week-slot enforcement, timezone picker |
| `<AdminDashboard>` | Charts using existing chart library in project |
| `<XPBar>` | Persistent header widget: current XP, level badge, next level progress |
| `<LevelGate>` | HOC/wrapper that renders lock overlay if XP insufficient |
| `<MockTestCountdown>` | Timer to next scheduled test; "Join" button activates when window opens |
| `<LiveQuizRoom>` | Question display, timer bar, option buttons, leaderboard sidebar |
| `<LateJoinBanner>` | Shows question index and "you joined late" message |
| `<ExamSwitchModal>` | Confirmation + cooldown countdown |
| `<SettingsEnrollment>` | Current exam display + switch button |

---

## 9. Implementation Order (Suggested)

1. DB migrations (section 6)
2. XP transaction system + signup bonus
3. Level gating middleware
4. Admin question upload (CSV + single form)
5. Mock test scheduling (admin) + countdown (user)
6. Exam persistence + switch flow
7. Live quiz: server timer + WebSocket room + late-join sync
8. Admin stats dashboard
9. Edge cases (auto-submit on tab close, reconnect polling, tie-breaking)

---

## 10. Non-functional Requirements

- All admin routes require `role = 'admin'` JWT claim. Return 403 otherwise.
- Rate limit answer submissions to 1 per question per user (DB unique constraint is the last line of defence; middleware should reject early).
- All timestamps UTC in DB, converted to local in frontend.
- Mobile-responsive: live quiz room must be usable on a 375px screen.
- Accessibility: live quiz timer must announce time remaining via `aria-live="polite"` region every 10 s.
