-- Run this in the SQL Editor if you already ran schema.sql before this file
-- existed. It upgrades an existing project to: (1) store each student's
-- email on their profile so admins can look them up, and (2) switch
-- enrollment to admin-only (removes free self-enroll).

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

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

drop policy if exists "enrollments_insert_self" on public.enrollments;
