import type {
  SavedResultDraft,
  SavedResultRecord,
  SavedTrailSummary,
  SavedTripInputs,
} from "./saved-results";
import type {
  PackingItem,
  PackingRecommendation,
  RouteType,
  SafetyDecisionContext,
  SourceLabel,
  TripAlert,
} from "@/features/trailpack/types";

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

const TRIP_INPUT_KEYS = new Set([
  "plannedDate",
  "startTime",
  "expectedDuration",
  "trailConditions",
  "distanceMiles",
  "elevationGainFeet",
  "routeType",
]);

const MAX_STRING_LENGTH = 2_000;
const MAX_ITEMS = 80;
const MAX_NESTED_DETAILS = 40;
const MAX_ITEM_LINKS = 20;

export function parseSavedResultDraft(value: unknown): SavedResultDraft | null {
  if (!isRecord(value)) {
    return null;
  }

  const trailSummary = parseTrailSummary(value.trailSummary);
  const tripInputs = parseTripInputs(value.tripInputs);
  const recommendation = parseRecommendation(value.recommendation);
  const sourceLabels = parseSourceLabels(value.sourceLabels);
  if (!trailSummary || !tripInputs || !recommendation || !sourceLabels) {
    return null;
  }

  // Build a canonical snapshot instead of returning the parsed object. This
  // prevents unrecognized nested fields from being retained in JSONB.
  return { trailSummary, tripInputs, recommendation, sourceLabels };
}

export function parseSavedResultRecord(value: unknown): SavedResultRecord | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.createdAt)) {
    return null;
  }

  const draft = parseSavedResultDraft(value);
  return draft ? { ...draft, id: value.id, createdAt: value.createdAt } : null;
}

function parseTrailSummary(value: unknown): SavedTrailSummary | null {
  if (
    !isRecord(value) ||
    (value.kind !== "profile" && value.kind !== "manual") ||
    !isString(value.name) ||
    !isOptionalString(value.trailId) ||
    !isOptionalString(value.park) ||
    !isOptionalString(value.state) ||
    !isOptionalRouteType(value.routeType) ||
    !isOptionalNumberOrString(value.distanceMiles) ||
    !isOptionalNumberOrString(value.elevationGainFeet)
  ) {
    return null;
  }

  const sourceLabels = parseSourceLabels(value.sourceLabels);
  if (!sourceLabels) {
    return null;
  }

  return {
    kind: value.kind,
    name: value.name,
    sourceLabels,
    ...(value.trailId === undefined ? {} : { trailId: value.trailId }),
    ...(value.park === undefined ? {} : { park: value.park }),
    ...(value.state === undefined ? {} : { state: value.state }),
    ...(value.routeType === undefined ? {} : { routeType: value.routeType }),
    ...(value.distanceMiles === undefined
      ? {}
      : { distanceMiles: value.distanceMiles }),
    ...(value.elevationGainFeet === undefined
      ? {}
      : { elevationGainFeet: value.elevationGainFeet }),
  };
}

function parseTripInputs(value: unknown): SavedTripInputs | null {
  if (
    !isRecord(value) ||
    !Object.keys(value).every((key) => TRIP_INPUT_KEYS.has(key)) ||
    !isOptionalString(value.plannedDate) ||
    !isOptionalString(value.startTime) ||
    !isOptionalString(value.expectedDuration) ||
    !isOptionalString(value.trailConditions) ||
    !isOptionalString(value.distanceMiles) ||
    !isOptionalString(value.elevationGainFeet) ||
    !isOptionalRouteType(value.routeType)
  ) {
    return null;
  }

  return {
    ...(value.plannedDate === undefined ? {} : { plannedDate: value.plannedDate }),
    ...(value.startTime === undefined ? {} : { startTime: value.startTime }),
    ...(value.expectedDuration === undefined
      ? {}
      : { expectedDuration: value.expectedDuration }),
    ...(value.trailConditions === undefined
      ? {}
      : { trailConditions: value.trailConditions }),
    ...(value.distanceMiles === undefined
      ? {}
      : { distanceMiles: value.distanceMiles }),
    ...(value.elevationGainFeet === undefined
      ? {}
      : { elevationGainFeet: value.elevationGainFeet }),
    ...(value.routeType === undefined ? {} : { routeType: value.routeType }),
  };
}

function parseRecommendation(value: unknown): PackingRecommendation | null {
  if (
    !isRecord(value) ||
    !isString(value.trailId) ||
    !isString(value.trailName) ||
    !isString(value.generatedAt) ||
    !isString(value.confidenceNote)
  ) {
    return null;
  }

  const missingDetails = parseStringArray(value.missingDetails, MAX_NESTED_DETAILS);
  const tripAlerts = parseRecordArray(
    value.tripAlerts,
    MAX_NESTED_DETAILS,
    parseTripAlert,
  );
  const essential = parseRecordArray(value.essential, MAX_ITEMS, parsePackingItem);
  const optional = parseRecordArray(value.optional, MAX_ITEMS, parsePackingItem);
  if (!missingDetails || !tripAlerts || !essential || !optional) {
    return null;
  }
  if (essential.length + optional.length > MAX_ITEMS) {
    return null;
  }

  return {
    trailId: value.trailId,
    trailName: value.trailName,
    generatedAt: value.generatedAt,
    tripAlerts,
    essential,
    optional,
    missingDetails,
    confidenceNote: value.confidenceNote,
  };
}

