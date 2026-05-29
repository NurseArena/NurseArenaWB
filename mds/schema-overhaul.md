# Sahara Academy — Schema & Question System Overhaul

> **Instruction set for OpenCode.** Apply every change described below. This document supersedes the relevant sections of `project-overview.md`.

---

## 0. Why This Change

The current schema has these critical gaps:

| Problem | Impact |
|---------|--------|
| No marks/negative-marking config per quiz type | Can't apply correct scoring for mock vs rapid fire vs PYQ |
| No per-session result table for student quizzes | Can't show past attempts or let students re-practice |
| `quizzes` table mixes all types but has no question-count or scoring rules | Mock (100 Qs), Quiz (50 Qs), Rapid Fire (10–20 Qs) are structurally different |
| No duplicate-prevention on questions | Same question can be inserted multiple times |
| No topic-level metadata on question | Serving topic-wise practice requires reliable `topic` text matching — fragile |
| Timer is only at quiz level | No per-question time tracking usable for rapid fire |

---

## 1. Question Bank — Deduplication & Structure

### 1.1 Add a content fingerprint column to `questions`

```sql
ALTER TABLE questions
  ADD COLUMN content_hash TEXT GENERATED ALWAYS AS (
    md5(lower(trim(question)))
  ) STORED;

CREATE UNIQUE INDEX uq_questions_content_hash
  ON questions (exam_id, content_hash)
  WHERE archived = false;
```

**Effect:** Any attempt to insert a question with identical text (case-insensitive, trimmed) for the same exam will fail with a unique-constraint error. The admin upload service must catch this and report it as "duplicate skipped" rather than a hard failure.

**Update `bulkUploadQuestions()` in `src/services/admin.ts`:**

```typescript
// Replace one-at-a-time sequential insert loop with upsert-or-skip:
const { error } = await supabase
  .from('questions')
  .insert(row)
  .select();

if (error?.code === '23505') {
  skipped.push({ row, reason: 'Duplicate question' });
} else if (error) {
  failed.push({ row, reason: error.message });
} else {
  uploaded++;
}
```

### 1.2 Add `topic_id` FK (replace free-text `topic`)

The current `topic` column is a plain text string. This makes topic-wise filtering unreliable (typos, casing differences). Add a proper `topics` table.

```sql
CREATE TABLE topics (
  id          BIGSERIAL PRIMARY KEY,
  subject_id  BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id     BIGINT NOT NULL REFERENCES exams(id)   ON DELETE CASCADE,
  name        TEXT   NOT NULL,
  UNIQUE (subject_id, name)
);

ALTER TABLE questions
  ADD COLUMN topic_id BIGINT REFERENCES topics(id);

-- Keep the old `topic` text column for now as a fallback,
-- but populate topic_id on all new inserts.
```

**Admin CSV upload:** Add `topic` as a lookup — if the topic name doesn't exist for that subject, auto-create it. Never use raw text for filtering again.

### 1.3 Normalise `questions` — final column list

```sql
-- Full intended state of the questions table:
questions (
  id             BIGSERIAL PRIMARY KEY,
  exam_id        BIGINT      NOT NULL REFERENCES exams(id),
  subject_id     BIGINT      NOT NULL REFERENCES subjects(id),
  topic_id       BIGINT      REFERENCES topics(id),          -- NEW
  topic          TEXT,                                        -- legacy, keep
  question       TEXT        NOT NULL,
  option_a       TEXT        NOT NULL,
  option_b       TEXT        NOT NULL,
  option_c       TEXT        NOT NULL,
  option_d       TEXT        NOT NULL,
  correct        CHAR(1)     NOT NULL CHECK (correct IN ('A','B','C','D')),
  explanation    TEXT,
  difficulty     TEXT        CHECK (difficulty IN ('easy','medium','hard')),
  is_pyq         BOOLEAN     DEFAULT false,
  pyq_year       SMALLINT,
  pyq_exam_name  TEXT,                                        -- NEW: e.g. "JENPAS UG 2022"
  tag_id         BIGINT      REFERENCES question_tags(id),
  content_hash   TEXT GENERATED ALWAYS AS (md5(lower(trim(question)))) STORED, -- NEW
  archived       BOOLEAN     DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

`pyq_exam_name` is new — PYQs from different exams can now be stored and filtered correctly (e.g., show only JENPAS UG PYQs).

---

## 2. Quiz Session Architecture

### 2.1 Scoring config — new `quiz_scoring_profiles` table

Every quiz type needs its own scoring rules. Don't hardcode them in the frontend.

```sql
CREATE TABLE quiz_scoring_profiles (
  id                  BIGSERIAL PRIMARY KEY,
  name                TEXT    NOT NULL UNIQUE,  -- e.g. 'standard', 'jenpas', 'no_negative'
  marks_correct       NUMERIC(4,2) NOT NULL DEFAULT 1,
  marks_wrong         NUMERIC(4,2) NOT NULL DEFAULT 0,     -- negative: store as positive, subtract
  marks_unattempted   NUMERIC(4,2) NOT NULL DEFAULT 0,
  partial_credit      BOOLEAN NOT NULL DEFAULT false       -- for Category II multi-select
);

