import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../../../../docs/data/leigh-trapper-admission-2026-09-05.geometry.json";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { getSearchSuggestions } from "./search";

const IDS = ["leigh-lake", "bearpaw-trapper-lakes"] as const;

function meters(a: readonly number[], b: readonly number[]) {
  const rad = Math.PI / 180;
  return 6_371_008.8 * 2 * Math.asin(Math.sqrt(
    Math.sin((b[1] - a[1]) * rad / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) *
    Math.sin((b[0] - a[0]) * rad / 2) ** 2,
  ));
}

describe("Leigh Lake and Bearpaw-Trapper route admissions", () => {
  it.each(IDS)("preserves every managed NPS field for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    const html = readFileSync(new URL("./__fixtures__/nps-source-integrity/" + id + "-current.html", import.meta.url), "utf8");
    const report = checkNpsSourceIntegrity([profile], [{
      trailId: id, sourceUrl: profile.npsSourceUrl, finalUrl: profile.npsSourceUrl, httpStatus: 200, html,
    }], "2026-09-05");
    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toHaveLength(6);
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(true);
    expect(profile.routeType).toBe("out-and-back");
  });

  it("recomputes the entire NPS approach and retains the official weather marker on it", () => {
    const approach = geometry.npsConnectors["leigh-approach"];
    const computed = approach.vertices.slice(1).reduce((sum, point, i) =>
      sum + meters(approach.vertices[i], point) / 1609.344, 0);
    expect(computed).toBeCloseTo(approach.lengthMiles, 8);
    expect(approach.featureIndex).toBe(0);
    expect(approach.vertices).toHaveLength(43);
    expect(meters(geometry.officialTrailhead.coordinates,
      approach.vertices[geometry.officialTrailhead.nearestApproachVertex])).toBeLessThan(5);
    // The map marker is not the southern parking-access start. Do not trim to it.
    expect(meters(geometry.officialTrailhead.coordinates, approach.vertices[0])).toBeGreaterThan(100);
  });

  it.each(IDS)("keeps a connected, correctly retraced route for %s", (id) => {
    const route = geometry.trails[id];
    const definition = TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!;
    const usgsIds = route.steps.filter((step) => step.source === "USGS").map((step) => step.sourceRecordId);
    expect(definition.comparison.sourceRecordIds).toEqual(usgsIds);
    const oriented = route.steps.map((step) => {
      const item = step.source === "USGS"
        ? geometry.segments[step.sourceRecordId as keyof typeof geometry.segments]
        : geometry.npsConnectors["leigh-approach"];
      const start = "vertices" in item ? item.vertices[0] : item.start;
      const end = "vertices" in item ? item.vertices.at(-1)! : item.end;
      return { start: step.reverse ? end : start, end: step.reverse ? start : end, miles: item.lengthMiles };
    });
    for (let i = 1; i < oriented.length; i += 1) {
      expect(meters(oriented[i - 1].end, oriented[i].start)).toBeLessThan(5);
    }
    expect(route.outAndBack).toBe(true);
    const roundTrip = 2 * oriented.reduce((sum, step) => sum + step.miles, 0);
    expect(roundTrip).toBeCloseTo(route.comparisonMiles, 8);
    expect(Number(roundTrip.toFixed(3))).toBe(definition.comparison.distanceMiles);
    expect(Math.abs(roundTrip - route.officialMiles) / route.officialMiles).toBeLessThan(0.02);
    for (const sourceId of usgsIds) {
      expect(geometry.segments[sourceId as keyof typeof geometry.segments].sourceOriginator).toBe("National Park Service");
    }
  });

  it("distinguishes the short south-shore turnaround from the full Trapper route and excludes the Bearpaw spur", () => {
    expect(geometry.trails["leigh-lake"].steps.map((step) => step.sourceRecordId))
      .toEqual(["leigh-approach", "4833", "4831"]);
    expect(geometry.trails["bearpaw-trapper-lakes"].steps.map((step) => step.sourceRecordId))
      .toEqual(["leigh-approach", "4833", "4831", "4860", "4835"]);
    expect(geometry.excludedBranch).toBe("7330");
    // Both branches meet here, but the admitted route uses Trapper Lake Trail.
    expect(geometry.segments["7330"].end).toEqual(geometry.segments["4835"].start);
    expect(geometry.segments["4835"].end).toEqual([-110.73338418239369, 43.83401904934986]);
    expect(TRAIL_CATALOG["leigh-lake"].distanceMiles.value).toBe(1.8);
    expect(TRAIL_CATALOG["bearpaw-trapper-lakes"].elevationGainFeet.value).toBe(460);
  });

  it.each(IDS)("keeps %s weather coordinates, independent gain and unavailable feeds honest", (id) => {
    const profile = TRAIL_CATALOG[id];
    expect(profile.coordinates!.lat).toBeCloseTo(geometry.officialTrailhead.coordinates[1], 7);
    expect(profile.coordinates!.lng).toBeCloseTo(geometry.officialTrailhead.coordinates[0], 7);
    expect(profile.elevationGainFeet.computedValue).toBeUndefined();
    expect(profile.sourceConfidence.gainMatch).toBe("unknown");
    expect(DEMO_CONTEXTS[id].weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(DEMO_CONTEXTS[id].alerts).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", alerts: [] });
  });

  it.each([["Leigh", "leigh-lake"], ["Bearpaw", "bearpaw-trapper-lakes"], ["Trapper", "bearpaw-trapper-lakes"]])(
    "finds the reviewed trail by %s", (query, id) => {
      expect(getSearchSuggestions(query)).toContainEqual(expect.objectContaining({ trailId: id, type: "public-trail" }));
    },
  );
});
