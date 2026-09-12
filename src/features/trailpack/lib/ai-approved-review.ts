import { getTrailById } from "../data/supported-trails";
import { analyzeTrailConditions, parseExpectedHours } from "./packing";
import { buildGuardedAiFallback, type AiContractInput, type GuardedAiReviewResult } from "./ai-contract";

/** Provider-visible wording is constructed here; client prose is never copied. */
export function approvedReviewFacts(input: AiContractInput): Record<string, string> {
  const trail = getTrailById(input.trail.id);
  const facts: Record<string, string> = {};
  if (trail) {
    facts.profile = `${trail.name} has ${trail.distanceMiles.label === "inferred" ? "about " : ""}${trail.distanceMiles.value} miles of hiking, with ${trail.elevationGainFeet.value === null ? "unverified elevation gain" : `${trail.elevationGainFeet.value} feet of elevation gain`}.`;
  }
  const weatherText = {
    heat: "The forecast context indicates heat; check the hydration and sun-protection recommendations.",
    cold: "The forecast context indicates cold; check the clothing and weather-protection recommendations.",
    rain: "The forecast context indicates rain; check the rain protection and footwear recommendations.",
    wind: "The forecast context indicates wind; check the weather-protection recommendations.",
    snow: "The forecast context indicates snow risk, not confirmed snow on the trail; check official conditions before leaving.",
    sun: "The forecast context indicates sun exposure; check the sun-protection recommendations.",
  };
  for (const [condition, wording] of Object.entries(weatherText)) {
    if (input.weather.conditions.includes(condition as keyof typeof weatherText)) {
      facts[`forecast-${condition}`] = input.weather.retrievalStatus === "saved-fixture"
        ? `Saved scenario: ${wording}` : wording;
    }
  }
  if (input.weather.retrievalStatus === "unavailable") {
    for (const key of Object.keys(facts)) if (key.startsWith("forecast-")) delete facts[key];
    facts["weather-unavailable"] = "Live weather is unavailable. Check a current forecast before leaving.";
  }
  if (input.alerts.retrievalStatus === "unavailable") {
    facts["alerts-unavailable"] = "Official alert data is unavailable; this does not mean there are no alerts.";
  } else if (input.alerts.hasActiveAlerts) {
    facts["alerts-active"] = `${input.alerts.retrievalStatus === "saved-fixture" ? "The saved scenario contains" : "The supplied park context reports"} active notices. Read their sources and scope; a park notice does not establish a closure on this route.`;
  }
  const hours = parseExpectedHours(input.userInput.expectedDuration);
  if (hours !== null && hours >= 6 && hours <= 24) {
    facts["duration-long"] = "Your entered duration indicates a long day. Review food, water, and daylight planning.";
  }
  const conditions = analyzeTrailConditions(input.userInput.trailConditions);
  if (conditions.snowOrIce) {
    facts["reported-snow"] = "Your entered conditions mention snow or ice; this is user-provided information, not an official trail report.";
  }
  if (input.packing.missingDetails.length > 0) {
    facts["missing-details"] = "Some planning details are missing. Review the missing-detail prompts before relying on this plan.";
  }
  return facts;
}

export function parseApprovedSelection(value: unknown): { summaryIds: string[] } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && Array.isArray(record.summaryIds) &&
    record.summaryIds.length >= 1 && record.summaryIds.length <= 3 &&
    record.summaryIds.every(id => typeof id === "string" && id.length > 0 && id.length <= 64)
    ? { summaryIds: record.summaryIds } : null;
}

export function resolveApprovedReview(input: AiContractInput, value: unknown): GuardedAiReviewResult {
  const fallback = buildGuardedAiFallback(input, ["The review did not select valid explanations for this trip. The rule-based plan is unchanged."]);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || !Array.isArray(record.summaryIds)) return fallback;
  const ids = record.summaryIds;
  const facts = approvedReviewFacts(input);
  if (ids.length < 1 || ids.length > 3 || new Set(ids).size !== ids.length ||
    !ids.every((id): id is string => typeof id === "string" && Object.hasOwn(facts, id))) return fallback;
  return {
    status: "accepted", validationReasons: [],
    review: { ...fallback.review, tripSummary: ids.map(id => facts[id]).join(" ") },
  };
}