-- Seed rows:
INSERT INTO quiz_scoring_profiles (name, marks_correct, marks_wrong, marks_unattempted) VALUES
  ('standard',      1.00, 0.25, 0),   -- +1 correct, -0.25 wrong (JENPAS style)
  ('no_negative',   1.00, 0.00, 0),   -- +1 correct, no penalty
  ('rapid_fire',    1.00, 0.25, 0),   -- same as standard but enforced per-question timer
  ('pyq_review',    1.00, 0.00, 0);   -- review mode, no penalty
```

### 2.2 Overhaul `quizzes` table

```sql
-- DROP existing and recreate (or ALTER if you prefer migration):
CREATE TABLE quizzes (
  id                   BIGSERIAL PRIMARY KEY,
  exam_id              BIGINT   NOT NULL REFERENCES exams(id),
  type                 TEXT     NOT NULL CHECK (type IN (
                          'mock',        -- 100 Qs, full timed exam
                          'quiz',        -- 50 Qs, topic/subject block
                          'topicwise',   -- variable Qs, single topic
                          'rapid_fire',  -- 10–20 Qs, per-question countdown
                          'pyq',         -- PYQ set (by year or mixed)
                          'live',        -- live event (existing)
                          'daily'        -- daily challenge (existing)
                       )),
  title                TEXT     NOT NULL,
  subject_id           BIGINT   REFERENCES subjects(id),    -- null = full exam
  topic_id             BIGINT   REFERENCES topics(id),      -- null unless topicwise
  pyq_year             SMALLINT,                            -- null unless pyq
  question_count       SMALLINT NOT NULL,                   -- 100/50/10-20/variable
  duration_seconds     INT      NOT NULL,                   -- total session timer
  per_question_seconds INT,                                 -- null unless rapid_fire
  scoring_profile_id   BIGINT   NOT NULL REFERENCES quiz_scoring_profiles(id),
  is_active            BOOLEAN  DEFAULT true,
  is_live              BOOLEAN  DEFAULT false,
  start_time           TIMESTAMPTZ,                         -- for scheduled/live
  created_by           UUID     REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ DEFAULT now()
);
```

**Key changes:**
- `question_count` is now explicit — no guessing based on type
- `per_question_seconds` enables rapid fire countdown per question
- `scoring_profile_id` links to the scoring rules — decoupled from frontend
- `subject_id` and `topic_id` allow filtered quiz generation
- `pyq_year` scopes PYQ quizzes to a specific year

### 2.3 New `quiz_sessions` table (replaces ad-hoc client state)

The biggest missing piece: there is currently **no server-side record** of a user starting a student quiz (non-live). This means users cannot review past attempts. Fix this now.

```sql
CREATE TABLE quiz_sessions (
  id              BIGSERIAL PRIMARY KEY,
  quiz_id         BIGINT      NOT NULL REFERENCES quizzes(id),
  user_id         UUID        NOT NULL REFERENCES auth.users(id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,                           -- null = in-progress
  time_taken_ms   INT,                                   -- filled on submit
  total_questions SMALLINT    NOT NULL,
  attempted_count SMALLINT    DEFAULT 0,
  correct_count   SMALLINT    DEFAULT 0,
  wrong_count     SMALLINT    DEFAULT 0,
  score           NUMERIC(6,2) DEFAULT 0,                -- final calculated score
  max_score       NUMERIC(6,2) NOT NULL,                 -- possible if all correct
  status          TEXT        DEFAULT 'in_progress'
                              CHECK (status IN ('in_progress','submitted','abandoned'))
);

CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id, submitted_at DESC);
CREATE INDEX idx_quiz_sessions_quiz ON quiz_sessions(quiz_id);
```

### 2.4 New `session_answers` table

Per-question answer record tied to a session (replaces the loose `attempts` table for quiz contexts).

```sql
CREATE TABLE session_answers (
  id               BIGSERIAL PRIMARY KEY,
  session_id       BIGINT    NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id      BIGINT    NOT NULL REFERENCES questions(id),
  order_index      SMALLINT  NOT NULL,                   -- position in this session
  selected_option  CHAR(1)   CHECK (selected_option IN ('A','B','C','D')),  -- null = skipped
  is_correct       BOOLEAN,
  marks_awarded    NUMERIC(4,2),                         -- actual marks for this answer
  time_taken_ms    INT,                                  -- per-question time
  flagged          BOOLEAN   DEFAULT false,              -- user can flag for review
  answered_at      TIMESTAMPTZ,
  UNIQUE (session_id, question_id)
);

