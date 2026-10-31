-- Culina 0002
-- Accounts, community feed, live chat, gamification.
-- Idempotent where the platform allows it.

-- ---------------------------------------------------------------------------
-- profiles: one row per account. RLS gives everyone read access (recipes need
-- a cook name) but WRITES go through security-definer functions only, so a
-- user cannot forge xp, streaks or badges.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default 'Anonymous Cook'
                check (char_length(display_name) between 2 and 40),
  xp            integer not null default 0,
  streak_days   integer not null default 0,
  last_plan_date date,
  plan_count    integer not null default 0,
  share_count   integer not null default 0,
  badges        jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- shared_plans: public recipe board. Rows are created only through
-- share_plan() so the share badge and counters stay server-computed.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  plan jsonb not null,
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shared_plans_recent_idx
  on public.shared_plans (created_at desc);

-- ---------------------------------------------------------------------------
-- plan_likes: one like per cook per plan. A trigger keeps like_count honest.
-- ---------------------------------------------------------------------------
create table if not exists public.plan_likes (
  plan_id uuid not null references public.shared_plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create or replace function public.refresh_like_count()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  update public.shared_plans
     set like_count = (select count(*) from public.plan_likes where plan_id = new.plan_id)
   where id = new.plan_id;
  return null;
end $$;

drop trigger if exists plan_likes_after on public.plan_likes;
create trigger plan_likes_after
  after insert or delete on public.plan_likes
  for each row execute function public.refresh_like_count();

-- ---------------------------------------------------------------------------
-- chat_messages: the live kitchen chat. Realtime broadcast is enabled after
-- the tables exist.
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_recent_idx
  on public.chat_messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.shared_plans   enable row level security;
alter table public.plan_likes     enable row level security;
alter table public.chat_messages  enable row level security;

-- profiles: read for all, writes only via definer functions.
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select using (true);

-- shared_plans: read for all; no direct write grants (share_plan handles it).
drop policy if exists "shared_plans_read" on public.shared_plans;
create policy "shared_plans_read" on public.shared_plans
  for select using (true);

drop policy if exists "shared_plans_delete_own" on public.shared_plans;
create policy "shared_plans_delete_own" on public.shared_plans
  for delete using (auth.uid() = user_id);

-- plan_likes: hearting needs a signed-in cook, one per cook per plan.
drop policy if exists "plan_likes_insert_own" on public.plan_likes;
create policy "plan_likes_insert_own" on public.plan_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "plan_likes_delete_own" on public.plan_likes;
create policy "plan_likes_delete_own" on public.plan_likes
  for delete using (auth.uid() = user_id);

-- chat_messages: anyone signed in can read and post as themselves.
drop policy if exists "chat_read" on public.chat_messages;
create policy "chat_read" on public.chat_messages
  for select using (true);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- Grant verbs the policies above rely on (profiles stays closed for writes).
grant select on public.profiles to anon, authenticated;
grant select on public.shared_plans to anon, authenticated;
grant delete on public.shared_plans to authenticated;
grant insert, delete on public.plan_likes to authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant select on public.chat_messages to anon;

-- ---------------------------------------------------------------------------
-- Server-computed actions (security definer so RLS cannot be bypassed by
-- a tweaked browser client).
-- ---------------------------------------------------------------------------
create or replace function public.register_profile()
returns public.profiles
language plpgsql security definer
set search_path = public as $$
declare
  p public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into public.profiles (id) values (auth.uid())
  on conflict (id) do nothing;
  select * into p from public.profiles where id = auth.uid();
  return p;
end $$;

create or replace function public.grant_plan_xp()
returns public.profiles
language plpgsql security definer
set search_path = public as $$
declare
  p public.profiles;
  today date := current_date;
  new_streak integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into public.profiles (id) values (auth.uid())
  on conflict (id) do nothing;

  select * into p from public.profiles where id = auth.uid() for update;

  if p.last_plan_date = today then
    return p;  -- one xp grant per day, no farming
  end if;

  new_streak := case when p.last_plan_date = today - 1 then p.streak_days + 1 else 1 end;

  update public.profiles set
    xp = p.xp + 20,
    plan_count = p.plan_count + 1,
    last_plan_date = today,
    streak_days = new_streak,
    badges = p.badges
      || (select coalesce(jsonb_agg(jsonb_build_array(b.code)), '[]'::jsonb)
          from unnest(array[
            case when p.plan_count + 1 >= 1 then 'first-plate' end,
            case when p.plan_count + 1 >= 5 then 'week-runner' end,
            case when p.plan_count + 1 >= 10 then 'home-chef' end,
            case when new_streak >= 3 then 'streak-iii' end,
            case when new_streak >= 7 then 'streak-vii' end
          ]) as code
          where code is not null and not (p.badges @> jsonb_build_array(code))),
    share_count = p.share_count,
    updated_at = now()
  where id = auth.uid()
  returning * into p;

  return p;
end $$;

create or replace function public.share_plan(
  p_title text,
  p_plan jsonb
) returns uuid
language plpgsql security definer
set search_path = public as $$
declare
  new_id uuid;
  p public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_title is null or char_length(trim(p_title)) < 3 or char_length(p_title) > 80 then
    raise exception 'title must be 3 to 80 characters';
  end if;
  if jsonb_typeof(p_plan) is distinct from 'object' then
    raise exception 'plan must be a json object';
  end if;

  insert into public.profiles (id) values (auth.uid())
  on conflict (id) do nothing;

  insert into public.shared_plans (user_id, title, plan)
  values (auth.uid(), trim(p_title), p_plan)
  returning id into new_id;

  -- First share earns the badge once. No repeat xp from re-sharing.
  select * into p from public.profiles where id = auth.uid() for update;
  if p.share_count = 0 then
    update public.profiles set
      share_count = p.share_count + 1,
      badges = case when not (p.badges @> '"first-share"'::jsonb)
                    then p.badges || '["first-share"]'::jsonb else p.badges end,
      updated_at = now()
    where id = auth.uid();
  else
    update public.profiles set
      share_count = p.share_count + 1,
      updated_at = now()
    where id = auth.uid();
  end if;

  return new_id;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime for the chat room (safely wrapped in case the publication is off).
-- ---------------------------------------------------------------------------
do $$
begin
  execute 'alter publication supabase_realtime add table public.chat_messages';
exception when others then null;
end $$;
