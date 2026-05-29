-- ============================================================
-- Sahara Academy — Initial Schema Migration
-- ============================================================

-- 1. EXAMS
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  description text,
  pattern_mcq_count int default 120,
  duration_seconds int default 7200,
  passing_score int default 40,
  xp_reward int default 100
);

-- 2. SUBJECTS
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  name text not null,
  icon text,
  mcq_count_in_exam int default 40
);

-- 3. PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  xp int default 10,
  level int default 1,
  streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  selected_exam_id uuid references exams(id),
  active_exam_id uuid references exams(id),
  is_admin boolean default false,
  created_at timestamptz default now(),
  last_exam_switch_at timestamptz,
  login_streak smallint default 0,
  last_login_date date,
  displayName text,
  email text,
  photoURL text,
  phone text,
  targetExams jsonb default '[]'::jsonb,
  jemasSubCourse text,
  currentStage text,
  institution text,
  district text,
  joinedAt timestamptz,
  totalMarksEarned numeric default 0,
  totalQuestionsAttempted int default 0,
  totalCorrect int default 0,
  totalWrong int default 0,
  totalSkipped int default 0,
  bestMockScore numeric default 0,
  rapidFireUnlockedTier int default 1,
  streakDays int default 0,
  lastLoginAt timestamptz,
  profileCompletePct int default 0
);

-- 4. TOPICS (normalised topic taxonomy)
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  exam_id uuid not null references exams(id) on delete cascade,
  name text not null,
  unique(subject_id, name)
);

-- 5. QUESTIONS
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  topic_id uuid references topics(id),
  topic text,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct text not null check (correct in ('A','B','C','D')),
  explanation text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  source text default 'generated',
  is_pyq boolean default false,
  pyq_year int,
  pyq_exam_name text,
  tag_id uuid,
  mock_test_id uuid,
  quiz_pool_status text not null default 'available'
    check (quiz_pool_status in ('available', 'reserved', 'used')),
  content_hash text generated always as (md5(lower(trim(question)))) stored,
  archived boolean default false,
  created_at timestamptz default now()
);

create unique index if not exists uq_questions_content_hash
  on questions (exam_id, content_hash)
  where archived = false;

create index if not exists idx_questions_mock_test
  on questions(mock_test_id)
  where mock_test_id is not null;

create index if not exists idx_questions_pool
  on questions (exam_id, quiz_pool_status)
  where mock_test_id is null and is_pyq = false and archived = false;

-- 5a. QUESTION TAGS
create table if not exists question_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_id uuid references exams(id) on delete cascade,
  unique(name, exam_id)
);

-- 6. ATTEMPTS
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id),
  selected_option text,
  is_correct boolean,
  time_taken_ms int,
  attempted_at timestamptz default now()
);

-- 7. QUIZ SCORING PROFILES (decoupled marking rules)
create table if not exists quiz_scoring_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  marks_correct numeric(4,2) not null default 1,
  marks_wrong numeric(4,2) not null default 0,
  marks_unattempted numeric(4,2) not null default 0,
  partial_credit boolean not null default false
);

-- 8. QUIZZES
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  type text check (type in ('mock','quiz','topicwise','rapid_fire','live','daily','pyq')),
  title text not null,
  subject_id uuid references subjects(id),
  topic_id uuid references topics(id),
  pyq_year smallint,
  question_count smallint not null,
  duration_seconds int default 7200,
  per_question_seconds int,
  scoring_profile_id uuid references quiz_scoring_profiles(id),
  is_active boolean default true,
  is_live boolean default false,
  start_time timestamptz,
  live_at timestamptz,
  catchup_ends_at timestamptz,
  live_status text default 'scheduled' check (live_status in ('scheduled','live','catchup','closed','failed')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- 9. QUIZ SESSIONS
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  user_id uuid not null references profiles(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  time_taken_ms int,
  total_questions smallint not null,
  attempted_count smallint default 0,
  correct_count smallint default 0,
  wrong_count smallint default 0,
  score numeric(6,2) default 0,
  max_score numeric(6,2) not null,
  status text default 'in_progress' check (status in ('in_progress','submitted','abandoned'))
);

create index if not exists idx_quiz_sessions_user on quiz_sessions(user_id, submitted_at desc);
create index if not exists idx_quiz_sessions_quiz on quiz_sessions(quiz_id);

-- 10. SESSION ANSWERS
create table if not exists session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quiz_sessions(id) on delete cascade,
  question_id uuid not null references questions(id),
  order_index smallint not null,
  selected_option char(1) check (selected_option in ('A','B','C','D')),
  is_correct boolean,
  marks_awarded numeric(4,2),
  time_taken_ms int,
  flagged boolean default false,
  answered_at timestamptz,
  unique (session_id, question_id)
);

