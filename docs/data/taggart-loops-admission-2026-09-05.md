# Taggart loop admission review — 2026-09-05

## Decision

Admit two distinct day-hike profiles from the Taggart Lake Trailhead:

- **Taggart Lake - Beaver Creek Loop** — NPS primary facts: 3.8 miles, 620 feet, 2–3 hours, Easy, loop.
- **Taggart Lake - Bradley Lake Loop** — NPS primary facts: 5.6 miles, 860 feet, 2–3 hours, Moderate, loop.

The existing 3.0-mile Taggart Lake out-and-back remains a separate profile. No route values are blended between the three variants.

## Source reconciliation

The dedicated NPS activity pages are the managed fact sources. The NPS trailhead summary currently differs: 3.9 miles / 500 feet / Moderate for Beaver Creek and 5.9 miles / 800 feet for Bradley. Those summaries are retained as conflicts, not averaged into the profiles. The Bradley activity page also says 860 feet in its main route fact and 890 feet in accessibility prose while both show 262 meters; TrailPack keeps the main 860-foot fact and preserves the accessibility paragraph verbatim.

The NPS map configurations explicitly select different route variants. The reviewed NPS-origin USGS corridor records total:

- 3.760 miles for Beaver Creek, 1.0% below the 3.8-mile activity-page value.
- 5.697 miles for Bradley, 1.7% above the 5.6-mile activity-page value.

USGS record `7892` is the direct Taggart connector used only by the Beaver comparison. Bradley instead uses Bradley Lake Trail `7891` and Valley Trail `7887`. The source layer has small endpoint gaps, so these are route-corridor comparisons and are never exposed as navigation geometry.

## Public recognition check

AllTrails has recognizable listings for both intended routes from the same trailhead: **Taggart Lake Loop** (3.8 miles, Easy, and describing Beaver Creek as a route option) and **Taggart Lake and Bradley Lake Loop** (about 6.0 miles, Moderate). The public-site differences are expected variant and measurement differences. They do not replace NPS facts, USGS comparison evidence, or live NPS conditions.

## Weather and photos

Both profiles use the official NPS Taggart Lake Trailhead point at `43.69310815, -110.73294997` for area weather. It is not a navigation point or a promise of uniform mountain conditions.

Each profile uses its corresponding NPS activity-page photograph at 2400 × 1350 with NPS Photo / A. Falgoust credit. Both assets were reviewed at source resolution for sharpness and centered separately for desktop and mobile.

## Troubleshooting contract

The focused admission test checks managed NPS parsing, exact USGS record membership and totals, route-variant separation, weather coordinates, honest unavailable fallbacks, and search aliases. If an official page changes, refresh the managed snapshot only after reviewing the route-level conflict notes here.
