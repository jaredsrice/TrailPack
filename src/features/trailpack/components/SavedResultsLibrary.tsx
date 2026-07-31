"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteSavedResultFromRoute, listSavedResultsFromRoute } from "@/features/trailpack/lib/saved-results-client";
import { getSupabaseBrowserClient } from "@/features/trailpack/lib/supabase/browser";
import type { SavedResultRecord } from "@/features/trailpack/lib/saved-results";
import type { SourceLabel } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";
import { TrailPackIcon } from "./TrailPackIcon";

type LibraryState =
  | { status: "loading" }
  | { status: "unavailable" | "signed-out" | "error" }
  | { status: "ready"; results: SavedResultRecord[] };

export function SavedResultsLibrary() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState({ status: "unavailable" });
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active) {
        return;
      }
      if (error || !data.user) {
        setState({ status: "signed-out" });
        return;
      }

      try {
        const results = await listSavedResultsFromRoute();
        if (active) {
          setState({ status: "ready", results });
        }
      } catch {
        if (active) {
          setState({ status: "error" });
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSavedResultFromRoute(id);
      setState((current) =>
        current.status === "ready"
          ? { status: "ready", results: current.results.filter((result) => result.id !== id) }
          : current,
      );
    } catch {
      setState({ status: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-10 sm:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 underline underline-offset-4">
        <TrailPackIcon name="chevron" className="h-4 w-4 rotate-180" />
        Plan another hike
      </Link>
      <header className="mt-8 border-b border-slate-200 pb-6">
        <p className="section-kicker">Private TrailPack account</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Saved plans</h1>
        <p className="mt-2 text-slate-700">Only plans saved under your signed-in account appear here.</p>
      </header>

      {state.status === "loading" ? <p className="mt-8 text-slate-700">Loading saved plans…</p> : null}
      {state.status === "unavailable" ? <p className="mt-8 text-slate-700">Saved plans are not configured on this deployment.</p> : null}
      {state.status === "signed-out" ? <p className="mt-8 text-slate-700">Sign in from a generated packing list to view your saved plans.</p> : null}
      {state.status === "error" ? <p className="mt-8 text-red-800">TrailPack could not load saved plans. Please try again.</p> : null}
      {state.status === "ready" && state.results.length === 0 ? <p className="mt-8 text-slate-700">You have not saved a plan yet.</p> : null}

      {state.status === "ready" ? (
        <div className="mt-8 space-y-4">
          {state.results.map((result) => (
            <article key={result.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{result.trailSummary.name}</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    {result.trailSummary.park ? `${result.trailSummary.park} · ` : ""}
                    Saved {new Date(result.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(result.id)}
                  disabled={deletingId === result.id}
                  className="self-start rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 disabled:cursor-wait disabled:opacity-70"
                >
                  {deletingId === result.id ? "Deleting…" : "Delete"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {result.sourceLabels.map((label) => <SourceBadge key={label} label={label as SourceLabel} />)}
              </div>
              <details className="mt-5 rounded-lg border border-slate-200 px-4 py-3">
                <summary className="cursor-pointer font-semibold text-slate-900">Revisit packing list</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SavedItemGroup title="Essential" items={result.recommendation.essential} />
                  <SavedItemGroup title="Optional" items={result.recommendation.optional} />
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function SavedItemGroup({ title, items }: { title: string; items: SavedResultRecord["recommendation"]["essential"] }) {
  return (
    <section>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {items.map((item) => <li key={`${title}-${item.name}`}><strong>{item.name}:</strong> {item.recommendation}</li>)}
      </ul>
    </section>
  );
}
