# Admin Setup Guide

This guide explains how to create an admin account and access the admin panel after connecting your app to Supabase.

## 1. Prerequisites

- Supabase project connected (set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`)
- Database schema applied (run `supabase-schema.sql` in the Supabase SQL Editor)
- App running locally or deployed

## 2. Create a User Account

1. Go to the **Register** page (`/register`) and sign up with an email and password
2. Complete the onboarding flow (select exam, etc.)
3. The user is now created in `auth.users` and a row is added to the `profiles` table

## 3. Promote the User to Admin

Run this SQL in the **Supabase SQL Editor** (Dashboard > SQL Editor):

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'the-user-email@example.com');
```

To verify:

```sql
select p.id, p.name, p.email, p.is_admin
from profiles p
join auth.users u on u.id = p.id
where p.is_admin = true;
```

## 4. Access the Admin Panel

1. Log in at `/login` with the admin user's email and password
2. After login, you are automatically redirected to `/admin` (the **Admin Dashboard**)
3. If you are redirected to `/dashboard` (user side), check that `is_admin` was set correctly

## 5. Admin Sections

| Route | Purpose |
|---|---|
| `/admin` | Dashboard — user stats, pool status |
| `/admin/users` | List users, search, export CSV, reset scores |
| `/admin/questions` | Upload questions via CSV |
| `/admin/quizzes` | Create, schedule, cancel, reschedule quizzes |
| `/admin/mock-tests` | Create, publish, archive mock tests |
| `/admin/scheduler` | Schedule mock tests and live quiz events |
| `/admin/notifications` | Send push notifications |
| `/admin/analytics` | User analytics and stats |
| `/admin/topics` | Add, delete, merge topics |
| `/admin/exam-mapping` | Exam → Subject → Topic hierarchy viewer |

## 6. Demo Credentials (Development Only)

The mock client (used when Supabase env vars are not set) provides:

- **Admin**: `admin@wbnursing.app` / `admin123`
- **Student**: `demo@wbnursing.app` / `demo123`

These work only in development without a real Supabase connection.

## 7. How It Works

- The `profiles` table has an `is_admin boolean default false` column
- On login, the app checks `profile.is_admin` and redirects to `/admin` or `/dashboard`
- All admin data queries are protected by **Row-Level Security (RLS)** policies that verify `is_admin = true`
- No admin route is blocked by middleware currently — access control relies on RLS at the database level

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| User not redirected to `/admin` after login | Run the SQL in step 3 and verify `is_admin = true` |
| Admin page shows no data | Check that RLS policies are enabled on all tables in Supabase dashboard |
| "Failed to fetch" errors | Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct |
