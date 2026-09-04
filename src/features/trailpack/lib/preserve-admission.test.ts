import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../../../../docs/data/preserve-admission-2026-09-04.geometry.json";
import inventory from "../../../../docs/data/grand-teton-inventory-2026-09-04.json";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";

const IDS = ["lake-creek-woodland-loop", "phelps-lake-loop"] as const;
function meters(a: number[], b: number[]) {
  const radians = Math.PI / 180;
  const dlat = (b[1] - a[1]) * radians;
  const dlng = (b[0] - a[0]) * radians;
  return 6_371_008.8 * 2 * Math.asin(Math.sqrt(
    Math.sin(dlat / 2) ** 2 + Math.cos(a[1] * radians) * Math.cos(b[1] * radians) * Math.sin(dlng / 2) ** 2,
  ));
}

describe("Preserve route admissions", () => {
  it("tracks every captured NPS hiking listing without silently dropping the adjacent Parkway routes", () => {
    const checklist = readFileSync(new URL("../../../../docs/data/grand-teton-coverage.md", import.meta.url), "utf8");
    expect(inventory.returnedRecords).toBe(inventory.totalRecords);
    expect(inventory.hikingListings).toHaveLength(41);
    expect(new Set(inventory.hikingListings.map((entry) => entry.id)).size).toBe(41);
    for (const entry of inventory.hikingListings) expect(checklist).toContain(entry.url);
    expect(checklist).toContain("39 named Grand Teton hiking pages");
    expect(checklist).toContain("Adjacent Parkway listings are tracked separately");
  });

  it.each(IDS)("matches all six managed NPS fields for %s", (id) => {
    const profile = TRAIL_CATALOG[id];
    const html = readFileSync(new URL("./__fixtures__/nps-source-integrity/" + id + "-current.html", import.meta.url), "utf8");
    const report = checkNpsSourceIntegrity([profile], [{
      trailId: id, sourceUrl: profile.npsSourceUrl, finalUrl: profile.npsSourceUrl, httpStatus: 200, html,
    }], geometry.checkedAt);
    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toHaveLength(6);
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(true);
  });

  it("clips the access trail from the independently captured NPS trailhead, not from a fitted mileage", () => {
    const clip = geometry.accessClip;
    const marker = geometry.officialTrailhead.coordinates;
    const distances = clip.vertices.map((point) => meters(marker, point));
    expect(distances.indexOf(Math.min(...distances))).toBe(clip.startVertex);
    expect(distances[clip.startVertex]).toBeCloseTo(clip.markerOffsetMeters, 5);
    expect(clip.markerOffsetMeters).toBeLessThan(10);
    const cumulative = [0];
    for (let i = 1; i < clip.vertices.length; i++) cumulative.push(cumulative[i - 1] + meters(clip.vertices[i - 1], clip.vertices[i]));
    const fraction = (cumulative.at(-1)! - cumulative[clip.startVertex]) / cumulative.at(-1)!;
    expect(fraction).toBeCloseTo(clip.usedFraction, 10);
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(1);
    expect(geometry.outputWkid).toBe(4326);
    expect(geometry.exceededTransferLimit).toBe(false);
  });

  it.each(IDS)("keeps %s connected with a twice-counted clipped access leg", (id) => {
    const evidence = geometry.trails[id];
    const definition = TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!;
    expect(definition.comparison.sourceRecordIds).toEqual(evidence.segments.map((segment) => segment.sourceRecordId));
    const total = evidence.segments.reduce((sum, segment) => sum + segment.lengthMiles * segment.traversals, 0);
    expect(total).toBeCloseTo(evidence.comparisonMiles, 8);
    expect(Number(total.toFixed(3))).toBe(TRAIL_CATALOG[id].distanceMiles.computedValue);
    expect(Math.abs(total - TRAIL_CATALOG[id].distanceMiles.value) / TRAIL_CATALOG[id].distanceMiles.value).toBeLessThan(0.02);
    const access = evidence.segments.find((segment) => segment.sourceRecordId === geometry.accessClip.sourceFeatureId)!;
    expect(access.traversals).toBe(2);
    expect(access.usedFraction).toBe(geometry.accessClip.usedFraction);
    expect(access.start).toEqual(geometry.accessClip.vertices[geometry.accessClip.startVertex]);
    const key = (point: number[]) => point.map((coordinate) => coordinate.toFixed(6)).join(",");
    const neighbors = new Map<string, Set<string>>();
    const degree = new Map<string, number>();
    for (const segment of evidence.segments) {
      expect(segment.sourceOriginator).toBe("National Park Service");
      expect(segment.lengthMiles).toBeCloseTo(segment.sourceLengthMiles * segment.usedFraction, 10);
      const a = key(segment.start); const b = key(segment.end);
      if (!neighbors.has(a)) neighbors.set(a, new Set());
      if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b); neighbors.get(b)!.add(a);
      degree.set(a, (degree.get(a) ?? 0) + segment.traversals);
      degree.set(b, (degree.get(b) ?? 0) + segment.traversals);
    }
    const visited = new Set<string>();
    const pending = [neighbors.keys().next().value!];
    while (pending.length) {
      const current = pending.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      pending.push(...neighbors.get(current)!);
    }
    expect(visited.size).toBe(neighbors.size);
    expect([...degree.values()].every((value) => value % 2 === 0)).toBe(true);
  });

  it.each(IDS)("queries weather at the official Preserve trailhead for %s without inventing conditions or gain", (id) => {
    const profile = TRAIL_CATALOG[id];
    expect(profile.coordinates!.lat).toBeCloseTo(geometry.officialTrailhead.coordinates[1], 7);
    expect(profile.coordinates!.lng).toBeCloseTo(geometry.officialTrailhead.coordinates[0], 7);
    expect(profile.sourceRecords).toContainEqual(expect.objectContaining({ source: "NPS", sourceUrl: geometry.officialTrailhead.sourceUrl }));
    expect(profile.elevationGainFeet.computedValue).toBeUndefined();
    expect(profile.sourceConfidence.gainMatch).toBe("unknown");
    expect(DEMO_CONTEXTS[id].weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(DEMO_CONTEXTS[id].weather.temperatureF).toBeUndefined();
    expect(DEMO_CONTEXTS[id].alerts).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", alerts: [] });
  });

  it("shares one sharp source photo for the same shore without making the routes identical", () => {
    const [woodland, phelps] = IDS.map((id) => TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!);
    expect(woodland.photo).toEqual(phelps.photo);
    expect(woodland.official.sourceUrl).not.toBe(phelps.official.sourceUrl);
    expect(woodland.comparison.sourceRecordIds).not.toEqual(phelps.comparison.sourceRecordIds);
    expect(phelps.comparison.sourceRecordIds).not.toContain("4821");
    expect(phelps.comparison.sourceRecordIds).not.toContain("4816");
  });
});
