import type { UserHikeInput } from "@/features/trailpack/lib/packing";
import type { TrailProfile } from "@/features/trailpack/types";

export type FlowMode = "search" | "park" | "trail" | "manual";

interface FlowSelectionState {
  mode: FlowMode;
  selectedParkId: string | null;
  selectedTrail: TrailProfile | null;
  userInput: UserHikeInput;
}

interface FlowSelectionStateWithQuery extends FlowSelectionState {
  query: string;
}

export function buildManualSelectionState(query: string): FlowSelectionStateWithQuery {
  return {
    mode: "manual",
    selectedParkId: null,
    selectedTrail: null,
    query,
    userInput: {},
  };
}

export function buildParkSelectionState(
  parkId: string,
  query: string,
): FlowSelectionStateWithQuery {
  return {
    mode: "park",
    selectedParkId: parkId,
    selectedTrail: null,
    query,
    userInput: {},
  };
}

export function buildTrailSelectionState(
  trail: TrailProfile,
  parkId: string | null,
): FlowSelectionStateWithQuery {
  return {
    mode: "trail",
    selectedParkId: parkId,
    selectedTrail: trail,
    query: trail.name,
    userInput: {},
  };
}

export function buildClearedSearchState(): FlowSelectionState {
  return {
    mode: "search",
    selectedParkId: null,
    selectedTrail: null,
    userInput: {},
  };
}
