import { describe, expect, it } from "vitest";
import {
  getContextParkPhoto,
  PARK_PHOTO_ROTATION,
} from "./park-images";

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
