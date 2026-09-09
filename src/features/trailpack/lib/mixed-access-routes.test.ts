import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import shuttleEvidence from "../../../../docs/data/inspiration-point-shuttle-2026-09-07.json";
import walkingEvidence from "../../../../docs/data/grand-teton-bulk-2026-09-05.json";
import { MIXED_ACCESS_DEFINITIONS, NPS_CATALOG_ENTRIES, TRAIL_CATALOG, TRAIL_CATALOG_ENTRIES } from "../data/trail-catalog";
import { NPS_SOURCE_SNAPSHOTS } from "../data/nps-source-snapshots";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import { buildAccessRouteCatalog, compileMixedAccessRoutes, transportReminder } from "./mixed-access-routes";
import { describeRouteDistance, getTrailGroup } from "./trail-groups";
import { generatePackingRecommendation } from "./packing";
import { buildAiContractInput, buildGuardedAiReview } from "./ai-contract";
import { parseAiContractInput } from "./ai-contract-runtime";
import { buildSavedResultDraft } from "./saved-results";
import { getSearchSuggestions } from "./search";
import { handleAiReviewPost } from "./ai-review-route";

const definition = MIXED_ACCESS_DEFINITIONS[0];
const out = TRAIL_CATALOG["inspiration-point-boat-out"];
const back = TRAIL_CATALOG["inspiration-point-boat-back"];

