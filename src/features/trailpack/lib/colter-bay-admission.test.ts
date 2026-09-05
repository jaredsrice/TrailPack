import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../../../../docs/data/colter-bay-admission-2026-09-04.geometry.json";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";

const IDS = ["heron-pond-swan-lake-loop", "hermitage-point"] as const;
const CHECKED_AT = "2026-09-04";

function meters(a: readonly number[], b: readonly number[]) {
  const radians = Math.PI / 180;
  const dlat = (b[1] - a[1]) * radians;
  const dlng = (b[0] - a[0]) * radians;
  return 6_371_008.8 * 2 * Math.asin(Math.sqrt(
    Math.sin(dlat / 2) ** 2 + Math.cos(a[1] * radians) * Math.cos(b[1] * radians) * Math.sin(dlng / 2) ** 2,
  ));
}

function miles(vertices: readonly (readonly number[])[]) {
  return vertices.slice(1).reduce((total, point, index) => total + meters(vertices[index], point) / 1609.344, 0);
}

describe("Colter Bay route admissions", () => {
  it("records a complete park-wide capture rather than treating the earlier bounded file as whole-park data", () => {
    expect(geometry.parkWideCapture.returnedFeatures).toBe(geometry.parkWideCapture.countQueryReturned);
    expect(geometry.parkWideCapture.exceededTransferLimit).toBe(false);
    expect(geometry.parkWideCapture.outputWkid).toBe(4326);
    expect(geometry.parkWideCapture.queryBounds).toEqual([-111, 43.45, -110.25, 44.2]);
    expect(Object.values(geometry.parkWideCapture.originatorCounts).reduce((sum, count) => sum + count, 0)).toBe(1144);
  });

  it.each(IDS)("matches every managed NPS field for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    const html = readFileSync(new URL("./__fixtures__/nps-source-integrity/" + id + "-current.html", import.meta.url), "utf8");
    const report = checkNpsSourceIntegrity([profile], [{
      trailId: id, sourceUrl: profile.npsSourceUrl, finalUrl: profile.npsSourceUrl, httpStatus: 200, html,
    }], CHECKED_AT);
    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toHaveLength(6);
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(true);
  });

  it("recomputes the official NPS connector instead of fitting it to the listed mileage", () => {
    const connector = geometry.npsConnectors["heron-pond-swan-lake"];
    expect(miles(connector.vertices)).toBeCloseTo(connector.lengthMiles, 8);
    expect(connector.startOffsetMeters).toBeLessThan(10);
    expect(connector.endOffsetMeters).toBeLessThan(10);
  });

  it.each(IDS)("retains an ordered, connected route comparison for %s", (id) => {
    const route = geometry.trails[id];
    const definition = TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!;
    const usgsIds = route.steps.filter((step) => step.source === "USGS").map((step) => step.sourceRecordId);
    expect(definition.comparison.sourceRecordIds).toEqual(usgsIds);
    const oriented = route.steps.map((step) => {
      const item = step.source === "USGS"
        ? geometry.segments[step.sourceRecordId as keyof typeof geometry.segments]
        : geometry.npsConnectors[step.sourceRecordId as keyof typeof geometry.npsConnectors];
      const start = "vertices" in item ? item.vertices[0] : item.start;
      const end = "vertices" in item ? item.vertices.at(-1)! : item.end;
      return step.reverse ? { start: end, end: start, lengthMiles: item.lengthMiles } : { start, end, lengthMiles: item.lengthMiles };
    });
    for (let index = 1; index < oriented.length; index += 1) {
      expect(meters(oriented[index - 1].end, oriented[index].start)).toBeLessThan(10);
    }
    const total = oriented.reduce((sum, step) => sum + step.lengthMiles, 0);
    expect(total).toBeCloseTo(route.comparisonMiles, 8);
    expect(Number(total.toFixed(3))).toBe(TRAIL_CATALOG[id].distanceMiles.computedValue);
    expect(Math.abs(total - route.officialMiles) / route.officialMiles).toBeLessThan(0.03);
    expect(meters(geometry.officialTrailhead.coordinates, oriented[0].start)).toBeLessThan(75);
    expect(meters(geometry.officialTrailhead.coordinates, oriented.at(-1)!.end)).toBeLessThan(75);
    for (const sourceId of usgsIds) {
      expect(geometry.segments[sourceId as keyof typeof geometry.segments].sourceOriginator).toBe("National Park Service");
    }
  });

  it("keeps the short pond connector and full point loop mutually exclusive", () => {
    const heronIds = geometry.trails["heron-pond-swan-lake-loop"].steps.map((step) => step.sourceRecordId);
    const hermitageIds = geometry.trails["hermitage-point"].steps.map((step) => step.sourceRecordId);
    expect(heronIds).toContain("heron-pond-swan-lake");
    expect(heronIds).not.toContain("7280");
    expect(heronIds).not.toContain("4832");
    expect(hermitageIds).not.toContain("heron-pond-swan-lake");
    expect(hermitageIds).toEqual(expect.arrayContaining(["7280", "4832"]));
  });

  it.each(IDS)("uses the official Colter Bay weather point and starts with honest unknown conditions for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    expect(profile.coordinates!.lng).toBeCloseTo(geometry.officialTrailhead.coordinates[0], 7);
    expect(profile.coordinates!.lat).toBeCloseTo(geometry.officialTrailhead.coordinates[1], 7);
    expect(profile.elevationGainFeet.computedValue).toBeUndefined();
    expect(profile.sourceConfidence.gainMatch).toBe("unknown");
    expect(DEMO_CONTEXTS[id].weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(DEMO_CONTEXTS[id].alerts).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", alerts: [] });
  });
});
