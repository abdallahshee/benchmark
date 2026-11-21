-- Creates a profile row automatically whenever a user is created in auth.users.
-- The role comes from app_metadata, which can only be set server-side.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_role text;
begin
  new_role := new.raw_app_meta_data ->> 'role';

  -- Ignore anything that isn't a known role (keep in sync with ROLES).
  if new_role is not null and new_role not in ('admin', 'secretary','foreman') then
    new_role := null;
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for users that existed before the trigger.
insert into public.profiles (id, full_name, role)
select
  id,
  raw_user_meta_data ->> 'full_name',
  case when raw_app_meta_data ->> 'role' in ('admin', 'secretary','foreman')
       then raw_app_meta_data ->> 'role' end
from auth.users
on conflict (id) do nothing;