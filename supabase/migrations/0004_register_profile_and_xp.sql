-- Culina 0004: fix function set (register_profile onboarding + xp grant).
create or replace function public.register_profile()
returns public.profiles
language plpgsql security definer
set search_path = public, pg_temp as $$
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
set search_path = public, pg_temp as $$
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
    return p;  -- one xp grant per day
  end if;

  new_streak := case when p.last_plan_date = today - 1 then p.streak_days + 1 else 1 end;

  update public.profiles set
    xp = p.xp + 20,
    plan_count = p.plan_count + 1,
    last_plan_date = today,
    streak_days = new_streak,
    badges = p.badges
      || coalesce((
        select jsonb_agg(t.code)
        from unnest(array[
          case when p.plan_count + 1 >= 1 then 'first-plate' end,
          case when p.plan_count + 1 >= 5 then 'week-runner' end,
          case when p.plan_count + 1 >= 10 then 'home-chef' end,
          case when new_streak >= 3 then 'streak-iii' end,
          case when new_streak >= 7 then 'streak-vii' end
        ]) as t(code)
        where t.code is not null and not (p.badges @> jsonb_build_array(t.code))
      ), '[]'::jsonb),
    updated_at = now()
  where id = auth.uid()
  returning * into p;

  return p;
end $$;
