-- Round four: chika editing for the author, and a flood limit on reports.

-- Authors may fix their own chika text. The fifteen minute window is a UI
-- courtesy, the database simply trusts the author's row.
CREATE POLICY post_comments_edit_own
  ON public.post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- One report per cook per target per day, so one account cannot drown the desk.
CREATE POLICY reports_flood_guard
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.reports r2
      WHERE r2.reporter = auth.uid()
        AND (
          (r2.post_id IS NOT NULL AND r2.post_id = reports.post_id)
          OR (r2.comment_id IS NOT NULL AND r2.comment_id = reports.comment_id)
        )
        AND r2.created_at > now() - interval '24 hours'
    )
  );
