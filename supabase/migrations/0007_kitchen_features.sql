-- PantryPal 0007: kitchen board pins, self-service profile edits, real account deletion.
alter table public.meal_plans
  add column if not exists pinned boolean not null default false;

-- Owners keep their own display name and profile row editable.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Self-service export: any signed-in cook can read their profile row.
grant select on table public.profiles to authenticated;

-- Privacy-policy promise: the account owner can erase the account and every
-- related row. Deleting the auth user cascades to profiles, plans, shares,
-- likes and chat messages (FK ON DELETE CASCADE).
create or replace function public.delete_my_account()
returns void
language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
