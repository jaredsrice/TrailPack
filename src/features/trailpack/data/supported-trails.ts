import type { TrailProfile } from "@/features/trailpack/types";

export interface SupportedPark {
  id: string;
  name: string;
  state: string;
  parkCode: string;
  trailIds: string[];
}

export const SUPPORTED_PARKS: SupportedPark[] = [
  {
    id: "grand-teton",
    name: "Grand Teton National Park",
    state: "Wyoming",
    parkCode: "grte",
    trailIds: ["jenny-lake-loop", "taggart-lake", "string-lake-loop"],
  },
];

export const JENNY_LAKE_LOOP: TrailProfile = {
  id: "jenny-lake-loop",
  name: "Jenny Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  coordinates: {
    lat: 43.7514,
    lng: -110.7222,
  },
  distanceMiles: {
    value: 7.1,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
    label: "official",
    computedValue: 6.947,
    computedSource: "USGS",
    computedSourceUrl: "USGS National Digital Trails",
  },
  elevationGainFeet: {
    value: 1040,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
    label: "official",
    computedValue: 698,
    computedSource: "USGS",
    computedSourceUrl: "USGS 3DEP",
    computedNote:
      "Computed estimate only; varies roughly 700–1,200 ft by method and does not match the official NPS gain.",
  },
  estimatedDuration: {
    value: "3-5 hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
    label: "official",
  },
  difficulty: {
    value: "Moderate",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
    label: "official",
  },
  routeType: "loop",
  elevationMinFeet: 6785,
  elevationMaxFeet: 6901,
  npsSourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
  sourceConfidence: {
    status: "official_nps_with_gain_conflict",
    summary:
      "Official NPS trail stats are the display values. USGS geometry closely matches the loop distance, but the USGS-computed elevation gain conflicts with the official NPS gain and is shown only as an estimate.",
    distanceMatch: "ok",
    gainMatch: "conflict",
    lastChecked: "2026-06-14",
  },
};

export const TAGGART_LAKE: TrailProfile = {
  id: "taggart-lake",
  name: "Taggart Lake",
  park: "Grand Teton National Park",
  state: "Wyoming",
  distanceMiles: {
    value: 3.0,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
    computedValue: 2.958,
    computedSource: "USGS",
    computedSourceUrl: "USGS National Digital Trails",
  },
  elevationGainFeet: {
    value: 360,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  estimatedDuration: {
    value: "1-2 Hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  difficulty: {
    value: "Easy",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  routeType: "out-and-back",
  npsSourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
  sourceConfidence: {
    status: "official_nps_with_usgs_geometry_ok",
    summary:
      "Official NPS display values are used, and the validated USGS route length is a close match for the short out-and-back route.",
    distanceMatch: "ok",
    gainMatch: "unknown",
    lastChecked: "2026-06-17",
  },
};

export const STRING_LAKE_LOOP: TrailProfile = {
  id: "string-lake-loop",
  name: "String Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  distanceMiles: {
    value: 3.7,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
    computedValue: 3.708,
    computedSource: "USGS",
    computedSourceUrl: "USGS National Digital Trails",
  },
  elevationGainFeet: {
    value: 540,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  estimatedDuration: {
    value: "2-3 Hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  difficulty: {
    value: "Easy",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  routeType: "loop",
  npsSourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
  sourceConfidence: {
    status: "official_nps_with_moderate_usgs_bridge",
    summary:
      "Official NPS display values are used, and the validated USGS route length is close but should be treated as a bridge estimate rather than an exact one-to-one match.",
    distanceMatch: "moderate_bridge",
    gainMatch: "unknown",
    lastChecked: "2026-06-17",
  },
};

export const SUPPORTED_TRAILS: Record<string, TrailProfile> = {
  "jenny-lake-loop": JENNY_LAKE_LOOP,
  "string-lake-loop": STRING_LAKE_LOOP,
  "taggart-lake": TAGGART_LAKE,
};

export function getTrailsForPark(parkId: string): TrailProfile[] {
  const park = SUPPORTED_PARKS.find((entry) => entry.id === parkId);
  if (!park) {
    return [];
  }

  return park.trailIds
    .map((trailId) => SUPPORTED_TRAILS[trailId])
    .filter((trail): trail is TrailProfile => Boolean(trail));
}

export function getSupportedParkForTrail(trailId: string): SupportedPark | null {
  return (
    SUPPORTED_PARKS.find((park) => park.trailIds.includes(trailId)) ?? null
  );
}
