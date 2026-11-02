-- coci round two: comments, notifications, saved boards, kitchen defaults

-- ================= comments on shared plans =================
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.shared_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (
    length(btrim(body)) between 1 and 500
  ),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;

-- mirror the shared_plans_read predicate: own posts always, public posts of
-- non-private cooks, and anything the viewer follows.
create policy post_comments_read on public.post_comments for select using (
  exists (
    select 1 from public.shared_plans sp
    where sp.id = post_comments.post_id
      and (
        sp.user_id = auth.uid()
        or (
          sp.visibility = 'public'
          and not exists (
            select 1 from public.profiles p
            where p.id = sp.user_id and p.is_private
          )
        )
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = sp.user_id
        )
      )
  )
);

create policy post_comments_insert_own on public.post_comments for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.shared_plans sp
    where sp.id = post_comments.post_id
      and (
        sp.user_id = auth.uid()
        or (
          sp.visibility = 'public'
          and not exists (
            select 1 from public.profiles p
            where p.id = sp.user_id and p.is_private
          )
        )
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = sp.user_id
        )
      )
  )
);

-- the author, the post owner, or a moderator may remove a comment
create policy post_comments_delete on public.post_comments for delete using (
  auth.uid() = user_id
  or exists (
    select 1 from public.shared_plans sp
    where sp.id = post_comments.post_id and sp.user_id = auth.uid()
  )
  or public.is_moderator()
);

-- ================= notifications =================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade, -- receiver
  actor_id uuid not null references public.profiles(id) on delete cascade, -- who acted
  kind text not null check (kind in ('follow', 'like', 'comment', 'save')),
  post_id uuid references public.shared_plans(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (actor_id <> user_id)
);

create index if not exists notifications_inbox_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_read_own on public.notifications for select using (
  auth.uid() = user_id
);
create policy notifications_insert_any on public.notifications for insert
  with check (auth.uid() is not null);
create policy notifications_update_own on public.notifications for update using (
  auth.uid() = user_id
) with check (
  auth.uid() = user_id
);
create policy notifications_delete_own on public.notifications for delete using (
  auth.uid() = user_id
);

-- ================= saved boards ("want to try") =================
create table if not exists public.board_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.shared_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.board_saves enable row level security;

create policy board_saves_read on public.board_saves for select using (
  auth.uid() = user_id
);
create policy board_saves_insert on public.board_saves for insert with check (
  auth.uid() = user_id
);
create policy board_saves_delete on public.board_saves for delete using (
  auth.uid() = user_id
);

-- ================= planner defaults on profiles =================
alter table public.profiles
  add column if not exists default_household smallint
    check (default_household between 1 and 12);
alter table public.profiles
  add column if not exists default_budget numeric(10, 2)
    check (default_budget is null or default_budget >= 0);