CREATE INDEX idx_session_answers_session ON session_answers(session_id);
```

**Keep the existing `attempts` table** for backward compatibility and the leaderboard materialized view. On quiz submit, write to **both** `session_answers` (rich) and `attempts` (existing leaderboard aggregation).

---

## 3. Marking Scheme — How to Calculate Score

The scoring logic lives in `src/hooks/useQuiz.ts`. Replace the hardcoded calculation with a lookup from the session's scoring profile.

### 3.1 Score calculation (TypeScript)

```typescript
// src/lib/scoring.ts  — NEW FILE

export interface ScoringProfile {
  marks_correct: number;
  marks_wrong: number;       // positive number; subtracted on wrong
  marks_unattempted: number; // usually 0
}

export function calculateMarks(
  isCorrect: boolean | null,  // null = unattempted/skipped
  profile: ScoringProfile
): number {
  if (isCorrect === null) return -profile.marks_unattempted;
  if (isCorrect) return profile.marks_correct;
  return -profile.marks_wrong;
}

export function calculateSessionScore(
  answers: Array<{ is_correct: boolean | null }>,
  profile: ScoringProfile
): { score: number; correct: number; wrong: number; skipped: number } {
  let score = 0, correct = 0, wrong = 0, skipped = 0;
  for (const a of answers) {
    if (a.is_correct === null) { skipped++; score += calculateMarks(null, profile); }
    else if (a.is_correct)    { correct++; score += profile.marks_correct; }
    else                      { wrong++;   score -= profile.marks_wrong; }
  }
  return { score: Math.max(0, score), correct, wrong, skipped };
}
```

### 3.2 Max score for a session

```typescript
// When creating a session:
const maxScore = quiz.question_count * profile.marks_correct;
// Store this in quiz_sessions.max_score at session creation.
```

---

## 4. Timers

### 4.1 Mock Test — global countdown (existing behaviour, keep)

`duration_seconds` on the quiz drives a single countdown for the whole paper. No change needed except it's now stored in `quizzes.duration_seconds` reliably.

### 4.2 Quiz (50 Qs) — same: single global timer

### 4.3 Rapid Fire — per-question countdown

`quizzes.per_question_seconds` is set (e.g., 15 or 30). The frontend should:

1. Start a per-question countdown when a question is displayed.
2. On expiry: auto-submit current question as **unattempted** (no answer selected = no negative mark), advance to next.
3. Store `time_taken_ms` in `session_answers` for each question.

**In `quizStore` (Zustand) — add:**

```typescript
perQuestionSeconds: number | null;     // from quiz config
questionStartTime: number | null;      // Date.now() when question displayed
```

**In `useQuiz.ts`:**

```typescript
// Start per-question timer when navigating to each question
const startQuestionTimer = () => {
  set({ questionStartTime: Date.now() });
};

// On answer or timeout:
const timeOnQuestion = Date.now() - (get().questionStartTime ?? Date.now());
// Store timeOnQuestion as time_taken_ms in session answer
```

### 4.4 Topic-wise & PYQ — global timer, no per-question timer

`per_question_seconds` is null. Single countdown only.

---

## 5. Session Review (Re-practice Past Attempts)

### 5.1 New API route: `GET /api/quiz/sessions`

```typescript
// Returns list of past sessions for the logged-in user
// Query params: ?exam_id=&type=&limit=20&offset=0

