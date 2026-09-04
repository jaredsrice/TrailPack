import { compileTrail, resolveTrailDefinition, type TrailDefinition } from "../lib/trail-definition";
import type { PreparedTrail } from "../lib/trail-onboarding";
import { NPS_SOURCE_SNAPSHOTS, type NpsSourceSnapshot } from "./nps-source-snapshots";
import { PARK_DEFINITIONS, type ParkDefinition } from "./parks";
import { TRAIL_DEFINITIONS } from "./trails";

/** No fetches or side effects: approved metadata plus managed NPS facts. */
export function buildTrailCatalog(
  definitions: readonly TrailDefinition[],
  snapshots: Readonly<Record<string, NpsSourceSnapshot>>,
  parks: readonly ParkDefinition[],
): Record<string, PreparedTrail> {
  const entries: Record<string, PreparedTrail> = {};
  const names = new Set<string>();
  for (const definition of definitions) {
    const { id, name, parkId } = definition.trail;
    const normalizedName = name.trim().replace(/\s+/g, " ").toLowerCase();
    if (Object.hasOwn(entries, id) || names.has(normalizedName)) {
      throw new Error("Duplicate trail identity: " + id + ".");
    }
    const park = parks.find((candidate) => candidate.id === parkId);
    if (!park) throw new Error("Unknown park for " + id + ": " + parkId + ".");
    if (!["curated", "public-source-import"].includes(definition.profileKind)) {
      throw new Error("Invalid catalog group for " + id + ".");
    }
    entries[id] = compileTrail(resolveTrailDefinition(definition, snapshots), park, definition.profileKind);
    names.add(normalizedName);
  }
  return entries;
}

export const TRAIL_CATALOG_ENTRIES = buildTrailCatalog(
  TRAIL_DEFINITIONS, NPS_SOURCE_SNAPSHOTS.trails, PARK_DEFINITIONS,
);

export const TRAIL_CATALOG = Object.fromEntries(
  Object.entries(TRAIL_CATALOG_ENTRIES).map(([id, entry]) => [id, entry.profile]),
);
