"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "./db";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  display_name: string;
  xp: number;
  streak_days: number;
  last_plan_date: string | null;
  plan_count: number;
  share_count: number;
  badges: string[];
  level: number;
  role: "member" | "moderator" | "admin";
  bio: string;
  is_private: boolean;
  default_household: number | null;
  default_budget: number | null;
}

/** undefined = loading, null = signed out, Session = signed in. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const sb = db();
    if (!sb) {
      setSession(null);
      return;
    }
    let alive = true;
    void sb.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      alive = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return session;
}

/** True once the session loaded and there is a real (non-anonymous) user. */
export function useSignedIn(): boolean {
  const session = useSession();
  return session !== undefined && session !== null && !session.user.is_anonymous;
}

function levelFor(xp: number): number {
  if (xp >= 600) return 6;
  if (xp >= 350) return 5;
  if (xp >= 200) return 4;
  if (xp >= 100) return 3;
  if (xp >= 40) return 2;
  return 1;
}

function toProfile(row: Record<string, unknown>): Profile {
  const rawBadges = row.badges;
  const badges = Array.isArray(rawBadges)
    ? rawBadges.filter((b): b is string => typeof b === "string")
    : [];
  const xp = typeof row.xp === "number" ? row.xp : 0;
  return {
    id: String(row.id),
    display_name:
      typeof row.display_name === "string" ? row.display_name : "Anonymous Cook",
    xp,
    streak_days: typeof row.streak_days === "number" ? row.streak_days : 0,
    last_plan_date: typeof row.last_plan_date === "string" ? row.last_plan_date : null,
    plan_count: typeof row.plan_count === "number" ? row.plan_count : 0,
    share_count: typeof row.share_count === "number" ? row.share_count : 0,
    badges,
    level: levelFor(xp),
    role:
      row.role === "admin" || row.role === "moderator"
        ? (row.role as "admin" | "moderator")
        : "member",
    bio: typeof row.bio === "string" ? row.bio : "",
    is_private: row.is_private === true,
    default_household:
      typeof row.default_household === "number" ? row.default_household : null,
    default_budget: typeof row.default_budget === "number" ? row.default_budget : null,
  };
}

/** Fetches a profile row straight from the public table. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = db();
  if (!sb) return null;
  const { data, error } = await sb
    .from("profiles")
    .select(
      "id, display_name, xp, streak_days, last_plan_date, plan_count, share_count, badges, role, bio, is_private, default_household, default_budget",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return toProfile(data as Record<string, unknown>);
}

/**
 * The signed-in cook's profile. Registers the row through the server function
 * the first time somebody signs in.
 */
export function useProfile(): {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<Profile | null>;
} {
  const session = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<Profile | null> => {
    const sb = db();
    if (!sb) {
      setProfile(null);
      return null;
    }
    const { data } = await sb.auth.getUser();
    if (!data?.user || data.user.is_anonymous) {
      setProfile(null);
      return null;
    }
    const next = await fetchProfile(data.user.id);
    // The row is missing: create it via the definer function, then read again.
    if (!next) {
      await sb.rpc("register_profile");
      const created = await fetchProfile(data.user.id);
      setProfile(created);
      return created;
    }
    setProfile(next);
    return next;
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session || session.user.is_anonymous) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [session, refresh]);

  return { profile, loading, refresh };
}

export async function signOut(): Promise<void> {
  const sb = db();
  if (!sb) return;
  await sb.auth.signOut();
}

export function displayNameFor(user: User | null | undefined): string {
  const meta = user?.user_metadata as Record<string, unknown> | undefined;
  const name = meta?.["display_name"];
  return typeof name === "string" && name.trim() ? name.trim() : "Anonymous Cook";
}
