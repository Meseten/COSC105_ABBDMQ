"use client";

import { db } from "./db";

export interface ReportRow {
  id: string;
  created_at: string;
  reason: string;
  post_id: string | null;
  comment_id: string | null;
  post_title: string | null;
  comment_body: string | null;
  comment_post_id: string | null;
  reporter_name: string | null;
}

/** A cook flags something. Moderators read the queue, cooks never see it. */
export async function addReport(opts: {
  reporterId: string;
  postId?: string | null;
  commentId?: string | null;
  reason: string;
}): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const clean = opts.reason.trim().slice(0, 300);
  if (!clean) throw new Error("Say what is wrong.");
  const payload: Record<string, string> = { reporter: opts.reporterId, reason: clean };
  if (opts.postId) payload.post_id = opts.postId;
  if (opts.commentId) payload.comment_id = opts.commentId;
  const { error } = await sb.from("reports").insert(payload);
  if (error) throw new Error(error.message);
}

/** The open queue. Empty for cooks, the database only lets stewards read. */
export async function loadReports(): Promise<ReportRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data } = await sb
    .from("reports")
    .select(
      "id, created_at, reason, post_id, comment_id, reporters(display_name), posts(title), comment:post_comments!reports_comment_id_fkey(body, post_id)",
    )
    .eq("handled", false)
    .order("created_at", { ascending: false });
  if (!data) return [];
  return data.map((r) => {
    const row = r as unknown as {
      reporters: { display_name: string | null } | { display_name: string | null }[] | null;
      posts: { title: string | null } | { title: string | null }[] | null;
      comment: { body: string | null; post_id: string | null } | null;
    };
    const rep = Array.isArray(row.reporters) ? row.reporters[0] : row.reporters;
    const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
    return {
      id: String(r.id),
      created_at: String(r.created_at),
      reason: String(r.reason),
      post_id: r.post_id ? String(r.post_id) : null,
      comment_id: r.comment_id ? String(r.comment_id) : null,
      post_title: post?.title ?? null,
      comment_body: row.comment?.body ?? null,
      comment_post_id: row.comment?.post_id ? String(row.comment.post_id) : null,
      reporter_name: rep?.display_name ?? null,
    };
  });
}

/** Leave the flagged thing up, mark the report as read. */
export async function dismissReport(id: string): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const { error } = await sb.from("reports").update({ handled: true }).eq("id", id);
  if (error) throw new Error(error.message);
}
