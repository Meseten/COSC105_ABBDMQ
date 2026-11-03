-- Round three: chika replies, bell preferences, moderation reports.

-- One level of replies on the community boards.
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
  REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Per-cook bell preferences. True means the bell rings.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notif_follows boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_likes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_comments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_saves boolean NOT NULL DEFAULT true;

-- Cooks flag broken posts or comments, moderators only get to see them.
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reporter uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.shared_plans(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 300),
  handled boolean NOT NULL DEFAULT false,
  CONSTRAINT reports_one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL)
    OR (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_insert_own
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter);

CREATE POLICY reports_read_moderators
  ON public.reports FOR SELECT TO authenticated
  USING (is_moderator());

CREATE POLICY reports_update_moderators
  ON public.reports FOR UPDATE TO authenticated
  USING (is_moderator())
  WITH CHECK (is_moderator());

CREATE POLICY reports_delete_moderators
  ON public.reports FOR DELETE TO authenticated
  USING (is_moderator());

CREATE INDEX IF NOT EXISTS reports_open_idx
  ON public.reports (created_at DESC) WHERE handled = false;
