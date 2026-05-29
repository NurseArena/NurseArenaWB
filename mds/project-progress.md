# Sahara Academy — Project Progress

> All changes implemented, from initial schema to the Daily Quiz Pool & Queue System.

---

## Phase 1: Schema & Question System Overhaul

### Database (`supabase-schema.sql`)

**New Tables:**
- **`topics`** — Normalised topic taxonomy with `subject_id` + `name` unique constraint (replaces free-text `topic`)
- **`quiz_scoring_profiles`** — Decoupled marking rules with seed rows: `standard` (+1/-0.25), `no_negative` (+1/0), `rapid_fire` (+1/-0.25), `pyq_review` (+1/0)
- **`quiz_sessions`** — Server-side record of every user quiz attempt with `status` (in_progress/submitted/abandoned), RLS enforcing user ownership
- **`session_answers`** — Per-question answer record tied to a session, with marks awarded, time tracking, and flagging
- **`mock_tests`** — Named mock tests with `serial_number`, `scoring_profile_id`, `status` (draft/published/archived)
- **`mock_test_attempts`** — One attempt per mock per user via `UNIQUE(mock_test_id, user_id)`

**Modified Tables:**
- **`questions`** — Added columns: `topic_id` (FK → topics), `content_hash` (auto-generated MD5), `pyq_exam_name`, `mock_test_id`; unique index on `(exam_id, content_hash)` for deduplication
- **`quizzes`** — Added: `question_count`, `per_question_seconds`, `scoring_profile_id`, `subject_id`, `topic_id`, `pyq_year`, `created_by`, `live_at`, `catchup_ends_at`, `live_status`; type now includes `'quiz'` and `'topicwise'`

**RLS Policies:** Added for all new tables (user-scoped read/write for sessions & answers, admin-scoped for mock tests, read-only for scoring profiles)

### New Files

| File | Purpose |
|------|---------|
| `src/lib/scoring.ts` | `ScoringProfile` interface, `calculateMarks(isCorrect, profile)`, `calculateSessionScore()` |
| `src/app/api/quiz/sessions/route.ts` | `GET` — list past sessions with exam/type/limit/offset filters |
| `src/app/api/quiz/sessions/[sessionId]/route.ts` | `GET` — full session detail with all answers and question content |
| `src/app/admin/topics/page.tsx` | Topic CRUD + merge UI |
| `src/app/admin/mock-tests/page.tsx` | Create, list, publish/archive mock tests |

### Updated Files

| File | Changes |
|------|---------|
| `src/types/quiz.ts` | +`'quiz'`, `'topicwise'` to QuizType; new fields on Quiz; new interfaces: `ScoringProfile`, `QuizSessionRecord`, `SessionAnswerRecord`, `MockTest`, `MockTestAttempt` |
| `src/store/quizStore.ts` | +`questionStartTime`, `perQuestionSeconds`, `setQuestionStartTime`, `setPerQuestionSeconds` |
| `src/services/admin.ts` | `bulkUploadQuestions` handles duplicates (code `23505`) with upload/skip/failed report; `fetchDuplicateQuestions()` helper |
| `src/app/api/quiz/start/route.ts` | Pool-based selection (mock→pre-assigned, pyq→PYQ pool, general→filtered); creates `quiz_sessions` on start |
| `src/app/api/quiz/submit/route.ts` | Writes to both `attempts` (leaderboard) and `session_answers` (rich); uses `marksAwarded` from scoring profile |
| `src/hooks/useQuiz.ts` | Loads scoring profile; per-question timer with auto-advance on expiry; session lifecycle management; pool-aware question selection |
| `src/app/admin/quizzes/page.tsx` | Subject/topic dropdowns, scoring profile selector, per-question timer, PYQ year, live scheduling |
| `src/app/admin/questions/bank/page.tsx` | Duplicates filter showing grouped `content_hash` counts |
| `src/app/admin/page.tsx` | Added Topics and Mock Tests nav links |

---

## Phase 2: Quiz Modes & CSV Guide

### Database

- **`mock_tests`** table created (covered in Phase 1)
- **`mock_test_attempts`** table created (covered in Phase 1)
- Questions now have `mock_test_id` — mock test questions excluded from general pool

### CSV Upload Formats (4 categories)

