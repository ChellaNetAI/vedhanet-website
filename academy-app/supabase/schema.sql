-- VedhaNet Academy schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds the role (student/admin)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- Stores email on the profile so admins can look a student up to enroll them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- courses / modules / lessons / documents
-- ---------------------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  is_published boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  kind text not null default 'video' check (kind in ('video', 'short')),
  video_path text, -- path inside the "videos" or "shorts" storage bucket
  duration_seconds int,
  position int not null default 0,
  is_preview boolean not null default false, -- viewable without enrollment
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  title text not null,
  file_path text not null, -- path inside the "documents" storage bucket
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- enrollments / progress
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  progress_seconds int not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---------------------------------------------------------------------------
-- Helper: is the current user an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.documents enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- profiles: users see/update their own row; admins see all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- courses: anyone signed in can see published courses; admins see & manage all
create policy "courses_select_published_or_admin" on public.courses
  for select using (is_published or public.is_admin());
create policy "courses_write_admin" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- modules: visible if the parent course is visible
create policy "modules_select" on public.modules
  for select using (
    public.is_admin() or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.is_published
    )
  );
create policy "modules_write_admin" on public.modules
  for all using (public.is_admin()) with check (public.is_admin());

-- lessons: preview lessons are visible to anyone who can see the module;
-- full lessons require an active enrollment in the parent course.
create policy "lessons_select" on public.lessons
  for select using (
    public.is_admin()
    or is_preview
    or exists (
      select 1
      from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = lessons.module_id and e.user_id = auth.uid()
    )
  );
create policy "lessons_write_admin" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- documents: same visibility rule as their parent lesson
create policy "documents_select" on public.documents
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lessons l
      where l.id = documents.lesson_id and (
        l.is_preview or exists (
          select 1 from public.modules m
          join public.enrollments e on e.course_id = m.course_id
          where m.id = l.module_id and e.user_id = auth.uid()
        )
      )
    )
  );
create policy "documents_write_admin" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: users see their own; only admins can grant/revoke access.
-- (Enrollment is admin-only by design: the admin panel enrolls a student
-- after payment is confirmed outside the app. There is deliberately no
-- self-enroll policy here.)
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "enrollments_admin_manage" on public.enrollments
  for update using (public.is_admin()) with check (public.is_admin());
create policy "enrollments_admin_delete" on public.enrollments
  for delete using (public.is_admin());

-- lesson_progress: users manage their own progress rows
create policy "progress_select_own_or_admin" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_admin());
create policy "progress_upsert_own" on public.lesson_progress
  for insert with check (user_id = auth.uid());
create policy "progress_update_own" on public.lesson_progress
  for update using (user_id = auth.uid());
