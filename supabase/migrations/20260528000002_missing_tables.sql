-- Add missing tables referenced by the application code.

-- notifications: general-purpose user notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  targetExams jsonb default '[]'::jsonb,
  type text not null check (type in ('mock_test', 'result', 'announcement')),
  readBy jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Authenticated users can read notifications"
  on notifications for select to authenticated using (true);

-- quiz_attempts: legacy quiz attempt records (used alongside quiz_sessions)
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  uid uuid not null references profiles(id),
  quiz_id uuid not null references quizzes(id),
  attempt_number smallint not null default 1,
  exam_id uuid references exams(id),
  started_at timestamptz,
  completed_at timestamptz,
  total_marks numeric(6,2) default 0,
  marks_earned numeric(6,2) default 0,
  percentage numeric(5,2) default 0,
  correct smallint default 0,
  wrong smallint default 0,
  skipped smallint default 0,
  negative_penalty numeric(6,2) default 0,
  category_i_attempts jsonb default '{"correct":0,"wrong":0,"skip":0}'::jsonb,
  category_ii_attempts jsonb default '{"correct":0,"wrong":0,"partial":0,"skip":0}'::jsonb,
  subject_breakdown jsonb default '{}'::jsonb,
  is_live_attempt boolean default false,
  created_at timestamptz default now()
);

alter table quiz_attempts enable row level security;

create policy "Users manage own quiz attempts"
  on quiz_attempts for all using (auth.uid() = uid);
