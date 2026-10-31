-- Culina 0006: community roles + moderation + proper signup names.
alter table public.profiles add column if not exists role text not null default 'member'
  check (role in ('member', 'moderator', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql security definer
set search_path = public, pg_temp as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member') = 'admin'
$$;

create or replace function public.is_moderator()
returns boolean
language sql security definer
set search_path = public, pg_temp as $$
  select public.is_admin() or coalesce((select role from public.profiles where id = auth.uid()), 'member') = 'moderator'
$$;

drop policy if exists "shared_plans_moderate" on public.shared_plans;
create policy "shared_plans_moderate" on public.shared_plans
  for delete to authenticated using (public.is_moderator());

drop policy if exists "chat_moderate" on public.chat_messages;
create policy "chat_moderate" on public.chat_messages
  for delete to authenticated using (public.is_moderator());

-- Profiles expose role (read-only to everyone; writes stay definer-only).
grant select (id, display_name, xp, streak_days, plan_count, share_count, badges, role) on public.profiles to anon, authenticated;

-- register_profile picks up the display name collected at signup.
create or replace function public.register_profile()
returns public.profiles
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  p public.profiles;
  meta_name text := coalesce(
    nullif(trim(coalesce((select raw_user_meta_data ->> 'display_name' from auth.users where id = auth.uid()), '')), ''),
    'Anonymous Cook'
  );
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into public.profiles (id, display_name)
  values (auth.uid(), left(meta_name, 40))
  on conflict (id) do nothing;
  select * into p from public.profiles where id = auth.uid();
  return p;
end $$;