create index if not exists idx_session_answers_session on session_answers(session_id);

-- 11. QUIZ QUESTIONS (junction)
create table if not exists quiz_questions (
  quiz_id uuid references quizzes(id) on delete cascade,
  question_id uuid references questions(id),
  order_index int,
  primary key (quiz_id, question_id)
);

-- 12. MOCK TESTS
create table if not exists mock_tests (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id),
  title text not null,
  serial_number smallint not null,
  duration_seconds int not null default 7200,
  scoring_profile_id uuid references quiz_scoring_profiles(id),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (exam_id, serial_number)
);

-- 13. MOCK TEST ATTEMPTS
create table if not exists mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references mock_tests(id),
  user_id uuid not null references profiles(id),
  session_id uuid not null references quiz_sessions(id),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(6,2),
  correct_count smallint,
  wrong_count smallint,
  rank int,
  unique (mock_test_id, user_id)
);

-- 14. LEADERBOARD
create table if not exists leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  exam_id uuid references exams(id),
  marksEarned numeric default 0,
  rank int,
  correct_count int default 0,
  total_latency_ms int default 0,
  period_type text check (period_type in ('daily','weekly','all_time')),
  period_start date,
  updated_at timestamptz default now()
);

-- 15. MISSIONS
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id),
  title text not null,
  description text,
  xp_reward int default 25,
  condition_type text,
  condition_value int,
  is_daily boolean default true
);

-- 16. USER MISSIONS
create table if not exists user_missions (
  user_id uuid references profiles(id) on delete cascade,
  mission_id uuid references missions(id) on delete cascade,
  progress int default 0,
  completed boolean default false,
  completed_at timestamptz,
  assigned_date date default current_date,
  primary key (user_id, mission_id, assigned_date)
);

-- 17. XP LEDGER
create table if not exists xp_transactions (
  id bigserial primary key,
  user_id uuid not null references profiles(id),
  delta int not null,
  reason varchar(64) not null,
  reference_id bigint,
  created_at timestamptz default now()
);

-- 18. XP LEVEL CONFIG
create table if not exists xp_levels (
  level smallint primary key,
  min_xp int not null,
  label varchar(64),
  unlocks jsonb
);

-- 19. SCHEDULED MOCK TEST EVENTS
create table if not exists mock_test_events (
  id bigserial primary key,
  exam_id uuid not null references exams(id),
  scheduled_at timestamptz not null,
  duration_min smallint not null,
  max_participants int,
  week_number smallint not null,
  year smallint not null,
  created_by uuid references profiles(id),
  unique (exam_id, week_number, year, scheduled_at)
);

-- 20. LIVE QUIZ EVENTS
create table if not exists live_quiz_events (
  id bigserial primary key,
  exam_id uuid not null references exams(id),
  question_set_id bigint,
  starts_at timestamptz not null,
  timezone varchar(64) not null,
  duration_min smallint not null default 60,
  status varchar(16) default 'scheduled',
  current_q_index smallint default 0
);

-- 21. LIVE QUIZ PER-USER RESULTS
create table if not exists quiz_results (
  id bigserial primary key,
  quiz_event_id bigint references live_quiz_events(id),
  user_id uuid references profiles(id),
  score int default 0,
  correct_count smallint default 0,
  total_latency_ms int default 0,
  joined_at_index smallint default 0,
  disconnection_flag boolean default false,
  unique (quiz_event_id, user_id)
);

-- 22. ANSWER SUBMISSIONS (LIVE QUIZ)
create table if not exists quiz_answers (
  id bigserial primary key,
  quiz_event_id bigint references live_quiz_events(id),
  user_id uuid references profiles(id),
  question_index smallint not null,
  selected_option char(1),
  is_correct boolean,
  latency_ms int,
  submitted_at timestamptz default now(),
  unique (user_id, quiz_event_id, question_index)
);

