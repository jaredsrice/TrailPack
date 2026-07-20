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

describe("supported trail inventory", () => {
  it("includes the expected Grand Teton park and trail catalog", () => {
    expect(SUPPORTED_PARKS).toHaveLength(1);
    expect(SUPPORTED_PARKS[0]).toMatchObject({
      id: "grand-teton",
      trailIds: ["jenny-lake-loop", "taggart-lake", "string-lake-loop"],
      publicTrailIds: ["colter-bay-lakeshore-trail", "two-ocean-lake-loop"],
    });
    expect(Object.keys(SUPPORTED_TRAILS)).toEqual([
      "jenny-lake-loop",
      "string-lake-loop",
      "taggart-lake",
    ]);
    expect(Object.keys(TRAIL_CATALOG)).toEqual([
      "jenny-lake-loop",
      "string-lake-loop",
      "taggart-lake",
      "colter-bay-lakeshore-trail",
      "two-ocean-lake-loop",
    ]);
    expect(getTrailsForPark("grand-teton")).toHaveLength(5);
  });
});

describe("Jenny Lake Loop profile", () => {
  it("uses official NPS values as the display values", () => {
    expect(JENNY_LAKE_LOOP.distanceMiles.value).toBe(7.1);
    expect(JENNY_LAKE_LOOP.distanceMiles.source).toBe("NPS");
    expect(JENNY_LAKE_LOOP.elevationGainFeet.value).toBe(1040);
    expect(JENNY_LAKE_LOOP.elevationGainFeet.source).toBe("NPS");
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
    expect(TAGGART_LAKE.distanceMiles.value).toBe(3.0);
    expect(TAGGART_LAKE.elevationGainFeet.value).toBe(360);
    expect(TAGGART_LAKE.estimatedDuration.value).toBe("1-2 Hours");
    expect(TAGGART_LAKE.difficulty.value).toBe("Easy");
    expect(TAGGART_LAKE.routeType).toBe("out-and-back");
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
    expect(STRING_LAKE_LOOP.distanceMiles.value).toBe(3.7);
    expect(STRING_LAKE_LOOP.elevationGainFeet.value).toBe(540);
    expect(STRING_LAKE_LOOP.estimatedDuration.value).toBe("2-3 Hours");
    expect(STRING_LAKE_LOOP.difficulty.value).toBe("Easy");
    expect(STRING_LAKE_LOOP.routeType).toBe("loop");
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
