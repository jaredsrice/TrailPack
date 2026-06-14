import { describe, expect, it } from "vitest";
import { JENNY_LAKE_LOOP } from "@/data/supported-trails";

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
