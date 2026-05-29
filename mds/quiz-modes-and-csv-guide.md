# Sahara Academy — Quiz Modes, Mock Test System & CSV Guide

> **Instruction set for OpenCode.** Applies on top of `schema-overhaul.md`. Clarifies exact behaviour for each quiz mode and how the admin uploads questions for each.

---

## 1. The Three Question Pools — Mental Model

Think of your question bank as three separate buckets:

```
┌─────────────────────────────────────────────────────────┐
│                    questions table                       │
│                                                          │
│  POOL A: General Pool                                    │
│  (topic_id set, is_pyq = false, mock_test_id = null)     │
│  ↳ Used for: Rapid Fire, Topic-wise, on-demand picks     │
│                                                          │
│  POOL B: PYQ Pool                                        │
│  (is_pyq = true, pyq_year set)                           │
│  ↳ Used for: PYQ section only                            │
│                                                          │
│  POOL C: Mock Test Pool                                  │
│  (mock_test_id set → locked to that mock test)           │
│  ↳ Used for: that specific mock test ONLY                │
└─────────────────────────────────────────────────────────┘
```

**Key rule:** Mock test questions are **never** randomly served into other quiz types. General pool questions are **never** locked to a mock test. PYQ questions only appear in the PYQ section.

---

## 2. Mock Test — Curated, Named, Admin-Controlled

### 2.1 How it works

- Admin creates a named mock test: **"Mock Test 1"**, **"Mock Test 2"**, etc.
- Admin uploads exactly **100 questions** tagged to that mock test via CSV.
- When published, a notification goes out: *"Mock Test 3 is now available!"*
- Students see a list of all published mock tests and can attempt any of them.
- A student can attempt a mock test **only once** (attempt again shows their past result, not a fresh attempt).
- Mock tests are **never randomised** — same 100 questions, same order, for every student.

### 2.2 Schema changes for Mock Tests

#### Add `mock_tests` table (new)

```sql
CREATE TABLE mock_tests (
  id             BIGSERIAL PRIMARY KEY,
  exam_id        BIGINT    NOT NULL REFERENCES exams(id),
  title          TEXT      NOT NULL,         -- "Mock Test 1", "Mock Test 2"
  serial_number  SMALLINT  NOT NULL,         -- 1, 2, 3 ... (auto or admin-set)
  duration_seconds INT     NOT NULL DEFAULT 7200,  -- 120 min default
  scoring_profile_id BIGINT NOT NULL REFERENCES quiz_scoring_profiles(id),
  status         TEXT      NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published', 'archived')),
  published_at   TIMESTAMPTZ,
  created_by     UUID      REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exam_id, serial_number)
);
```

#### Add `mock_test_id` to `questions`

```sql
ALTER TABLE questions
  ADD COLUMN mock_test_id BIGINT REFERENCES mock_tests(id);

-- Index for fast lookup
CREATE INDEX idx_questions_mock_test ON questions(mock_test_id)
  WHERE mock_test_id IS NOT NULL;
```

Questions with `mock_test_id` set are **excluded from all random pool queries** automatically by adding `AND mock_test_id IS NULL` to general/rapid-fire/topicwise selects.

#### Add `mock_test_attempts` table

```sql
CREATE TABLE mock_test_attempts (
  id              BIGSERIAL PRIMARY KEY,
  mock_test_id    BIGINT    NOT NULL REFERENCES mock_tests(id),
  user_id         UUID      NOT NULL REFERENCES auth.users(id),
  session_id      BIGINT    NOT NULL REFERENCES quiz_sessions(id),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  score           NUMERIC(6,2),
  correct_count   SMALLINT,
  wrong_count     SMALLINT,
  rank            INT,                    -- populated after all submissions
  UNIQUE (mock_test_id, user_id)          -- one attempt per mock per user
);

ALTER TABLE mock_test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mock attempts"
  ON mock_test_attempts FOR ALL USING (user_id = auth.uid());
```

The `UNIQUE (mock_test_id, user_id)` constraint **prevents a second attempt at the DB level.**

### 2.3 Admin flow for creating a Mock Test

```
1. Go to /admin/mock-tests → "New Mock Test"
2. Fill: Exam, Title (auto-suggests "Mock Test N"), Duration, Scoring Profile
3. Status = draft  → save
4. Upload questions CSV with mock_test_id column (see Section 5.2)
5. After upload, system shows: "100/100 questions loaded ✓"  (warns if ≠ 100)
6. Admin clicks "Publish" → status = published, published_at = now()
7. System triggers notification to all students of that exam
```

### 2.4 Student flow