-- 23. ADMIN NOTIFICATIONS
create table if not exists admin_notifications (
  id bigserial primary key,
  type text not null,
  message text not null,
  reference_id text,
  acknowledged boolean default false,
  created_at timestamptz default now()
);

-- 24. QUIZ POOL SUMMARY VIEW
create or replace view quiz_pool_summary as
select
  e.id   as exam_id,
  e.name as exam_name,
  count(*) filter (where q.quiz_pool_status = 'available') as available_count,
  count(*) filter (where q.quiz_pool_status = 'reserved') as reserved_count,
  count(*) filter (where q.quiz_pool_status = 'used')     as used_count,
  floor(
    count(*) filter (where q.quiz_pool_status = 'available') / 50.0
  )::int as quizzes_possible
from exams e
left join questions q
  on q.exam_id = e.id
  and q.mock_test_id is null
  and q.is_pyq = false
  and q.archived = false
group by e.id, e.name;

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table leaderboard enable row level security;
alter table xp_transactions enable row level security;
alter table mock_test_events enable row level security;
alter table live_quiz_events enable row level security;
alter table quiz_results enable row level security;
alter table quiz_answers enable row level security;
alter table quiz_sessions enable row level security;
alter table session_answers enable row level security;
alter table quiz_scoring_profiles enable row level security;
alter table mock_tests enable row level security;
alter table mock_test_attempts enable row level security;
alter table admin_notifications enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Authenticated users can read questions"
  on questions for select to authenticated using (true);

create policy "Users can insert own attempts"
  on attempts for insert with check (auth.uid() = user_id);

create policy "Users can view own attempts"
  on attempts for select using (auth.uid() = user_id);

create policy "Authenticated users can read leaderboard"
  on leaderboard for select to authenticated using (true);

create policy "Users can view own xp transactions"
  on xp_transactions for select using (auth.uid() = user_id);

create policy "Users can view mock test events"
  on mock_test_events for select to authenticated using (true);

create policy "Users can view live quiz events"
  on live_quiz_events for select to authenticated using (true);

create policy "Users can view own quiz results"
  on quiz_results for select using (auth.uid() = user_id);

create policy "Users can insert own quiz answers"
  on quiz_answers for insert with check (auth.uid() = user_id);

create policy "Users can view own quiz answers"
  on quiz_answers for select using (auth.uid() = user_id);

create policy "Users manage own sessions"
  on quiz_sessions for all using (auth.uid() = user_id);

create policy "Users manage own session answers"
  on session_answers for all
  using (exists (
    select 1 from quiz_sessions qs
    where qs.id = session_id and qs.user_id = auth.uid()
  ));

create policy "Anyone can read scoring profiles"
  on quiz_scoring_profiles for select to authenticated using (true);

create policy "Authenticated users can read mock tests"
  on mock_tests for select to authenticated using (true);

create policy "Admin can manage mock tests"
  on mock_tests for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users manage own mock attempts"
  on mock_test_attempts for all using (auth.uid() = user_id);

create policy "Admins can manage notifications"
  on admin_notifications for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can read notifications"
  on admin_notifications for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- RLS for reference tables
alter table exams enable row level security;
alter table subjects enable row level security;
alter table topics enable row level security;
alter table question_tags enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table missions enable row level security;
alter table user_missions enable row level security;

create policy "Authenticated users can read exams"
  on exams for select to authenticated using (true);

create policy "Authenticated users can read subjects"
  on subjects for select to authenticated using (true);

create policy "Authenticated users can read topics"
  on topics for select to authenticated using (true);

create policy "Authenticated users can read question tags"
  on question_tags for select to authenticated using (true);

create policy "Admins can manage question tags"
  on question_tags for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can read quizzes"
  on quizzes for select to authenticated using (true);

create policy "Admins can manage quizzes"
  on quizzes for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can read quiz questions"
  on quiz_questions for select to authenticated using (true);

create policy "Admins can manage quiz questions"
  on quiz_questions for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users manage own missions"
  on user_missions for all using (auth.uid() = user_id);

create policy "Authenticated users can read missions"
  on missions for select to authenticated using (true);

