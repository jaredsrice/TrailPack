import type { UserHikeInput } from "@/features/trailpack/lib/packing";
import type {
  PackingRecommendation,
  RouteType,
  SourceLabel,
  TrailProfile,
} from "@/features/trailpack/types";

export interface SavedTrailSummary {
  kind: "profile" | "manual";
  trailId?: string;
  name: string;
  park?: string;
  state?: string;
  routeType?: RouteType;
  distanceMiles?: number | string;
  elevationGainFeet?: number | string;
  sourceLabels: SourceLabel[];
}

/**
 * These fields can affect a generated recommendation. Notes are intentionally
 * omitted because they are free-form context, are not interpreted by the rule
 * engine, and do not need to be retained for a useful saved list.
 */
export interface SavedTripInputs {
  plannedDate?: string;
  startTime?: string;
  expectedDuration?: string;
  trailConditions?: string;
  distanceMiles?: string;
  elevationGainFeet?: string;
  routeType?: RouteType;
}

export interface SavedResultDraft {
  trailSummary: SavedTrailSummary;
  tripInputs: SavedTripInputs;
  recommendation: PackingRecommendation;
  sourceLabels: SourceLabel[];
}

export interface SavedResultRecord extends SavedResultDraft {
  id: string;
  createdAt: string;
}

export function buildSavedResultDraft({
  trail,
  userInput,
  recommendation,
}: {
  trail: TrailProfile | null;
  userInput: UserHikeInput;
  recommendation: PackingRecommendation;
}): SavedResultDraft {
  const tripInputs = pickSavedTripInputs(userInput);
  const trailSummary = buildTrailSummary(trail, tripInputs, recommendation);
  const inputSourceLabels: SourceLabel[] =
    Object.keys(tripInputs).length > 0 ? ["user-provided"] : [];

  return {
    trailSummary,
    tripInputs,
    recommendation,
    sourceLabels: uniqueSourceLabels([
      ...trailSummary.sourceLabels,
      ...recommendation.tripAlerts.flatMap((alert) => alert.sourceLabels),
      ...recommendation.essential.flatMap((item) => item.sourceLabels),
      ...recommendation.optional.flatMap((item) => item.sourceLabels),
      ...inputSourceLabels,
    ]),
  };
}

export function pickSavedTripInputs(input: UserHikeInput): SavedTripInputs {
  return {
    plannedDate: input.plannedDate,
    startTime: input.startTime,
    expectedDuration: input.expectedDuration,
    trailConditions: input.trailConditions,
    distanceMiles: input.distanceMiles,
    elevationGainFeet: input.elevationGainFeet,
    routeType: input.routeType,
  };
}

function buildTrailSummary(
  trail: TrailProfile | null,
  tripInputs: SavedTripInputs,
  recommendation: PackingRecommendation,
): SavedTrailSummary {
  if (!trail) {
    return {
      kind: "manual",
      name: recommendation.trailName,
      routeType: tripInputs.routeType,
      distanceMiles: tripInputs.distanceMiles,
      elevationGainFeet: tripInputs.elevationGainFeet,
      sourceLabels: ["user-provided"],
    };
  }

  return {
    kind: "profile",
    trailId: trail.id,
    name: trail.name,
    park: trail.park,
    state: trail.state,
    routeType: trail.routeType,
    distanceMiles: trail.distanceMiles.value,
    elevationGainFeet: trail.elevationGainFeet.value,
    sourceLabels: uniqueSourceLabels([
      trail.distanceMiles.label,
      trail.elevationGainFeet.label,
      trail.estimatedDuration.label,
      trail.difficulty.label,
    ]),
  };
}

function uniqueSourceLabels(labels: SourceLabel[]): SourceLabel[] {
  return Array.from(new Set(labels));
}
