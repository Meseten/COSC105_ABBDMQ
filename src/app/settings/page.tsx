"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Masthead from "@/components/Masthead";
import BackButton from "@/components/BackButton";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";
import { signOut, useProfile, useSession } from "@/lib/auth";
import { Lock } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

/** Reads the current look: stored pick, or system when nothing chose yet. */
type ThemeChoice = "system" | "light" | "dark";

function readThemeChoice(): ThemeChoice {
  try {
    const t = localStorage.getItem("pantrypal.theme");
    if (t === "light" || t === "dark") return t;
  } catch {
    /* private mode keeps the system default */
  }
  return "system";
}

function applyThemeChoice(choice: ThemeChoice): void {
  try {
    if (choice === "system") localStorage.removeItem("pantrypal.theme");
    else localStorage.setItem("pantrypal.theme", choice);
  } catch {
    /* the attribute below still rules this visit */
  }
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = choice === "system" ? (systemDark ? "dark" : "light") : choice;
  document.documentElement.setAttribute("data-theme", resolved);
  if (choice === "system") document.documentElement.removeAttribute("data-theme");
}

export default function SettingsPage() {
  const session = useSession();
  const { profile, refresh } = useProfile();
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // appearance
  const [theme, setTheme] = useState<ThemeChoice>("system");
  // planner defaults
  const [household, setHousehold] = useState("");
  const [budget, setBudget] = useState("");
  const [savingKitchen, setSavingKitchen] = useState(false);
  // the bell
  const [bell, setBell] = useState({ follows: true, likes: true, comments: true, saves: true });
  const [savingBell, setSavingBell] = useState(false);

  const signedIn = session !== undefined && session !== null && !session.user.is_anonymous;
  const isAnonSession = session !== undefined && session !== null && session.user.is_anonymous;

  useEffect(() => {
    if (profile) {
      setName(profile.display_name);
      setBio(profile.bio);
      setPrivacy(profile.is_private);
      setHousehold(profile.default_household ? String(profile.default_household) : "");
      setBudget(
        profile.default_budget !== null && profile.default_budget !== undefined
          ? String(profile.default_budget)
          : "",
      );
      setBell({
        follows: profile.notif_follows,
        likes: profile.notif_likes,
        comments: profile.notif_comments,
        saves: profile.notif_saves,
      });
    }
  }, [profile]);

  useEffect(() => {
    setTheme(readThemeChoice());
  }, []);

  if (session === undefined) {
    return (
      <>
        <Masthead />
        <main id="pp-main" className="mx-auto max-w-2xl px-5 py-12">
          <BackButton fallbackHref="/" label="Back to the planner" />
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
            {isAnonSession ? "Using coci without an account" : "Not signed in"}
          </h1>
          <p className="mt-2 text-sm text-mute">
            Account settings (name, password, data copy, deletion) belong to a
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

  const savePrivacy = async (nextPrivate: boolean, nextBio: string) => {
    setSavingPrivacy(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb
        .from("profiles")
        .update({ is_private: nextPrivate, bio: nextBio.trim().slice(0, 200) })
        .eq("id", (await sb.auth.getUser()).data.user?.id ?? "");
      if (error) throw error;
      await refresh();
      toast.success(
        nextPrivate
          ? "Your kitchen is private. Only your crew sees your boards."
          : "Your kitchen is open to everyone now.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update privacy.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const saveKitchen = async () => {
    setSavingKitchen(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const people = parseInt(household, 10);
      const total = parseFloat(budget);
      const { error } = await sb
        .from("profiles")
        .update({
          default_household:
            Number.isFinite(people) && people >= 1 && people <= 12 ? people : null,
          default_budget:
            Number.isFinite(total) && total >= 0 ? Number(total.toFixed(2)) : null,
        })
        .eq("id", (await sb.auth.getUser()).data.user?.id ?? "");
      if (error) throw error;
      await refresh();
      toast.success("Kitchen defaults set. The planner greets you with them.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the defaults.");
    } finally {
      setSavingKitchen(false);
    }
  };

  const saveBell = async () => {
    setSavingBell(true);
    try {
      const sb = db();
      if (!sb) throw new Error("Storage not configured.");
      const { error } = await sb
        .from("profiles")
        .update({
          notif_follows: bell.follows,
          notif_likes: bell.likes,
          notif_comments: bell.comments,
          notif_saves: bell.saves,
        })
        .eq("id", (await sb.auth.getUser()).data.user?.id ?? "");
      if (error) throw error;
      await refresh();
      toast.success("Bell settings kept.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the bell.");
    } finally {
      setSavingBell(false);
    }
  };

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
        <BackButton fallbackHref="/" label="Back to the planner" />
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
          <h2 className="font-display text-xl font-semibold">Privacy</h2>
          <p className="mt-1 text-xs text-mute">
            Decide who can read your boards on the community page and how you introduce
            yourself.
          </p>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-1 size-5 accent-[color:var(--herb)]"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-bold">
                <Lock className="size-4" aria-hidden="true" /> Private kitchen
              </span>
              <span className="mt-0.5 block text-xs text-mute">
                When on, only people who follow you see your shared boards. Everything else
                (plans, groceries, chat) stays yours alone in both modes.
              </span>
            </span>
          </label>
          <label className="mt-4 block text-sm font-bold" htmlFor="cook-bio">
            Kitchen bio (shown as your line on your crew page)
          </label>
          <textarea
            id="cook-bio"
            value={bio}
            maxLength={200}
            rows={2}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ulam of the week enthusiast, budget cooker."
            className="mt-1 min-h-16 w-full px-3 py-2 text-base font-normal"
          />
          <button
            type="button"
            onClick={() => void savePrivacy(privacy, bio)}
            disabled={savingPrivacy}
            className="mt-3 min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save privacy
          </button>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Appearance</h2>
          <p className="mt-1 text-xs text-mute">
            The app follows your system by default. Tie it down here.
          </p>
          <fieldset className="mt-3">
            <legend className="sr-only">Theme</legend>
            <div className="flex flex-wrap gap-2">
              {([
                ["system", "Follow the system"],
                ["light", "Light table"],
                ["dark", "Dark night market"],
              ] as [ThemeChoice, string][]).map(([value, label]) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border px-3 text-sm font-bold has-[:checked]:border-herb has-[:checked]:bg-paper-deep"
                >
                  <input
                    type="radio"
                    name="appearance"
                    checked={theme === value}
                    onChange={() => {
                      setTheme(value);
                      applyThemeChoice(value);
                    }}
                    className="size-4 accent-[color:var(--herb)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Kitchen preferences</h2>
          <p className="mt-1 text-xs text-mute">
            Greet every plan with your usual number of plates and weekly budget.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold" htmlFor="default-household">
              Plates at the table
              <input
                id="default-household"
                type="number"
                min={1}
                max={12}
                value={household}
                onChange={(e) => setHousehold(e.target.value)}
                placeholder="2"
                className="mt-1 h-11 w-full px-3 text-base font-normal"
              />
            </label>
            <label className="block text-sm font-bold" htmlFor="default-budget">
              Weekly budget (p, empty to skip)
              <input
                id="default-budget"
                type="number"
                min={0}
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="2500"
                className="mt-1 h-11 w-full px-3 text-base font-normal"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void saveKitchen()}
            disabled={savingKitchen}
            className="mt-3 min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save kitchen defaults
          </button>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Your bell</h2>
          <p className="mt-1 text-xs text-mute">
            Choose what still rings. The bell never pings you for your own moves.
          </p>
          <div className="mt-3 grid gap-2">
            {(
              [
                ["follows", "Someone follows me"],
                ["likes", "Someone taps the heart on my board"],
                ["comments", "Someone drops a chika on my board"],
                ["saves", "Someone shelves my board to try"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-3 text-sm font-bold has-[:checked]:border-herb has-[:checked]:bg-paper-deep"
              >
                <input
                  type="checkbox"
                  checked={bell[key]}
                  onChange={(e) => setBell((b) => ({ ...b, [key]: e.target.checked }))}
                  className="size-4 accent-[color:var(--herb)]"
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveBell()}
            disabled={savingBell}
            className="mt-3 min-h-11 rounded-sm bg-herb px-4 text-sm font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Save bell settings
          </button>
        </section>

        <section className="index-card mb-4 p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Password</h2>
          <label className="mt-3 block text-sm font-bold" htmlFor="new-password">
            New password
          </label>
          <div className="mt-1 flex gap-2">
            <PasswordInput
              id="new-password"
              value={newPassword}
              minLength={6}
              autoComplete="new-password"
              onChange={setNewPassword}
              placeholder="At least 6 characters"
              className="h-11 min-w-0 flex-1 px-3 pr-10 text-base font-normal"
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
            one JSON file: profile, plans, pantry settings.
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
            chats immediately. This cannot be undone, so download your data first.
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
