"use client";

import { useMemo, useState } from "react";
import { getDemoScenario } from "@/data/demo-contexts";
import {
  getTrailsForPark,
  SUPPORTED_PARKS,
  SUPPORTED_TRAILS,
} from "@/data/supported-trails";
import {
  generateManualEntryRecommendation,
  generatePackingRecommendation,
  type UserHikeInput,
} from "@/lib/packing";
import {
  buildClearedSearchState,
  buildManualSelectionState,
  buildParkSelectionState,
  buildTrailSelectionState,
  type FlowMode,
} from "@/lib/trailpack-flow";
import { getSearchSuggestions, type SearchSuggestion } from "@/lib/search";
import type { TrailProfile } from "@/types/trailpack";
import { MissingDetailPrompts } from "./MissingDetailPrompts";
import { PackingListOutput } from "./PackingListOutput";
import { TrailProfileSummary } from "./TrailProfileSummary";

function suggestionBadge(type: SearchSuggestion["type"]): string {
  switch (type) {
    case "park":
      return "Supported park";
    case "trail":
      return "Supported trail";
    case "manual":
      return "Manual entry";
  }
}

export function TrailPackShell() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FlowMode>("search");
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<TrailProfile | null>(null);
  const [userInput, setUserInput] = useState<UserHikeInput>({});

  const suggestions = useMemo(() => getSearchSuggestions(query), [query]);
  const parkTrails = selectedParkId ? getTrailsForPark(selectedParkId) : [];
  const selectedPark = SUPPORTED_PARKS.find((park) => park.id === selectedParkId);
  const selectedScenario = getDemoScenario(selectedTrail?.id);

  const recommendation = useMemo(() => {
    if (mode === "manual") {
      return generateManualEntryRecommendation(userInput);
    }

    if (!selectedTrail || !selectedScenario) {
      return null;
    }

    return generatePackingRecommendation(
      selectedTrail,
      {
        ...selectedScenario.weather,
        plannedDate: userInput.plannedDate ?? selectedScenario.weather.plannedDate,
      },
      selectedScenario.alerts,
      userInput,
    );
  }, [mode, selectedScenario, selectedTrail, userInput]);

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    if (suggestion.type === "manual") {
      const next = buildManualSelectionState(query);
      setMode(next.mode);
      setSelectedParkId(next.selectedParkId);
      setSelectedTrail(next.selectedTrail);
      setQuery(next.query);
      setUserInput(next.userInput);
      return;
    }

    if (suggestion.type === "park" && suggestion.parkId) {
      const next = buildParkSelectionState(suggestion.parkId, suggestion.title);
      setMode(next.mode);
      setSelectedParkId(next.selectedParkId);
      setSelectedTrail(next.selectedTrail);
      setQuery(next.query);
      setUserInput(next.userInput);
      return;
    }

    if (suggestion.type === "trail" && suggestion.trailId) {
      const trail = SUPPORTED_TRAILS[suggestion.trailId];
      if (!trail) {
        return;
      }

      const next = buildTrailSelectionState(trail, suggestion.parkId ?? null);
      setMode(next.mode);
      setSelectedParkId(next.selectedParkId);
      setSelectedTrail(next.selectedTrail);
      setQuery(next.query);
      setUserInput(next.userInput);
    }
  }

  function handleTrailSelect(trailId: string) {
    const trail = SUPPORTED_TRAILS[trailId];
    if (!trail) {
      return;
    }

    const next = buildTrailSelectionState(trail, selectedParkId);
    setMode(next.mode);
    setSelectedParkId(next.selectedParkId);
    setSelectedTrail(next.selectedTrail);
    setQuery(next.query);
    setUserInput(next.userInput);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section
        className="relative overflow-hidden px-6 pb-10 pt-8 text-white"
        style={{
          background: "linear-gradient(135deg, var(--hero-from), var(--hero-to))",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
            TrailPack
          </p>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Where would you like to go?
          </h1>
          <p className="mt-3 max-w-2xl text-base text-emerald-50/90">
            Search a supported park or trail, then get a rule-based packing list built from
            official trail stats and trip context.
          </p>

          <div className="mt-8">
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (!event.target.value) {
                  const next = buildClearedSearchState();
                  setMode(next.mode);
                  setSelectedParkId(next.selectedParkId);
                  setSelectedTrail(next.selectedTrail);
                  setUserInput(next.userInput);
                }
              }}
              placeholder="Search a park or trail..."
              className="w-full max-w-2xl rounded-full border border-white/20 bg-white px-6 py-4 text-base text-slate-800 shadow-lg outline-none ring-emerald-300 focus:ring-4"
            />
          </div>

          {query.trim() ? (
            <div className="mt-6">
              <p className="text-sm font-semibold text-emerald-100">Suggestions</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      suggestion.type === "manual"
                        ? "border-amber-300 bg-amber-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {suggestionBadge(suggestion.type)}
                    </p>
                    <p className="mt-1 font-semibold">{suggestion.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{suggestion.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {mode === "park" && selectedPark ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Selected park</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{selectedPark.name}</h2>
            <p className="mt-1 text-slate-600">{selectedPark.state}</p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">Choose a supported trail</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {parkTrails.map((trail) => (
                  <button
                    key={trail.id}
                    type="button"
                    onClick={() => handleTrailSelect(trail.id)}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
                  >
                    <p className="font-semibold text-emerald-950">{trail.name}</p>
                    <p className="mt-1 text-sm text-emerald-800">
                      {trail.distanceMiles.value} mi · {trail.elevationGainFeet.value} ft gain ·{" "}
                      {trail.difficulty.value}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {mode === "manual" ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-950">Manual hike entry</h2>
            <p className="mt-2 text-sm text-amber-900">
              Manual entry is still the fallback for unsupported hikes. Week 8 now supports Jenny
              Lake Loop, Taggart Lake, and String Lake Loop in Grand Teton National Park.
            </p>
          </section>
        ) : null}

        {selectedTrail ? <TrailProfileSummary trail={selectedTrail} /> : null}

        {selectedTrail || mode === "manual" ? (
          <MissingDetailPrompts value={userInput} onChange={setUserInput} />
        ) : null}

        {recommendation ? <PackingListOutput recommendation={recommendation} /> : null}
      </div>
    </main>
  );
}
