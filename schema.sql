-- ============================================================
-- NurseArena / Sahara Academy — Consolidated Schema v3
-- Single source of truth. Run once in Supabase SQL Editor.
-- Drop and recreate if migrating from an older version.
-- ============================================================

-- ============================================================
-- CORE REFERENCE TABLES
-- ============================================================

create table if not exists exams (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  code                text        unique not null,
  description         text,
  pattern_mcq_count   int         default 120,
  duration_seconds    int         default 7200,
  passing_score       int         default 40,
  xp_reward           int         default 100
);

create table if not exists subjects (
  id                  uuid        primary key default gen_random_uuid(),
  exam_id             uuid        references exams(id) on delete cascade,
  name                text        not null,
  icon                text,
  mcq_count_in_exam   int         default 40
);

create table if not exists topics (
  id                  uuid        primary key default gen_random_uuid(),
  subject_id          uuid        not null references subjects(id) on delete cascade,
  exam_id             uuid        not null references exams(id) on delete cascade,
  name                text        not null,
  unique(subject_id, name)
);

create table if not exists question_tags (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null,
  exam_id             uuid        references exams(id) on delete cascade,
  unique(name, exam_id)
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table if not exists profiles (
  -- identity
  id                        uuid        primary key references auth.users(id) on delete cascade,
  email                     text,
  displayName               text,
  photoURL                  text,
  phone                     text,
  avatar_url                text,

  -- onboarding / exam selection
  targetExams               jsonb       default '[]'::jsonb,   -- e.g. ["JENPAS-UG","JEPBN"]
  selected_exam_id          uuid        references exams(id),
  active_exam_id            uuid        references exams(id),
  last_exam_switch_at       timestamptz,
  jemasSubCourse            text,
  currentStage              text,
  institution               text,
  district                  text,

  -- gamification
  xp                        int         default 10,
  level                     int         default 1,
  streak                    int         default 0,
  longest_streak            int         default 0,
  streakDays                int         default 0,
  login_streak              smallint    default 0,
  last_login_date           date,
  last_active_date          date,
  lastLoginAt               timestamptz,
  joinedAt                  timestamptz,

  -- quiz stats (denormalised for leaderboard speed)
  totalMarksEarned          numeric     default 0,
  totalQuestionsAttempted   int         default 0,
  totalCorrect              int         default 0,
  totalWrong                int         default 0,
  totalSkipped              int         default 0,
  bestMockScore             numeric     default 0,
  rapidFireUnlockedTier     int         default 1,
  profileCompletePct        int         default 0,

  -- admin
  is_admin                  boolean     default false,
  created_at                timestamptz default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, displayName)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- QUESTIONS
-- ============================================================

create table if not exists questions (
  id                  uuid        primary key default gen_random_uuid(),
  exam_id             uuid        references exams(id) on delete cascade,
  subject_id          uuid        references subjects(id) on delete cascade,
  topic_id            uuid        references topics(id),
  tag_id              uuid        references question_tags(id),
  topic               text,
  question            text        not null,
  option_a            text        not null,
  option_b            text        not null,
  option_c            text        not null,
  option_d            text        not null,
  correct             text        not null check (correct in ('A','B','C','D')),
  explanation         text,
  difficulty          text        check (difficulty in ('easy','medium','hard')),
  source              text        default 'generated',
  is_pyq              boolean     default false,
  pyq_year            int,
  pyq_exam_name       text,
  mock_test_id        uuid,
  quiz_pool_status    text        not null default 'available'
                                  check (quiz_pool_status in ('available','reserved','used')),
  content_hash        text        generated always as (md5(lower(trim(question)))) stored,
  archived            boolean     default false,
  created_at          timestamptz default now()
);

create unique index if not exists uq_questions_content_hash
  on questions (exam_id, content_hash) where archived = false;

create index if not exists idx_questions_pool
  on questions (exam_id, quiz_pool_status)
  where mock_test_id is null and is_pyq = false and archived = false;

create index if not exists idx_questions_mock_test
  on questions (mock_test_id) where mock_test_id is not null;

-- ============================================================
-- SCORING PROFILES
-- ============================================================

create table if not exists quiz_scoring_profiles (
  id                  uuid        primary key default gen_random_uuid(),
  name                text        not null unique,
  marks_correct       numeric(4,2) not null default 1,
  marks_wrong         numeric(4,2) not null default 0,
  marks_unattempted   numeric(4,2) not null default 0,
  partial_credit      boolean     not null default false
);

-- ============================================================
-- QUIZZES
-- ============================================================

create table if not exists quizzes (
  id                  uuid        primary key default gen_random_uuid(),
  exam_id             uuid        references exams(id),
  subject_id          uuid        references subjects(id),
  topic_id            uuid        references topics(id),
  scoring_profile_id  uuid        references quiz_scoring_profiles(id),
  created_by          uuid        references profiles(id),
  type                text        check (type in ('mock','quiz','topicwise','rapid_fire','live','daily','pyq')),
  title               text        not null,
  pyq_year            smallint,
  question_count      smallint    not null,
  duration_seconds    int         default 7200,
  per_question_seconds int,
  is_active           boolean     default true,
  is_live             boolean     default false,
  start_time          timestamptz,
  live_at             timestamptz,
  catchup_ends_at     timestamptz,
  live_status         text        default 'scheduled'
                                  check (live_status in ('scheduled','live','catchup','closed','failed')),
  created_at          timestamptz default now()
);

create table if not exists quiz_questions (
  quiz_id             uuid        not null references quizzes(id) on delete cascade,
  question_id         uuid        not null references questions(id),
  order_index         int,
  primary key (quiz_id, question_id)
);

-- ============================================================
-- MOCK TESTS
-- ============================================================

create table if not exists mock_tests (
  id                  uuid        primary key default gen_random_uuid(),
  exam_id             uuid        not null references exams(id),
  scoring_profile_id  uuid        references quiz_scoring_profiles(id),
  created_by          uuid        references profiles(id),
  title               text        not null,
  serial_number       smallint    not null,
  duration_seconds    int         not null default 7200,
  status              text        not null default 'draft'
                                  check (status in ('draft','published','archived')),
  published_at        timestamptz,
  created_at          timestamptz default now(),
  unique (exam_id, serial_number)
);

-- ============================================================
-- QUIZ SESSIONS + ANSWERS (unified attempt tracking)
-- ============================================================

create table if not exists quiz_sessions (
  id                  uuid        primary key default gen_random_uuid(),
  quiz_id             uuid        not null references quizzes(id),
  user_id             uuid        not null references profiles(id),
  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  time_taken_ms       int,
  total_questions     smallint    not null,
  attempted_count     smallint    default 0,
  correct_count       smallint    default 0,
  wrong_count         smallint    default 0,
  score               numeric(6,2) default 0,
  max_score           numeric(6,2) not null,
  status              text        default 'in_progress'
                                  check (status in ('in_progress','submitted','abandoned'))
);

create index if not exists idx_quiz_sessions_user on quiz_sessions(user_id, submitted_at desc);
create index if not exists idx_quiz_sessions_quiz on quiz_sessions(quiz_id);

create table if not exists session_answers (
  id                  uuid        primary key default gen_random_uuid(),
  session_id          uuid        not null references quiz_sessions(id) on delete cascade,
  question_id         uuid        not null references questions(id),
  order_index         smallint    not null,
  selected_option     char(1)     check (selected_option in ('A','B','C','D')),
  is_correct          boolean,
  marks_awarded       numeric(4,2),
  time_taken_ms       int,
  flagged             boolean     default false,
  answered_at         timestamptz,
  unique (session_id, question_id)
);

create index if not exists idx_session_answers_session on session_answers(session_id);

-- ============================================================
-- MOCK TEST ATTEMPTS
-- ============================================================

create table if not exists mock_test_attempts (
  id                  uuid        primary key default gen_random_uuid(),
  mock_test_id        uuid        not null references mock_tests(id),
  user_id             uuid        not null references profiles(id),
  session_id          uuid        not null references quiz_sessions(id),
  started_at          timestamptz not null default now(),
  submitted_at        timestamptz,
  score               numeric(6,2),
  correct_count       smallint,
  wrong_count         smallint,
  rank                int,
  unique (mock_test_id, user_id)
);

-- ============================================================
-- PER-QUESTION ATTEMPTS (granular history)
-- ============================================================

create table if not exists attempts (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        references profiles(id) on delete cascade,
  question_id         uuid        references questions(id),
  selected_option     text,
  is_correct          boolean,
  time_taken_ms       int,
  attempted_at        timestamptz default now()
);

-- ============================================================
-- LIVE QUIZ EVENTS
-- ============================================================

create table if not exists live_quiz_events (
  id                  bigserial   primary key,
  exam_id             uuid        not null references exams(id),
  scoring_profile_id  uuid        references quiz_scoring_profiles(id),
  title               text,
  description         text,
  starts_at           timestamptz not null,
  timezone            varchar(64) not null,
  duration_min        smallint    not null default 60,
  status              varchar(16) default 'scheduled'
                                  check (status in ('scheduled','live','catchup','closed','failed','cancelled')),
  current_q_index     smallint    default 0
);

create table if not exists quiz_results (
  id                  bigserial   primary key,
  quiz_event_id       bigint      references live_quiz_events(id),
  user_id             uuid        references profiles(id),
  marks_earned        numeric     default 0,
  score               int         default 0,
  correct_count       smallint    default 0,
  total_latency_ms    int         default 0,
  joined_at_index     smallint    default 0,
  disconnection_flag  boolean     default false,
  unique (quiz_event_id, user_id)
);

create table if not exists quiz_answers (
  id                  bigserial   primary key,
  quiz_event_id       bigint      references live_quiz_events(id),
  user_id             uuid        references profiles(id),
  question_index      smallint    not null,
  selected_option     char(1),
  is_correct          boolean,
  latency_ms          int,
  submitted_at        timestamptz default now(),
  unique (user_id, quiz_event_id, question_index)
);

-- ============================================================
-- SCHEDULED MOCK TEST EVENTS
-- ============================================================

create table if not exists mock_test_events (
  id                  bigserial   primary key,
  exam_id             uuid        not null references exams(id),
  scoring_profile_id  uuid        references quiz_scoring_profiles(id),
  created_by          uuid        references profiles(id),
  title               text,
  description         text,
  scheduled_at        timestamptz not null,
  duration_min        smallint    not null,
  max_participants    int,
  status              text        default 'scheduled'
                                  check (status in ('scheduled','live','completed','cancelled')),
  week_number         smallint    not null,
  year                smallint    not null,
  unique (exam_id, week_number, year, scheduled_at)
);

-- ============================================================
-- LEADERBOARD
-- ============================================================

create table if not exists leaderboard (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        references profiles(id) on delete cascade,
  exam_id             uuid        references exams(id),
  marksEarned         numeric     default 0,
  rank                int,
  correct_count       int         default 0,
  total_latency_ms    int         default 0,
  period_type         text        check (period_type in ('daily','weekly','all_time')),
  period_start        date,
  updated_at          timestamptz default now()
);

create materialized view if not exists leaderboard_daily as
select
  a.user_id,
  q.exam_id,
  sum(case when a.is_correct then 10 else 0 end)  as score,
  count(case when a.is_correct then 1 end)         as correct_count,
  sum(a.time_taken_ms)                             as total_latency_ms,
  rank() over (
    partition by q.exam_id
    order by
      sum(case when a.is_correct then 10 else 0 end) desc,
      count(case when a.is_correct then 1 end) desc,
      sum(a.time_taken_ms) asc
  ) as rank
from attempts a
join questions q on a.question_id = q.id
where a.attempted_at >= current_date
group by a.user_id, q.exam_id;

-- ============================================================
-- MISSIONS
-- ============================================================

create table if not exists missions (
  id                  uuid        primary key default gen_random_uuid(),
  exam_id             uuid        references exams(id),
  title               text        not null,
  description         text,
  xp_reward           int         default 25,
  type                text,
  target              int,
  condition_type      text,
  condition_value     int,
  is_daily            boolean     default true,
  created_at          timestamptz default now()
);

create table if not exists user_missions (
  user_id             uuid        references profiles(id) on delete cascade,
  mission_id          uuid        references missions(id) on delete cascade,
  progress            int         default 0,
  completed           boolean     default false,
  completed_at        timestamptz,
  assigned_date       date        default current_date,
  primary key (user_id, mission_id, assigned_date)
);

-- ============================================================
-- XP
-- ============================================================

create table if not exists xp_transactions (
  id                  bigserial   primary key,
  user_id             uuid        not null references profiles(id),
  delta               int         not null,
  reason              varchar(64) not null,
  reference_id        bigint,
  created_at          timestamptz default now()
);

create table if not exists xp_levels (
  level               smallint    primary key,
  min_xp              int         not null,
  label               varchar(64),
  unlocks             jsonb
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists notifications (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  body                text        not null,
  type                text        not null check (type in ('mock_test','result','announcement')),
  targetExams         jsonb       default '[]'::jsonb,
  readBy              jsonb       default '[]'::jsonb,
  created_at          timestamptz default now()
);

create table if not exists admin_notifications (
  id                  bigserial   primary key,
  type                text        not null,
  message             text        not null,
  reference_id        text,
  acknowledged        boolean     default false,
  created_at          timestamptz default now()
);

-- ============================================================
-- VIEWS
-- ============================================================

create or replace view quiz_pool_summary as
select
  e.id                                                                      as exam_id,
  e.name                                                                    as exam_name,
  count(*) filter (where q.quiz_pool_status = 'available')                  as available_count,
  count(*) filter (where q.quiz_pool_status = 'reserved')                   as reserved_count,
  count(*) filter (where q.quiz_pool_status = 'used')                       as used_count,
  floor(count(*) filter (where q.quiz_pool_status = 'available') / 50.0)::int as quizzes_possible
from exams e
left join questions q
  on  q.exam_id = e.id
  and q.mock_test_id is null
  and q.is_pyq = false
  and q.archived = false
group by e.id, e.name;

-- ============================================================
-- RLS
-- ============================================================

alter table profiles             enable row level security;
alter table questions            enable row level security;
alter table attempts             enable row level security;
alter table leaderboard          enable row level security;
alter table xp_transactions      enable row level security;
alter table mock_test_events     enable row level security;
alter table live_quiz_events     enable row level security;
alter table quiz_results         enable row level security;
alter table quiz_answers         enable row level security;
alter table quiz_sessions        enable row level security;
alter table session_answers      enable row level security;
alter table quiz_scoring_profiles enable row level security;
alter table mock_tests           enable row level security;
alter table mock_test_attempts   enable row level security;
alter table admin_notifications  enable row level security;
alter table notifications        enable row level security;
alter table exams                enable row level security;
alter table subjects             enable row level security;
alter table topics               enable row level security;
alter table question_tags        enable row level security;
alter table quizzes              enable row level security;
alter table quiz_questions       enable row level security;
alter table missions             enable row level security;
alter table user_missions        enable row level security;

-- Profiles
create policy "Users view own profile"     on profiles for select  using (auth.uid() = id);
create policy "Users update own profile"   on profiles for update  using (auth.uid() = id);
create policy "Users insert own profile"   on profiles for insert  with check (auth.uid() = id);

-- Read-only reference tables (all authenticated users)
create policy "Read exams"          on exams           for select to authenticated using (true);
create policy "Read subjects"       on subjects        for select to authenticated using (true);
create policy "Read topics"         on topics          for select to authenticated using (true);
create policy "Read question_tags"  on question_tags   for select to authenticated using (true);
create policy "Read quizzes"        on quizzes         for select to authenticated using (true);
create policy "Read quiz_questions" on quiz_questions   for select to authenticated using (true);
create policy "Read questions"      on questions       for select to authenticated using (true);
create policy "Read mock_tests"     on mock_tests      for select to authenticated using (true);
create policy "Read scoring"        on quiz_scoring_profiles for select to authenticated using (true);
create policy "Read missions"       on missions        for select to authenticated using (true);
create policy "Read leaderboard"    on leaderboard     for select to authenticated using (true);
create policy "Read mock_events"    on mock_test_events for select to authenticated using (true);
create policy "Read live_events"    on live_quiz_events for select to authenticated using (true);
create policy "Read notifications"  on notifications   for select to authenticated using (true);

-- User-owned data
create policy "Own attempts insert"     on attempts         for insert with check (auth.uid() = user_id);
create policy "Own attempts select"     on attempts         for select using (auth.uid() = user_id);
create policy "Own xp select"           on xp_transactions  for select using (auth.uid() = user_id);
create policy "Own xp insert"           on xp_transactions  for insert with check (auth.uid() = user_id);
create policy "Own sessions"            on quiz_sessions     for all   using (auth.uid() = user_id);
create policy "Own session_answers"     on session_answers   for all
  using (exists (select 1 from quiz_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "Own mock_attempts"       on mock_test_attempts for all  using (auth.uid() = user_id);
create policy "Own quiz_results select" on quiz_results      for select using (auth.uid() = user_id);
create policy "Own quiz_results insert" on quiz_results      for insert with check (auth.uid() = user_id);
create policy "Own quiz_results update" on quiz_results      for update using (auth.uid() = user_id);
create policy "Own quiz_answers insert" on quiz_answers      for insert with check (auth.uid() = user_id);
create policy "Own quiz_answers select" on quiz_answers      for select using (auth.uid() = user_id);
create policy "Own user_missions"       on user_missions     for all   using (auth.uid() = user_id);

-- Admin-only write policies
create policy "Admin questions"      on questions        for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin quizzes"        on quizzes          for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin quiz_questions" on quiz_questions    for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin mock_tests"     on mock_tests       for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin mock_events"    on mock_test_events  for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin live_events"    on live_quiz_events  for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin question_tags"  on question_tags    for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin missions"       on missions         for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));
create policy "Admin notifications"  on admin_notifications for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin));

-- ============================================================
-- SEED DATA
-- ============================================================

insert into quiz_scoring_profiles (name, marks_correct, marks_wrong, marks_unattempted) values
  ('standard',    1.00, 0.25, 0),
  ('no_negative', 1.00, 0.00, 0),
  ('rapid_fire',  1.00, 0.25, 0),
  ('pyq_review',  1.00, 0.00, 0)
on conflict (name) do nothing;

insert into exams (name, code, description, pattern_mcq_count, duration_seconds) values
  ('JENPAS Undergraduate', 'JENPAS-UG', 'West Bengal undergraduate nursing/paramedical entrance', 120, 7200),
  ('JENPAS Postgraduate',  'JENPAS-PG', 'West Bengal postgraduate nursing entrance',              100, 7200),
  ('JEPBN 2026',           'JEPBN',     'Joint Entrance Examination for Post-Basic B.Sc. Nursing', 100, 5400)
on conflict (code) do nothing;

-- JENPAS-UG subjects
with ug as (select id from exams where code = 'JENPAS-UG')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select ug.id, s.name, s.icon, s.mcq from ug,
  (values ('Physics','physics',40),('Chemistry','chemistry',40),('Biology','biology',40))
  as s(name,icon,mcq)
where not exists (select 1 from subjects where exam_id = ug.id and name = s.name);

-- JENPAS-PG subjects
with pg as (select id from exams where code = 'JENPAS-PG')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select pg.id, s.name, s.icon, s.mcq from pg,
  (values
    ('Anatomy','anatomy',15),('Physiology','physiology',15),
    ('Microbiology','microbiology',14),('Biochemistry','biochemistry',14),
    ('Pathology','pathology',14),('Pharmacology','pharmacology',14),
    ('Nursing Foundation','nursing',14)
  ) as s(name,icon,mcq)
where not exists (select 1 from subjects where exam_id = pg.id and name = s.name);

-- JEPBN subjects
with jepbn as (select id from exams where code = 'JEPBN')
insert into subjects (exam_id, name, icon, mcq_count_in_exam)
select jepbn.id, s.name, s.icon, s.mcq from jepbn,
  (values
    ('Anatomy','anatomy',5),('Physiology','physiology',5),
    ('Microbiology','microbiology',5),('Pathology','pathology',5),
    ('Pharmacology','pharmacology',5),('Nutrition','nutrition',5),
    ('Psychology','psychology',5),('Sociology','sociology',5),
    ('Fundamentals of Nursing','nursing',10),
    ('Medical-Surgical Nursing','medical-surgical',10),
    ('Pediatric Nursing','pediatric',10),('Psychiatric Nursing','psychiatric',10),
    ('Obstetrical Nursing','obstetrical',10),
    ('Community Health Nursing','community-health',10)
  ) as s(name,icon,mcq)
where not exists (select 1 from subjects where exam_id = jepbn.id and name = s.name);

-- JEPBN topics
with j as (select id from exams where code = 'JEPBN')
insert into topics (subject_id, exam_id, name)
select s.id, j.id, t.name
from j
cross join (values
  ('Anatomy','Skeletal & Muscular Architecture'),
  ('Anatomy','Cardio-Respiratory & Visceral Systems'),
  ('Anatomy','Neuro-Urinary & Endocrine Layout'),
  ('Physiology','Hematology & Cardiovascular Dynamics'),
  ('Physiology','Respiratory, Digestive & Renal Mechanics'),
  ('Physiology','Endocrine Signalling & Reproduction'),
  ('Microbiology','Bacteriology & Virological Strains'),
  ('Microbiology','Sterilization & Infection Control'),
  ('Microbiology','Immunology & Diagnostic Serology'),
  ('Pathology','Cellular Adaptation & Tissue Injury'),
  ('Pathology','Inflammation & Hemodynamic Disorders'),
  ('Pathology','Neoplasia & Systemic Healing'),
  ('Pharmacology','Pharmacokinetics & Pharmacodynamics'),
  ('Pharmacology','Systemic Therapeutics'),
  ('Pharmacology','Chemotherapy & Antibiotic Stewardship'),
  ('Nutrition','Macronutrient & Micronutrient Energetics'),
  ('Nutrition','Therapeutic Dietetics & Deficiencies'),
  ('Psychology','Cognitive Processes & Behavior'),
  ('Psychology','Personality & Defense Mechanisms'),
  ('Sociology','Social Groups & Cultural Frameworks'),
  ('Sociology','Social Pathology & Healthcare Interfaces'),
  ('Fundamentals of Nursing','Professional Paradigms & Communication'),
  ('Fundamentals of Nursing','Clinical Intervention & Vital Metrics'),
  ('Medical-Surgical Nursing','Perioperative Care & Critical Fluid Management'),
  ('Medical-Surgical Nursing','Cardiovascular, Respiratory & Gastrointestinal Pathologies'),
  ('Medical-Surgical Nursing','Renal, Endocrine & Neurological Alterations'),
  ('Pediatric Nursing','Growth & Developmental Milestones'),
  ('Pediatric Nursing','Neonatal Care & Congenital Malformations'),
  ('Pediatric Nursing','Childhood Illnesses & Integrated Protocols'),
  ('Psychiatric Nursing','Psychopathology & Diagnostic Evaluation'),
  ('Psychiatric Nursing','Major Psychiatric Conditions'),
  ('Psychiatric Nursing','Psychiatric Therapeutics'),
  ('Obstetrical Nursing','Antenatal Assessment & Fetal Surveillance'),
  ('Obstetrical Nursing','Intrapartum Mechanics & Complications'),
  ('Obstetrical Nursing','Postnatal Care & Neonatal Stabilization'),
  ('Community Health Nursing','Epidemiology & Demographic Controls'),
  ('Community Health Nursing','National Health Schemes & Policy Structures'),
  ('Community Health Nursing','Family Planning & Environmental Sanitation')
) as t(subject_name, name)
inner join subjects s on s.exam_id = j.id and s.name = t.subject_name
where not exists (
  select 1 from topics where subject_id = s.id and exam_id = j.id and name = t.name
);

-- XP levels
insert into xp_levels (level, min_xp, label, unlocks) values
  (1,   0,  'Beginner',   '["daily_practice_5"]'),
  (2,  50,  'Explorer',   '["daily_practice_10","topic_filters"]'),
  (3, 150,  'Challenger', '["full_chapter_tests","performance_analytics"]'),
  (4, 350,  'Contender',  '["previous_year_papers"]'),
  (5, 700,  'Expert',     '["all_content","priority_mock_booking"]')
on conflict (level) do nothing;

-- ============================================================
-- ONBOARDING REDIRECT FIX
-- The onboarding page MUST run this SQL pattern after saving:
--
--   update profiles
--   set targetExams = $1::jsonb   -- e.g. '["JENPAS-UG"]'
--   where id = auth.uid();
--
-- If it only writes to the Zustand store without hitting Supabase,
-- every login will see targetExams = [] and redirect back to /onboarding.
-- ============================================================
