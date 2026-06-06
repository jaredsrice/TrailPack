import type { TrailProfile } from "@/types/trailpack";

export interface SupportedPark {
  id: string;
  name: string;
  state: string;
  trailIds: string[];
}

export const SUPPORTED_PARKS: SupportedPark[] = [
  {
    id: "grand-teton",
    name: "Grand Teton National Park",
    state: "Wyoming",
    trailIds: ["jenny-lake-loop"],
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
    status: "official_nps_with_usgs_geometry_ok",
    summary:
      "Official NPS trail stats with USGS geometry that closely matches the loop distance.",
    distanceMatch: "ok",
    gainMatch: "ok",
    lastChecked: "2026-06-06",
  },
};

export const SUPPORTED_TRAILS: Record<string, TrailProfile> = {
  "jenny-lake-loop": JENNY_LAKE_LOOP,
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
