"use client";

import { db } from "./db";

const MAX_BYTES = 8_000_000; // a cooking phone photo, shrunk below 8MB
const OK_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Guard the file client-side; storage policies do the real gating. */
export function photoProblem(file: File): string | null {
  if (!OK_TYPES.has(file.type)) return "Photos work as JPG, PNG, WebP or GIF.";
  if (file.size > MAX_BYTES) return "That photo is too big. Keep it under 8MB.";
  return null;
}

/** Uploads under the signed-in cook's own folder so storage policies hold. */
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const sb = db();
  if (!sb) throw new Error("Sign in first to attach a photo.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safe = ext === "jpeg" ? "jpg" : ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${safe}`;
  const { error } = await sb.storage
    .from("coci-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("coci-photos").getPublicUrl(path);
  return data.publicUrl;
}

/** Deletes a cook's own photo; failures never block the caller. */
export async function removePhoto(publicUrl: string): Promise<void> {
  const sb = db();
  if (!sb) return;
  const marker = "/object/public/";
  const at = publicUrl.indexOf(marker);
  if (at < 0) return;
  await sb.storage.from("coci-photos").remove([publicUrl.slice(at + marker.length)]);
}
