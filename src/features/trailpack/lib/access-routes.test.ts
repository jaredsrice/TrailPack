import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import evidence from "../../../../docs/data/inspiration-point-shuttle-2026-09-07.json";
import { TRAIL_CATALOG } from "../data/trail-catalog";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { buildTrailGroups, describeRouteDistance, getTrailGroup, resolveGroupRoute, TRAIL_GROUPS } from "./trail-groups";
import { getSearchSuggestions } from "./search";
import { generatePackingRecommendation } from "./packing";
import { buildAiContractInput } from "./ai-contract";
import { buildSavedResultDraft } from "./saved-results";
import { checkNpsSourceIntegrity } from "./nps-source-integrity";
import { checkTrailDefinition } from "./trail-onboarding";
import { NPS_SOURCE_SNAPSHOTS } from "../data/nps-source-snapshots";
import { SUPPORTED_PARKS } from "../data/supported-trails";
import { TRAIL_DEFINITIONS } from "../data/trails";

const walk = TRAIL_CATALOG["inspiration-point"];
const shuttle = TRAIL_CATALOG["inspiration-point-shuttle"];

describe("complete access routes", () => {
  it("groups four approaches without changing the original saved walking identity", () => {
    expect(Object.keys(TRAIL_GROUPS)).toHaveLength(39);
    const group = getTrailGroup("inspiration-point")!;
    expect(group.name).toBe("Inspiration Point");
    expect(group.routes.map((route) => route.id).sort()).toEqual([walk.id, "inspiration-point-boat-back", "inspiration-point-boat-out", shuttle.id]);
    expect(resolveGroupRoute(group)).toBeNull();
    expect(resolveGroupRoute(group, walk.id)).toBe(walk);
    expect(resolveGroupRoute(group, shuttle.id)).toBe(shuttle);
    expect(resolveGroupRoute(group, "taggart-lake")).toBeNull();
    expect(resolveGroupRoute(getTrailGroup("taggart-lake")!)).toBe(TRAIL_CATALOG["taggart-lake"]);
    expect(getTrailGroup("constructor")).toBeNull();
    expect(walk.name).toBe("Inspiration Point via South Jenny Lake");
    expect(walk.distanceMiles.value).toBe(5.7);
    expect(walk.elevationGainFeet.value).toBe(870);
  });

  it.each(["inspiration", walk.name, shuttle.name])("search %s returns one destination, not duplicate choices", (query) => {
    const choices = getSearchSuggestions(query);
    expect(choices).toHaveLength(1);
    expect(choices[0]).toMatchObject({ trailId: walk.id, title: "Inspiration Point" });
  });

  it("searching round-trip shuttle returns each matching destination once", () => {
    const choices = getSearchSuggestions("round-trip shuttle");
    expect(choices.map((choice) => choice.trailId).sort()).toEqual([
      "cascade-canyon-forks", "hidden-falls", "hurricane-pass", "inspiration-point", "lake-solitude",
    ]);
  });

  it("rejects conflicting, orphaned or duplicated group metadata", () => {
    expect(() => buildTrailGroups({ [shuttle.id]: shuttle })).toThrow(/original route ID/);
    expect(() => buildTrailGroups({ [walk.id]: walk, [shuttle.id]: { ...shuttle, park: "Other Park" } })).toThrow(/Conflicting/);
    expect(() => buildTrailGroups({ [walk.id]: walk, [shuttle.id]: { ...shuttle, accessRoute: { ...shuttle.accessRoute!, label: walk.accessRoute!.label } } })).toThrow(/Duplicate/);
    const definition = structuredClone(TRAIL_DEFINITIONS.find((entry) => entry.trail.id === shuttle.id)!);
    Object.assign(definition.trail.accessRoute!, { transport: "one-way-guess" });
    const result = checkTrailDefinition(definition, NPS_SOURCE_SNAPSHOTS.trails, {
      parks: SUPPORTED_PARKS, existingTrails: TRAIL_CATALOG, today: "2026-09-09", allowExisting: true,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.field === "trail.accessRoute.transport")).toBe(true);
  });

  it("displays complete totals once and distinguishes route shapes", () => {
    expect(describeRouteDistance(walk)).toBe("5.7 mi · Out-and-back · return included");
    expect(describeRouteDistance(shuttle)).toBe("1.8 mi · Out-and-back · return included");
    expect(describeRouteDistance({ ...walk, routeType: "loop" })).toBe("5.7 mi · Loop · full circuit");
    expect(describeRouteDistance({ ...walk, routeType: "point-to-point" })).toBe("5.7 mi · One-way · return not included");
    expect(describeRouteDistance({ ...walk, routeType: "unknown" })).toContain("check return distance");
  });

  it.each([walk, shuttle])("%s uses one concrete identity in packing, AI and immutable saved facts", (trail) => {
    const scenario = DEMO_CONTEXTS[trail.id];
    const recommendation = generatePackingRecommendation(trail, scenario.weather, scenario.alerts);
    const input = buildAiContractInput({ trail, ...scenario, recommendation, userInput: {} });
    const saved = buildSavedResultDraft({ trail, recommendation, userInput: {} });
    expect(input.trail).toMatchObject({ id: trail.id, name: trail.name, distanceMiles: trail.distanceMiles.value, elevationGainFeet: trail.elevationGainFeet.value, routeType: "out-and-back" });
    expect(recommendation).toMatchObject({ trailId: trail.id, trailName: trail.name });
    expect(saved.trailSummary).toMatchObject({ trailId: trail.id, name: trail.name, distanceMiles: trail.distanceMiles.value, elevationGainFeet: trail.elevationGainFeet.value, routeType: "out-and-back" });
    expect(recommendation.essential.some((item) => item.name === "Return boat plan")).toBe(trail === shuttle);
    expect(saved.recommendation.essential.some((item) => item.name === "Return boat plan")).toBe(trail === shuttle);
    const originalDistance = saved.trailSummary.distanceMiles;
    const edited = structuredClone(trail);
    edited.distanceMiles.value = 999;
    expect(saved.trailSummary.distanceMiles).toBe(originalDistance);
  });

  it("verifies separate NPS sections and fails if the shuttle metrics are replaced by walking values", () => {
    const html = readFileSync(new URL("./__fixtures__/nps-bulk/inspiration-point.html", import.meta.url), "utf8");
    const check = (content: string) => checkNpsSourceIntegrity([walk, shuttle], [walk, shuttle].map((trail) => ({ trailId: trail.id, sourceUrl: trail.npsSourceUrl, html: content })), "2026-09-07T12:00:00Z");
    expect(check(html).overallStatus).toBe("pass");
    expect(check(html.replaceAll("1.8", "5.7")).results.find((result) => result.trailId === shuttle.id)?.status).toBe("changed");
    expect(shuttle.accessibility?.value).not.toContain("870");
    expect(shuttle.accessibility?.value).toContain("16%");
  });

  it("recomputes the USGS corridor comparison and verifies the west-dock weather reference", () => {
    const features = new Map(evidence.features.map((feature) => [feature.attributes.sourcefeatureid, feature]));
    const clippedPath = features.get("5084")!.geometry.paths[0];
    // Project the reviewed viewpoint onto the actual archived polyline.
    let total = 0, bestOffset = Infinity, bestAlong = 0;
    for (let i = 1; i < clippedPath.length; i++) {
      const a = clippedPath[i - 1], b = clippedPath[i];
      const dx = (b[0] - a[0]) * 80400, dy = (b[1] - a[1]) * 111195;
      const px = (evidence.viewpoint[0] - a[0]) * 80400, py = (evidence.viewpoint[1] - a[1]) * 111195;
      const length = Math.hypot(dx, dy);
      const t = length ? Math.max(0, Math.min(1, (px * dx + py * dy) / length ** 2)) : 0;
      const offset = Math.hypot(px - t * dx, py - t * dy);
      if (offset < bestOffset) { bestOffset = offset; bestAlong = total + t * length; }
      total += length;
    }
    const fraction = bestAlong / total;
    expect(bestOffset).toBeLessThan(2);
    expect(fraction).toBeCloseTo(evidence.clippedFraction, 6);
    const comparison = evidence.features.reduce((sum, feature) => sum + 2 * feature.attributes.lengthmiles * (feature.attributes.sourcefeatureid === "5084" ? fraction : 1), 0);
    expect(comparison).toBeCloseTo(evidence.comparisonMiles, 6);
    expect(comparison).toBeCloseTo(shuttle.distanceMiles.computedValue!, 3);
    expect(Math.abs(comparison / shuttle.distanceMiles.value - 1)).toBeLessThan(.03);
    expect(evidence.features.every((feature) => feature.attributes.sourceoriginator === "National Park Service")).toBe(true);
    const ids = ["5082", "5117", "5116", "5086", "5093"];
    for (let i = 1; i < ids.length; i++) {
      const previous = features.get(ids[i - 1])!.geometry.paths[0];
      const current = features.get(ids[i])!.geometry.paths[0];
      expect([current[0], current.at(-1)]).toContainEqual(previous[0]);
    }
    const junction = features.get("5093")!.geometry.paths[0].at(-1);
    expect(features.get("5083")!.geometry.paths[0][0]).toEqual(junction);
    expect(clippedPath[0]).toEqual(junction);
    const dock = evidence.weather.coordinates;
    const landStart = features.get("5082")!.geometry.paths[0].at(-1)!;
    const gap = Math.hypot((dock[0] - landStart[0]) * 80400, (dock[1] - landStart[1]) * 111195);
    expect(gap).toBeGreaterThan(45);
    expect(gap).toBeLessThan(55);
    expect(shuttle.coordinates).toEqual({ lat: dock[1], lng: dock[0] });
    expect(shuttle.coordinates).not.toEqual(walk.coordinates);
    expect(shuttle.distanceMiles.computedNote).toContain("49 m");
  });
});