- `/mock-test` page: shows a list of all **published** mock tests for the active exam.
- Each card shows: title, question count, duration, marks, student's own past score (if attempted).
- If not attempted: **"Start"** button.
- If attempted: **"View Result"** button → shows the full review (their answers vs correct answers).
- No re-attempt. The UNIQUE constraint + `mock_test_attempts` lookup enforces this on both frontend and backend.

### 2.5 Notification on publish

When admin sets `status = 'published'`:

```sql
-- Trigger or application code inserts into a notifications queue:
INSERT INTO notifications (exam_id, title, body, type, reference_id)
VALUES (
  $exam_id,
  'New Mock Test Available!',
  'Mock Test ' || $serial_number || ' for ' || $exam_name || ' is now live. Attempt now!',
  'mock_test',
  $mock_test_id
);
```

---

## 3. Quiz (50 Qs) — Scheduled Live at 9 PM, Catchup Allowed

### 3.1 How it works

- Admin schedules a **50-question quiz** for a specific date at 9 PM.
- At 9 PM, the quiz goes **live** — students attempting it then get a countdown and compete together.
- Students who **miss** the 9 PM window can still attempt it **later in catchup mode** (no timer pressure, not on live leaderboard).
- Each quiz has a cutoff — e.g., available for 7 days after going live, then archived.

### 3.2 Schema — update `quizzes` table

Add these columns to the existing `quizzes` table (from `schema-overhaul.md`):

```sql
ALTER TABLE quizzes
  ADD COLUMN live_at          TIMESTAMPTZ,          -- scheduled 9 PM time
  ADD COLUMN catchup_ends_at  TIMESTAMPTZ,          -- e.g. live_at + 7 days
  ADD COLUMN live_status      TEXT DEFAULT 'scheduled'
             CHECK (live_status IN ('scheduled','live','catchup','closed'));
```

**State transitions:**

```
scheduled → live        (at live_at, via pg_cron or admin action)
live      → catchup     (after 1 hour, or next morning)
catchup   → closed      (at catchup_ends_at)
```

### 3.3 Live vs Catchup behaviour

| | Live (9 PM window) | Catchup |
|--|--|--|
| Timer | Full global countdown | Full global countdown |
| Leaderboard | Real-time during quiz | Not on live leaderboard |
| Shown on leaderboard? | Yes | Separate "Catchup" label |
| Score saved? | Yes | Yes |
| Can see answers during? | No | No |
| Result visible after submit? | Yes | Yes |

### 3.4 Questions for the daily quiz

Questions come from the **general pool** (Pool A) — topic/subject scoped as admin sets when creating the quiz. They are pre-assigned into `quiz_questions` when the quiz is created, not randomly drawn at start time.

This ensures every student — live or catchup — gets the **same 50 questions**.

### 3.5 Admin scheduling flow

```
1. /admin/quizzes → "New Quiz"
2. Fill: Exam, Subject (optional), Topic (optional), Title, Date
3. System sets live_at = selected_date at 21:00 IST
4. System sets catchup_ends_at = live_at + 7 days
5. Admin selects 50 questions manually OR clicks "Auto-select 50"
   (Auto-select picks from general pool filtered by subject/topic)
6. Save → status = scheduled
7. At 9 PM → pg_cron updates live_status = 'live'
8. After 60 min → live_status = 'catchup'
9. After catchup_ends_at → live_status = 'closed'
```

### 3.6 Student flow

- `/quiz` or `/daily-quiz` page lists upcoming and recent quizzes.
- Card shows: title, subject, date, live/catchup/closed badge, student's score if attempted.
- Live: "Join Now" → timer starts immediately.
- Catchup: "Attempt" → same questions, same timer, no leaderboard pressure.
- Closed: "View Result" (if attempted) or "Missed" (if not).

---

## 4. Rapid Fire & PYQ — Always Available, Random from Pool

These two modes need **no admin scheduling**. They always serve from their respective pools.

### 4.1 Rapid Fire

- Questions drawn **randomly** from Pool A (general pool, `mock_test_id IS NULL`, `is_pyq = false`).
- Admin just keeps uploading new questions to the general pool — rapid fire automatically gets richer.
- Count: 10–20 Qs depending on tier (set in the quizzes row or quiz config).
- Per-question timer enforced.

### 4.2 PYQ

- Questions drawn from Pool B (`is_pyq = true`).
- Filtered by `pyq_year` if student selects a year, or all years mixed.
- Admin uploads PYQ questions at any time; they are immediately available.
- Duplicate detection via `content_hash` prevents re-adding same question across years.

---

## 5. CSV Formats — One Per Upload Category

There are **4 CSV formats** in the admin upload panel. Each maps to a different pool/mode.

---

### 5.1 General Pool CSV
*(for Rapid Fire, Topic-wise, Subject-wise practice)*