create policy "Admins can manage missions"
  on missions for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can insert own xp transactions"
  on xp_transactions for insert with check (auth.uid() = user_id);

create policy "Users can insert own quiz results"
  on quiz_results for insert with check (auth.uid() = user_id);

create policy "Users can update own quiz results"
  on quiz_results for update using (auth.uid() = user_id);

create policy "Admins can manage live quiz events"
  on live_quiz_events for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage mock tests"
  on mock_tests for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage mock test events"
  on mock_test_events for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- SEED DATA
-- ============================================================

insert into quiz_scoring_profiles (name, marks_correct, marks_wrong, marks_unattempted) values
  ('standard',    1.00, 0.25, 0),
  ('no_negative', 1.00, 0.00, 0),
  ('rapid_fire',  1.00, 0.25, 0),
  ('pyq_review',  1.00, 0.00, 0)
on conflict (name) do nothing;

create materialized view if not exists leaderboard_daily as
select
  a.user_id,
  q.exam_id,
  sum(case when a.is_correct then 10 else 0 end) as score,
  count(case when a.is_correct then 1 end) as correct_count,
  sum(a.time_taken_ms) as total_latency_ms,
  rank() over (partition by q.exam_id order by sum(case when a.is_correct then 10 else 0 end) desc, count(case when a.is_correct then 1 end) desc, sum(a.time_taken_ms) asc) as rank
from attempts a
join questions q on a.question_id = q.id
where a.attempted_at >= current_date
group by a.user_id, q.exam_id;

insert into exams (name, code, description, pattern_mcq_count, duration_seconds)
values
  ('JENPAS Undergraduate', 'JENPAS-UG', 'West Bengal undergraduate nursing/paramedical entrance', 120, 7200),
  ('JENPAS Postgraduate', 'JENPAS-PG', 'West Bengal postgraduate nursing entrance', 100, 7200)
on conflict (code) do nothing;

-- Insert subjects for JENPAS-UG
with ug as (select id from exams where code = 'JENPAS-UG')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select ug.id, name, icon, mcq_count from ug, (values
  ('Physics', 'physics', 40),
  ('Chemistry', 'chemistry', 40),
  ('Biology', 'biology', 40)
) as s(name, icon, mcq_count)
where not exists (select 1 from subjects where exam_id = (select id from exams where code = 'JENPAS-UG') and name = s.name);

-- Insert subjects for JENPAS-PG
with pg as (select id from exams where code = 'JENPAS-PG')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select pg.id, name, icon, mcq_count from pg, (values
  ('Anatomy', 'anatomy', 15),
  ('Physiology', 'physiology', 15),
  ('Microbiology', 'microbiology', 14),
  ('Biochemistry', 'biochemistry', 14),
  ('Pathology', 'pathology', 14),
  ('Pharmacology', 'pharmacology', 14),
  ('Nursing Foundation', 'nursing', 14)
) as s(name, icon, mcq_count)
where not exists (select 1 from subjects where exam_id = (select id from exams where code = 'JENPAS-PG') and name = s.name);

-- Insert JEPBN exam
insert into exams (name, code, description, pattern_mcq_count, duration_seconds)
values ('JEPBN 2026', 'JEPBN', 'Joint Entrance Examination for Post-Basic B.Sc. Nursing', 100, 5400)
on conflict (code) do nothing;

-- Insert subjects for JEPBN
with jepbn as (select id from exams where code = 'JEPBN')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select jepbn.id, name, icon, mcq_count from jepbn, (values
  ('Anatomy', 'anatomy', 5),
  ('Physiology', 'physiology', 5),
  ('Microbiology', 'microbiology', 5),
  ('Pathology', 'pathology', 5),
  ('Pharmacology', 'pharmacology', 5),
  ('Nutrition', 'nutrition', 5),
  ('Psychology', 'psychology', 5),
  ('Sociology', 'sociology', 5),
  ('Fundamentals of Nursing', 'nursing', 10),
  ('Medical-Surgical Nursing', 'medical-surgical', 10),
  ('Pediatric Nursing', 'pediatric', 10),
  ('Psychiatric Nursing', 'psychiatric', 10),
  ('Obstetrical Nursing', 'obstetrical', 10),
  ('Community Health Nursing', 'community-health', 10)
) as s(name, icon, mcq_count)
where not exists (select 1 from subjects where exam_id = (select id from exams where code = 'JEPBN') and name = s.name);

