import type { TrailProfile } from "@/features/trailpack/types";
import { TRAIL_CATALOG } from "./trail-catalog";

export const COLTER_BAY_LAKESHORE_TRAIL = TRAIL_CATALOG["colter-bay-lakeshore-trail"];
export const TWO_OCEAN_LAKE_LOOP = TRAIL_CATALOG["two-ocean-lake-loop"];

export const PUBLIC_TRAILS: Record<string, TrailProfile> = Object.fromEntries(
  Object.entries(TRAIL_CATALOG).filter(([, trail]) => trail.profileKind === "public-source-import"),
);
