import { describe, expect, it } from "vitest";
import {
  JENNY_LAKE_LOOP,
  STRING_LAKE_LOOP,
  SUPPORTED_PARKS,
  SUPPORTED_TRAILS,
  TAGGART_LAKE,
  TRAIL_CATALOG,
  getTrailsForPark,
} from "@/features/trailpack/data/supported-trails";
import { NPS_SOURCE_SNAPSHOTS } from "@/features/trailpack/data/nps-source-snapshots";
import { TRAIL_DEFINITIONS } from "./trails";

describe("supported trail inventory", () => {
  it("includes the expected Grand Teton park and trail catalog", () => {
    expect(SUPPORTED_PARKS).toHaveLength(1);
    expect(SUPPORTED_PARKS[0]).toMatchObject({
      id: "grand-teton",
      trailIds: ["jenny-lake-loop", "taggart-lake", "string-lake-loop"],
      publicTrailIds: expect.arrayContaining([
        "colter-bay-lakeshore-trail", "two-ocean-lake-loop", "lunch-tree-hill", "christian-pond-loop",
      ]),
    });
    expect(Object.keys(SUPPORTED_TRAILS)).toEqual([
      "jenny-lake-loop",
      "taggart-lake",
      "string-lake-loop",
    ]);
    expect(Object.keys(TRAIL_CATALOG)).toEqual(TRAIL_DEFINITIONS.map((definition) => definition.trail.id));
    expect(getTrailsForPark("grand-teton")).toHaveLength(TRAIL_DEFINITIONS.length);
  });
});

describe("Jenny Lake Loop profile", () => {
  it("uses official NPS values as the display values", () => {
    const snapshot = NPS_SOURCE_SNAPSHOTS.trails[JENNY_LAKE_LOOP.id];
    expect(JENNY_LAKE_LOOP.distanceMiles.value).toBe(snapshot.distanceMiles);
    expect(JENNY_LAKE_LOOP.distanceMiles.source).toBe("NPS");
    expect(JENNY_LAKE_LOOP.elevationGainFeet.value).toBe(
      snapshot.elevationGainFeet,
    );
    expect(JENNY_LAKE_LOOP.elevationGainFeet.source).toBe("NPS");
  });

  it("exposes the official NPS accessibility information", () => {
    expect(JENNY_LAKE_LOOP.accessibility).toMatchObject({
      source: "NPS",
      label: "official",
      value: NPS_SOURCE_SNAPSHOTS.trails[JENNY_LAKE_LOOP.id].accessibility,
    });
  });

  it("marks the NPS-vs-USGS gain comparison as a conflict", () => {
    expect(JENNY_LAKE_LOOP.sourceConfidence.gainMatch).toBe("conflict");
    expect(JENNY_LAKE_LOOP.sourceConfidence.status).toBe(
      "official_nps_with_gain_conflict",
    );
  });

  it("keeps distance as an ok match", () => {
    expect(JENNY_LAKE_LOOP.sourceConfidence.distanceMatch).toBe("ok");
  });

  it("labels the USGS gain as a computed estimate that does not match NPS", () => {
    expect(JENNY_LAKE_LOOP.elevationGainFeet.computedSource).toBe("USGS");
    expect(JENNY_LAKE_LOOP.elevationGainFeet.computedNote).toBeTruthy();
    expect(JENNY_LAKE_LOOP.elevationGainFeet.computedNote).toMatch(/estimate/i);
    expect(JENNY_LAKE_LOOP.elevationGainFeet.computedValue).not.toBe(
      JENNY_LAKE_LOOP.elevationGainFeet.value,
    );
  });
});

describe("Taggart Lake profile", () => {
  it("uses the expected supported profile values", () => {
    const snapshot = NPS_SOURCE_SNAPSHOTS.trails[TAGGART_LAKE.id];
    expect(TAGGART_LAKE.distanceMiles.value).toBe(snapshot.distanceMiles);
    expect(TAGGART_LAKE.elevationGainFeet.value).toBe(snapshot.elevationGainFeet);
    expect(TAGGART_LAKE.estimatedDuration.value).toBe(snapshot.estimatedDuration);
    expect(TAGGART_LAKE.difficulty.value).toBe(snapshot.difficulty);
    expect(TAGGART_LAKE.routeType).toBe(snapshot.routeType);
  });

  it("records the expected computed distance confidence", () => {
    expect(TAGGART_LAKE.distanceMiles.computedValue).toBe(2.958);
    expect(TAGGART_LAKE.sourceConfidence.status).toBe(
      "official_nps_with_usgs_geometry_ok",
    );
    expect(TAGGART_LAKE.sourceConfidence.distanceMatch).toBe("ok");
  });
});

describe("String Lake Loop profile", () => {
  it("uses the expected supported profile values", () => {
    const snapshot = NPS_SOURCE_SNAPSHOTS.trails[STRING_LAKE_LOOP.id];
    expect(STRING_LAKE_LOOP.distanceMiles.value).toBe(snapshot.distanceMiles);
    expect(STRING_LAKE_LOOP.elevationGainFeet.value).toBe(
      snapshot.elevationGainFeet,
    );
    expect(STRING_LAKE_LOOP.estimatedDuration.value).toBe(
      snapshot.estimatedDuration,
    );
    expect(STRING_LAKE_LOOP.difficulty.value).toBe(snapshot.difficulty);
    expect(STRING_LAKE_LOOP.routeType).toBe(snapshot.routeType);
  });

  it("records the expected computed distance confidence", () => {
    expect(STRING_LAKE_LOOP.distanceMiles.computedValue).toBe(3.708);
    expect(STRING_LAKE_LOOP.sourceConfidence.status).toBe(
      "official_nps_with_moderate_usgs_bridge",
    );
    expect(STRING_LAKE_LOOP.sourceConfidence.distanceMatch).toBe(
      "moderate_bridge",
    );
  });
});
