import type { SavedResultDraft, SavedResultRecord } from "./saved-results";
import type { SourceLabel } from "@/features/trailpack/types";

const SOURCE_LABELS = new Set<SourceLabel>([
  "supported-profile",
  "public-source-import",
  "user-provided",
  "forecast-based",
  "daylight",
  "official",
  "inferred",
  "missing",
  "unavailable",
  "future-work",
]);

const MAX_STRING_LENGTH = 2_000;
const MAX_ITEMS = 80;

export function parseSavedResultDraft(value: unknown): SavedResultDraft | null {
  if (!isRecord(value) || !isRecord(value.trailSummary) || !isRecord(value.tripInputs)) {
    return null;
  }

  if (
    !isTrailSummary(value.trailSummary) ||
    !isTripInputs(value.tripInputs) ||
    !isRecommendation(value.recommendation) ||
    !isSourceLabelArray(value.sourceLabels)
  ) {
    return null;
  }

  return value as unknown as SavedResultDraft;
}

export function parseSavedResultRecord(value: unknown): SavedResultRecord | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.createdAt)) {
    return null;
  }

  const draft = parseSavedResultDraft(value);
  return draft ? { ...draft, id: value.id, createdAt: value.createdAt } : null;
}

function isTrailSummary(value: Record<string, unknown>): boolean {
  return (
    (value.kind === "profile" || value.kind === "manual") &&
    isString(value.name) &&
    isOptionalString(value.trailId) &&
    isOptionalString(value.park) &&
    isOptionalString(value.state) &&
    isOptionalRouteType(value.routeType) &&
    isOptionalNumberOrString(value.distanceMiles) &&
    isOptionalNumberOrString(value.elevationGainFeet) &&
    isSourceLabelArray(value.sourceLabels)
  );
}

function isTripInputs(value: Record<string, unknown>): boolean {
  const permittedKeys = new Set([
    "plannedDate",
    "startTime",
    "expectedDuration",
    "trailConditions",
    "distanceMiles",
    "elevationGainFeet",
    "routeType",
  ]);
  return (
    Object.keys(value).every((key) => permittedKeys.has(key)) &&
    isOptionalString(value.plannedDate) &&
    isOptionalString(value.startTime) &&
    isOptionalString(value.expectedDuration) &&
    isOptionalString(value.trailConditions) &&
    isOptionalString(value.distanceMiles) &&
    isOptionalString(value.elevationGainFeet) &&
    isOptionalRouteType(value.routeType)
  );
}

function isRecommendation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.trailId) &&
    isString(value.trailName) &&
    isString(value.generatedAt) &&
    isString(value.confidenceNote) &&
    isStringArray(value.missingDetails, 40) &&
    Array.isArray(value.tripAlerts) &&
    value.tripAlerts.length <= 40 &&
    value.tripAlerts.every(isTripAlert) &&
    Array.isArray(value.essential) &&
    Array.isArray(value.optional) &&
    value.essential.length + value.optional.length <= MAX_ITEMS &&
    value.essential.every(isPackingItem) &&
    value.optional.every(isPackingItem)
  );
}

function isTripAlert(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.summary) &&
    (value.severity === "info" || value.severity === "caution" || value.severity === "danger") &&
    isStringArray(value.affectedBy, 40) &&
    isSourceLabelArray(value.sourceLabels) &&
    isOptionalString(value.sourceUrl)
  );
}

function isPackingItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isString(value.question) &&
    isString(value.recommendation) &&
    isString(value.why) &&
    isString(value.answer) &&
    isString(value.reason) &&
    isSourceLabelArray(value.sourceLabels)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isOptionalNumberOrString(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isFinite(value)) || isString(value);
}

function isOptionalRouteType(value: unknown): boolean {
  return value === undefined || value === "loop" || value === "out-and-back" || value === "point-to-point" || value === "unknown";
}

function isStringArray(value: unknown, maxLength: number): boolean {
  return Array.isArray(value) && value.length <= maxLength && value.every(isString);
}

function isSourceLabelArray(value: unknown): boolean {
  return Array.isArray(value) && value.length <= 20 && value.every(
    (label) => typeof label === "string" && SOURCE_LABELS.has(label as SourceLabel),
  );
}
