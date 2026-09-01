"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { requestTrailAlerts } from "@/features/trailpack/lib/alerts-client";
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
import type {
  AlertContext,
  PackingRecommendation,
  TrailProfile,
  WeatherContext,
} from "@/features/trailpack/types";
import { AiReviewPanel } from "./AiReviewPanel";
import { ContextStatusPanel } from "./ContextStatusPanel";
import { MissingDetailPrompts } from "./MissingDetailPrompts";
import { ParkPhotoShowcase } from "./ParkPhotoShowcase";
import { PackingListOutput } from "./PackingListOutput";
import { SavedResultActions } from "./SavedResultActions";
import { VERIFIED_TRAIL_PROFILE_LABEL } from "./SourceBadge";
import { TrailPackIcon } from "./TrailPackIcon";
import { TrailProfileSummary } from "./TrailProfileSummary";

const QUICK_START_TRAIL_IDS = [
  "jenny-lake-loop",
  "taggart-lake",
  "string-lake-loop",
] as const;

const AI_REVIEW_CLIENT_TIMEOUT_MS = 30_000;
const ALERT_REQUEST_TIMEOUT_MS = 12_000;
const WEATHER_REQUEST_TIMEOUT_MS = 20_000;

type LiveAiUiState =
  | { status: "idle" }
  | { status: "loading"; generationId: string }
  | {
      status: "ready";
      generationId: string;
      result: LiveAiReviewResult;
    }
  | { status: "error"; generationId: string; message: string };

type WeatherUiState =
  | { status: "idle" }
  | {
      status: "loading" | "ready";
      requestKey: string;
      weather: WeatherContext;
    };

type AlertUiState =
  | { status: "idle" }
  | {
      status: "loading" | "ready";
      requestKey: string;
      alerts: AlertContext;
    };

interface GeneratedPlan {
  generationId: string;
  trailId: string;
  userInput: UserHikeInput;
  weather: WeatherContext;
  alerts: AlertContext;
  recommendation: PackingRecommendation;
  aiInput: AiContractInput;
}

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
    case "public-trail":
      return VERIFIED_TRAIL_PROFILE_LABEL;
    case "manual":
      return "Manual entry";
  }
}

function sameUserHikeInput(
  left: UserHikeInput,
  right: UserHikeInput,
): boolean {
  return (
    left.plannedDate === right.plannedDate &&
    left.startTime === right.startTime &&
    left.expectedDuration === right.expectedDuration &&
    left.trailConditions === right.trailConditions &&
    left.notes === right.notes &&
    left.distanceMiles === right.distanceMiles &&
    left.elevationGainFeet === right.elevationGainFeet &&
    left.routeType === right.routeType
  );
}

