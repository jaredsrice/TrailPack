"use client";

import { useEffect, useState } from "react";
import type { UserHikeInput } from "@/features/trailpack/lib/packing";
import { buildSavedResultDraft } from "@/features/trailpack/lib/saved-results";
import { saveResultFromRoute } from "@/features/trailpack/lib/saved-results-client";
import { getSupabaseBrowserClient } from "@/features/trailpack/lib/supabase/browser";
import type { PackingRecommendation, TrailProfile } from "@/features/trailpack/types";
import { TrailPackIcon } from "./TrailPackIcon";

type AccountState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "signed-out" }
  | { status: "signed-in"; email: string | null };

export function SavedResultActions({
  trail,
  userInput,
  recommendation,
}: {
  trail: TrailProfile | null;
  userInput: UserHikeInput;
  recommendation: PackingRecommendation;
}) {
  const [accountState, setAccountState] = useState<AccountState>({ status: "loading" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAccountState({ status: "unavailable" });
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) {
        return;
      }
      setAccountState(
        !error && data.user
          ? { status: "signed-in", email: data.user.email ?? null }
          : { status: "signed-out" },
      );
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleGoogleSignIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAccountState({ status: "unavailable" });
      return;
    }

    const callbackPath = `/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${callbackPath}` },
    });
    if (error || !data.url) {
      setSaveState("error");
      return;
    }

    window.location.assign(data.url);
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      await saveResultFromRoute(
        buildSavedResultDraft({ trail, userInput, recommendation }),
      );
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    await supabase.auth.signOut();
    setAccountState({ status: "signed-out" });
    setSaveState("idle");
  }

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm" aria-labelledby="save-plan-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-kicker">Keep this plan</p>
          <h2 id="save-plan-heading" className="text-xl font-semibold text-slate-950">
            Save a private copy
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-700">
            Your saved plan includes the trail summary, trip details that affect
            the list, recommendation, source labels, and creation time. Free-form notes are not saved.
          </p>
        </div>

        {accountState.status === "signed-in" ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              <TrailPackIcon name="shield" className="h-4 w-4" />
              {saveState === "saving" ? "Saving…" : "Save this plan"}
            </button>
            <a href="/saved" className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900">
              Saved plans
            </a>
          </div>
        ) : accountState.status === "signed-out" ? (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Continue with Google
          </button>
        ) : null}
      </div>

      {accountState.status === "signed-in" ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
          <span>Signed in{accountState.email ? ` as ${accountState.email}` : ""}.</span>
          <button type="button" onClick={handleSignOut} className="font-semibold text-emerald-900 underline underline-offset-2">
            Sign out
          </button>
          {saveState === "saved" ? <span className="font-medium text-emerald-800">Saved privately.</span> : null}
          {saveState === "error" ? <span className="font-medium text-red-800">TrailPack could not save this plan. Please try again.</span> : null}
        </div>
      ) : null}

      {accountState.status === "unavailable" ? (
        <p className="mt-4 text-sm text-slate-700">
          Saved plans are not configured on this deployment yet. You can still use the full guest planner without an account.
        </p>
      ) : null}
    </section>
  );
}
