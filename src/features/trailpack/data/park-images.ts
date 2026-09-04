import { TRAIL_CATALOG_ENTRIES } from "./trail-catalog";

export interface ParkPhoto {
  id: string;
  src: string;
  parkName: string;
  locationName: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  focalPoint?: {
    desktop: string;
    mobile?: string;
  };
}

export const PARK_PHOTO_ROTATION: readonly ParkPhoto[] = [
  {
    id: "grand-teton-teton-range",
    src: "/park-images/grand-teton-teton-range.jpg",
    parkName: "Grand Teton National Park",
    locationName: "Teton Range",
    alt: "Snowy peaks rise above green forest and spring wildflowers in Grand Teton National Park.",
    credit: "NPS Photo / Jane Gamble",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=D8FA991A-BAB6-4DA9-84CD-8B0F58A33E6A",
    focalPoint: { desktop: "50% 54%", mobile: "50% 53%" },
  },
  {
    id: "yosemite-half-dome",
    src: "/park-images/yosemite-national-park.jpg",
    parkName: "Yosemite National Park",
    locationName: "Half Dome from Snow Creek Trail",
    alt: "Half Dome rises above granite slopes and pine trees under cloudy skies.",
    credit: "NPS Photo / Dory Shreve",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=F0103896-0B72-4458-8DCC-9393098FCB46",
    focalPoint: { desktop: "58% 46%", mobile: "61% 48%" },
  },
  {
    id: "yellowstone-pelican-creek",
    src: "/park-images/yellowstone-national-park.jpg",
    parkName: "Yellowstone National Park",
    locationName: "Pelican Creek and Yellowstone Lake",
    alt: "Pelican Creek winding through golden wetlands toward Yellowstone Lake.",
    credit: "NPS Photo / Diane Renkin",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=FF5DCB7D-1DD8-B71B-0B7B-E46B9D89458A",
    focalPoint: { desktop: "52% 50%", mobile: "55% 50%" },
  },
  {
    id: "glacier-going-to-the-sun-road",
    src: "/park-images/glacier-national-park.jpg",
    parkName: "Glacier National Park",
    locationName: "Going-to-the-Sun Road",
    alt: "Going-to-the-Sun Road crosses a green mountain valley above waterfalls and a winding creek.",
    credit: "NPS Photo / Tim Rains",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=350026E2-1DD8-B71B-0BF0-87234FDB0F45",
    focalPoint: { desktop: "50% 56%", mobile: "52% 52%" },
  },
  {
    id: "olympic-coast-sea-stacks",
    src: "/park-images/olympic-national-park.jpg",
    parkName: "Olympic National Park",
    locationName: "Olympic Coast sea stacks",
    alt: "Rocky sea stacks rise from the Olympic Coast beyond a shaded tide pool.",
    credit: "NPS Photo",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=F24A5A69-155D-4519-3E4D-8113C1A7B030",
    focalPoint: { desktop: "50% 42%", mobile: "50% 45%" },
  },
  {
    id: "zion-canyon",
    src: "/park-images/zion-national-park.jpg",
    parkName: "Zion National Park",
    locationName: "Zion Canyon",
    alt: "Zion Canyon stretches between towering sandstone cliffs from Angels Landing.",
    credit: "NPS Photo",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=27CFD31C-155D-451F-67B1-099AF8F7BC45",
    focalPoint: { desktop: "50% 49%", mobile: "50% 50%" },
  },
  {
    id: "acadia-otter-cliff",
    src: "/park-images/acadia-national-park.jpg",
    parkName: "Acadia National Park",
    locationName: "Otter Cliff at sunrise",
    alt: "Warm sunrise light illuminates Otter Cliff above softened Atlantic waves.",
    credit: "NPS Photo / Matthew Lambert",
    sourceUrl:
      "https://www.nps.gov/media/photo/view.htm?id=8FC76911-1DD8-B71B-0B0C-44001AD49D55",
    focalPoint: { desktop: "60% 50%", mobile: "68% 50%" },
  },
] as const;

const TRAIL_PHOTOS: Readonly<Record<string, ParkPhoto>> = Object.fromEntries(
  Object.entries(TRAIL_CATALOG_ENTRIES).map(([id, entry]) => [id, entry.photo]),
);

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
