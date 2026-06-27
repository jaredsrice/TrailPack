import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS, getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import { SUPPORTED_TRAILS } from "@/features/trailpack/data/supported-trails";

describe("demo contexts", () => {
  it("covers every supported trail", () => {
    expect(Object.keys(DEMO_CONTEXTS).sort()).toEqual(
      Object.keys(SUPPORTED_TRAILS).sort(),
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
});

describe("getDemoScenario", () => {
  it("returns the saved scenario for each supported trail", () => {
    expect(getDemoScenario("jenny-lake-loop")).toBe(DEMO_CONTEXTS["jenny-lake-loop"]);
    expect(getDemoScenario("taggart-lake")).toBe(DEMO_CONTEXTS["taggart-lake"]);
    expect(getDemoScenario("string-lake-loop")).toBe(DEMO_CONTEXTS["string-lake-loop"]);
  });

  it("returns null for missing or unsupported trail ids", () => {
    expect(getDemoScenario(undefined)).toBeNull();
    expect(getDemoScenario("not-a-trail")).toBeNull();
  });
});
