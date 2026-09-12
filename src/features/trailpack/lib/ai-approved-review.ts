import { getTrailById } from "../data/supported-trails";
import { analyzeTrailConditions, parseExpectedHours } from "./packing";
import { buildGuardedAiFallback, type AiContractInput, type GuardedAiReviewResult } from "./ai-contract";

/** Provider-visible wording is constructed here; client prose is never copied. */
export function approvedReviewFacts(input: AiContractInput): Record<string, string> {
  const trail = getTrailById(input.trail.id);
  const facts: Record<string, string> = {};
  if (trail) {
    facts.profile = buildProfileAssessment(input, trail);
  }
  const weatherText = {
    heat: "The forecast context includes heat, so water and sun protection carry more weight in this plan.",
    cold: "The forecast context includes cold, so the clothing and weather-protection items carry more weight in this plan.",
    rain: "The forecast context includes rain, so rain protection and grippy footwear carry more weight in this plan.",
    wind: "The forecast context includes wind, so a wind-blocking layer carries more weight in this plan.",
    snow: "The forecast context indicates snow risk, not confirmed snow on the trail. Check official conditions before deciding whether traction is needed.",
    sun: "The forecast context includes sun exposure, so sun protection and water carry more weight in this plan.",
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
    facts["alerts-active"] = `${input.alerts.retrievalStatus === "saved-fixture" ? "The saved scenario contains" : "The supplied park context reports"} active notices. Confirm whether they affect this route before driving to the trailhead; a park notice does not by itself establish a closure here.`;
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

function buildProfileAssessment(
  input: AiContractInput,
  trail: NonNullable<ReturnType<typeof getTrailById>>,
): string {
  const distance = trail.distanceMiles.label === "inferred"
    ? `about ${trail.distanceMiles.value}`
    : String(trail.distanceMiles.value);
  const routeType = trail.routeType.replaceAll("-", " ");
  const difficultyArticle = /^[aeiou]/i.test(trail.difficulty.value) ? "an" : "a";
  const gain = trail.elevationGainFeet.value === null
    ? "unverified elevation gain"
    : `${trail.elevationGainFeet.value.toLocaleString("en-US")} feet of elevation gain`;
  const expectedHours = parseExpectedHours(input.userInput.expectedDuration);
  const timingWindow = buildTimingWindow(input.userInput.startTime, expectedHours);
  const enteredDuration = timingWindow
    ? ` ${timingWindow}`
    : expectedHours === null
      ? ""
      : ` Your ${formatHours(expectedHours)} plan is used for food, water, and daylight guidance.`;
  const officialHours = parseExpectedHours(trail.estimatedDuration.value);
  const effort = officialHours !== null &&
    (officialHours >= 3 || trail.distanceMiles.value >= 5 || (trail.elevationGainFeet.value ?? 0) >= 1_000)
    ? "plan for a sustained half-day effort"
    : "this is a shorter outing rather than a half-day route";

  return `${trail.name} is ${difficultyArticle} ${trail.difficulty.value} ${distance}-mile ${routeType} with ${gain}. ` +
    `NPS estimates ${trail.estimatedDuration.value}, so ${effort}.${enteredDuration}`;
}

function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}-hour`;
}

function buildTimingWindow(
  startTime: string | undefined,
  expectedHours: number | null,
): string | null {
  const startMinutes = parseClockMinutes(startTime);
  if (startMinutes === null || expectedHours === null) {
    return null;
  }

  const finishMinutes = startMinutes + Math.round(expectedHours * 60);
  const nextDay = finishMinutes >= 24 * 60;
  const duration = durationPhrase(expectedHours);
  return `A ${formatClockMinutes(startMinutes)} start and ${duration} estimate put the planned finish around ${formatClockMinutes(finishMinutes)}${nextDay ? " the next day" : ""}. TrailPack uses that window for daylight and headlamp decisions.`;
}

function parseClockMinutes(value?: string): number | null {
  const match = value?.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    return null;
  }
  const hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) {
    return null;
  }
  const hour24 = meridiem
    ? hour % 12 + (meridiem === "pm" ? 12 : 0)
    : hour;
  return hour24 * 60 + minute;
}

function formatClockMinutes(totalMinutes: number): string {
  const minutesInDay = 24 * 60;
  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const hour = hour24 % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${hour24 >= 12 ? "PM" : "AM"}`;
}

function durationPhrase(hours: number): string {
  if (hours > 0 && hours < 1) {
    return `${Math.round(hours * 60)}-minute`;
  }
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  return Number.isInteger(hours) && hours >= 1 && hours <= 12
    ? `${words[hours]}-hour`
    : formatHours(hours);
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
  const selectedIds = ids.includes("profile") ? ids : ["profile", ...ids.slice(0, 2)];
  return {
    status: "accepted", validationReasons: [],
    review: {
      ...fallback.review,
      tripSummary: selectedIds.map(id => facts[id]).join(" "),
    },
  };
}
