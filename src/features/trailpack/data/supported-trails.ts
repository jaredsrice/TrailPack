import type { TrailProfile } from "@/features/trailpack/types";
import { PUBLIC_TRAILS } from "./public-trails";

const USGS_TRAILS_LAYER_URL =
  "https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37";

export interface SupportedPark {
  id: string;
  name: string;
  state: string;
  parkCode: string;
  trailIds: string[];
  publicTrailIds: string[];
}

export const SUPPORTED_PARKS: SupportedPark[] = [
  {
    id: "grand-teton",
    name: "Grand Teton National Park",
    state: "Wyoming",
    parkCode: "grte",
    trailIds: ["jenny-lake-loop", "taggart-lake", "string-lake-loop"],
    publicTrailIds: ["colter-bay-lakeshore-trail", "two-ocean-lake-loop"],
  },
];

export const JENNY_LAKE_LOOP: TrailProfile = {
  id: "jenny-lake-loop",
  name: "Jenny Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  profileKind: "curated",
  retrievalStatus: "saved-fixture",
  retrievedAt: "2026-06-14",
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
  sourceRecords: [
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
      retrievedAt: "2026-06-14",
      note: "Official display values for the supported profile.",
    },
    {
      source: "USGS",
      role: "geometry-comparison",
      sourceUrl: USGS_TRAILS_LAYER_URL,
      retrievedAt: "2026-06-14",
      note: "Validated route geometry and exploratory 3DEP elevation comparison.",
    },
  ],
  missingFields: [],
};

export const TAGGART_LAKE: TrailProfile = {
  id: "taggart-lake",
  name: "Taggart Lake",
  park: "Grand Teton National Park",
  state: "Wyoming",
  profileKind: "curated",
  retrievalStatus: "saved-fixture",
  retrievedAt: "2026-06-17",
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
  sourceRecords: [
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
      retrievedAt: "2026-06-17",
      note: "Official display values for the supported profile.",
    },
    {
      source: "USGS",
      role: "geometry-comparison",
      sourceUrl: USGS_TRAILS_LAYER_URL,
      retrievedAt: "2026-06-17",
      note: "Validated route geometry used for the distance comparison.",
    },
  ],
  missingFields: [],
};

export const STRING_LAKE_LOOP: TrailProfile = {
  id: "string-lake-loop",
  name: "String Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  profileKind: "curated",
  retrievalStatus: "saved-fixture",
  retrievedAt: "2026-06-17",
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
  sourceRecords: [
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
      retrievedAt: "2026-06-17",
      note: "Official display values for the supported profile.",
    },
    {
      source: "USGS",
      role: "geometry-comparison",
      sourceUrl: USGS_TRAILS_LAYER_URL,
      retrievedAt: "2026-06-17",
      note: "Validated route geometry used for the distance comparison.",
    },
  ],
  missingFields: [],
};

export const SUPPORTED_TRAILS: Record<string, TrailProfile> = {
  "jenny-lake-loop": JENNY_LAKE_LOOP,
  "string-lake-loop": STRING_LAKE_LOOP,
  "taggart-lake": TAGGART_LAKE,
};

export const TRAIL_CATALOG: Record<string, TrailProfile> = {
  ...SUPPORTED_TRAILS,
  ...PUBLIC_TRAILS,
};

export function getTrailById(trailId: string): TrailProfile | null {
  return TRAIL_CATALOG[trailId] ?? null;
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
