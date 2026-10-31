-- PantryPal 0008: personal recipes (my cookbook) and the feedback inbox.

create table if not exists public.personal_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  minutes integer not null default 30 check (minutes between 1 and 600),
  category text not null default 'any' check (category in
    ('any', 'quick', 'veg', 'protein', 'budget', 'party')),
  ingredients jsonb not null default '[]'::jsonb,
  steps text not null default '',
  favorite boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.personal_recipes enable row level security;

create policy "recipes_read_own" on public.personal_recipes
  for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.personal_recipes
  for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.personal_recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.personal_recipes
  for delete using (auth.uid() = user_id);

create index if not exists recipes_by_user
  on public.personal_recipes (user_id, created_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  topic text not null default 'general' check (topic in
    ('general', 'bug', 'idea', 'content', 'account')),
  message text not null check (char_length(message) between 5 and 2000),
  page varchar(120) not null default '',
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

-- Anyone (including guests) can send feedback; only admins can read the inbox.
create policy "feedback_send_anyone" on public.feedback
  for insert with check (true);
create policy "feedback_read_admins" on public.feedback
  for select using (public.is_admin());
