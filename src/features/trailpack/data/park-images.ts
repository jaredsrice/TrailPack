export interface ParkPhoto {
  id: string;
  src: string;
  parkName: string;
  locationName: string;
  alt: string;
  credit: string;
  sourceUrl: string;
}

export const PARK_PHOTO_ROTATION: readonly ParkPhoto[] = [
  {
    id: "grand-teton-jenny-lake",
    src: "/park-images/grand-teton-jenny-lake.jpg",
    parkName: "Grand Teton National Park",
    locationName: "Jenny Lake Loop",
    alt: "A lakeside trail beneath the Teton Range at Jenny Lake.",
    credit: "NPS Photo / J. Bonney",
    sourceUrl: "https://www.nps.gov/thingstodo/jennylakeloop.htm",
  },
  {
    id: "yosemite-upper-fall",
    src: "/park-images/yosemite-national-park.jpg",
    parkName: "Yosemite National Park",
    locationName: "Upper Yosemite Fall and Merced River",
    alt: "Upper Yosemite Fall above the Merced River and a forested valley.",
    credit: "NPS Photo",
    sourceUrl: "https://www.nps.gov/yose/index.htm",
  },
  {
    id: "yellowstone-pelican-creek",
    src: "/park-images/yellowstone-national-park.jpg",
    parkName: "Yellowstone National Park",
    locationName: "Pelican Creek and Yellowstone Lake",
    alt: "Pelican Creek winding through golden wetlands toward Yellowstone Lake.",
    credit: "NPS Photo / Jacob W. Frank",
    sourceUrl: "https://www.nps.gov/yell/index.htm",
  },
  {
    id: "glacier-saint-mary-valley",
    src: "/park-images/glacier-national-park.jpg",
    parkName: "Glacier National Park",
    locationName: "St. Mary Valley",
    alt: "Going-to-the-Sun Road beneath dark mountains at dusk in St. Mary Valley.",
    credit: "NPS Photo",
    sourceUrl: "https://www.nps.gov/glac/index.htm",
  },
  {
    id: "olympic-high-country",
    src: "/park-images/olympic-national-park.jpg",
    parkName: "Olympic National Park",
    locationName: "Olympic high country",
    alt: "Backpackers watching sunset above clouds in Olympic National Park.",
    credit: "NPS Photo",
    sourceUrl: "https://www.nps.gov/olym/index.htm",
  },
  {
    id: "zion-watchman",
    src: "/park-images/zion-national-park.jpg",
    parkName: "Zion National Park",
    locationName: "The Watchman",
    alt: "The Watchman glowing above desert plants in Zion Canyon.",
    credit: "NPS Photo / Shane Carte",
    sourceUrl: "https://www.nps.gov/zion/index.htm",
  },
  {
    id: "acadia-atlantic-coast",
    src: "/park-images/acadia-national-park.jpg",
    parkName: "Acadia National Park",
    locationName: "Atlantic coast",
    alt: "Sunset over granite boulders and the Atlantic coast in Acadia National Park.",
    credit: "NPS Photo",
    sourceUrl: "https://www.nps.gov/articles/getaway-acad.htm",
  },
] as const;

const TRAIL_PHOTOS: Readonly<Record<string, ParkPhoto>> = {
  "jenny-lake-loop": PARK_PHOTO_ROTATION[0],
  "taggart-lake": {
    id: "grand-teton-taggart-lake",
    src: "/park-images/grand-teton-taggart-lake.jpg",
    parkName: "Grand Teton National Park",
    locationName: "Taggart Lake Trail",
    alt: "A trail through low evergreens beneath snow-streaked peaks near Taggart Lake.",
    credit: "NPS Photo / J. Bonney",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
  },
  "string-lake-loop": {
    id: "grand-teton-string-lake",
    src: "/park-images/grand-teton-string-lake.jpg",
    parkName: "Grand Teton National Park",
    locationName: "String Lake",
    alt: "Families beside clear green water and lodgepole pines at String Lake.",
    credit: "NPS Photo / Helton",
    sourceUrl: "https://www.nps.gov/places/000/string-lake-picnic-area.htm",
  },
  "colter-bay-lakeshore-trail": {
    id: "grand-teton-colter-bay",
    src: "/park-images/grand-teton-colter-bay.jpg",
    parkName: "Grand Teton National Park",
    locationName: "Colter Bay lakeshore",
    alt: "Jackson Lake and the Teton Range framed by sunlit autumn leaves at Colter Bay.",
    credit: "NPS Photo",
    sourceUrl: "https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm",
  },
  "two-ocean-lake-loop": {
    id: "grand-teton-two-ocean-lake",
    src: "/park-images/grand-teton-two-ocean-lake.jpg",
    parkName: "Grand Teton National Park",
    locationName: "Two Ocean Lake",
    alt: "A hiker beside Two Ocean Lake with the Teton Range in the distance.",
    credit: "NPS Photo / J. Bonney",
    sourceUrl: "https://www.nps.gov/thingstodo/twoocean.htm",
  },
};

const PARK_PHOTOS: Readonly<Record<string, ParkPhoto>> = {
  "grand-teton": PARK_PHOTO_ROTATION[0],
};

export function getContextParkPhoto({
  selectedParkId,
  selectedTrailId,
}: {
  selectedParkId: string | null;
  selectedTrailId: string | null;
}): ParkPhoto | null {
  if (selectedTrailId && TRAIL_PHOTOS[selectedTrailId]) {
    return TRAIL_PHOTOS[selectedTrailId];
  }

  if (selectedParkId && PARK_PHOTOS[selectedParkId]) {
    return PARK_PHOTOS[selectedParkId];
  }

  return null;
}
