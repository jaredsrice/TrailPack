import type { TrailProfile } from "@/features/trailpack/types";

const USGS_TRAILS_LAYER_URL =
  "https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37";

export const COLTER_BAY_LAKESHORE_TRAIL: TrailProfile = {
  id: "colter-bay-lakeshore-trail",
  name: "Colter Bay Lakeshore Trail",
  park: "Grand Teton National Park",
  state: "Wyoming",
  profileKind: "public-source-import",
  retrievalStatus: "saved-fixture",
  retrievedAt: "2026-07-20",
  coordinates: {
    lat: 43.90068945,
    lng: -110.65001068,
  },
  distanceMiles: {
    value: 2.2,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
    label: "official",
    computedValue: 2.331,
    computedSource: "USGS",
    computedSourceUrl: USGS_TRAILS_LAYER_URL,
    computedNote:
      "Fifteen NPS-origin USGS trail segments total 2.331 miles, about 6% above the official NPS round-trip distance.",
  },
  elevationGainFeet: {
    value: 100,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
    label: "official",
  },
  estimatedDuration: {
    value: "1 hour",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
    label: "official",
  },
  difficulty: {
    value: "Easy",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
    label: "official",
  },
  routeType: "loop",
  npsSourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
  sourceConfidence: {
    status: "official_nps_with_strong_usgs_bridge",
    summary:
      "Official NPS values are displayed. The selected NPS-origin USGS Lakeshore Trail segments form a close geometry bridge, while elevation gain remains NPS-only.",
    distanceMatch: "strong_bridge",
    gainMatch: "unknown",
    lastChecked: "2026-07-20",
  },
  sourceRecords: [
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
      retrievedAt: "2026-07-20",
      note: "Official distance, climbing, duration, difficulty, and route description.",
    },
    {
      source: "USGS",
      role: "geometry-comparison",
      sourceUrl: USGS_TRAILS_LAYER_URL,
      retrievedAt: "2026-07-20",
      sourceRecordIds: [
        "4757",
        "4770",
        "4771",
        "4776",
        "4778",
        "4779",
        "4796",
        "4798",
        "4799",
        "4888",
        "4889",
        "4890",
        "4891",
        "4929",
        "7293",
      ],
      note:
        "NPS-origin Lakeshore Trail segments; summed geometry length 2.33107153 miles.",
    },
  ],
  missingFields: [],
};

export const TWO_OCEAN_LAKE_LOOP: TrailProfile = {
  id: "two-ocean-lake-loop",
  name: "Two Ocean Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  profileKind: "public-source-import",
  retrievalStatus: "saved-fixture",
  retrievedAt: "2026-07-20",
  coordinates: {
    lat: 43.9096367,
    lng: -110.52399853,
  },
  distanceMiles: {
    value: 6.4,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
    label: "official",
    computedValue: 6.335,
    computedSource: "USGS",
    computedSourceUrl: USGS_TRAILS_LAYER_URL,
    computedNote:
      "Three NPS-origin USGS trail segments total 6.335 miles, about 1% below the official NPS round-trip distance.",
  },
  elevationGainFeet: {
    value: 400,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
    label: "official",
    computedNote:
      "Official NPS pages conflict: the newer trailhead page lists 400 ft, while the older activity page lists 700 ft. AllTrails reports 488 ft as a comparison only; TrailPack keeps the newer official value and flags the conflict.",
  },
  estimatedDuration: {
    value: "3 hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
    label: "official",
  },
  difficulty: {
    value: "Moderate",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
    label: "official",
  },
  routeType: "loop",
  npsSourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
  sourceConfidence: {
    status: "official_nps_with_gain_conflict",
    summary:
      "The official 6.4-mile route is strongly supported by USGS and AllTrails comparisons. TrailPack displays the newer NPS page's 400-ft climbing value, but another NPS page lists 700 ft, so elevation confidence remains explicitly conflicted.",
    distanceMatch: "ok",
    gainMatch: "conflict",
    lastChecked: "2026-07-20",
  },
  sourceRecords: [
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm",
      retrievedAt: "2026-07-20",
      note:
        "Newer official page used for display: 6.4 miles, 3 hours, 400 ft total climbing, Moderate.",
    },
    {
      source: "NPS",
      role: "official-profile",
      sourceUrl: "https://www.nps.gov/thingstodo/twoocean.htm",
      retrievedAt: "2026-07-20",
      note:
        "Older official activity page agrees on distance, route, and difficulty but lists 3-5 hours and 700 ft elevation gain.",
    },
    {
      source: "USGS",
      role: "geometry-comparison",
      sourceUrl: USGS_TRAILS_LAYER_URL,
      retrievedAt: "2026-07-20",
      sourceRecordIds: ["4882", "7248", "7285"],
      note:
        "NPS-origin Two Ocean Lake Trail segments; summed geometry length 6.33516917 miles.",
    },
  ],
  missingFields: [],
};

export const PUBLIC_TRAILS: Record<string, TrailProfile> = {
  "colter-bay-lakeshore-trail": COLTER_BAY_LAKESHORE_TRAIL,
  "two-ocean-lake-loop": TWO_OCEAN_LAKE_LOOP,
};
