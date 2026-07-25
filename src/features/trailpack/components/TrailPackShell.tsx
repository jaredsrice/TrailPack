"use client";

import { useEffect, useMemo, useState } from "react";
import { getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import { getSavedAiReviewFixture } from "@/features/trailpack/data/ai-review-fixtures";
import {
  getTrailById,
  getTrailsForPark,
  SUPPORTED_PARKS,
  SUPPORTED_TRAILS,
} from "@/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  buildGuardedAiReview,
  type AiContractInput,
  type LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import { requestLiveAiReviewFromRoute } from "@/features/trailpack/lib/ai-review-client";
import {
  generateManualEntryRecommendation,
  generatePackingRecommendation,
  type UserHikeInput,
} from "@/features/trailpack/lib/packing";
import { requestTrailWeather } from "@/features/trailpack/lib/weather-client";
import {
  buildClearedSearchState,
  buildManualSelectionState,
  buildParkSelectionState,
  buildTrailSelectionState,
  type FlowMode,
} from "@/features/trailpack/lib/trailpack-flow";
import { getSearchSuggestions, type SearchSuggestion } from "@/features/trailpack/lib/search";
import type { TrailProfile, WeatherContext } from "@/features/trailpack/types";
import { AiReviewPanel } from "./AiReviewPanel";
import { ContextStatusPanel } from "./ContextStatusPanel";
import { MissingDetailPrompts } from "./MissingDetailPrompts";
import { ParkPhotoShowcase } from "./ParkPhotoShowcase";
import { PackingListOutput } from "./PackingListOutput";
import { TrailPackIcon } from "./TrailPackIcon";
import { TrailProfileSummary } from "./TrailProfileSummary";

const QUICK_START_TRAIL_IDS = [
  "jenny-lake-loop",
  "taggart-lake",
  "string-lake-loop",
] as const;

type LiveAiUiState =
  | { status: "idle" }
  | { status: "loading"; input: AiContractInput }
  | {
      status: "ready";
      input: AiContractInput;
      result: LiveAiReviewResult;
    }
  | { status: "error"; input: AiContractInput; message: string };

type WeatherUiState =
  | { status: "idle" }
  | {
      status: "loading" | "ready";
      requestKey: string;
      weather: WeatherContext;
    };

function alignSavedWeatherToDate(
  weather: WeatherContext,
  plannedDate: string | undefined,
): WeatherContext {
  if (!plannedDate || plannedDate === weather.plannedDate) {
    return weather;
  }

  return {
    ...weather,
    plannedDate,
    forecastPeriods: weather.forecastPeriods?.map((period) => ({
      ...period,
      time: period.time.includes("T")
        ? `${plannedDate}${period.time.slice(period.time.indexOf("T"))}`
        : period.time,
    })),
    daylight: undefined,
    retrievalStatus: "saved-fixture",
    statusReason:
      "Saved example conditions are shown while TrailPack requests the selected day's live forecast.",
  };
}

function suggestionBadge(type: SearchSuggestion["type"]): string {
  switch (type) {
    case "park":
      return "Supported park";
    case "trail":
      return "Supported trail";
    case "public-trail":
      return "Verified public trail";
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
  const [liveAiState, setLiveAiState] = useState<LiveAiUiState>({
    status: "idle",
  });
  const [weatherState, setWeatherState] = useState<WeatherUiState>({
    status: "idle",
  });

  const suggestions = useMemo(() => getSearchSuggestions(query), [query]);
  const parkTrails = selectedParkId ? getTrailsForPark(selectedParkId) : [];
  const selectedPark = SUPPORTED_PARKS.find((park) => park.id === selectedParkId);
  const selectedScenario = getDemoScenario(selectedTrail?.id);
  const savedWeather = useMemo(
    () =>
      selectedScenario
        ? alignSavedWeatherToDate(
            selectedScenario.weather,
            userInput.plannedDate,
          )
        : null,
    [selectedScenario, userInput.plannedDate],
  );
  const weatherRequestKey =
    selectedTrail && savedWeather
      ? `${selectedTrail.id}:${userInput.plannedDate ?? "today"}`
      : null;
  const hasCurrentWeatherState =
    weatherRequestKey !== null &&
    weatherState.status !== "idle" &&
    weatherState.requestKey === weatherRequestKey;
  const weather = hasCurrentWeatherState
    ? weatherState.weather
    : savedWeather;
  const isWeatherLoading =
    hasCurrentWeatherState && weatherState.status === "loading";

  useEffect(() => {
    if (!weatherRequestKey || !selectedTrail || !savedWeather) {
      setWeatherState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    let active = true;

    setWeatherState({
      status: "loading",
      requestKey: weatherRequestKey,
      weather: savedWeather,
    });

    void requestTrailWeather(selectedTrail.id, {
      plannedDate: userInput.plannedDate,
      signal: controller.signal,
    })
      .then((liveWeather) => {
        if (!active) {
          return;
        }

        setWeatherState({
          status: "ready",
          requestKey: weatherRequestKey,
          weather: liveWeather,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setWeatherState({
          status: "ready",
          requestKey: weatherRequestKey,
          weather: {
            ...savedWeather,
            retrievalStatus: "saved-fixture",
            statusReason:
              "The live forecast could not be loaded. TrailPack is showing saved example conditions instead.",
          },
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    savedWeather,
    selectedTrail,
    userInput.plannedDate,
    weatherRequestKey,
  ]);

  const recommendation = useMemo(() => {
    if (mode === "manual") {
      return generateManualEntryRecommendation(userInput);
    }

    if (!selectedTrail || !selectedScenario || !weather) {
      return null;
    }

    return generatePackingRecommendation(
      selectedTrail,
      weather,
      selectedScenario.alerts,
      userInput,
    );
  }, [mode, selectedScenario, selectedTrail, userInput, weather]);

  const aiInput = useMemo(() => {
    if (!selectedTrail || !selectedScenario || !recommendation || !weather) {
      return null;
    }

    return buildAiContractInput({
      trail: selectedTrail,
      weather,
      alerts: selectedScenario.alerts,
      userInput,
      recommendation,
    });
  }, [recommendation, selectedScenario, selectedTrail, userInput, weather]);

  const savedAiReview = useMemo(() => {
    if (!aiInput) {
      return null;
    }

    return buildGuardedAiReview(
      aiInput,
      aiInput.weather.retrievalStatus === "saved-fixture"
        ? getSavedAiReviewFixture(aiInput.trail.id)
        : null,
    );
  }, [aiInput]);

  const hasCurrentLiveState =
    aiInput !== null &&
    liveAiState.status !== "idle" &&
    liveAiState.input === aiInput;
  const currentLiveAiState = hasCurrentLiveState ? liveAiState : null;
  const displayedAiReview =
    currentLiveAiState?.status === "ready"
      ? currentLiveAiState.result.review
      : savedAiReview;

  async function handleLiveAiReview() {
    if (!aiInput) {
      return;
    }

    const requestedInput = aiInput;
    setLiveAiState({ status: "loading", input: requestedInput });

    try {
      const result = await requestLiveAiReviewFromRoute(requestedInput);
      setLiveAiState({
        status: "ready",
        input: requestedInput,
        result,
      });
    } catch {
      setLiveAiState({
        status: "error",
        input: requestedInput,
        message:
          "TrailPack could not complete the live AI review. The rule-based list remains available.",
      });
    }
  }

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

    if (
      (suggestion.type === "trail" || suggestion.type === "public-trail") &&
      suggestion.trailId
    ) {
      const trail = getTrailById(suggestion.trailId);
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
    const trail = getTrailById(trailId);
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
    <main className="trailpack-app">
      <header className="site-masthead">
        <div className="site-masthead-inner">
          <a href="#main-content" className="brand-lockup" aria-label="TrailPack home">
            <span className="brand-mark">
              <TrailPackIcon name="logo" className="h-7 w-7" />
            </span>
            <span>TrailPack</span>
          </a>
          <p className="masthead-note">Rule-based packing guidance</p>
        </div>
      </header>

      <section className="home-hero" aria-labelledby="trailpack-heading">
        <div className="home-hero-inner">
          <div className="hero-search-column">
            <p className="section-kicker">Plan with traceable trail context</p>
            <h1 id="trailpack-heading" className="hero-heading">
              Choose a trail.
              <span>Prepare intelligently.</span>
            </h1>
            <p className="hero-description">
              Search a supported park, curated trail, or verified public-source
              import, then build a focused packing list from trail facts,
              forecast context, and official alerts.
            </p>

            <label className="search-field">
              <span className="sr-only">Search a park or trail</span>
              <TrailPackIcon name="search" className="search-field-icon" />
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
              />
            </label>

            {query.trim() ? (
              <div className="search-results" aria-label="Search suggestions">
                <p className="search-label">Suggestions</p>
                <div className="suggestion-grid">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={`suggestion-button ${
                        suggestion.type === "manual" ? "is-manual" : ""
                      }`}
                    >
                      <span className="suggestion-type">
                        {suggestionBadge(suggestion.type)}
                      </span>
                      <span className="suggestion-title">{suggestion.title}</span>
                      <span className="suggestion-subtitle">
                        {suggestion.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : mode === "search" ? (
              <div className="quick-starts">
                <p className="search-label">Quick starts</p>
                <div className="quick-start-list">
                  {QUICK_START_TRAIL_IDS.map((trailId) => {
                    const trail = SUPPORTED_TRAILS[trailId];
                    return (
                      <button
                        key={trail.id}
                        type="button"
                        onClick={() => handleTrailSelect(trail.id)}
                        className="quick-start-button"
                      >
                        <TrailPackIcon name="trail" className="h-4 w-4" />
                        <span>
                          <strong>{trail.name}</strong>
                          <small>
                            {trail.distanceMiles.value} mi ·{" "}
                            {trail.elevationGainFeet.value} ft
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <ParkPhotoShowcase
            selectedParkId={selectedParkId}
            selectedTrailId={selectedTrail?.id ?? null}
          />
        </div>
      </section>

      <div id="main-content" className="content-flow">
        {mode === "park" && selectedPark ? (
          <section className="selection-band">
            <div className="section-heading-row">
              <div>
                <p className="section-kicker">Selected park</p>
                <h2 className="section-title">{selectedPark.name}</h2>
                <p className="section-subtitle">{selectedPark.state}</p>
              </div>
              <TrailPackIcon name="trail" className="section-heading-icon" />
            </div>

            <div className="park-trail-picker">
              <p className="picker-label">
                Choose a curated or verified public-source trail
              </p>
              <div className="park-trail-grid">
                {parkTrails.map((trail) => (
                  <button
                    key={trail.id}
                    type="button"
                    onClick={() => handleTrailSelect(trail.id)}
                    className="park-trail-button"
                  >
                    <span className="park-trail-name">{trail.name}</span>
                    <span className="park-trail-source">
                      {trail.profileKind === "public-source-import"
                        ? "Verified NPS + USGS import"
                        : "Curated profile"}
                    </span>
                    <span className="park-trail-stats">
                      {trail.distanceMiles.value} mi ·{" "}
                      {trail.elevationGainFeet.value} ft gain ·{" "}
                      {trail.difficulty.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {mode === "manual" ? (
          <section className="manual-entry-notice">
            <TrailPackIcon name="info" className="h-6 w-6 shrink-0" />
            <div>
              <h2>Manual hike entry</h2>
              <p>
                Unsupported hikes use a limited fallback list. Distance,
                elevation gain, route type, expected time out, and current
                conditions can make the fallback more specific.
              </p>
            </div>
          </section>
        ) : null}

        {selectedTrail ? <TrailProfileSummary trail={selectedTrail} /> : null}

        {selectedTrail && selectedScenario && weather ? (
          <ContextStatusPanel
            weather={weather}
            alerts={selectedScenario.alerts}
            isWeatherLoading={isWeatherLoading}
            startTime={userInput.startTime}
          />
        ) : null}

        {selectedTrail || mode === "manual" ? (
          <MissingDetailPrompts
            value={userInput}
            onChange={setUserInput}
            showManualFields={mode === "manual"}
          />
        ) : null}

        {recommendation ? <PackingListOutput recommendation={recommendation} /> : null}
        {displayedAiReview && aiInput ? (
          <AiReviewPanel
            review={displayedAiReview}
            liveOutcome={
              currentLiveAiState?.status === "ready"
                ? currentLiveAiState.result.outcome
                : undefined
            }
            providerModel={
              currentLiveAiState?.status === "ready"
                ? currentLiveAiState.result.provider.model
                : undefined
            }
            isLoading={currentLiveAiState?.status === "loading"}
            requestError={
              currentLiveAiState?.status === "error"
                ? currentLiveAiState.message
                : undefined
            }
            onRequestLive={handleLiveAiReview}
          />
        ) : null}
      </div>

      <footer className="site-footer">
        <div>
          <span className="footer-brand">
            <TrailPackIcon name="logo" className="h-5 w-5" />
            TrailPack
          </span>
          <p>
            Planning guidance only. Confirm conditions and closures with official
            park sources before leaving.
          </p>
        </div>
      </footer>
    </main>
  );
}
