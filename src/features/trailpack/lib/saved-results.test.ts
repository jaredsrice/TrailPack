import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import { JENNY_LAKE_LOOP } from "@/features/trailpack/data/supported-trails";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import {
  buildSavedResultDraft,
  pickSavedTripInputs,
} from "@/features/trailpack/lib/saved-results";

describe("saved result snapshots", () => {
  it("retains the recommendation context but excludes free-form notes", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const userInput = {
      plannedDate: "2026-08-05",
      expectedDuration: "4 hours",
      trailConditions: "dry",
      notes: "Meet Taylor at the north lot and bring their medicine.",
    };
    const recommendation = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      scenario.weather,
      scenario.alerts,
      userInput,
    );

    const saved = buildSavedResultDraft({
      trail: JENNY_LAKE_LOOP,
      userInput,
      recommendation,
    });

    expect(saved.tripInputs).toEqual({
      plannedDate: "2026-08-05",
      expectedDuration: "4 hours",
      trailConditions: "dry",
    });
    expect(JSON.stringify(saved)).not.toContain("Taylor");
    expect(saved.trailSummary).toMatchObject({
      kind: "profile",
      trailId: "jenny-lake-loop",
      name: "Jenny Lake Loop",
    });
    expect(saved.sourceLabels).toContain("user-provided");
    expect(saved.sourceLabels).toContain("official");
  });

  it("preserves a manual hike as user-provided rather than inventing provenance", () => {
    const scenario = DEMO_CONTEXTS["jenny-lake-loop"];
    const userInput = {
      distanceMiles: "6.2 miles",
      elevationGainFeet: "900 feet",
      routeType: "out-and-back" as const,
    };
    const recommendation = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      scenario.weather,
      scenario.alerts,
      userInput,
    );
    recommendation.trailName = "Manual hike";

    const saved = buildSavedResultDraft({
      trail: null,
      userInput,
      recommendation,
    });

    expect(saved.trailSummary).toEqual({
      kind: "manual",
      name: "Manual hike",
      routeType: "out-and-back",
      distanceMiles: "6.2 miles",
      elevationGainFeet: "900 feet",
      sourceLabels: ["user-provided"],
    });
  });

  it("keeps only fields that can affect the saved recommendation", () => {
    expect(
      pickSavedTripInputs({
        startTime: "8 AM",
        notes: "Personal note that must not persist",
      }),
    ).toEqual({ startTime: "8 AM" });
  });
});
