"use client";

import { db } from "./db";
import { notify } from "./notifications";

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
  cook_name: string | null;
};

/** Every chika on one board, oldest first, with the cook name attached. */
export async function loadComments(postId: string): Promise<CommentRow[]> {
  const sb = db();
  if (!sb) return [];
  const { data } = await sb
    .from("post_comments")
    .select("id, post_id, user_id, body, created_at, parent_comment_id, profiles!post_comments_user_id_fkey(display_name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (!data) return [];
  return data.map((r) => {
    const row = r as unknown as {
      profiles: { display_name: string | null } | { display_name: string | null }[] | null;
    };
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: String(r.id),
      post_id: String(r.post_id),
      user_id: String(r.user_id),
      body: String(r.body),
      created_at: String(r.created_at),
      parent_comment_id: r.parent_comment_id ? String(r.parent_comment_id) : null,
      cook_name: p?.display_name ?? null,
    };
  });
}

/** Post a chika, or a reply to one. The database rejects empty and too-long text. */
export async function addComment(
  postId: string,
  userId: string,
  body: string,
  parentId?: string | null,
): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const clean = body.trim().slice(0, 500);
  if (!clean) throw new Error("Nothing to say yet.");
  const { error } = await sb.from("post_comments").insert({
    post_id: postId,
    user_id: userId,
    body: clean,
    parent_comment_id: parentId ?? null,
  });
  if (error) throw new Error(error.message);
  // ring the bell of the board owner and, on replies, of the cook answered
  const { data: post } = await sb
    .from("shared_plans")
    .select("user_id")
    .eq("id", postId)
    .maybeSingle();
  if (post) {
    void notify({ targetId: String(post.user_id), actorId: userId, kind: "comment", postId });
  }
  if (parentId) {
    const { data: parent } = await sb
      .from("post_comments")
      .select("user_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parent && String(parent.user_id) !== String(post?.user_id ?? "")) {
      void notify({ targetId: String(parent.user_id), actorId: userId, kind: "comment", postId });
    }
  }
}

/** Fix the wording of one of my own chikas. */
export async function updateComment(id: string, body: string): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const clean = body.trim().slice(0, 500);
  if (!clean) throw new Error("Nothing to say yet.");
  const { error } = await sb.from("post_comments").update({ body: clean }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Remove one comment. The cook who wrote it, the board owner, or a moderator. */
export async function deleteComment(id: string): Promise<void> {
  const sb = db();
  if (!sb) throw new Error("Storage not configured.");
  const { error } = await sb.from("post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
