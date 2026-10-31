-- ============================================================
-- PantryPal schema (Supabase / PostgreSQL)
-- Meal plans: one row per saved plan, owned by the anonymous
-- session that created it, guarded by row-level security.
-- ============================================================

create table if not exists public.meal_plans (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists meal_plans_user_created_idx
  on public.meal_plans (user_id, created_at desc);

alter table public.meal_plans enable row level security;

drop policy if exists "Plans are readable by their owner"
  on public.meal_plans;
create policy "Plans are readable by their owner"
  on public.meal_plans
  for select
  using (auth.uid() = user_id);

drop policy if exists "Plans are insertable by their owner"
  on public.meal_plans;
create policy "Plans are insertable by their owner"
  on public.meal_plans
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Plans are updatable by their owner"
  on public.meal_plans;
create policy "Plans are updatable by their owner"
  on public.meal_plans
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Plans are deletable by their owner"
  on public.meal_plans;
create policy "Plans are deletable by their owner"
  on public.meal_plans
  for delete
  using (auth.uid() = user_id);

-- Anonymous sign-in must also be enabled in the Supabase dashboard:
-- Authentication > Providers > Email > "Allow anonymous sign-ins".