| Category | Pool | Key Columns |
|----------|------|-------------|
| General / Practice | Pool A | `exam_code`, `subject`, `topic`, `question`, `option_a-d`, `correct_option` |
| Mock Test | Pool C | `mock_test_id`, `order_index` (1-100), `subject`, `topic`, question + options |
| PYQ | Pool B | `exam_code`, `pyq_year`, `pyq_exam_name`, `subject`, `topic`, question + options |
| Bulk (no topic) | Pool A | Same as General but `topic` optional |

### Question Serving Rules

- General/Rapid/Topic-wise: `WHERE archived=false AND mock_test_id IS NULL AND is_pyq=false`
- Mock Test: `WHERE mock_test_id=$id ORDER BY order_index ASC`
- PYQ: `WHERE is_pyq=true AND exam_id=$id ORDER BY pyq_year DESC, RANDOM()`

### Admin UI Updates

- Upload category selector: 4 options (General, Mock Test, PYQ, Bulk)
- Pre-flight check for mock test uploads (ID exists, status=draft, row count=100, order_index 1-100)
- Duplicate report on upload: "✓ 48 uploaded | ⚠ 2 duplicates skipped | ✗ 0 failed"
- `GET /api/quiz/sessions` and `GET /api/quiz/sessions/[sessionId]` for past attempt review

---

## Phase 3: Daily Quiz Pool & Queue System

### Database (`supabase-schema.sql`)

**New Column:**
- **`questions.quiz_pool_status`** — `TEXT NOT NULL DEFAULT 'available'` with check constraint (`'available'`, `'reserved'`, `'used'`). Tracks whether a general-pool question has been consumed by a daily quiz.

**New Index:**
- `idx_questions_pool` on `(exam_id, quiz_pool_status)` where `mock_test_id IS NULL AND is_pyq = false AND archived = false`

**Modified Constraint:**
- `quizzes.live_status` — added `'failed'` to CHECK (`'scheduled' | 'live' | 'catchup' | 'closed' | 'failed'`)

**New Table:**
- **`admin_notifications`** — `id`, `type`, `message`, `reference_id`, `acknowledged`, `created_at` with RLS for admin-only access

**New View:**
- **`quiz_pool_summary`** — Per-exam aggregation: `available_count`, `reserved_count`, `used_count`, `quizzes_possible` (floor(available / 50))

### Pool Lifecycle

| Action | Effect |
|--------|--------|
| Admin schedules quiz | Count available ≥ 50? Reserve 50 → `quiz_pool_status = 'reserved'`, insert into `quiz_questions` |
| Quiz goes live | No change — questions already reserved and assigned |
| Quiz closes | `quiz_pool_status = 'used'` — permanently consumed |
| Quiz cancelled | `quiz_pool_status = 'available'` — released back, `quiz_questions` deleted |
| Pool insufficient | Schedule blocked, quiz cannot go live → `live_status = 'failed'` |

### Updated Files

| File | Changes |
|------|---------|
| `src/hooks/useQuiz.ts` | Non-PYQ fallback queries for `quiz`, `topicwise`, `rapid_fire`, `daily` now filter by `quiz_pool_status = 'available'` |
| `src/app/api/quiz/start/route.ts` | Same pool filters applied server-side |
| `src/app/admin/quizzes/page.tsx` | Full rewrite: pool health indicator, inline available count, **Create button disabled when pool < 50**, quiz list with all status badges (scheduled/live/catchup/closed/failed), Cancel scheduled quiz (releases pool), Fix & Reschedule for failed quizzes |
| `src/app/admin/page.tsx` | Pool health cards per exam showing available/reserved/used counts with colour-coded status (green ≥ 150, yellow 50-149, red < 50) |

### Admin Warning System

- Dashboard pool cards show per-exam health with colour coding
- Quiz creation page shows: "Available pool: N questions. After this quiz: M remaining (X more possible)"
- Pool insufficient: red banner with "Cannot schedule — only N available (need 50)"
- Schedule button disabled when pool < 50 for quiz type
- Failed quiz shows "Fix & Reschedule" UI — set new `live_at` date

### pg_cron Safety Checks (to be deployed separately)

