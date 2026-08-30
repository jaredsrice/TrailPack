import type {
  AiContractInput,
  AiContractPackingItem,
  AiItemExplanationDraft,
  AiReviewDraft,
  AiReviewRequest,
  LiveAiOutcome,
  LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import type {
  RetrievalStatus,
  RouteType,
  SourceLabel,
  WeatherContext,
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

const RETRIEVAL_STATUSES = new Set<RetrievalStatus>([
  "live",
  "saved-fixture",
  "unavailable",
]);

const ROUTE_TYPES = new Set<RouteType>([
  "loop",
  "out-and-back",
  "point-to-point",
  "unknown",
]);

const WEATHER_CONDITIONS = new Set<WeatherContext["conditions"][number]>([
  "heat",
  "cold",
  "rain",
  "wind",
  "snow",
  "sun",
]);

const LIVE_AI_OUTCOMES = new Set<LiveAiOutcome>([
  "accepted",
  "rejected",
  "timed-out",
  "quota-limited",
  "rate-limited",
  "duplicate-generation",
  "sign-in-required",
  "missing-key",
  "invalid-response",
  "provider-error",
]);

const MAX_INPUT_STRING_LENGTH = 2_000;
const MAX_OUTPUT_STRING_LENGTH = 2_000;
const MAX_PACKING_ITEMS = 80;
const MAX_LIST_ITEMS = 40;
const GENERATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAiReviewRequest(value: unknown): AiReviewRequest | null {
  if (
    !isRecord(value) ||
    !isAiReviewGenerationId(value.generationId)
  ) {
    return null;
  }

  const input = parseAiContractInput(value.input);
  if (!input) {
    return null;
  }

  return {
    generationId: value.generationId,
    input,
  };
}

export function isAiReviewGenerationId(value: unknown): value is string {
  return typeof value === "string" && GENERATION_ID_PATTERN.test(value);
}

export function parseAiContractInput(value: unknown): AiContractInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const { trail, weather, alerts, userInput, packing } = value;
  if (
    !isRecord(trail) ||
    !isRecord(weather) ||
    !isRecord(alerts) ||
    !isRecord(userInput) ||
    !isRecord(packing)
  ) {
    return null;
  }

  if (
    !isRequiredString(trail.id) ||
    !isRequiredString(trail.name) ||
    !isRequiredString(trail.park) ||
    !isRequiredString(trail.state) ||
    !isFiniteNumber(trail.distanceMiles, 0, 1_000) ||
    !isFiniteNumber(trail.elevationGainFeet, 0, 100_000) ||
    !isRouteType(trail.routeType) ||
    !isRequiredString(trail.estimatedDuration) ||
    !isRequiredString(trail.difficulty)
  ) {
    return null;
  }

  if (
    !isRequiredString(weather.summary) ||
    !isWeatherConditions(weather.conditions) ||
    !isSourceLabel(weather.sourceLabel) ||
    !isOptionalRetrievalStatus(weather.retrievalStatus)
  ) {
    return null;
  }

  if (
    typeof alerts.hasActiveAlerts !== "boolean" ||
    !isStringArray(alerts.titles, MAX_LIST_ITEMS, MAX_INPUT_STRING_LENGTH) ||
    !isSourceLabel(alerts.sourceLabel) ||
    !isOptionalRetrievalStatus(alerts.retrievalStatus)
  ) {
    return null;
  }

  if (
    !isOptionalString(userInput.startTime) ||
    !isOptionalString(userInput.expectedDuration) ||
    !isOptionalString(userInput.trailConditions) ||
    !isOptionalString(userInput.notes)
  ) {
    return null;
  }

  if (
    !isPackingItemArray(packing.essential) ||
    !isPackingItemArray(packing.optional) ||
    packing.essential.length + packing.optional.length > MAX_PACKING_ITEMS ||
    packing.essential.length + packing.optional.length === 0 ||
    !isStringArray(packing.missingDetails, MAX_LIST_ITEMS, MAX_INPUT_STRING_LENGTH) ||
    !isRequiredString(packing.confidenceNote)
  ) {
    return null;
  }

  return value as unknown as AiContractInput;
}

export function parseAiReviewDraft(value: unknown): AiReviewDraft | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isRequiredString(value.tripSummary, MAX_OUTPUT_STRING_LENGTH) ||
    !isStringArray(
      value.missingDataReview,
      MAX_LIST_ITEMS,
      MAX_OUTPUT_STRING_LENGTH,
    ) ||
    !Array.isArray(value.itemExplanationDrafts) ||
    value.itemExplanationDrafts.length > MAX_PACKING_ITEMS ||
    !value.itemExplanationDrafts.every(isAiItemExplanationDraft)
  ) {
    return null;
  }

  return value as unknown as AiReviewDraft;
}