export function TrailPackShell() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FlowMode>("search");
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<TrailProfile | null>(null);
  const [userInput, setUserInput] = useState<UserHikeInput>({});
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [liveAiState, setLiveAiState] = useState<LiveAiUiState>({
    status: "idle",
  });
  const [weatherState, setWeatherState] = useState<WeatherUiState>({
    status: "idle",
  });
  const [alertState, setAlertState] = useState<AlertUiState>({
    status: "idle",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeAiGenerationRef = useRef<string | null>(null);
  const aiReviewAbortControllerRef = useRef<AbortController | null>(null);

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
  const savedAlerts = selectedScenario?.alerts ?? null;
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
  const isWeatherLoading = Boolean(
    weatherRequestKey &&
      (!hasCurrentWeatherState || weatherState.status === "loading"),
  );

  useEffect(() => {
    if (!weatherRequestKey || !selectedTrail || !savedWeather) {
      setWeatherState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    let active = true;
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      WEATHER_REQUEST_TIMEOUT_MS,
    );

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
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    savedWeather,
    selectedTrail,
    userInput.plannedDate,
    weatherRequestKey,
  ]);

  const alertRequestKey = selectedTrail?.id ?? null;
  const hasCurrentAlertState =
    alertRequestKey !== null &&
    alertState.status !== "idle" &&
    alertState.requestKey === alertRequestKey;
  const alerts = hasCurrentAlertState ? alertState.alerts : savedAlerts;
  const isAlertLoading = Boolean(
    alertRequestKey &&
      (!hasCurrentAlertState || alertState.status === "loading"),
  );

  useEffect(() => {
    if (!alertRequestKey || !selectedTrail || !savedAlerts) {
      setAlertState({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    let active = true;
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      ALERT_REQUEST_TIMEOUT_MS,
    );

    setAlertState({
      status: "loading",
      requestKey: alertRequestKey,
      alerts: savedAlerts,
    });

    void requestTrailAlerts(selectedTrail.id, { signal: controller.signal })
      .then((liveAlerts) => {
        if (!active) {
          return;
        }

        setAlertState({
          status: "ready",
          requestKey: alertRequestKey,
          alerts: liveAlerts,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setAlertState({
          status: "ready",
          requestKey: alertRequestKey,
          alerts: {
            ...savedAlerts,
            statusReason:
              "Live NPS alerts could not be loaded. TrailPack is showing saved alert context instead.",
          },
        });
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [alertRequestKey, savedAlerts, selectedTrail]);

  const currentGeneratedPlan =
    selectedTrail && generatedPlan?.trailId === selectedTrail.id
      ? generatedPlan
      : null;
  const manualRecommendation = useMemo(
    () =>
      mode === "manual" ? generateManualEntryRecommendation(userInput) : null,
    [mode, userInput],
  );
  const recommendation =
    mode === "manual"
      ? manualRecommendation
      : currentGeneratedPlan?.recommendation ?? null;
  const aiInput = currentGeneratedPlan?.aiInput ?? null;

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
    currentGeneratedPlan !== null &&
    liveAiState.status !== "idle" &&
    liveAiState.generationId === currentGeneratedPlan.generationId;
  const currentLiveAiState = hasCurrentLiveState ? liveAiState : null;
  const displayedAiReview =
    currentLiveAiState?.status === "ready"
      ? currentLiveAiState.result.review
      : savedAiReview;

  const requestAiReview = useCallback(async (
    requestedInput: AiContractInput,
    generationId: string,
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      AI_REVIEW_CLIENT_TIMEOUT_MS,
    );
    aiReviewAbortControllerRef.current = controller;
    setLiveAiState({ status: "loading", generationId });

    try {
      const result = await requestLiveAiReviewFromRoute(requestedInput, {
        generationId,
        signal: controller.signal,
      });
      setLiveAiState((current) =>
        current.status !== "idle" && current.generationId === generationId
          ? {
              status: "ready",
              generationId,
              result,
            }
          : current,
      );
    } catch {
      setLiveAiState((current) =>
        current.status !== "idle" && current.generationId === generationId
          ? {
              status: "error",
              generationId,
              message:
                "TrailPack could not complete the live AI review. The rule-based list remains available.",
            }
          : current,
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (activeAiGenerationRef.current === generationId) {
        activeAiGenerationRef.current = null;
      }
      if (aiReviewAbortControllerRef.current === controller) {
        aiReviewAbortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(
    () => () => {
      aiReviewAbortControllerRef.current?.abort();
    },
    [],
  );

  const hasPendingPlanChanges = Boolean(
    currentGeneratedPlan &&
      !sameUserHikeInput(userInput, currentGeneratedPlan.userInput),
  );
  const isPlanContextLoading = isWeatherLoading || isAlertLoading;
  const canGeneratePlan = Boolean(
    selectedTrail &&
      weather &&
      alerts &&
      !isPlanContextLoading &&
      liveAiState.status !== "loading" &&
      (!currentGeneratedPlan || hasPendingPlanChanges),
  );

  function handleGeneratePlan() {
    if (
      !canGeneratePlan ||
      !selectedTrail ||
      !weather ||
      !alerts ||
      activeAiGenerationRef.current !== null
    ) {
      return;
    }

    const generationId = crypto.randomUUID();
    const planUserInput = { ...userInput };
    const planRecommendation = generatePackingRecommendation(
      selectedTrail,
      weather,
      alerts,
      planUserInput,
    );
    const nextAiInput = buildAiContractInput({
      trail: selectedTrail,
      weather,
      alerts,
      userInput: planUserInput,
      recommendation: planRecommendation,
    });
    activeAiGenerationRef.current = generationId;

    setGeneratedPlan({
      generationId,
      trailId: selectedTrail.id,
      userInput: planUserInput,
      weather,
      alerts,
      recommendation: planRecommendation,
      aiInput: nextAiInput,
    });
    void requestAiReview(nextAiInput, generationId);
  }

  function resetGeneratedOutput() {
    aiReviewAbortControllerRef.current?.abort();
    aiReviewAbortControllerRef.current = null;
    activeAiGenerationRef.current = null;
    setGeneratedPlan(null);
    setLiveAiState({ status: "idle" });
  }

  function handleSuggestionSelect(suggestion: SearchSuggestion) {
    if (suggestion.type === "manual") {
      const next = buildManualSelectionState(query);
      setMode(next.mode);
      setSelectedParkId(next.selectedParkId);
      setSelectedTrail(next.selectedTrail);
      setQuery(next.query);
      setUserInput(next.userInput);
      resetGeneratedOutput();
      return;
    }

    if (suggestion.type === "park" && suggestion.parkId) {
      const next = buildParkSelectionState(suggestion.parkId, suggestion.title);
      setMode(next.mode);
      setSelectedParkId(next.selectedParkId);
      setSelectedTrail(next.selectedTrail);
      setQuery(next.query);
      setUserInput(next.userInput);
      resetGeneratedOutput();
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
      resetGeneratedOutput();
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
    resetGeneratedOutput();
  }

  function handleChangeSearch() {
    const next = buildClearedSearchState();
    setMode(next.mode);
    setSelectedParkId(next.selectedParkId);
    setSelectedTrail(next.selectedTrail);
    setUserInput(next.userInput);
    setQuery("");
    resetGeneratedOutput();

    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
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

      <section
        className={`home-hero ${mode === "park" ? "is-park-view" : ""}`}
        aria-label={mode === "park" ? "Selected park photograph" : undefined}
        aria-labelledby={mode === "park" ? undefined : "trailpack-heading"}
      >
        <div className="home-hero-inner">
          <ParkPhotoShowcase
            selectedParkId={selectedParkId}
            selectedParkName={selectedPark?.name ?? null}
            selectedParkState={selectedPark?.state ?? null}
            selectedTrailId={selectedTrail?.id ?? null}
          />

          {mode !== "park" ? (
            <div className="hero-search-column">
              <h1 id="trailpack-heading" className="hero-heading">
                Plan a hike
              </h1>
              <p className="hero-description">
                Choose a supported trail or park to build a packing list with
                weather and official trail context.
              </p>

              <label className="search-field">
                <span className="sr-only">Search a park or trail</span>
                <TrailPackIcon name="search" className="search-field-icon" />
                <input
                  ref={searchInputRef}
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
                      resetGeneratedOutput();
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
                  <p className="search-label">Popular trails</p>
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
          ) : null}
        </div>
      </section>

      <div id="main-content" className="content-flow">
        {mode === "park" && selectedPark ? (
          <section className="park-landing-section" aria-labelledby="trailpack-heading">
            <button
              type="button"
              className="park-change-button"
              onClick={handleChangeSearch}
            >
              <TrailPackIcon name="chevron" className="park-change-icon" />
              Change park or trail
            </button>

            <h1 id="trailpack-heading" className="park-landing-title">
              {selectedPark.name}
            </h1>
            <p className="park-landing-description">
              Choose a trail to build your packing list and forecast.
            </p>

            <div className="park-trail-list">
              {parkTrails.map((trail) => (
                <button
                  key={trail.id}
                  type="button"
                  onClick={() => handleTrailSelect(trail.id)}
                  className="park-trail-button"
                >
                  <span className="park-trail-copy">
                    <span className="park-trail-name">{trail.name}</span>
                    <span className="park-trail-source">
                      {VERIFIED_TRAIL_PROFILE_LABEL}
                    </span>
                  </span>
                  <span className="park-trail-stats">
                    {trail.distanceMiles.value} mi ·{" "}
                    {trail.elevationGainFeet.value.toLocaleString()} ft gain ·{" "}
                    {trail.difficulty.value}
                  </span>
                  <TrailPackIcon
                    name="chevron"
                    className="park-trail-chevron"
                  />
                </button>
              ))}
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

        {selectedTrail && selectedScenario && weather && alerts ? (
          <ContextStatusPanel
            weather={weather}
            alerts={alerts}
            isWeatherLoading={isWeatherLoading}
            isAlertLoading={isAlertLoading}
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

        {selectedTrail ? (
          <section
            className="plan-generation-section"
            aria-labelledby="plan-generation-heading"
          >
            <div>
              <p className="section-kicker">Generation boundary</p>
              <h2 id="plan-generation-heading" className="section-title">
                {currentGeneratedPlan
                  ? "Update your packing list"
                  : "Generate your packing list"}
              </h2>
              <p className="section-subtitle">
                Finish your trip details, then generate once. You can keep
                editing before you update the list.
              </p>
            </div>
            <div className="plan-generation-action">
              <button
                type="button"
                className="plan-generation-button"
                onClick={handleGeneratePlan}
                disabled={!canGeneratePlan}
              >
                {isPlanContextLoading
                  ? "Loading current conditions..."
                  : liveAiState.status === "loading"
                    ? "Reviewing generated list..."
                    : !currentGeneratedPlan
                      ? "Generate packing list"
                      : hasPendingPlanChanges
                        ? "Update packing list"
                        : "Packing list is current"}
              </button>
              <p aria-live="polite">
                {currentGeneratedPlan && hasPendingPlanChanges
                  ? "Your edits are ready. Update the list when you are finished."
                  : currentGeneratedPlan
                    ? "The displayed list matches the trip details above."
                    : "Finish your trip details, then generate the list once."}
              </p>
            </div>
          </section>
        ) : null}

        {recommendation ? (
          <>
            <PackingListOutput recommendation={recommendation} />
            <SavedResultActions
              trail={selectedTrail}
              userInput={currentGeneratedPlan?.userInput ?? userInput}
              recommendation={recommendation}
            />
          </>
        ) : null}
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