**Used for:** Pool A — questions available to rapid fire, topic-wise quizzes, daily quizzes.

**Required columns:**

| Column | Format | Example |
|--------|--------|---------|
| `exam_code` | Text | `JENPAS_UG_P1` |
| `subject` | Text (must match subjects table) | `Anatomy` |
| `topic` | Text (auto-creates if new) | `Bones of Upper Limb` |
| `question` | Text | `Which bone is the longest in the human body?` |
| `option_a` | Text | `Femur` |
| `option_b` | Text | `Humerus` |
| `option_c` | Text | `Tibia` |
| `option_d` | Text | `Radius` |
| `correct_option` | `a` / `b` / `c` / `d` | `a` |
| `difficulty` | `easy` / `medium` / `hard` | `easy` |

**Optional columns:**

| Column | Format | Example |
|--------|--------|---------|
| `explanation` | Text | `The femur (thigh bone) is the longest…` |
| `tag` | Text | `high_yield` |

**Sample rows:**
```csv
exam_code,subject,topic,question,option_a,option_b,option_c,option_d,correct_option,difficulty,explanation
JENPAS_UG_P1,Anatomy,Bones of Upper Limb,Which bone is the longest in the human body?,Femur,Humerus,Tibia,Radius,a,easy,The femur is the longest and strongest bone.
JENPAS_UG_P1,Physiology,Blood,Normal pH of blood is?,7.35-7.45,7.0-7.2,7.5-7.6,6.8-7.0,a,easy,Normal arterial blood pH range is 7.35 to 7.45.
```

---

### 5.2 Mock Test CSV
*(for a specific named mock test)*

**Used for:** Pool C — questions locked to one mock test.

**Required columns:**

| Column | Format | Example |
|--------|--------|---------|
| `mock_test_id` | Number (from mock_tests table) | `3` |
| `order_index` | Number 1–100 | `1` |
| `subject` | Text | `Anatomy` |
| `topic` | Text | `Bones of Upper Limb` |
| `question` | Text | `Question text here` |
| `option_a` | Text | `Option A` |
| `option_b` | Text | `Option B` |
| `option_c` | Text | `Option C` |
| `option_d` | Text | `Option D` |
| `correct_option` | `a`/`b`/`c`/`d` | `b` |
| `difficulty` | `easy`/`medium`/`hard` | `medium` |

**Optional columns:** `explanation`, `tag`

**Rules:**
- Exactly 100 rows expected. Upload warns if count ≠ 100 but does not block.
- `order_index` determines the question order every student sees.
- `mock_test_id` must exist in the `mock_tests` table before upload.
- Admin creates the mock test entry first (`/admin/mock-tests → New`), gets the ID, then uploads.

**Sample rows:**
```csv
mock_test_id,order_index,subject,topic,question,option_a,option_b,option_c,option_d,correct_option,difficulty,explanation
3,1,Anatomy,Bones of Upper Limb,The longest bone in the human body is?,Radius,Femur,Tibia,Fibula,b,easy,Femur is the longest bone.
3,2,Physiology,Blood,Haemoglobin carries oxygen via?,Plasma,RBC,WBC,Platelets,b,easy,Haemoglobin is present in red blood cells.
```

---

### 5.3 PYQ CSV
*(Previous Year Questions)*

**Used for:** Pool B — PYQ section.

**Required columns:**

| Column | Format | Example |
|--------|--------|---------|
| `exam_code` | Text | `JENPAS_UG_P1` |
| `pyq_year` | 4-digit year | `2022` |
| `pyq_exam_name` | Text | `JENPAS UG 2022` |
| `subject` | Text | `Microbiology` |
| `topic` | Text | `Bacteria` |
| `question` | Text | `Question text` |
| `option_a` | Text | `Option A` |
| `option_b` | Text | `Option B` |
| `option_c` | Text | `Option C` |
| `option_d` | Text | `Option D` |
| `correct_option` | `a`/`b`/`c`/`d` | `c` |
| `difficulty` | `easy`/`medium`/`hard` | `medium` |

**Optional columns:** `explanation`, `tag`

**Rules:**
- `is_pyq` is automatically set to `true` on all rows in this upload category.
- Duplicate detection still applies — same question text for same exam/year is skipped.

**Sample rows:**
```csv
exam_code,pyq_year,pyq_exam_name,subject,topic,question,option_a,option_b,option_c,option_d,correct_option,difficulty,explanation
JENPAS_UG_P1,2022,JENPAS UG 2022,Microbiology,Bacteria,Gram positive cocci in clusters is?,E. coli,Streptococcus,Staphylococcus,Klebsiella,c,medium,Staphylococcus appears as gram positive cocci in clusters.
JENPAS_UG_P1,2022,JENPAS UG 2022,Anatomy,Bones of Upper Limb,Anatomical snuff box is bounded by?,Flexor tendons,Extensor tendons,Both,Interosseous muscles,b,hard,The anatomical snuff box is bounded by extensor pollicis longus and brevis tendons.
```