SELECT qs.*, q.title, q.type, q.question_count
FROM quiz_sessions qs
JOIN quizzes q ON q.id = qs.quiz_id
WHERE qs.user_id = auth.uid()
  AND qs.status = 'submitted'
  AND q.exam_id = $exam_id  -- optional filter
ORDER BY qs.submitted_at DESC
LIMIT 20 OFFSET 0;
```

### 5.2 New API route: `GET /api/quiz/sessions/[sessionId]`

```typescript
// Returns full session detail with all answers and question content
SELECT sa.*, 
       q.question, q.option_a, q.option_b, q.option_c, q.option_d,
       q.correct, q.explanation, q.topic, q.difficulty
FROM session_answers sa
JOIN questions q ON q.id = sa.question_id
WHERE sa.session_id = $sessionId
  AND EXISTS (
    SELECT 1 FROM quiz_sessions qs 
    WHERE qs.id = $sessionId AND qs.user_id = auth.uid()
  )
ORDER BY sa.order_index;
```

### 5.3 Re-practice flow

When a user clicks "Re-practice" on a past session:

1. Create a **new** `quiz_sessions` row (same `quiz_id`).
2. Pull question IDs from the original session's `session_answers` (same questions, re-shuffled order).
3. New session is independent — does not overwrite old scores.
4. On the result page, optionally show side-by-side comparison: "Last attempt: 62% → This attempt: 74%".

### 5.4 RLS for new tables

```sql
-- quiz_sessions
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions"
  ON quiz_sessions FOR ALL USING (user_id = auth.uid());

-- session_answers
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own session answers"
  ON session_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quiz_sessions qs
    WHERE qs.id = session_id AND qs.user_id = auth.uid()
  ));

-- quiz_scoring_profiles — read-only for all authenticated users
ALTER TABLE quiz_scoring_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read scoring profiles"
  ON quiz_scoring_profiles FOR SELECT USING (true);
```

---

## 6. Question Serving Logic (How to Generate Each Quiz Type)

Move question selection to a **server-side API route** (`/api/quiz/start`). The current client-side random selection is not reproducible and can't be reviewed.

### 6.1 Mock Test (100 Qs)

```typescript
// /api/quiz/start  POST  { quiz_id }
// If quiz has pre-assigned questions in quiz_questions — use those (ordered)
// If not (on-demand mock) — random selection:

SELECT id FROM questions
WHERE exam_id = $exam_id
  AND archived = false
ORDER BY RANDOM()
LIMIT 100;
```

### 6.2 Quiz / Topic-wise (50 Qs or variable)

```typescript
SELECT id FROM questions
WHERE exam_id = $exam_id
  AND subject_id = $subject_id        -- if subject-scoped
  AND topic_id = $topic_id            -- if topic-scoped (null = whole subject)
  AND archived = false
ORDER BY RANDOM()
LIMIT $question_count;                -- from quizzes.question_count
```

### 6.3 Rapid Fire (10–20 Qs)

```typescript
// Same as topic-wise but question_count from quizzes row (10–20)
// per_question_seconds is set — frontend enforces per-question countdown
SELECT id FROM questions
WHERE exam_id = $exam_id
  AND archived = false
ORDER BY RANDOM()
LIMIT $question_count;
```

### 6.4 PYQ (variable Qs)

```typescript
SELECT id FROM questions
WHERE exam_id = $exam_id
  AND is_pyq = true
  AND ($pyq_year IS NULL OR pyq_year = $pyq_year)   -- year filter optional
  AND archived = false
