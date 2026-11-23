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
  if new_role is not null and new_role not in ('admin', 'secretary', 'foreman') then
    new_role := null;
  end if;

  insert into public.profiles (id, first_name, last_name, phone, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), ''),
    new_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profiles for users that existed before the trigger.
insert into public.profiles (id, first_name, last_name, phone, role)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'first_name'), ''), ''),
  coalesce(nullif(trim(raw_user_meta_data ->> 'last_name'), ''), ''),
  coalesce(nullif(trim(raw_user_meta_data ->> 'phone'), ''), ''),
  case when raw_app_meta_data ->> 'role' in ('admin', 'secretary', 'foreman')
       then raw_app_meta_data ->> 'role' end
from auth.users
on conflict (id) do nothing;