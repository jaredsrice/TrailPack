import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getContextParkPhoto,
  PARK_PHOTO_ROTATION,
} from "./park-images";

function readJpegDimensions(src: string): { width: number; height: number } {
  const bytes = readFileSync(
    resolve(process.cwd(), "public", src.replace(/^\//, "")),
  );
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }

    const segmentLength = bytes.readUInt16BE(offset + 2);
    offset += segmentLength + 2;
  }

  throw new Error(`Could not read JPEG dimensions for ${src}.`);
}

describe("park photo selection", () => {
  it("offers a varied homepage rotation", () => {
    expect(PARK_PHOTO_ROTATION).toHaveLength(7);
    expect(new Set(PARK_PHOTO_ROTATION.map((photo) => photo.parkName)).size).toBe(
      7,
    );
    expect(
      PARK_PHOTO_ROTATION.every(
        (photo) =>
          photo.focalPoint?.desktop &&
          photo.sourceUrl.startsWith("https://www.nps.gov/media/photo/view.htm"),
      ),
    ).toBe(true);
  });

  it("prefers a trail-specific photo when a trail is selected", () => {
    const photo = getContextParkPhoto({
      selectedParkId: "grand-teton",
      selectedTrailId: "taggart-lake",
    });

    expect(photo?.locationName).toBe("Taggart Lake Trail");
    expect(photo?.sourceUrl).toContain("nps.gov");
  });

  it("gives every supported trail an intentional desktop and mobile crop", () => {
    const trailIds = [
      "jenny-lake-loop",
      "taggart-lake",
      "string-lake-loop",
      "colter-bay-lakeshore-trail",
      "two-ocean-lake-loop",
    ];
    const photos = trailIds.map((selectedTrailId) =>
      getContextParkPhoto({
        selectedParkId: "grand-teton",
        selectedTrailId,
      }),
    );

    expect(new Set(photos.map((photo) => photo?.id)).size).toBe(trailIds.length);
    expect(
      photos.every(
        (photo) =>
          photo?.focalPoint?.desktop && photo.focalPoint.mobile,
      ),
    ).toBe(true);
  });

  it("keeps every shipped showcase photo large enough for a crisp responsive crop", () => {
    const selectedTrailPhotos = [
      "jenny-lake-loop",
      "taggart-lake",
      "string-lake-loop",
      "colter-bay-lakeshore-trail",
      "two-ocean-lake-loop",
    ].map((selectedTrailId) =>
      getContextParkPhoto({
        selectedParkId: "grand-teton",
        selectedTrailId,
      }),
    );
    const photos = [...PARK_PHOTO_ROTATION, ...selectedTrailPhotos];

    for (const photo of photos) {
      expect(photo).not.toBeNull();
      const dimensions = readJpegDimensions(photo!.src);
      expect(dimensions.width, photo!.src).toBeGreaterThanOrEqual(2_000);
      expect(dimensions.height, photo!.src).toBeGreaterThanOrEqual(1_200);
    }
  });

  it("uses a park-level photo until the user chooses a trail", () => {
    const photo = getContextParkPhoto({
      selectedParkId: "grand-teton",
      selectedTrailId: null,
    });

    expect(photo?.parkName).toBe("Grand Teton National Park");
  });

  it("returns no locked photo for manual entry or the unselected homepage", () => {
    expect(
      getContextParkPhoto({
        selectedParkId: null,
        selectedTrailId: null,
      }),
    ).toBeNull();
  });
});
