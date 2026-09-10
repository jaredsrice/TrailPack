import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import evidenceJson from "../../../../docs/data/jenny-lake-shuttle-routes-2026-09-09.json";
import shuttleGeometry from "../../../../docs/data/inspiration-point-shuttle-2026-09-07.json";
import { TRAIL_CATALOG, TRAIL_CATALOG_ENTRIES } from "../data/trail-catalog";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { getTrailGroup } from "./trail-groups";

type Point = [number, number];
type Feature = {
  attributes: { sourcefeatureid: string; lengthmiles: number; sourceoriginator: string };
  geometry: { paths: Point[][] };
};
type Leg = { id: string; times: number; fraction: number; end?: Point };
type EvidenceRoute = {
  id: string;
  npsUrl: string;
  npsMapUrl: string;
  officialDistanceMiles: number;
  comparisonMiles: number;
  distanceMatch: string;
  legs: Leg[];
  recognition: { url: string; relationship: string; note: string };
};

const evidence = evidenceJson as unknown as {
  routes: EvidenceRoute[];
  deferredOfficialVariants: Array<{ name: string; reason: string; resolvedBy?: string }>;
  weather: { sourceUrl: string; coordinates: Point };
};
const bulkGeometry = JSON.parse(gunzipSync(readFileSync(new URL(
  "../../../../docs/data/grand-teton-bulk-2026-09-05.geometry.json.gz",
  import.meta.url,
))).toString()) as { features: Feature[] };
const features = new Map(
  [...bulkGeometry.features, ...(shuttleGeometry.features as Feature[])]
    .map((feature) => [feature.attributes.sourcefeatureid, feature]),
);

function meters(a: Point, b: Point): number {
  return Math.hypot((a[0] - b[0]) * 80400, (a[1] - b[1]) * 111195);
}

function selectedEnds(leg: Leg): Point[] {
  const path = features.get(leg.id)!.geometry.paths[0];
  return [path[0], leg.end ?? path.at(-1)!];
}

describe("Jenny Lake round-trip shuttle variants", () => {
  it("admits the four NPS variants as distinct access choices", () => {
    expect(evidence.routes).toHaveLength(4);
    expect(Object.keys(TRAIL_CATALOG)).toHaveLength(52);
    for (const route of evidence.routes) {
      const profile = TRAIL_CATALOG[route.id];
      expect(profile).toBeDefined();
      expect(profile.distanceMiles.value).toBe(route.officialDistanceMiles);
      expect(profile.distanceMiles.computedValue).toBeCloseTo(route.comparisonMiles, 9);
      expect(profile.sourceConfidence.distanceMatch).toBe(route.distanceMatch);
      expect(profile.coordinates).toEqual({ lat: evidence.weather.coordinates[1], lng: evidence.weather.coordinates[0] });
      expect(profile.accessRoute).toMatchObject({ transport: "round-trip-shuttle" });
      expect(profile.accessRoute!.comparison).toMatchObject({
        source: "AllTrails",
        sourceUrl: route.recognition.url,
        relationship: route.recognition.relationship,
      });
      expect(getTrailGroup(profile.accessRoute!.groupId)!.routes).toHaveLength(2);
      expect(TRAIL_CATALOG_ENTRIES[route.id].snapshot).toBeDefined();
      expect(TRAIL_CATALOG_ENTRIES[route.id].integrityPolicy!.metricSectionHeading).toMatch(/Via Shuttle Boat/);
      expect(profile.sourceRecords.some((record) => record.sourceUrl === route.npsMapUrl)).toBe(true);
    }
  });

  it("recomputes every comparison from retained NPS-origin USGS features", () => {
    for (const route of evidence.routes) {
      const miles = route.legs.reduce((sum, leg) => {
        const feature = features.get(leg.id)!;
        expect(feature).toBeDefined();
        expect(feature.attributes.sourceoriginator).toBe("National Park Service");
        return sum + feature.attributes.lengthmiles * leg.fraction * leg.times;
      }, 0);
      expect(miles).toBeCloseTo(route.comparisonMiles, 9);
      expect(TRAIL_CATALOG[route.id].distanceMiles.computedValue).toBeCloseTo(miles, 9);
      for (let index = 1; index < route.legs.length; index += 1) {
        const previous = selectedEnds(route.legs[index - 1]);
        const current = selectedEnds(route.legs[index]);
        const gap = Math.min(...previous.flatMap((a) => current.map((b) => meters(a, b))));
        expect(gap, `${route.id}: ${route.legs[index - 1].id} joins ${route.legs[index].id}`).toBeLessThan(0.6);
      }
    }
  });

  it("matches each captured NPS access section", () => {
    for (const route of evidence.routes) {
      const entry = TRAIL_CATALOG_ENTRIES[route.id];
      const fixtureId = route.id.replace(/-shuttle$/, "");
      const html = readFileSync(new URL(`./__fixtures__/nps-bulk/${fixtureId}.html`, import.meta.url), "utf8");
      const report = checkNpsSourceIntegrity([entry.profile], [{
        trailId: route.id,
        sourceUrl: route.npsUrl,
        finalUrl: route.npsUrl,
        httpStatus: 200,
        html,
      }], "2026-09-09T18:00:00.000Z");
      expect(report.results[0].fields.filter((field) => field.status !== "match")).toEqual([]);
      expect(report.overallStatus).toBe("pass");
    }
  });

  it("retains the former evidence holds with their resolving route IDs", () => {
    expect(evidence.deferredOfficialVariants.map((variant) => variant.name)).toEqual([
      "Grand View Point from Jackson Lake Lodge",
      "Marion Lake from Rendezvous Mountain",
      "Moose Ponds Loop",
    ]);
    for (const variant of evidence.deferredOfficialVariants) {
      expect(variant.reason).toContain("retained archive does not establish its complete route geometry");
      expect(variant.resolvedBy).toBeTruthy();
      expect(TRAIL_CATALOG[variant.resolvedBy!]).toBeDefined();
    }
  });
});
