import { describe, expect, it } from "vitest";
import {
  COLTER_BAY_LAKESHORE_TRAIL,
  PUBLIC_TRAILS,
  TWO_OCEAN_LAKE_LOOP,
} from "@/features/trailpack/data/public-trails";
import { getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import { generatePackingRecommendation } from "@/features/trailpack/lib/packing";
import type { TrailProfile } from "@/features/trailpack/types";

const TRAIL_CASES: Array<[TrailProfile, number, number, number]> = [
  [COLTER_BAY_LAKESHORE_TRAIL, 2.2, 100, 2.331],
  [TWO_OCEAN_LAKE_LOOP, 6.4, 400, 6.335],
];

describe("verified Grand Teton public-source imports", () => {
  it("contains the bounded two-trail expansion", () => {
    expect(Object.keys(PUBLIC_TRAILS)).toEqual([
      "colter-bay-lakeshore-trail",
      "two-ocean-lake-loop",
    ]);
  });

  it.each(TRAIL_CASES)(
    "keeps NPS values authoritative and USGS distance labeled as comparison data for %s",
    (trail, distanceMiles, gainFeet, usgsDistanceMiles) => {
      expect(trail.profileKind).toBe("public-source-import");
      expect(trail.retrievalStatus).toBe("saved-fixture");
      expect(trail.distanceMiles).toMatchObject({
        value: distanceMiles,
        source: "NPS",
        label: "official",
        computedValue: usgsDistanceMiles,
        computedSource: "USGS",
      });
      expect(trail.elevationGainFeet).toMatchObject({
        value: gainFeet,
        source: "NPS",
        label: "official",
      });
      expect(trail.sourceRecords.some((record) => record.source === "NPS")).toBe(true);
      expect(trail.sourceRecords.some((record) => record.source === "USGS")).toBe(true);
      expect(trail.missingFields).toEqual([]);
    },
  );

  it("records the exact reconciled USGS source feature IDs", () => {
    const lakeshoreUsgs = COLTER_BAY_LAKESHORE_TRAIL.sourceRecords.find(
      (record) => record.source === "USGS",
    );
    const twoOceanUsgs = TWO_OCEAN_LAKE_LOOP.sourceRecords.find(
      (record) => record.source === "USGS",
    );

    expect(lakeshoreUsgs?.sourceRecordIds).toHaveLength(15);
    expect(lakeshoreUsgs?.sourceRecordIds).toContain("4757");
    expect(lakeshoreUsgs?.sourceRecordIds).toContain("7293");
    expect(twoOceanUsgs?.sourceRecordIds).toEqual(["4882", "7248", "7285"]);
  });

  it("keeps the newer Two Ocean NPS gain while exposing the official conflict", () => {
    expect(TWO_OCEAN_LAKE_LOOP.elevationGainFeet.value).toBe(400);
    expect(TWO_OCEAN_LAKE_LOOP.elevationGainFeet.computedNote).toMatch(
      /400 ft.*700 ft.*AllTrails.*488 ft/i,
    );
    expect(TWO_OCEAN_LAKE_LOOP.sourceConfidence).toMatchObject({
      status: "official_nps_with_gain_conflict",
      gainMatch: "conflict",
    });
    expect(
      TWO_OCEAN_LAKE_LOOP.sourceRecords.some(
        (record) => record.sourceUrl === "https://www.nps.gov/thingstodo/twoocean.htm",
      ),
    ).toBe(true);
  });

  it.each(TRAIL_CASES)(
    "produces a rule-based packing result for imported trail %s",
    (trail) => {
      const scenario = getDemoScenario(trail.id);
      expect(scenario).not.toBeNull();

      const recommendation = generatePackingRecommendation(
        trail,
        scenario!.weather,
        scenario!.alerts,
        {},
      );

      expect(recommendation.trailId).toBe(trail.id);
      expect(recommendation.essential.length).toBeGreaterThan(0);
    },
  );
});
