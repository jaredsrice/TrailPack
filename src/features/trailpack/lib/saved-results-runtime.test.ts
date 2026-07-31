import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import { buildSavedResultDraft } from "@/features/trailpack/lib/saved-results";
import { parseSavedResultDraft } from "@/features/trailpack/lib/saved-results-runtime";

function draft() {
  const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
  return buildSavedResultDraft({
    trail: JENNY_LAKE_LOOP,
    userInput: { startTime: "8 AM" },
    recommendation: generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      scenario.weather,
      scenario.alerts,
      { startTime: "8 AM" },
    ),
  });
}

describe("saved result runtime contract", () => {
  it("accepts the bounded snapshot created by the application", () => {
    const value = draft();
    expect(parseSavedResultDraft(value)).toEqual(value);
  });

  it("rejects an extra free-form trip field rather than persisting it", () => {
    const value = draft();
    expect(
      parseSavedResultDraft({
        ...value,
        tripInputs: { ...value.tripInputs, notes: "Private free-form note" },
      }),
    ).toBeNull();
  });

  it("rejects unknown source labels", () => {
    const value = draft();
    expect(parseSavedResultDraft({ ...value, sourceLabels: ["unverified"] })).toBeNull();
  });
});
