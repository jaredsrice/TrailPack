import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import evidence from "../../../../docs/data/grand-teton-bulk-2026-09-05.json";
import inventory from "../../../../docs/data/grand-teton-inventory-2026-09-04.json";
import { TRAIL_CATALOG } from "../data/supported-trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";

type Point = number[];
interface GeometryFeature {
  attributes: { sourcefeatureid: string; lengthmiles: number; sourceoriginator: string };
  geometry: { paths: Point[][] };
}
const geometry = JSON.parse(gunzipSync(readFileSync(new URL(
  "../../../../docs/data/grand-teton-bulk-2026-09-05.geometry.json.gz", import.meta.url,
))).toString()) as { features: GeometryFeature[]; npsTrailheadMarkers: { properties: { name: string }; geometry: { coordinates: Point } }[] };
const features = new Map(geometry.features.map((feature) => [String(feature.attributes.sourcefeatureid), feature]));

// Recompute against the archived vertices, not the evidence's claimed offsets.
function locate(point: Point, path: Point[]) {
  let total = 0, offset = Infinity, along = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = (path[i][0] - path[i - 1][0]) * 80400;
    const dy = (path[i][1] - path[i - 1][1]) * 111195;
    const px = (point[0] - path[i - 1][0]) * 80400;
    const py = (point[1] - path[i - 1][1]) * 111195;
    const length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, (px * dx + py * dy) / (length * length))) : 0;
    const distance = Math.hypot(px - t * dx, py - t * dy);
    if (distance < offset) { offset = distance; along = total + t * length; }
    total += length;
  }
  return { total, offset, along };
}

describe("Grand Teton bulk route admission", () => {
  it("registers the complete reviewed batch without duplicate identities", () => {
    expect(evidence.trails).toHaveLength(24);
    expect(new Set(evidence.trails.map((trail) => trail.id)).size).toBe(24);
    expect(Object.keys(TRAIL_CATALOG)).toHaveLength(39);
    const coveredUrls = new Set(Object.values(TRAIL_CATALOG).map((trail) => trail.npsSourceUrl));
    // These two longstanding profiles use NPS Places as their primary source.
    coveredUrls.add("https://www.nps.gov/thingstodo/colterlakeshore.htm");
    coveredUrls.add("https://www.nps.gov/thingstodo/twoocean.htm");
    expect(TRAIL_CATALOG["colter-bay-lakeshore-trail"]).toBeDefined();
    expect(TRAIL_CATALOG["two-ocean-lake-loop"]).toBeDefined();
    // Discovery tags both adjoining Parkway hikes as grte too. Keep the
    // geographically reviewed exclusions explicit, not inferred from that tag.
    const parkwayUrls = new Set([
      "https://www.nps.gov/thingstodo/polecatcreek.htm",
      "https://www.nps.gov/thingstodo/flaggcanyon.htm",
    ]);
    expect(inventory.hikingListings.filter((page) => parkwayUrls.has(page.url))).toHaveLength(2);
    const parkPages = inventory.hikingListings.filter((page) => !parkwayUrls.has(page.url));
    expect(parkPages).toHaveLength(39);
    expect(parkPages.filter((page) => !coveredUrls.has(page.url))).toEqual([]);
  });

  for (const trail of evidence.trails) {
    it(`${trail.id}: matches the captured NPS source and selected approach`, () => {
      const profile = TRAIL_CATALOG[trail.id];
      expect(profile).toBeDefined();
      const html = readFileSync(new URL(`./__fixtures__/nps-bulk/${trail.id}.html`, import.meta.url), "utf8");
      const report = checkNpsSourceIntegrity([profile], [{
        trailId: trail.id, sourceUrl: trail.npsUrl, finalUrl: trail.npsUrl, httpStatus: 200, html,
      }], "2026-09-05T23:00:00.000Z");
      const manualRouteType = ["granite-canyon", "open-canyon"].includes(trail.id);
      expect(report.results[0].fields.filter((field) => field.status !== "match" &&
        !(manualRouteType && field.field === "routeType" && field.status === "not-checked"))).toEqual([]);
      expect(report.overallStatus).toBe("pass");
      expect(profile.accessibility?.value).toBeTruthy();
    });

    it(`${trail.id}: retains reproducible comparison and recognizable public route evidence`, () => {
      const miles = trail.legs.reduce((sum, leg) => sum + leg.sourceLengthMiles * leg.fraction * leg.times, 0)
        + trail.officialConnectors.reduce((sum, connector) => sum + connector.miles * connector.traversals, 0);
      expect(miles).toBeCloseTo(trail.comparisonMiles, 8);
      expect(Math.abs(miles / TRAIL_CATALOG[trail.id].distanceMiles.value - 1)).toBeLessThan(0.06);
      expect(trail.weather.offsetMeters).toBeLessThan(35);
      expect(trail.recognition.url).toMatch(/^https:\/\/www.alltrails.com\/trail\//);
      expect(trail.recognition.note.length).toBeGreaterThan(30);
      for (const leg of trail.legs) {
        expect(leg.fraction).toBeGreaterThan(0);
        expect(leg.fraction).toBeLessThanOrEqual(1);
        expect([1, 2]).toContain(leg.times);
        expect(leg.startDistance).toBeLessThan(20);
        expect(leg.endDistance).toBeLessThan(20);
      }
    });

    it(`${trail.id}: recomputes clipping and weather placement from archived source geometry`, () => {
      const marker = geometry.npsTrailheadMarkers.find((marker) => marker.properties.name === trail.weather.marker);
      expect(marker?.geometry.coordinates).toEqual(trail.weather.coordinates);
      expect(TRAIL_CATALOG[trail.id].coordinates).toEqual({ lat: trail.weather.coordinates[1], lng: trail.weather.coordinates[0] });
      const offsets: number[] = [];
      for (const leg of trail.legs) {
        const feature = features.get(leg.id)!;
        expect(feature.attributes.sourceoriginator).toBe("National Park Service");
        expect(feature.attributes.lengthmiles).toBe(leg.sourceLengthMiles);
        expect(feature.geometry.paths).toHaveLength(1);
        const path = feature.geometry.paths[0];
        const a = locate("start" in leg && leg.start ? leg.start : path[0], path);
        const b = locate("end" in leg && leg.end ? leg.end : path.at(-1)!, path);
        expect(Math.abs(b.along - a.along) / a.total).toBeCloseTo(leg.fraction, 6);
        expect(a.offset).toBeCloseTo(leg.startDistance, 3);
        expect(b.offset).toBeCloseTo(leg.endDistance, 3);
        offsets.push(locate(trail.weather.coordinates, path).offset);
      }
      for (const connector of trail.officialConnectors) {
        expect(locate(connector.coordinates[0], connector.coordinates).total / 1609.344).toBeCloseTo(connector.miles, 6);
        offsets.push(locate(trail.weather.coordinates, connector.coordinates).offset);
      }
      expect(Math.min(...offsets)).toBeCloseTo(trail.weather.offsetMeters, 3);
    });
  }

  it("keeps the closed Death Canyon start distinct from alternate approaches", () => {
    for (const trail of evidence.trails.filter((trail) => trail.weather.marker === "Death Canyon Trailhead")) {
      expect(TRAIL_CATALOG[trail.id].planningNote).toContain("including to pedestrians");
      expect(TRAIL_CATALOG[trail.id].planningNote).toContain("do not use them for an alternate trailhead");
    }
  });
});
