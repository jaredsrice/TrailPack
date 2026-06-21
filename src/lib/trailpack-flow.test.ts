import { describe, expect, it } from "vitest";
import {
  buildClearedSearchState,
  buildManualSelectionState,
  buildParkSelectionState,
  buildTrailSelectionState,
} from "@/lib/trailpack-flow";
import { JENNY_LAKE_LOOP } from "@/data/supported-trails";

describe("trailpack flow state", () => {
  it("clears user input when manual entry is selected", () => {
    expect(buildManualSelectionState("unknown trail")).toEqual({
      mode: "manual",
      selectedParkId: null,
      selectedTrail: null,
      query: "unknown trail",
      userInput: {},
    });
  });

  it("clears user input when a supported park is selected", () => {
    expect(buildParkSelectionState("grand-teton", "Grand Teton National Park")).toEqual({
      mode: "park",
      selectedParkId: "grand-teton",
      selectedTrail: null,
      query: "Grand Teton National Park",
      userInput: {},
    });
  });

  it("clears user input when a supported trail is selected", () => {
    expect(buildTrailSelectionState(JENNY_LAKE_LOOP, "grand-teton")).toEqual({
      mode: "trail",
      selectedParkId: "grand-teton",
      selectedTrail: JENNY_LAKE_LOOP,
      query: "Jenny Lake Loop",
      userInput: {},
    });
  });

  it("clears user input when the search box is cleared", () => {
    expect(buildClearedSearchState()).toEqual({
      mode: "search",
      selectedParkId: null,
      selectedTrail: null,
      userInput: {},
    });
  });
});