ORDER BY pyq_year DESC, RANDOM();
```

### 6.5 On quiz start — persist question list

After selection, **always insert into `quiz_questions`** so the session is reproducible:

```typescript
await supabase.from('quiz_questions').insert(
  selectedIds.map((qid, i) => ({
    quiz_id: session.quiz_id,  // or create a per-session variant
    question_id: qid,
    order_index: i
  }))
);
```

> **Note:** For on-demand quizzes (not pre-scheduled), create a transient `quizzes` row or link to a parent template quiz. Use `quiz_sessions.id` as the stable anchor — all session answers reference the session, not the quiz directly.

---

## 7. Admin Changes

### 7.1 Quiz creation — updated fields

In `AdminQuizCreate` / `/admin/quizzes` POST, add:

| Field | Input Type | Notes |
|-------|-----------|-------|
| `type` | Dropdown | mock / quiz / topicwise / rapid_fire / pyq / live / daily |
| `question_count` | Number | auto-suggest: mock=100, quiz=50, rapid_fire=10 |
| `per_question_seconds` | Number | only show if type = rapid_fire |
| `scoring_profile_id` | Dropdown | load from `quiz_scoring_profiles` |
| `subject_id` | Dropdown | optional, for subject-scoped quiz |
| `topic_id` | Dropdown | optional, cascades from subject selection |
| `pyq_year` | Number | only show if type = pyq |

### 7.2 Question bank — add deduplication report

In `/admin/questions/bank`, add a "Duplicates" filter that shows questions grouped by `content_hash` where count > 1 (cross-archive). Let admin pick which to keep.

```sql
SELECT content_hash, COUNT(*) as count, array_agg(id) as ids
FROM questions
WHERE exam_id = $exam_id AND archived = false
GROUP BY content_hash
HAVING COUNT(*) > 1;
```

### 7.3 Topic management page — NEW

Add `/admin/topics`:
- Shows subject → topic hierarchy.
- Admin can add / rename / merge topics.
- Merge: update all `questions.topic_id` where `topic_id = old_id` to `new_id`, then delete `old_id`.

---

## 8. Summary of New / Changed Tables

| Table | Status | What Changed |
|-------|--------|-------------|
| `questions` | Modified | + `topic_id`, `content_hash`, `pyq_exam_name` |
| `topics` | **New** | Normalised topic taxonomy |
| `quizzes` | Modified | + `question_count`, `per_question_seconds`, `scoring_profile_id`, `subject_id`, `topic_id`, `pyq_year`, `created_by` |
| `quiz_scoring_profiles` | **New** | Decoupled marking rules (+1/−0.25 etc.) |
| `quiz_sessions` | **New** | Server-side record of every user quiz attempt |
| `session_answers` | **New** | Per-question answer with marks and time |
| `quiz_questions` | Unchanged | Now also used for on-demand session question lists |
| `attempts` | Keep | Still used for leaderboard aggregation |

---

## 9. Migration Checklist for OpenCode

Apply in this order:

- [ ] 1. Create `topics` table
- [ ] 2. Create `quiz_scoring_profiles` table + seed 4 rows
- [ ] 3. `ALTER TABLE questions` — add `topic_id`, `content_hash`, `pyq_exam_name`
- [ ] 4. `CREATE UNIQUE INDEX` on `questions(exam_id, content_hash)` where not archived
- [ ] 5. `ALTER TABLE quizzes` — add all new columns
- [ ] 6. Create `quiz_sessions` table + RLS
- [ ] 7. Create `session_answers` table + RLS
- [ ] 8. Create `src/lib/scoring.ts`
- [ ] 9. Update `src/services/admin.ts` — `bulkUploadQuestions` with duplicate handling
- [ ] 10. Update `/api/quiz/start` — server-side question selection + session creation
- [ ] 11. Update `/api/quiz/submit` — write to both `session_answers` and `attempts`
- [ ] 12. Add `GET /api/quiz/sessions` and `GET /api/quiz/sessions/[sessionId]`
- [ ] 13. Update `useQuiz.ts` — load scoring profile, per-question timer support
- [ ] 14. Update `quizStore` — add `perQuestionSeconds`, `questionStartTime`
- [ ] 15. Add `/admin/topics` page
- [ ] 16. Update admin quiz create form with new fields
- [ ] 17. Add duplicates view in question bank

---

## 10. No Breaking Changes Guaranteed

- `attempts` table is **untouched** — leaderboard, XP, streaks, missions all continue working.
- `quiz_questions` junction is **extended**, not replaced.
- `quizzes.type` existing values (`mock`, `rapid_fire`, `live`, `daily`, `pyq`) are preserved; `quiz` and `topicwise` are new additions.
- All existing API routes remain; new routes are additive.
- RLS on existing tables is unchanged.
