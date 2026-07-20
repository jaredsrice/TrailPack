import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS, getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import { TRAIL_CATALOG } from "@/features/trailpack/data/supported-trails";

describe("demo contexts", () => {
  it("covers every supported trail", () => {
    expect(Object.keys(DEMO_CONTEXTS).sort()).toEqual(
      Object.keys(TRAIL_CATALOG).sort(),
    );
  });

  it("stores the exact Jenny Lake Loop scenario values", () => {
    expect(DEMO_CONTEXTS["jenny-lake-loop"].weather).toMatchObject({
      summary: "Partly sunny with a chance of afternoon showers in the Tetons.",
      precipitationChance: 35,
      windMph: 12,
      conditions: ["sun", "rain", "wind"],
    });
  });

  it("stores the exact Taggart Lake scenario values", () => {
    expect(DEMO_CONTEXTS["taggart-lake"].weather).toMatchObject({
      summary: "Sunny and mild with a cool start at the trailhead.",
      precipitationChance: 10,
      windMph: 8,
      conditions: ["sun"],
    });
    expect(DEMO_CONTEXTS["taggart-lake"].alerts).toMatchObject({
      hasActiveAlerts: true,
      label: "official",
      retrievalStatus: "saved-fixture",
      alerts: [
        {
          title: "Taggart Trail 2026 construction closure",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
        },
      ],
    });
  });

  it("stores the exact String Lake Loop scenario values", () => {
    expect(DEMO_CONTEXTS["string-lake-loop"].weather).toMatchObject({
      summary: "Hot, sunny, and breezy around the exposed String Lake shoreline.",
      temperatureF: { high: 84, low: 52, current: 74 },
      precipitationChance: 5,
      windMph: 14,
      conditions: ["sun", "heat", "wind"],
    });
  });

  it("labels both public-source imports with deterministic saved context", () => {
    for (const trailId of [
      "colter-bay-lakeshore-trail",
      "two-ocean-lake-loop",
    ] as const) {
      expect(DEMO_CONTEXTS[trailId].weather.retrievalStatus).toBe("saved-fixture");
      expect(DEMO_CONTEXTS[trailId].weather.statusReason).toMatch(/deterministic/i);
      expect(DEMO_CONTEXTS[trailId].alerts.retrievalStatus).toBe("saved-fixture");
    }
  });
});

describe("getDemoScenario", () => {
  it("returns the saved scenario for each supported trail", () => {
    expect(getDemoScenario("jenny-lake-loop")).toBe(DEMO_CONTEXTS["jenny-lake-loop"]);
    expect(getDemoScenario("taggart-lake")).toBe(DEMO_CONTEXTS["taggart-lake"]);
    expect(getDemoScenario("string-lake-loop")).toBe(DEMO_CONTEXTS["string-lake-loop"]);
    expect(getDemoScenario("colter-bay-lakeshore-trail")).toBe(
      DEMO_CONTEXTS["colter-bay-lakeshore-trail"],
    );
    expect(getDemoScenario("two-ocean-lake-loop")).toBe(
      DEMO_CONTEXTS["two-ocean-lake-loop"],
    );
  });

  it("returns null for missing or unsupported trail ids", () => {
    expect(getDemoScenario(undefined)).toBeNull();
    expect(getDemoScenario("not-a-trail")).toBeNull();
  });
});