```sql
-- Every minute: flip scheduled→live only if 50 questions assigned
UPDATE quizzes SET live_status = 'live'
WHERE live_at <= now() AND live_status = 'scheduled'
  AND (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = quizzes.id) = 50;

-- If < 50, flip to failed + notify admin
UPDATE quizzes SET live_status = 'failed'
WHERE live_at <= now() AND live_status = 'scheduled'
  AND (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = quizzes.id) < 50;
```

### No Breaking Changes

- Existing `attempts` table untouched — leaderboard, XP, streaks, missions unaffected
- Existing `quiz_questions` junction extended, not replaced
- All existing API routes preserved; new routes are additive
- RLS on existing tables unchanged

---

## Migration Checklist (Complete)

- [x] 1. Create `topics` table
- [x] 2. Create `quiz_scoring_profiles` table + seed 4 rows
- [x] 3. `ALTER TABLE questions` — add `topic_id`, `content_hash`, `pyq_exam_name`
- [x] 4. `CREATE UNIQUE INDEX` on `questions(exam_id, content_hash)` where not archived
- [x] 5. `ALTER TABLE quizzes` — add all new columns
- [x] 6. Create `quiz_sessions` table + RLS
- [x] 7. Create `session_answers` table + RLS
- [x] 8. Create `src/lib/scoring.ts`
- [x] 9. Update `src/services/admin.ts` — `bulkUploadQuestions` with duplicate handling
- [x] 10. Update `/api/quiz/start` — server-side question selection + session creation
- [x] 11. Update `/api/quiz/submit` — write to both `session_answers` and `attempts`
- [x] 12. Add `GET /api/quiz/sessions` and `GET /api/quiz/sessions/[sessionId]`
- [x] 13. Update `useQuiz.ts` — load scoring profile, per-question timer support
- [x] 14. Update `quizStore` — add `perQuestionSeconds`, `questionStartTime`
- [x] 15. Add `/admin/topics` page
- [x] 16. Update admin quiz create form with new fields
- [x] 17. Add duplicates view in question bank
- [x] 18. Create `mock_tests` table
- [x] 19. Add `mock_test_id` column to `questions`
- [x] 20. Create `mock_test_attempts` table + UNIQUE constraint + RLS
- [x] 21. Add `live_at`, `catchup_ends_at`, `live_status` to `quizzes`
- [x] 22. Update all general/rapid-fire/topicwise queries to add `mock_test_id IS NULL AND is_pyq = false`
- [x] 23. Update mock test query to use `ORDER BY order_index ASC`
- [x] 24. Add pg_cron schema for live status transitions
- [x] 25. Update admin upload UI categories
- [x] 26. Add mock test publish → notification trigger
- [x] 27. Add `/admin/mock-tests` page
- [x] 29. Add `quiz_pool_status` column to `questions` with index
- [x] 30. Add `failed` to `quizzes.live_status` CHECK constraint
- [x] 31. Create `quiz_pool_summary` view
- [x] 32. Create `admin_notifications` table
- [x] 33. Update quiz scheduling — availability check + reserve 50
- [x] 34. Update quiz cancel — release reserved questions back to available
- [x] 35. Update pg_cron live-status job — add safety check + failed state
- [x] 36. Update pg_cron close job — mark questions as `used` on close
- [x] 37. Update pool queries for rapid-fire/topicwise — add `quiz_pool_status = 'available'`
- [x] 38. Add pool health cards to `/admin` dashboard
- [x] 39. Add inline pool count on `/admin/quizzes → New Quiz`
- [x] 40. Disable schedule button when pool < 50
- [x] 41. Add `failed` badge + "Fix & Reschedule" button on quiz list

---

## Key Architecture Decisions

1. **UUID primary keys** — All new tables use UUID (matching existing schema convention), not BIGSERIAL as shown in spec guides
2. **Scoring profiles decoupled** — No hardcoded +1/-0.25 in frontend. Profiles loaded from `quiz_scoring_profiles` table
3. **Pool reservation at schedule time** — Prevents race conditions where the same question could be picked for two quizzes scheduled on the same day
4. **Session as the stable anchor** — `quiz_sessions.id` is the primary reference for all user answers. The `attempts` table is maintained separately for leaderboard compatibility
5. **No breaking changes** — All new features are additive; existing data and routes untouched