describe("mixed boat and walking access", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("requires both distinct directions in the same destination chooser", () => {
    expect(getTrailGroup("inspiration-point")!.routes).toHaveLength(4);
    expect(out.id).not.toBe(back.id);
    expect(out.coordinates).toEqual(TRAIL_CATALOG["inspiration-point-shuttle"].coordinates);
    expect(back.coordinates).toEqual(TRAIL_CATALOG["inspiration-point"].coordinates);
    for (const route of [out, back]) {
      expect(getSearchSuggestions(route.name)).toHaveLength(1);
      expect(getSearchSuggestions(route.name)[0].trailId).toBe("inspiration-point");
      expect(describeRouteDistance(route)).toBe("~3.7 mi hiking · Mixed walk + boat · complete itinerary");
      expect(route.accessRoute!.distanceScope).toContain("One-way hiking");
      expect(route.sourceConfidence.status).toBe("derived_route_estimate");
      expect(route.elevationGainFeet).toMatchObject({ value: null, label: "unavailable" });
      expect(route.accessibility).toBeUndefined();
      expect(TRAIL_CATALOG_ENTRIES[route.id].snapshot).toBeUndefined();
      expect(TRAIL_CATALOG_ENTRIES[route.id].integrityPolicy).toBeUndefined();
      expect(NPS_SOURCE_SNAPSHOTS.trails[route.id]).toBeUndefined();
      const keys = route.sourceRecords.map((record) => JSON.stringify(record));
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("recomputes the land-only mileage from archived segments and connected paths", () => {
    type Feature = { attributes: { sourcefeatureid: string; lengthmiles: number }; geometry: { paths: number[][][] } };
    const archive = JSON.parse(gunzipSync(readFileSync(new URL("../../../../docs/data/grand-teton-bulk-2026-09-05.geometry.json.gz", import.meta.url))).toString()) as { features: Feature[] };
    const features = new Map([...archive.features, ...shuttleEvidence.features].map((feature) => [feature.attributes.sourcefeatureid, feature]));
    const walk = walkingEvidence.trails.find((trail) => trail.id === "inspiration-point")!;
    const walkingMiles = walk.legs.reduce((sum, leg) => sum + features.get(leg.id)!.attributes.lengthmiles * leg.fraction, 0);
    const shuttleIds = ["5082", "5117", "5116", "5086", "5093", "5084"];
    const dockMiles = shuttleIds.reduce((sum, id) => sum + features.get(id)!.attributes.lengthmiles * (id === "5084" ? shuttleEvidence.clippedFraction : 1), 0);
    expect(walkingMiles + dockMiles).toBeCloseTo(definition.mappedDistanceMiles, 9);
    expect(Math.round((walkingMiles + dockMiles) * 10) / 10).toBe(out.distanceMiles.value);
    expect([...definition.sourceRecordIds].sort()).toEqual([...new Set([...walk.legs.map((leg) => leg.id), ...shuttleIds])].sort());
    expect(definition.sourceRecordIds).not.toContain("5083"); // Optional Hidden Falls spur is excluded.
    for (const ids of [walk.legs.map((leg) => leg.id), shuttleIds]) {
      for (let i = 1; i < ids.length; i++) {
        const a = features.get(ids[i - 1])!.geometry.paths[0];
        const b = features.get(ids[i])!.geometry.paths[0];
        const gap = Math.min(...[a[0], a.at(-1)!].flatMap((point) => [b[0], b.at(-1)!].map((other) => Math.hypot((point[0] - other[0]) * 80400, (point[1] - other[1]) * 111195))));
        expect(gap, `${ids[i - 1]} connects to ${ids[i]}`).toBeLessThan(.5);
      }
      expect(ids.at(-1)).toBe("5084"); // Both legs meet at the same clipped viewpoint.
    }
    expect(walk.legs.at(-1)!.fraction).toBe(shuttleEvidence.clippedFraction);
    expect(out.distanceMiles.value).toBe(back.distanceMiles.value); // Reversing land path preserves length, not a claim of equal ascent.
    expect(out.distanceMiles.computedNote).toMatch(/49 m/);
  });

  it("rejects stale parent facts, mismatched approaches and duplicate route identities", () => {
    const parents = structuredClone(NPS_CATALOG_ENTRIES);
    parents[definition.walkingRouteId].profile.distanceMiles.value += .1;
    expect(() => compileMixedAccessRoutes(definition, parents)).toThrow(/parent facts changed/);
    const duplicate = structuredClone(definition);
    duplicate.options[1].id = duplicate.options[0].id;
    expect(() => compileMixedAccessRoutes(duplicate, NPS_CATALOG_ENTRIES)).toThrow(/duplicate/);
    const wrongDirection = structuredClone(definition);
    wrongDirection.options[1].transport = wrongDirection.options[0].transport;
    expect(() => compileMixedAccessRoutes(wrongDirection, NPS_CATALOG_ENTRIES)).toThrow(/both directional/);
    expect(() => compileMixedAccessRoutes({ ...definition, walkingRouteId: "taggart-lake" }, NPS_CATALOG_ENTRIES)).toThrow(/matching walking/);
    expect(() => compileMixedAccessRoutes({ ...definition, distanceMiles: 7.4 }, NPS_CATALOG_ENTRIES)).toThrow(/mapped mileage/);
    expect(() => buildAccessRouteCatalog(NPS_CATALOG_ENTRIES, [definition, definition])).toThrow(/Duplicate mixed route/);
  });

  it.each([out, back])("keeps %s estimates and return instructions in packing, AI and saved lists", (trail) => {
    const scenario = DEMO_CONTEXTS[trail.id];
    const recommendation = generatePackingRecommendation(trail, scenario.weather, scenario.alerts);
    const input = buildAiContractInput({ trail, ...scenario, recommendation, userInput: {} });
    expect(parseAiContractInput(input)).not.toBeNull();
    expect(buildGuardedAiReview(input, null).review.tripSummary).toContain("about 3.7 mi of hiking with unverified elevation gain");
    expect(input.trail).toMatchObject({ id: trail.id, elevationGainFeet: null, distanceIsEstimate: true, distanceMiles: 3.7 });
    expect(parseAiContractInput({ ...input, trail: { ...input.trail, elevationGainFeet: "unknown" } })).toBeNull();
    expect(parseAiContractInput({ ...input, trail: { ...input.trail, distanceIsEstimate: "yes" } })).toBeNull();
    const saved = buildSavedResultDraft({ trail, userInput: {}, recommendation });
    expect(saved.trailSummary).toMatchObject({ trailId: trail.id, elevationGainFeet: "Unverified", distanceMiles: 3.7 });
    expect(saved.trailSummary.sourceLabels).not.toContain("official");
    expect(saved.sourceLabels).not.toContain("supported-profile");
    expect(recommendation.missingDetails.join(" ")).toContain("Elevation gain is unverified");
    expect(recommendation.essential.find((item) => item.name === "Water")!.recommendation).toContain("2-3 liters");
    const boatItem = recommendation.essential.find((item) => item.name.endsWith("boat plan"))!;
    expect(boatItem.recommendation).toBe(transportReminder(trail.accessRoute!.transport));
    expect(saved.recommendation.essential).toContainEqual(boatItem);
    if (trail === out) {
      expect(boatItem.name).toBe("Outbound boat plan");
      expect(boatItem.recommendation).not.toContain("last");
      expect(boatItem.recommendation).toContain("no return boat is needed");
    } else {
      expect(boatItem.name).toBe("Return boat plan");
      expect(boatItem.recommendation).toContain("last west-dock departure");
    }
    expect(JSON.stringify(recommendation)).not.toContain("null ft");
  });

  it.each([out, back])("%s gets a guest API fallback without contacting the AI provider", async (trail) => {
    vi.stubEnv("GEMINI_API_KEY", "unit-test-placeholder-not-a-real-key");
    const scenario = DEMO_CONTEXTS[trail.id];
    const recommendation = generatePackingRecommendation(trail, scenario.weather, scenario.alerts);
    const input = buildAiContractInput({ trail, ...scenario, recommendation, userInput: {} });
    const provider = vi.fn();
    const claimQuota = vi.fn().mockResolvedValue({ status: "signed-out" });
    const response = await handleAiReviewPost(new Request("http://localhost/api/trailpack/ai-review", {
      method: "POST", body: JSON.stringify({ generationId: "00000000-0000-4000-8000-000000000001", input }),
    }), { claimQuota, requestReview: provider });
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.outcome).toBe("sign-in-required");
    expect(body.review.review.tripSummary).toContain("unverified elevation gain");
    expect(claimQuota).toHaveBeenCalledOnce();
    expect(provider).not.toHaveBeenCalled();
  });
});