function parseTripAlert(value: unknown): TripAlert | null {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.title) ||
    !isString(value.summary) ||
    (value.severity !== "info" &&
      value.severity !== "caution" &&
      value.severity !== "danger") ||
    !isOptionalHttpsUrl(value.sourceUrl)
  ) {
    return null;
  }

  const affectedBy = parseStringArray(value.affectedBy, MAX_NESTED_DETAILS);
  const sourceLabels = parseSourceLabels(value.sourceLabels);
  if (!affectedBy || !sourceLabels) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    summary: value.summary,
    severity: value.severity,
    affectedBy,
    sourceLabels,
    ...(value.sourceUrl === undefined ? {} : { sourceUrl: value.sourceUrl }),
  };
}

function parsePackingItem(value: unknown): PackingItem | null {
  if (
    !isRecord(value) ||
    !isString(value.name) ||
    !isString(value.question) ||
    !isString(value.recommendation) ||
    !isString(value.why) ||
    !isString(value.answer) ||
    !isString(value.reason) ||
    !isOptionalHttpsUrl(value.sourceUrl)
  ) {
    return null;
  }

  const sourceLabels = parseSourceLabels(value.sourceLabels);
  const affectedBy = parseOptionalStringArray(value.affectedBy, MAX_NESTED_DETAILS);
  const links = parseOptionalRecordArray(value.links, MAX_ITEM_LINKS, parseItemLink);
  const contextNotes = parseOptionalRecordArray(
    value.contextNotes,
    MAX_ITEM_LINKS,
    parseContextNote,
  );
  const safetyContext = value.safetyContext === undefined
    ? undefined
    : parseSafetyContext(value.safetyContext);
  if (
    !sourceLabels ||
    affectedBy === null ||
    links === null ||
    contextNotes === null ||
    safetyContext === null
  ) {
    return null;
  }

  return {
    name: value.name,
    question: value.question,
    recommendation: value.recommendation,
    why: value.why,
    answer: value.answer,
    reason: value.reason,
    sourceLabels,
    ...(affectedBy === undefined ? {} : { affectedBy }),
    ...(value.sourceUrl === undefined ? {} : { sourceUrl: value.sourceUrl }),
    ...(links === undefined ? {} : { links }),
    ...(contextNotes === undefined ? {} : { contextNotes }),
    ...(safetyContext === undefined ? {} : { safetyContext }),
  };
}

function parseSafetyContext(value: unknown): SafetyDecisionContext | null {
  if (
    !isRecord(value) ||
    (value.scope !== "park-wide" && value.scope !== "forecast") ||
    !isString(value.issue) ||
    !isString(value.impact)
  ) {
    return null;
  }

  const evidence = parseRecordArray(value.evidence, 10, (entry) => {
    if (
      !isRecord(entry) ||
      !isString(entry.title) ||
      !isString(entry.description) ||
      !isOptionalHttpsUrl(entry.sourceUrl)
    ) {
      return null;
    }

    return {
      title: entry.title,
      description: entry.description,
      ...(entry.sourceUrl === undefined ? {} : { sourceUrl: entry.sourceUrl }),
    };
  });

  return evidence ? {
    scope: value.scope,
    issue: value.issue,
    impact: value.impact,
    evidence,
  } : null;
}

function parseItemLink(value: unknown): NonNullable<PackingItem["links"]>[number] | null {
  return isRecord(value) && isString(value.label) && isHttpsUrl(value.url)
    ? { label: value.label, url: value.url }
    : null;
}

function parseContextNote(
  value: unknown,
): NonNullable<PackingItem["contextNotes"]>[number] | null {
  return isRecord(value) && isString(value.label) && isString(value.text)
    ? { label: value.label, text: value.text }
    : null;
}

function parseRecordArray<T>(
  value: unknown,
  maximumLength: number,
  parser: (entry: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length > maximumLength) {
    return null;
  }

  const parsed = value.map(parser);
  return parsed.some((entry) => entry === null) ? null : (parsed as T[]);
}

function parseOptionalRecordArray<T>(
  value: unknown,
  maximumLength: number,
  parser: (entry: unknown) => T | null,
): T[] | undefined | null {
  return value === undefined
    ? undefined
    : parseRecordArray(value, maximumLength, parser);
}

function parseStringArray(value: unknown, maximumLength: number): string[] | null {
  return Array.isArray(value) &&
    value.length <= maximumLength &&
    value.every(isString)
    ? [...value]
    : null;
}

function parseOptionalStringArray(
  value: unknown,
  maximumLength: number,
): string[] | undefined | null {
  return value === undefined ? undefined : parseStringArray(value, maximumLength);
}

function parseSourceLabels(value: unknown): SourceLabel[] | null {
  return Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (label) => typeof label === "string" && SOURCE_LABELS.has(label as SourceLabel),
    )
    ? ([...value] as SourceLabel[])
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isHttpsUrl(value: unknown): value is string {
  if (
    !isString(value) ||
    value.trim() !== value ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.length > 0 &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}

function isOptionalHttpsUrl(value: unknown): value is string | undefined {
  return value === undefined || isHttpsUrl(value);
}

function isOptionalNumberOrString(
  value: unknown,
): value is number | string | undefined {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value)) ||
    isString(value)
  );
}

function isOptionalRouteType(value: unknown): value is RouteType | undefined {
  return (
    value === undefined ||
    value === "loop" ||
    value === "out-and-back" ||
    value === "point-to-point" ||
    value === "unknown"
  );
}
