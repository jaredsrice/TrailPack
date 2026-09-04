import type { TrailProfile } from "@/features/trailpack/types";
import { PARK_DEFINITIONS, type ParkDefinition } from "./parks";
import { TRAIL_DEFINITIONS } from "./trails";
import { TRAIL_CATALOG } from "./trail-catalog";

export { TRAIL_CATALOG } from "./trail-catalog";

export interface SupportedPark extends ParkDefinition {
  trailIds: string[];
  publicTrailIds: string[];
}

export const SUPPORTED_PARKS: SupportedPark[] = PARK_DEFINITIONS.map((park) => ({
  ...park,
  trailIds: TRAIL_DEFINITIONS.filter((entry) => entry.trail.parkId === park.id && entry.profileKind === "curated").map((entry) => entry.trail.id),
  publicTrailIds: TRAIL_DEFINITIONS.filter((entry) => entry.trail.parkId === park.id && entry.profileKind === "public-source-import").map((entry) => entry.trail.id),
}));

export const JENNY_LAKE_LOOP = TRAIL_CATALOG["jenny-lake-loop"];
export const TAGGART_LAKE = TRAIL_CATALOG["taggart-lake"];
export const STRING_LAKE_LOOP = TRAIL_CATALOG["string-lake-loop"];

export const SUPPORTED_TRAILS: Record<string, TrailProfile> = Object.fromEntries(
  Object.entries(TRAIL_CATALOG).filter(([, trail]) => trail.profileKind === "curated"),
);

export function getTrailById(trailId: string): TrailProfile | null {
  return Object.hasOwn(TRAIL_CATALOG, trailId) ? TRAIL_CATALOG[trailId] : null;
}

export function getTrailsForPark(parkId: string): TrailProfile[] {
  const park = SUPPORTED_PARKS.find((entry) => entry.id === parkId);
  if (!park) {
    return [];
  }

  return [...park.trailIds, ...park.publicTrailIds]
    .map((trailId) => TRAIL_CATALOG[trailId])
    .filter((trail): trail is TrailProfile => Boolean(trail));
}

export function getSupportedParkForTrail(trailId: string): SupportedPark | null {
  return (
    SUPPORTED_PARKS.find((park) =>
      [...park.trailIds, ...park.publicTrailIds].includes(trailId),
    ) ?? null
  );
}