export function parseLiveAiReviewResult(
  value: unknown,
): LiveAiReviewResult | null {
  if (
    !isRecord(value) ||
    !isLiveAiOutcome(value.outcome) ||
    !isRecord(value.provider) ||
    value.provider.name !== "gemini" ||
    !isRequiredString(value.provider.model, 100) ||
    !/^gemini-[a-z0-9.-]+$/.test(value.provider.model) ||
    !isRecord(value.review) ||
    (value.review.status !== "accepted" &&
      value.review.status !== "fallback") ||
    !isStringArray(
      value.review.validationReasons,
      MAX_LIST_ITEMS,
      MAX_OUTPUT_STRING_LENGTH,
    )
  ) {
    return null;
  }

  const parsedReview = parseAiReviewDraft(value.review.review);
  if (!parsedReview) {
    return null;
  }

  const expectedStatus =
    value.outcome === "accepted" ? "accepted" : "fallback";
  if (
    value.review.status !== expectedStatus ||
    (expectedStatus === "accepted" &&
      value.review.validationReasons.length > 0) ||
    (expectedStatus === "fallback" &&
      value.review.validationReasons.length === 0)
  ) {
    return null;
  }

  return {
    outcome: value.outcome,
    provider: {
      name: "gemini",
      model: value.provider.model,
    },
    review: {
      status: expectedStatus,
      review: parsedReview,
      validationReasons: [...value.review.validationReasons],
    },
  };
}

function isAiItemExplanationDraft(value: unknown): value is AiItemExplanationDraft {
  return (
    isRecord(value) &&
    isRequiredString(value.itemName, MAX_OUTPUT_STRING_LENGTH) &&
    isRequiredString(value.explanation, MAX_OUTPUT_STRING_LENGTH) &&
    isSourceLabelArray(value.sourceLabels)
  );
}

function isPackingItemArray(value: unknown): value is AiContractPackingItem[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_PACKING_ITEMS &&
    value.every(
      (item) =>
        isRecord(item) &&
        isRequiredString(item.name) &&
        isRequiredString(item.question) &&
        isRequiredString(item.recommendation) &&
        isRequiredString(item.why) &&
        isRequiredString(item.answer) &&
        isRequiredString(item.reason) &&
        isSourceLabelArray(item.sourceLabels),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequiredString(
  value: unknown,
  maxLength = MAX_INPUT_STRING_LENGTH,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isOptionalString(value: unknown): value is string | undefined {
  return (
    value === undefined ||
    (typeof value === "string" && value.length <= MAX_INPUT_STRING_LENGTH)
  );
}

function isFiniteNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isStringArray(
  value: unknown,
  maximumItems: number,
  maximumStringLength: number,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((item) => isRequiredString(item, maximumStringLength))
  );
}

function isSourceLabel(value: unknown): value is SourceLabel {
  return typeof value === "string" && SOURCE_LABELS.has(value as SourceLabel);
}

function isSourceLabelArray(value: unknown): value is SourceLabel[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= SOURCE_LABELS.size &&
    value.every(isSourceLabel)
  );
}

function isOptionalRetrievalStatus(
  value: unknown,
): value is RetrievalStatus | undefined {
  return (
    value === undefined ||
    (typeof value === "string" &&
      RETRIEVAL_STATUSES.has(value as RetrievalStatus))
  );
}

function isRouteType(value: unknown): value is RouteType {
  return typeof value === "string" && ROUTE_TYPES.has(value as RouteType);
}

function isWeatherConditions(
  value: unknown,
): value is WeatherContext["conditions"] {
  return (
    Array.isArray(value) &&
    value.length <= WEATHER_CONDITIONS.size &&
    value.every(
      (condition) =>
        typeof condition === "string" &&
        WEATHER_CONDITIONS.has(condition as WeatherContext["conditions"][number]),
    )
  );
}

function isLiveAiOutcome(value: unknown): value is LiveAiOutcome {
  return (
    typeof value === "string" &&
    LIVE_AI_OUTCOMES.has(value as LiveAiOutcome)
  );
}
