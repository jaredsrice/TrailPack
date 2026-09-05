import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../../../../docs/data/taggart-loops-admission-2026-09-05.geometry.json";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { getSearchSuggestions } from "./search";

const IDS = ["taggart-beaver-creek-loop", "taggart-bradley-lake-loop"] as const;

describe("Taggart loop route admissions", () => {
  it.each(IDS)("preserves every managed NPS field for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    const html = readFileSync(new URL("./__fixtures__/nps-source-integrity/" + id + "-current.html", import.meta.url), "utf8");
    const report = checkNpsSourceIntegrity([profile], [{
      trailId: id, sourceUrl: profile.npsSourceUrl, finalUrl: profile.npsSourceUrl, httpStatus: 200, html,
    }], "2026-09-05");
    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toHaveLength(6);
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(true);
    expect(profile.routeType).toBe("loop");
  });

  it.each(IDS)("retains exact NPS-origin USGS corridor records for %s", (id) => {
    const route = geometry.trails[id];
    const definition = TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!;
    expect(definition.comparison.sourceRecordIds).toEqual(route.sourceRecordIds);
    const total = route.sourceRecordIds.reduce((sum, sourceId) =>
      sum + geometry.segments[sourceId as keyof typeof geometry.segments].lengthMiles, 0);
    expect(total).toBeCloseTo(route.comparisonMiles, 8);
    expect(Number(total.toFixed(3))).toBe(definition.comparison.distanceMiles);
    expect(Math.abs(total - route.officialMiles) / route.officialMiles).toBeLessThan(0.02);
    for (const sourceId of route.sourceRecordIds) {
      expect(geometry.segments[sourceId as keyof typeof geometry.segments].sourceOriginator).toBe("National Park Service");
    }
  });

  it("keeps the two route variants distinct", () => {
    const beaver = geometry.trails["taggart-beaver-creek-loop"].sourceRecordIds;
    const bradley = geometry.trails["taggart-bradley-lake-loop"].sourceRecordIds;
    expect(beaver).toContain("7892");
    expect(beaver).not.toContain("7891");
    expect(beaver).not.toContain("7887");
    expect(bradley).not.toContain("7892");
    expect(bradley).toContain("7891");
    expect(bradley).toContain("7887");
  });

  it.each(IDS)("uses the official Taggart trailhead weather marker for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    expect(profile.coordinates).toEqual({ lat: 43.69310815, lng: -110.73294997 });
    expect(profile.elevationGainFeet.computedValue).toBeUndefined();
    expect(profile.sourceConfidence.gainMatch).toBe("unknown");
    expect(DEMO_CONTEXTS[id].weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(DEMO_CONTEXTS[id].alerts).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", alerts: [] });
  });

  it.each([
    ["Beaver Creek", "taggart-beaver-creek-loop"],
    ["Bradley Lake", "taggart-bradley-lake-loop"],
  ])("finds the reviewed route by %s", (query, id) => {
    expect(getSearchSuggestions(query)).toContainEqual(expect.objectContaining({ trailId: id, type: "public-trail" }));
  });
});
