"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { signOut, useProfile, useSession } from "@/lib/auth";

export default function SettingsPage() {
  const session = useSession();
  const { profile, refresh } = useProfile();
  const router = useRouter();
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const isAnonSession = session !== undefined && session !== null && session.user.is_anonymous;

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  if (session === undefined) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-2xl px-5 py-12">
          <p className="text-sm text-mute">
            <span className="simmer">Opening the settings drawer...</span>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (!signedIn) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="font-display text-3xl font-semibold">
            {isAnonSession ? "Using PantryPal without an account" : "Not signed in"}
          </h1>
          <p className="mt-2 text-sm text-mute">
            Account settings — name, password, data copy, deletion — belong to a
            signed-in account. Your saved plans still live on this device.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="mt-6 inline-block rounded-sm bg-herb px-5 py-3 text-sm font-bold text-paper"
          >
            {isAnonSession ? "Switch to a real account" : "Sign in"}
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Names need at least 2 characters.");
      return;
    }
    setSavingName(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb.rpc("update_display_name", { p_name: trimmed });
      if (error) throw error;
      await refresh();
      toast.success("Name updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename.");
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Use at least 6 characters.");
      return;
    }
    setSavingPassword(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      toast.success("Password changed. All devices stay signed in.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const exportData = async () => {
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const userId = (await sb.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("No signed-in user.");
      const { data: profileRows } = await sb
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      const { data: planRows } = await sb
        .from("meal_plans")
        .select("id, title, created_at, pinned, data")
        .eq("user_id", userId);
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), profile: profileRows, plans: planRows }, null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pantrypal-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data copy downloaded (JSON).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export data.");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb.rpc("delete_my_account");
      if (error) throw error;
      await sb.auth.signOut();
      router.push("/");
      toast.success("Account and all data erased.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the account.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Masthead />
      <main id="pp-main" className="mx-auto max-w-2xl px-5 sm:px-8">
        <section className="py-8">
          <h1 className="font-display text-3xl font-semibold">Account settings</h1>
          <p className="mt-1 text-sm text-mute">{session?.user?.email}</p>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Cook name</h2>
          <p className="mt-1 text-xs text-mute">
            Shown on the community board and the top-cooks list.
          </p>
          <label className="mt-3 block text-sm font-bold" htmlFor="display-name">
            Display name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="display-name"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              className="h-11 min-w-0 flex-1 px-3 text-base font-normal"
            />
            <button
              type="button"
              onClick={() => void saveName()}
              disabled={savingName}
              className="min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Password</h2>
          <label className="mt-3 block text-sm font-bold" htmlFor="new-password">
            New password
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="new-password"
              type="password"
              value={newPassword}
              minLength={6}
              autoComplete="new-password"
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 min-w-0 flex-1 px-3 text-base font-normal"
            />
            <button
              type="button"
              onClick={() => void changePassword()}
              disabled={savingPassword || newPassword.length < 6}
              className="min-h-11 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb disabled:opacity-60"
            >
              Change
            </button>
          </div>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Your data</h2>
          <p className="mt-1 text-xs text-mute">
            Your privacy note (Section 8) promises a copy of your data: here it is as
            one JSON file — profile, plans, pantry settings.
          </p>
          <button
            type="button"
            onClick={() => void exportData()}
            className="mt-3 min-h-11 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-herb hover:text-herb"
          >
            Download my data
          </button>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Sessions</h2>
          <p className="mt-1 text-xs text-mute">
            Signed in on a shared computer? End every session on every device.
          </p>
          <button
            type="button"
            onClick={async () => {
              const sb = db();
              await sb?.auth.signOut({ scope: "global" });
              router.push("/");
              toast.success("Signed out everywhere.");
            }}
            className="mt-3 min-h-11 rounded-sm border border-line px-4 text-sm font-bold transition-colors hover:border-brake hover:text-brake"
          >
            Sign out everywhere
          </button>
        </section>

        <section className="index-card mb-10 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-brake">Danger zone</h2>
          <p className="mt-1 text-xs text-mute">
            Deleting your account erases your profile, plans, shared posts, likes and
            chats immediately. This cannot be undone — download your data first.
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-3 min-h-11 rounded-sm border border-brake px-4 text-sm font-bold text-brake transition-colors hover:bg-brake hover:text-on-brake"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleting}
                className="min-h-11 rounded-sm bg-brake px-4 text-sm font-bold text-on-brake disabled:opacity-60"
              >
                Yes, erase everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-11 rounded-sm border border-line px-4 text-sm font-bold"
              >
                Keep my account
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
