import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  SourceLabel,
  TrailProfile,
  WeatherContext,
} from "@/features/trailpack/types";
import type { UserHikeInput } from "@/features/trailpack/lib/packing";
import { TRAIL_CATALOG } from "@/features/trailpack/data/supported-trails";

export interface AiContractPackingItem {
  name: string;
  question: string;
  recommendation: string;
  why: string;
  answer: string;
  reason: string;
  sourceLabels: SourceLabel[];
}

export interface AiContractInput {
  trail: {
    id: string;
    name: string;
    park: string;
    state: string;
    distanceMiles: number;
    elevationGainFeet: number;
    routeType: string;
    estimatedDuration: string;
    difficulty: string;
  };
  weather: {
    summary: string;
    conditions: WeatherContext["conditions"];
    sourceLabel: SourceLabel;
    retrievalStatus?: WeatherContext["retrievalStatus"];
  };
  alerts: {
    hasActiveAlerts: boolean;
    titles: string[];
    sourceLabel: SourceLabel;
    retrievalStatus?: AlertContext["retrievalStatus"];
  };
  userInput: Pick<
    UserHikeInput,
    "startTime" | "expectedDuration" | "trailConditions" | "notes"
  >;
  packing: {
    essential: AiContractPackingItem[];
    optional: AiContractPackingItem[];
    missingDetails: string[];
    confidenceNote: string;
  };
}

export interface AiReviewRequest {
  generationId: string;
  input: AiContractInput;
}

export interface AiItemExplanationDraft {
  itemName: string;
  explanation: string;
  sourceLabels: SourceLabel[];
}

export interface AiReviewDraft {
  tripSummary: string;
  missingDataReview: string[];
  itemExplanationDrafts: AiItemExplanationDraft[];
}

export interface GuardedAiReview {
  tripSummary: string;
  missingDataReview: string[];
  itemExplanationDrafts: AiItemExplanationDraft[];
}

export interface AiReviewValidationResult {
  status: "accepted" | "rejected";
  review: GuardedAiReview;
  validationReasons: string[];
}

export interface GuardedAiReviewResult {
  status: "accepted" | "fallback";
  review: GuardedAiReview;
  validationReasons: string[];
}

export type LiveAiOutcome =
  | "accepted"
  | "rejected"
  | "timed-out"
  | "quota-limited"
  | "rate-limited"
  | "duplicate-generation"
  | "sign-in-required"
  | "missing-key"
  | "invalid-response"
  | "provider-error";

export interface LiveAiReviewResult {
  outcome: LiveAiOutcome;
  provider: {
    name: "gemini";
    model: string;
  };
  review: GuardedAiReviewResult;
}

export function buildAiContractInput({
  trail,
  weather,
  alerts,
  userInput,
  recommendation,
}: {
  trail: TrailProfile;
  weather: WeatherContext;
  alerts: AlertContext;
  userInput: UserHikeInput;
  recommendation: PackingRecommendation;
}): AiContractInput {
  return {
    trail: {
      id: trail.id,
      name: trail.name,
      park: trail.park,
      state: trail.state,
      distanceMiles: trail.distanceMiles.value,
      elevationGainFeet: trail.elevationGainFeet.value,
      routeType: trail.routeType,
      estimatedDuration: trail.estimatedDuration.value,
      difficulty: trail.difficulty.value,
    },
    weather: {
      summary: weather.summary,
      conditions: weather.conditions,
      sourceLabel: weather.label,
      retrievalStatus: weather.retrievalStatus,
    },
    alerts: {
      hasActiveAlerts: alerts.hasActiveAlerts,
      titles: alerts.alerts.map((alert) => alert.title),
      sourceLabel: alerts.label,
      retrievalStatus: alerts.retrievalStatus,
    },
    userInput: {
      startTime: userInput.startTime,
      expectedDuration: userInput.expectedDuration,
      trailConditions: userInput.trailConditions,
      notes: userInput.notes,
    },
    packing: {
      essential: recommendation.essential.map(toContractPackingItem),
      optional: recommendation.optional.map(toContractPackingItem),
      missingDetails: recommendation.missingDetails,
      confidenceNote: recommendation.confidenceNote,
    },
  };
}

