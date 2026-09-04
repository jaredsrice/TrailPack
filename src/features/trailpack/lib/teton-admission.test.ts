import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import geometry from "../../../../docs/data/teton-expansion-2026-09-03.geometry.json";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { NPS_SOURCE_SNAPSHOTS } from "../data/nps-source-snapshots";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { TRAIL_DEFINITIONS } from "../data/trails";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { planNpsSourceRefresh } from "./nps-source-refresh";
import { parseExpectedHours } from "./packing";

const NEW_IDS = ["lunch-tree-hill", "christian-pond-loop"] as const;
const CHECKED_AT = "2026-09-03";
const PREVIOUS_CHECKED_AT = "2026-09-02";
const fixture = (id: string) => readFileSync(new URL("./__fixtures__/nps-source-integrity/" + id + "-current.html", import.meta.url), "utf8");
const page = (id: string, html = fixture(id)) => ({
  trailId: id, sourceUrl: TRAIL_CATALOG[id].npsSourceUrl,
  finalUrl: TRAIL_CATALOG[id].npsSourceUrl, httpStatus: 200, html,
});

describe("reviewed Grand Teton admissions", () => {
  it.each(NEW_IDS)("checks every managed field against captured NPS evidence for %s", (id) => {
    const report = checkNpsSourceIntegrity([TRAIL_CATALOG[id]], [page(id)], CHECKED_AT);
    expect(report.overallStatus).toBe("pass");
    expect(report.results[0].fields).toHaveLength(6);
    expect(report.results[0].fields.every((field) => field.status === "match")).toBe(true);
  });

  it.each(NEW_IDS)("retains a connected and correctly counted USGS route comparison for %s", (id) => {
    const evidence = geometry.trails[id];
    const definition = TRAIL_DEFINITIONS.find((entry) => entry.trail.id === id)!;
    expect(definition.comparison.sourceRecordIds).toEqual(evidence.segments.map((segment) => segment.sourceRecordId));
    const total = evidence.segments.reduce((sum, segment) => sum + segment.lengthMiles * segment.traversals, 0);
    expect(total).toBeCloseTo(evidence.comparisonMiles, 8);
    expect(Number(total.toFixed(3))).toBe(TRAIL_CATALOG[id].distanceMiles.computedValue);
    expect(Math.abs(total - TRAIL_CATALOG[id].distanceMiles.value) / TRAIL_CATALOG[id].distanceMiles.value).toBeLessThan(0.15);
    const key = (point: number[]) => point.map((coordinate) => coordinate.toFixed(6)).join(",");
    const neighbors = new Map<string, Set<string>>();
    const degree = new Map<string, number>();
    for (const segment of evidence.segments) {
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
    // A loop and its return access spur finish where they start.
    expect([...degree.values()].every((value) => value % 2 === 0)).toBe(true);
  });

  it("counts the Christian Pond lodge spur twice and excludes the unrelated pond spur", () => {
    const evidence = geometry.trails["christian-pond-loop"];
    expect(evidence.segments.find((segment) => segment.sourceRecordId === "5078")?.traversals).toBe(2);
    expect(evidence.segments.some((segment) => segment.sourceRecordId === "4894")).toBe(false);
  });

  it.each(NEW_IDS)("keeps forecast and current alerts unknown for %s until a provider responds", (id) => {
    expect(DEMO_CONTEXTS[id].weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(DEMO_CONTEXTS[id].weather.temperatureF).toBeUndefined();
    expect(DEMO_CONTEXTS[id].alerts).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", alerts: [] });
  });

  it("interprets Lunch Tree Hill's minute range as at most three quarters of an hour", () => {
    expect(parseExpectedHours(TRAIL_CATALOG["lunch-tree-hill"].estimatedDuration.value)).toBe(0.75);
  });

  function refreshDuration(duration: string) {
    const id = "lunch-tree-hill";
    const current = structuredClone(NPS_SOURCE_SNAPSHOTS);
    current.updatedAt = PREVIOUS_CHECKED_AT;
    current.trails[id].checkedAt = PREVIOUS_CHECKED_AT;
    current.trails[id].estimatedDuration = "20-45 Minutes";
    const profile = { ...TRAIL_CATALOG[id], estimatedDuration: { ...TRAIL_CATALOG[id].estimatedDuration, value: "20-45 Minutes" } };
    const html = fixture(id).replace("20-45 Minutes", duration);
    const report = checkNpsSourceIntegrity([profile], [page(id, html)], CHECKED_AT);
    return planNpsSourceRefresh({ profiles: [profile], current, firstReport: report, confirmationReport: report, checkedAt: CHECKED_AT });
  }

  it("accepts confirmed minute-based updates without relaxing the two-read source gate", () => {
    const plan = refreshDuration("20-40 Minutes");
    expect(plan.status).toBe("updated");
    expect(plan.document.trails["lunch-tree-hill"].estimatedDuration).toBe("20-40 minutes");
  });

  it.each(["0 Minutes", "45-20 Minutes", "2000 Minutes"])("blocks unsafe automatic duration update %s", (duration) => {
    const plan = refreshDuration(duration);
    expect(plan.status).toBe("blocked");
    expect(plan.document.trails["lunch-tree-hill"].estimatedDuration).toBe("20-45 Minutes");
  });
});
