"use client";
import { useEffect, useRef, useState } from "react";
import { NPS_LOOKUP_PARKS, normalizeNpsLookup, parseLookupQuery, type NpsLookupOutcome, type NpsLookupTrail, type NpsLookupQuery } from "../lib/nps-lookup";
import { readTextWithinLimit } from "../lib/read-text-with-limit";

const messages: Record<Exclude<NpsLookupOutcome["status"], "ok">, string> = {
  empty: "No matching NPS hiking records with usable duration were found.",
  "invalid-query": "Enter a trail name of 3–100 characters.",
  "rate-limited": "NPS lookup is busy. Please wait before trying again.",
  timeout: "NPS lookup took too long.",
  "provider-error": "NPS lookup could not finish.",
  "invalid-response": "NPS returned information this lookup cannot safely use.",
  unavailable: "Live NPS lookup is unavailable.",
};

export function NpsTrailLookup({ query, onSelect }: { query: string; onSelect: (trail: NpsLookupTrail) => void }) {
  const [parkCode, setParkCode] = useState<NpsLookupQuery["parkCode"]>("zion");
  const [state, setState] = useState<NpsLookupOutcome | { status: "idle" | "loading" }>({ status: "idle" });
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  function clear() {
    active.current?.abort();
    active.current = null;
    setState({ status: "idle" });
  }
  async function search() {
    const input = parseLookupQuery({ q: query, parkCode });
    if (!input) { setState({ status: "invalid-query" }); return; }
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setState({ status: "loading" });
    const deadline = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/trailpack/nps-lookup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input), signal: controller.signal,
      });
      const body = await readTextWithinLimit(response, 16 * 1024);
      if (body.status !== "ok") {
        if (active.current === controller) setState({ status: "invalid-response" });
        return;
      }
      let value: NpsLookupOutcome;
      try {
        value = JSON.parse(body.text) as NpsLookupOutcome;
      } catch {
        if (active.current === controller) setState({ status: "invalid-response" });
        return;
      }
      if (!value || typeof value !== "object") {
        if (active.current === controller) setState({ status: "invalid-response" });
        return;
      }
      let outcome: NpsLookupOutcome;
      if (value.status === "ok" && Array.isArray(value.results) && value.results.length <= 5) {
        // Revalidate links and facts before exposing any provider-derived result.
        const results = value.results.flatMap((r) => {
          if (!r || typeof r !== "object" || r.kind !== "nps-live-lookup" ||
            typeof r.retrievedAt !== "string" || !Number.isFinite(Date.parse(r.retrievedAt))) return [];
          return normalizeNpsLookup({ data: [{
            id: r.id, title: r.title, url: r.sourceUrl, duration: r.duration,
            relatedParks: [{ parkCode: r.parkCode, fullName: r.park, states: r.state }],
            activities: [{ name: "Hiking" }],
          }] }, input, r.retrievedAt) ?? [];
        });
        outcome = results.length === value.results.length && results.length
          ? { status: "ok", results } : { status: "invalid-response" };
      } else if (typeof value.status === "string" && Object.hasOwn(messages, value.status)) {
        outcome = { status: value.status as keyof typeof messages };
      } else { outcome = { status: "invalid-response" }; }
      if (active.current === controller) setState(outcome);
    } catch {
      if (active.current === controller) setState({ status: controller.signal.aborted ? "timeout" : "unavailable" });
    } finally { window.clearTimeout(deadline); }
  }
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
      <summary className="cursor-pointer font-semibold">Search live NPS hikes</summary>
      <p className="mt-3 text-sm">Limited to hiking records in three parks. Results have partial facts, not complete verified trail profiles. Your trail search text is sent to NPS only when you search.</p>
      <label className="mt-3 block text-sm">
        NPS lookup park
        <select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3"
          value={parkCode} onChange={(event) => { clear(); setParkCode(event.target.value as NpsLookupQuery["parkCode"]); }}>
          {Object.entries(NPS_LOOKUP_PARKS).map(([id, park]) => <option key={id} value={id}>{park.name}</option>)}
        </select>
      </label>
      <button type="button" className="plan-generation-button mt-3" onClick={() => void search()} disabled={state.status === "loading"}>
        {state.status === "loading" ? "Searching NPS..." : "Search NPS"}
      </button>
      <div role="status" className="mt-3 text-sm">
        {state.status === "loading" ? "Looking for matching hiking records." :
          state.status === "ok" ? `${state.results.length} matching records. Confirm the name and park before choosing.` :
          state.status !== "idle" ? `${messages[state.status]} Manual entry is still available in Suggestions above.` : null}
      </div>
      {state.status === "ok" ? <ul className="mt-3 space-y-3">
        {state.results.map((trail) => <li key={trail.id} className="rounded-lg border border-slate-200 p-3">
          <p className="font-semibold">{trail.title}</p>
          <p className="text-sm">{trail.park}, {trail.state} · NPS duration: {trail.duration}</p>
          <p className="text-sm">Distance, elevation, and route type are not supplied by this lookup.</p>
          <a className="text-sm underline" href={trail.sourceUrl} target="_blank" rel="noreferrer">View NPS source</a>
          <button className="suggestion-button mt-2 w-full" type="button" onClick={() => onSelect(trail)}>Use {trail.title}</button>
        </li>)}
      </ul> : null}
    </details>
  );
}
