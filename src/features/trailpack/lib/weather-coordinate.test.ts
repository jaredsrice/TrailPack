import { describe, expect, it } from "vitest";
import review from "../../../../docs/data/weather-coordinate-review-2026-09-04.json";
import { TRAIL_CATALOG } from "../data/trail-catalog";

// Local tangent-plane distance is sufficient for these sub-kilometre checks.
// The captured reference is independent of the live catalog, so a swapped,
// mistyped, or silently changed weather point cannot pass by comparing to itself.
function distanceToLineMeters(lat: number, lng: number, line: number[][]) {
  const eastScale = 111_320 * Math.cos(lat * Math.PI / 180);
  const [a, b] = line.map(([x, y]) => [(x - lng) * eastScale, (y - lat) * 111_320]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const fraction = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy)));
  return Math.hypot(a[0] + fraction * dx, a[1] + fraction * dy);
}

describe("independently reviewed weather query points", () => {
  it("retains a complete, untruncated WGS84 review of the original seven points", () => {
    expect(review.outputWkid).toBe(4326);
    expect(review.exceededTransferLimit).toBe(false);
    expect(review.sourceOriginator).toBe("National Park Service");
    expect(new Set(review.trails.map(({ id }) => id)).size).toBe(7);
  });

  it.each(review.trails)("keeps $id at its reviewed trail-area weather point", (entry) => {
    const coordinates = TRAIL_CATALOG[entry.id].coordinates;
    expect(coordinates).toEqual(entry.coordinates);
    const meters = distanceToLineMeters(coordinates!.lat, coordinates!.lng, entry.line);
    expect(Math.abs(meters - entry.distanceToLineMeters)).toBeLessThan(0.05);
    // This is a weather-area check, not a navigation accuracy guarantee.
    expect(meters).toBeLessThan(600);
    expect(entry.sourceFeatureId).toMatch(/^\d+$/);
  });
});