export function validateAiReviewDraft(
  input: AiContractInput,
  draft: AiReviewDraft,
): AiReviewValidationResult {
  const validationReasons: string[] = [];
  const allowedItems = allPackingItems(input);
  const draftItemNames = draft.itemExplanationDrafts.map((item) => item.itemName);

  for (const item of allowedItems) {
    const matches = draft.itemExplanationDrafts.filter(
      (draftItem) => draftItem.itemName === item.name,
    );

    if (matches.length !== 1) {
      validationReasons.push(`AI review must explain "${item.name}" exactly once.`);
      continue;
    }

    if (!sameLabels(matches[0].sourceLabels, item.sourceLabels)) {
      validationReasons.push(`AI review changed source labels for "${item.name}".`);
    }
  }

  for (const draftItemName of draftItemNames) {
    if (!allowedItems.some((item) => item.name === draftItemName)) {
      validationReasons.push(`AI review referenced unknown packing item "${draftItemName}".`);
    }
  }

  if (!sameStrings(draft.missingDataReview, input.packing.missingDetails)) {
    validationReasons.push(
      "AI review changed the rule-based missing-details list.",
    );
  }

  const draftText = collectDraftText(draft).toLowerCase();
  if (hasUnsupportedSafetyClaim(draftText)) {
    validationReasons.push("AI review made an unsupported safety claim.");
  }

  const otherTrail = Object.values(TRAIL_CATALOG).find(
    (trail) =>
      trail.id !== input.trail.id && draftText.includes(trail.name.toLowerCase()),
  );
  if (otherTrail) {
    validationReasons.push(
      `AI review included unsupported trail fact from "${otherTrail.name}".`,
    );
  }

  return {
    status: validationReasons.length === 0 ? "accepted" : "rejected",
    review: draft,
    validationReasons,
  };
}

export function buildGuardedAiReview(
  input: AiContractInput,
  draft: AiReviewDraft | null | undefined,
): GuardedAiReviewResult {
  if (!draft) {
    return buildGuardedAiFallback(input, ["AI review fixture was unavailable."]);
  }

  const result = validateAiReviewDraft(input, draft);
  if (result.status === "accepted") {
    return {
      status: "accepted",
      review: result.review,
      validationReasons: [],
    };
  }

  return {
    status: "fallback",
    review: buildTemplateFallbackReview(input),
    validationReasons: result.validationReasons.map(toFallbackValidationReason),
  };
}

export function buildGuardedAiFallback(
  input: AiContractInput,
  validationReasons: string[],
): GuardedAiReviewResult {
  return {
    status: "fallback",
    review: buildTemplateFallbackReview(input),
    validationReasons,
  };
}

function toFallbackValidationReason(reason: string): string {
  if (/^AI review referenced unknown packing item "/.test(reason)) {
    return "AI review referenced an item outside the current rule-based packing list.";
  }

  return reason;
}

function toContractPackingItem(item: PackingItem): AiContractPackingItem {
  return {
    name: item.name,
    question: item.question,
    recommendation: item.recommendation,
    why: item.why,
    answer: item.answer,
    reason: item.reason,
    sourceLabels: item.sourceLabels,
  };
}

function allPackingItems(input: AiContractInput): AiContractPackingItem[] {
  return [...input.packing.essential, ...input.packing.optional];
}

function sameLabels(left: SourceLabel[], right: SourceLabel[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((label, index) => label === right[index]);
}

function sameStrings(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function collectDraftText(draft: AiReviewDraft): string {
  return [
    draft.tripSummary,
    ...draft.missingDataReview,
    ...draft.itemExplanationDrafts.map((item) => item.explanation),
  ].join(" ");
}

function hasUnsupportedSafetyClaim(text: string): boolean {
  return [
    /\b(?:guaranteed|completely|perfectly|totally)\s+safe\b/,
    /\bsafe today\b/,
    /\bsafe to hike\b/,
    /\brely on this list for safety\b/,
    /\b(?:no|zero)\s+(?:risk|danger)\b/,
    /\brisk[- ]free\b/,
    /\b(?:ensures|guarantees)\s+(?:your\s+)?safety\b/,
  ].some((pattern) => pattern.test(text));
}

function buildTemplateFallbackReview(input: AiContractInput): GuardedAiReview {
  const items = allPackingItems(input);
  const activeContext = input.alerts.hasActiveAlerts
    ? "the forecast, active alerts, and your trip details"
    : "the forecast and your trip details";

  return {
    tripSummary:
      `${input.trail.name} is a ${input.trail.distanceMiles} mi ${input.trail.routeType} ` +
      `with ${input.trail.elevationGainFeet} ft of gain. TrailPack checked ` +
      `${input.packing.essential.length} essential and ${input.packing.optional.length} optional ` +
      `items in the rule-based packing list against ${activeContext}.`,
    missingDataReview:
      input.packing.missingDetails.length > 0
        ? input.packing.missingDetails
        : ["No missing details were recorded for the current rule-based recommendation."],
    itemExplanationDrafts: items.map((item) => ({
      itemName: item.name,
      explanation: item.answer,
      sourceLabels: item.sourceLabels,
    })),
  };
}
