import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import audit from "../../../../docs/data/grand-teton-day-hike-audit-2026-09-09.json";
import { TRAIL_CATALOG, TRAIL_CATALOG_ENTRIES } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { getTrailGroup } from "./trail-groups";

type Feature = { attributes: { sourcefeatureid: string; lengthmiles: number; sourceoriginator: string } };
const bulkGeometry = JSON.parse(gunzipSync(readFileSync(new URL(
  "../../../../docs/data/grand-teton-bulk-2026-09-05.geometry.json.gz", import.meta.url,
))).toString()) as { features: Feature[] };
const addedGeometry = JSON.parse(gunzipSync(readFileSync(new URL(
  "../../../../docs/data/grand-teton-route-expansion-2026-09-09.geometry.json.gz", import.meta.url,
))).toString()) as { features: Feature[] };
const features = new Map([...bulkGeometry.features, ...(addedGeometry.features as Feature[])]
  .map((feature) => [String(feature.attributes.sourcefeatureid), feature]));

const legs: Record<string, Record<string, number>> = {
  "grand-view-point-jackson-lodge": { "5079": 2, "4896": 2, "4895": 2, "7308": 2 * 0.3875540190219804 },
  "moose-ponds-loop": { "5161": 2, "5154": 2, "5160": 2, "5101": 2, "5112": 2, "5100": 1, "5108": 1 },
  "granite-canyon-valley-trail": { "4964": 2, "4843": 2, "4844": 2, "4836": 2, "7347": 2 },
  "granite-canyon-rendezvous": { "7298": 1, "7282": 1, "7347": 1, "4836": 1, "4844": 1, "4843": 1, "4964": 1 },
  "marion-lake-rendezvous": { "7298": 2, "7301": 1, "7295": 1, "7310": 1, "7273": 2 * 0.5865669992124506, "7276": 1, "7282": 1 },
  "open-canyon-rendezvous": { "7298": 1, "7282": 1, "7276": 1 - 0.5911836507906388, "7309": 1, "4854": 1, "4838": 1, "7341": 1, "7340": 1, "7286": 1, "4836": 1, "4844": 1, "4843": 1 },
};
const fixtureFor: Record<string, string> = {
  "grand-view-point-jackson-lodge": "grand-view-point", "moose-ponds-loop": "moose-ponds",
  "granite-canyon-valley-trail": "granite-canyon", "granite-canyon-rendezvous": "granite-canyon",
  "marion-lake-rendezvous": "marion-lake", "open-canyon-rendezvous": "open-canyon",
};

describe("Grand Teton day-hike route expansion", () => {
  it("admits every evidence-complete alternate route and keeps one discovery group per destination", () => {
    expect(audit.admitted.map((route) => route.id)).toEqual(Object.keys(legs));
    expect(Object.keys(TRAIL_CATALOG)).toHaveLength(52);
    expect(getTrailGroup("grand-view-point")!.routes).toHaveLength(2);
    expect(getTrailGroup("moose-ponds")!.routes).toHaveLength(2);
    expect(getTrailGroup("granite-canyon")!.routes).toHaveLength(3);
    expect(getTrailGroup("marion-lake")!.routes).toHaveLength(2);
    expect(getTrailGroup("open-canyon")!.routes).toHaveLength(2);
  });

  it.each(Object.keys(legs))("%s retains an exact, reproducible NPS-origin USGS comparison", (id) => {
    const definition = TRAIL_DEFINITIONS.find((candidate) => candidate.trail.id === id)!;
    expect(new Set(definition.comparison.sourceRecordIds)).toEqual(new Set(Object.keys(legs[id])));
    const miles = Object.entries(legs[id]).reduce((sum, [sourceId, multiplier]) => {
      const feature = features.get(sourceId)!;
      expect(feature).toBeDefined();
      expect(feature.attributes.sourceoriginator).toBe("National Park Service");
      return sum + feature.attributes.lengthmiles * multiplier;
    }, 0);
    expect(miles).toBeCloseTo(definition.comparison.distanceMiles, 6);
    expect(Math.abs(miles / TRAIL_CATALOG[id].distanceMiles.value - 1)).toBeLessThan(0.12);
  });

  it.each(Object.keys(legs))("%s matches its captured NPS variant section", (id) => {
    const entry = TRAIL_CATALOG_ENTRIES[id];
    const html = readFileSync(new URL(`./__fixtures__/nps-bulk/${fixtureFor[id]}.html`, import.meta.url), "utf8");
    const report = checkNpsSourceIntegrity([entry.profile], [{ trailId: id, sourceUrl: entry.profile.npsSourceUrl,
      finalUrl: entry.profile.npsSourceUrl, httpStatus: 200, html }], "2026-09-09T23:00:00.000Z");
    const uncheckedRouteType = ["granite-canyon-valley-trail", "open-canyon-rendezvous"].includes(id);
    expect(report.results[0].fields.filter((field) => field.status !== "match" &&
      !(uncheckedRouteType && field.field === "routeType" && field.status === "not-checked"))).toEqual([]);
    expect(report.overallStatus).toBe("pass");
  });

  it("keeps every non-admitted discovery in an explicit evidence hold or exclusion list", () => {
    expect(audit.evidenceHolds).toHaveLength(26);
    expect(audit.evidenceHolds.every((candidate) => candidate.reason.length > 45)).toBe(true);
    expect(audit.excludedTechnical.length).toBeGreaterThan(5);
    expect(audit.policyDecisionsForReview).toHaveLength(6);
  });
});
