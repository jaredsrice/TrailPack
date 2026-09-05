import { describe, expect, it } from "vitest";
import {
  EMPTY_TRAIL_POPULARITY,
  getPopularTrailIds,
  hasTrailPopularity,
  incrementTrailPopularity,
  parseTrailPopularity,
  shuffleTrailIds,
} from "./trail-popularity";

const IDS = ["jenny", "taggart", "leigh", "trapper"];

describe("trail popularity", () => {
  it("accepts only supported positive safe click counts", () => {
    expect(parseTrailPopularity(JSON.stringify({
      version: 1,
      clicks: { jenny: 3, taggart: -1, unknown: 9, leigh: 1.5 },
    }), IDS)).toEqual({ version: 1, clicks: { jenny: 3 } });
    expect(parseTrailPopularity("not json", IDS)).toBe(EMPTY_TRAIL_POPULARITY);
    expect(parseTrailPopularity(JSON.stringify({ version: 2, clicks: { jenny: 9 } }), IDS))
      .toBe(EMPTY_TRAIL_POPULARITY);
  });

  it("increments one trail without discarding other counts", () => {
    expect(incrementTrailPopularity({ version: 1, clicks: { jenny: 2 } }, "leigh"))
      .toEqual({ version: 1, clicks: { jenny: 2, leigh: 1 } });
  });

  it("orders clicked trails by count and fills the remaining slots from fallback order", () => {
    const popularity = { version: 1 as const, clicks: { leigh: 2, jenny: 4 } };
    expect(getPopularTrailIds(popularity, IDS)).toEqual(["jenny", "leigh", "taggart"]);
    expect(hasTrailPopularity(popularity)).toBe(true);
    expect(hasTrailPopularity(EMPTY_TRAIL_POPULARITY)).toBe(false);
  });

  it("uses a deterministic Fisher-Yates shuffle when random values are supplied", () => {
    const values = [0, 0.5, 0.25];
    expect(shuffleTrailIds(IDS, () => values.shift() ?? 0)).toEqual([
      "leigh", "trapper", "taggart", "jenny",
    ]);
  });
});