-- Insert topics for JEPBN subjects
with jepbn_exam as (select id from exams where code = 'JEPBN')
insert into topics (subject_id, exam_id, name)
select s.id, j.id, t.name
from jepbn_exam j
cross join (values
  ('Anatomy', 'Skeletal & Muscular Architecture'),
  ('Anatomy', 'Cardio-Respiratory & Visceral Systems'),
  ('Anatomy', 'Neuro-Urinary & Endocrine Layout'),
  ('Physiology', 'Hematology & Cardiovascular Dynamics'),
  ('Physiology', 'Respiratory, Digestive & Renal Mechanics'),
  ('Physiology', 'Endocrine Signalling & Reproduction'),
  ('Microbiology', 'Bacteriology & Virological Strains'),
  ('Microbiology', 'Sterilization & Infection Control'),
  ('Microbiology', 'Immunology & Diagnostic Serology'),
  ('Pathology', 'Cellular Adaptation & Tissue Injury'),
  ('Pathology', 'Inflammation & Hemodynamic Disorders'),
  ('Pathology', 'Neoplasia & Systemic Healing'),
  ('Pharmacology', 'Pharmacokinetics & Pharmacodynamics'),
  ('Pharmacology', 'Systemic Therapeutics'),
  ('Pharmacology', 'Chemotherapy & Antibiotic Stewardship'),
  ('Nutrition', 'Macronutrient & Micronutrient Energetics'),
  ('Nutrition', 'Therapeutic Dietetics & Deficiencies'),
  ('Psychology', 'Cognitive Processes & Behavior'),
  ('Psychology', 'Personality & Defense Mechanisms'),
  ('Sociology', 'Social Groups & Cultural Frameworks'),
  ('Sociology', 'Social Pathology & Healthcare Interfaces'),
  ('Fundamentals of Nursing', 'Professional Paradigms & Communication'),
  ('Fundamentals of Nursing', 'Clinical Intervention & Vital Metrics'),
  ('Medical-Surgical Nursing', 'Perioperative Care & Critical Fluid Management'),
  ('Medical-Surgical Nursing', 'Cardiovascular, Respiratory & Gastrointestinal Pathologies'),
  ('Medical-Surgical Nursing', 'Renal, Endocrine & Neurological Alterations'),
  ('Pediatric Nursing', 'Growth & Developmental Milestones'),
  ('Pediatric Nursing', 'Neonatal Care & Congenital Malformations'),
  ('Pediatric Nursing', 'Childhood Illnesses & Integrated Protocols'),
  ('Psychiatric Nursing', 'Psychopathology & Diagnostic Evaluation'),
  ('Psychiatric Nursing', 'Major Psychiatric Conditions'),
  ('Psychiatric Nursing', 'Psychiatric Therapeutics'),
  ('Obstetrical Nursing', 'Antenatal Assessment & Fetal Surveillance'),
  ('Obstetrical Nursing', 'Intrapartum Mechanics & Complications'),
  ('Obstetrical Nursing', 'Postnatal Care & Neonatal Stabilization'),
  ('Community Health Nursing', 'Epidemiology & Demographic Controls'),
  ('Community Health Nursing', 'National Health Schemes & Policy Structures'),
  ('Community Health Nursing', 'Family Planning & Environmental Sanitation')
) as t(subject_name, name)
inner join subjects s on s.exam_id = j.id and s.name = t.subject_name
where not exists (
  select 1 from topics
  where subject_id = s.id and exam_id = j.id and name = t.name
);

-- Seed XP levels
insert into xp_levels (level, min_xp, label, unlocks) values
  (1, 0, 'Beginner', '["daily_practice_5"]'),
  (2, 50, 'Explorer', '["daily_practice_10", "topic_filters"]'),
  (3, 150, 'Challenger', '["full_chapter_tests", "performance_analytics"]'),
  (4, 350, 'Contender', '["previous_year_papers"]'),
  (5, 700, 'Expert', '["all_content", "priority_mock_booking"]')
on conflict (level) do nothing;
