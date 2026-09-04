import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkTrailDefinition, checkTrailDraft } from "../lib/trail-onboarding";
import { defineTrail, resolveTrailDefinition, type TrailDefinition } from "../lib/trail-definition";
import { generatePackingRecommendation, parseExpectedHours } from "../lib/packing";
import { getSearchSuggestions } from "../lib/search";
import { DEMO_CONTEXTS, getDemoScenario } from "./demo-contexts";
import { getContextParkPhoto } from "./park-images";
import { NPS_SOURCE_SNAPSHOTS } from "./nps-source-snapshots";
import { PARK_DEFINITIONS } from "./parks";
import { SUPPORTED_PARKS, getTrailById, getTrailsForPark } from "./supported-trails";
import { buildTrailCatalog, TRAIL_CATALOG, TRAIL_CATALOG_ENTRIES } from "./trail-catalog";
import { TRAIL_DEFINITIONS } from "./trails";

const options = {
  parks: SUPPORTED_PARKS, existingTrails: TRAIL_CATALOG,
  today: new Date().toISOString().slice(0, 10), allowExisting: true,
};

describe("one approved trail record drives the catalog", () => {
  it("registers every definition exactly once with one matching managed snapshot", () => {
    const ids = TRAIL_DEFINITIONS.map((entry) => entry.trail.id);
    const files = readdirSync(new URL("./trails/", import.meta.url))
      .filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));
    expect(new Set(ids).size).toBe(ids.length);
    expect(files.sort()).toEqual([...ids].sort());
    expect(Object.keys(NPS_SOURCE_SNAPSHOTS.trails).sort()).toEqual([...ids].sort());
    expect(Object.keys(DEMO_CONTEXTS).sort()).toEqual([...ids].sort());
    expect(getTrailsForPark("grand-teton").map((trail) => trail.id)).toEqual(ids);
  });

  it.each(TRAIL_DEFINITIONS.map((definition) => [definition.trail.id, definition] as const))(
    "%s passes the same schema and connects its profile, photo, source checks and guest fallback",
    (id, definition) => {
      const result = checkTrailDefinition(definition, NPS_SOURCE_SNAPSHOTS.trails, options);
      expect(result.ok, JSON.stringify(result.issues)).toBe(true);
      if (!result.ok) return;
      const entry = TRAIL_CATALOG_ENTRIES[id];
      const snapshot = NPS_SOURCE_SNAPSHOTS.trails[id];
      expect(getTrailById(id)).toBe(entry.profile);
      expect(entry.profile.distanceMiles).toMatchObject({ value: snapshot.distanceMiles, source: "NPS" });
      expect(entry.profile.elevationGainFeet.value).toBe(snapshot.elevationGainFeet);
      expect(entry.profile.retrievedAt).toBe(snapshot.checkedAt);
      expect(entry.profile.coordinates).toEqual(definition.trail.coordinates);
      expect(entry.profile.coordinates!.lat).toBeGreaterThan(43);
      expect(entry.profile.coordinates!.lng).toBeLessThan(-110);
      expect(getContextParkPhoto({ selectedParkId: "grand-teton", selectedTrailId: id })).toEqual(entry.photo);
      expect(entry.photo).toMatchObject({ src: definition.photo.src, credit: definition.photo.credit, focalPoint: definition.photo.focalPoint });
      expect(entry.integrityPolicy).toEqual(result.prepared.integrityPolicy);
      expect(getSearchSuggestions(definition.trail.name).some((suggestion) => suggestion.trailId === id)).toBe(true);
      const scenario = getDemoScenario(id)!;
      const packing = generatePackingRecommendation(entry.profile, scenario.weather, scenario.alerts, {});
      expect(packing.trailId).toBe(id);
      expect(packing.essential.length).toBeGreaterThan(0);
      expect(parseExpectedHours(entry.profile.estimatedDuration.value)).toBeGreaterThan(0);
    },
  );

  it("refreshes official facts in one place without changing reviewed comparison or photo data", () => {
    const definition = TRAIL_DEFINITIONS[0];
    const snapshots = structuredClone(NPS_SOURCE_SNAPSHOTS.trails);
    snapshots[definition.trail.id].distanceMiles += 0.1;
    snapshots[definition.trail.id].checkedAt = "2026-09-03";
    const before = structuredClone(definition);
    const entry = buildTrailCatalog([definition], snapshots, PARK_DEFINITIONS)[definition.trail.id];
    expect(entry.profile.distanceMiles.value).toBe(snapshots[definition.trail.id].distanceMiles);
    expect(entry.profile.distanceMiles.computedValue).toBe(definition.comparison.distanceMiles);
    expect(entry.photo.src).toBe(definition.photo.src);
    expect(definition).toEqual(before);
    expect(entry.profile.distanceMiles.value).not.toBe(TRAIL_CATALOG[definition.trail.id].distanceMiles.value);
  });

  it("prepares a new template without duplicating managed NPS facts or publishing it", () => {
    const draft = structuredClone(resolveTrailDefinition(TRAIL_DEFINITIONS[3], NPS_SOURCE_SNAPSHOTS.trails));
    draft.trail.id = "catalog-test-loop";
    draft.trail.name = "Catalog Test Loop";
    draft.sourceCheck.aliases = [draft.trail.name];
    const checked = checkTrailDraft(draft, { ...options, allowExisting: false });
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const definition = defineTrail(draft);
    expect(Object.keys(definition.official).sort()).toEqual(["additionalSources", "sourceUrl"]);
    const entries = buildTrailCatalog([definition], { [draft.trail.id]: checked.prepared.snapshot }, PARK_DEFINITIONS);
    expect(entries[draft.trail.id]).toEqual(checked.prepared);
    expect(getTrailById(draft.trail.id)).toBeNull();
  });

  it("rejects duplicate identities, missing parks and missing or rebound source snapshots", () => {
    const original = TRAIL_DEFINITIONS[0];
    const build = (definitions: readonly TrailDefinition[], snapshots = NPS_SOURCE_SNAPSHOTS.trails) =>
      buildTrailCatalog(definitions, snapshots, PARK_DEFINITIONS);
    expect(() => build([original, original])).toThrow(/Duplicate/);
    expect(() => build([{ ...original, trail: { ...original.trail, parkId: "unknown" } }])).toThrow(/Unknown park/);
    expect(() => build([original], {})).toThrow(/Missing managed/);
    expect(() => build([original], {
      ...NPS_SOURCE_SNAPSHOTS.trails,
      [original.trail.id]: { ...NPS_SOURCE_SNAPSHOTS.trails[original.trail.id], sourceUrl: "https://www.nps.gov/other.htm" },
    })).toThrow(/does not match/);
    expect(getTrailById("constructor")).toBeNull();
    expect(getDemoScenario("constructor")).toBeNull();
  });

  it("rejects unknown fields and duplicate official values rather than silently dropping them", () => {
    const definition = TRAIL_DEFINITIONS[0];
    expect(checkTrailDefinition({ ...definition, extra: true }, NPS_SOURCE_SNAPSHOTS.trails, options).ok).toBe(false);
    expect(checkTrailDefinition({ ...definition, official: { ...definition.official, distanceMiles: 99 } }, NPS_SOURCE_SNAPSHOTS.trails, options).ok).toBe(false);
    expect(checkTrailDefinition({ ...definition, profileKind: "automatic" }, NPS_SOURCE_SNAPSHOTS.trails, options).ok).toBe(false);
    expect(checkTrailDefinition(null, NPS_SOURCE_SNAPSHOTS.trails, options).ok).toBe(false);
  });

  it("preserves historical evidence gaps without allowing them on newly admitted drafts", () => {
    const existing = resolveTrailDefinition(TRAIL_DEFINITIONS[0], NPS_SOURCE_SNAPSHOTS.trails);
    expect(existing.comparison.recordIdNote).toMatch(/historical estimate/);
    expect(checkTrailDraft(existing, options).warnings.join(" ")).toMatch(/Historical geometry/);
    const newDraft = structuredClone(existing);
    newDraft.trail.id = "missing-evidence-test";
    newDraft.trail.name = "Missing Evidence Test";
    newDraft.sourceCheck.aliases = [newDraft.trail.name];
    const checked = checkTrailDraft(newDraft, { ...options, allowExisting: false });
    expect(checked.ok).toBe(false);
    expect(checked.issues).toContainEqual(expect.objectContaining({ field: "comparison.sourceRecordIds" }));
    const admitted = structuredClone(TRAIL_DEFINITIONS.find((definition) => definition.trail.id === "lunch-tree-hill")!);
    admitted.comparison.sourceRecordIds = [];
    admitted.comparison.recordIdNote = "This new trail must not claim the historical migration exception.";
    expect(checkTrailDefinition(admitted, NPS_SOURCE_SNAPSHOTS.trails, options).ok).toBe(false);
  });
});