---

### 5.4 Bulk General (Multi-subject, no topic enforcement)
*(Quick bulk dump — admin assigns topic later)*

This is the "emergency upload" format when admin has a large question set without clean topic labels.

**Required columns:** Same as General Pool CSV but `topic` is optional.

If `topic` is blank, `topic_id` is left null. Admin can batch-assign topics later from the question bank using the topic filter.

---

## 6. What Changes in the Admin Upload UI

### 6.1 Category selector — updated options

| Option | CSV Format | Pool |
|--------|-----------|------|
| General / Practice | 5.1 | Pool A |
| Mock Test | 5.2 | Pool C |
| PYQ | 5.3 | Pool B |
| Bulk (no topic) | 5.4 | Pool A |

Remove the old "Rapid Fire" upload category — rapid fire questions are just general pool questions. Admin does not upload "for rapid fire" specifically.

### 6.2 Mock test upload gate

For Mock Test uploads, show a **pre-flight check**:

```
Before upload:
  ✓ Mock Test ID exists?
  ✓ Mock Test status = 'draft'?  (block upload to published tests)
  ✓ Row count = 100?  (warn if not)
  ✓ order_index values 1–100, no gaps, no duplicates?

After upload:
  "100 questions uploaded for Mock Test 3 — Mock Test 1 (JENPAS UG)"
  [Preview Questions] [Publish Mock Test]
```

### 6.3 Duplicate report on upload

After any upload, show a summary row:

```
✓ 48 uploaded   ⚠ 2 duplicates skipped   ✗ 0 failed
```

Duplicates show the conflicting question text so admin can verify.

---

## 7. Updated Question Serving Rules (API changes)

### 7.1 General / Rapid Fire / Topic-wise query

Always add these filters:

```sql
WHERE archived = false
  AND mock_test_id IS NULL      -- exclude mock test questions
  AND is_pyq = false            -- exclude PYQs
  AND exam_id = $exam_id
```

### 7.2 Mock Test query

```sql
WHERE mock_test_id = $mock_test_id
  AND archived = false
ORDER BY order_index ASC        -- always ordered, never random
```

### 7.3 PYQ query

```sql
WHERE is_pyq = true
  AND exam_id = $exam_id
  AND ($pyq_year IS NULL OR pyq_year = $pyq_year)
  AND archived = false
ORDER BY pyq_year DESC, RANDOM()
```

---

## 8. Summary — What Each Mode Needs from Admin

| Mode | Admin action | Questions come from | Random? | One-time only? |
|------|-------------|--------------------|---------|-|
| **Mock Test** | Create mock test → upload 100 Qs → publish | Pool C (locked) | No — fixed order | Yes (one attempt) |
| **Daily Quiz** | Schedule quiz → auto/manual pick 50 Qs | Pool A (pre-assigned) | No — same for all | No (catchup allowed) |
| **Topic-wise** | Nothing extra needed | Pool A (live query) | Yes | No |
| **Rapid Fire** | Just keep adding general pool Qs | Pool A (live query) | Yes | No |
| **PYQ** | Upload PYQ CSVs any time | Pool B (live query) | By year then random | No |

---

## 9. Migration Additions (append to schema-overhaul.md checklist)

- [ ] 18. Create `mock_tests` table
- [ ] 19. Add `mock_test_id` column to `questions`
- [ ] 20. Create `mock_test_attempts` table + UNIQUE constraint + RLS
- [ ] 21. Add `live_at`, `catchup_ends_at`, `live_status` to `quizzes`
- [ ] 22. Update all general/rapid-fire/topicwise queries to add `mock_test_id IS NULL AND is_pyq = false`
- [ ] 23. Update mock test query to use `ORDER BY order_index ASC`
- [ ] 24. Add pg_cron job: every minute check quizzes where `live_at <= now()` and `live_status = 'scheduled'` → set `live_status = 'live'`; where `live_at + interval '60 min' <= now()` → set `live_status = 'catchup'`; where `catchup_ends_at <= now()` → set `live_status = 'closed'`
- [ ] 25. Update admin upload UI: replace 5 old categories with 4 new ones (General, Mock Test, PYQ, Bulk)
- [ ] 26. Add mock test publish → notification trigger
- [ ] 27. Add `/admin/mock-tests` page (create, upload questions, publish)
- [ ] 28. Update `/mock-test` student page: list of published mock tests with attempt status
