# Preserve loops: reviewed admission

Checked: 2026-09-04 UTC. Status: local review candidates, not a Production
release. These additions follow the seven-trail release in PR #50.

## Official route scope

| Route | Authoritative NPS facts | Independent USGS distance |
|---|---|---|
| [Lake Creek–Woodland Trail Loop](https://www.nps.gov/thingstodo/lakecreek-woodlandtrail.htm) | 3.0 mi; 770 ft gain; 1–3 hours; Easy | 2.960 mi, about 1.3% shorter |
| [Phelps Lake Loop](https://www.nps.gov/thingstodo/phelpslake.htm) | 6.4 mi; 1,060 ft gain; 3–5 hours; Moderate | 6.441 mi, about 0.6% longer |

Both start at the Laurance S. Rockefeller Preserve trailhead. The shorter hike
uses the Lake Creek and Woodland trails and the south-shore connection. The
longer route circles Phelps Lake. Neither includes the Aspen/Boulder Ridge
extensions or substitutes the separate Death Canyon approach. NPS published
facts remain authoritative; no distance is averaged or adjusted to fit USGS.
Independent computed elevation gains are unavailable and remain explicitly
unknown. Official accessibility/terrain text is retained without turning it
into a claim of accessibility certification.

The captured NPS HTML excerpts preserve the six managed fields and route
identity for offline regression checks. Scripts and unrelated page navigation
are omitted. The managed snapshot date records this admission, not a claim
that the trail is open or the weather is current.

## Geometry and weather point

The [USGS NPS-origin trails layer](https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37)
returned 452 WGS84 features in the bounded Grand Teton query, without a
transfer-limit truncation. The [captured evidence](preserve-admission-2026-09-04.geometry.json)
retains feature IDs, original lengths, endpoints, traversal counts, and the
complete access-line vertices needed to reproduce the clipped length.

NPS's own route maps establish which connections belong to the itineraries:
[Woodland map configuration](https://www.nps.gov/maps/builder/configs/79419100-2b75-4fe6-bbb2-fec05e46bb2f.json)
and [Phelps map configuration](https://www.nps.gov/maps/builder/configs/d0973041-f4d5-4f20-9875-ece94f004b3e.json).
Their internal feature identifiers are not the USGS source-feature IDs.

- Woodland: `4775`, `7277`, `4791`, `4821`, `4816`, `4761`, `4855`, `4794`.
- Phelps: `4775`, `7277`, `4791`, `4819`, `4818`, `7281`, `4842`, `7311`,
  `4810`, `4820`, `4761`, `4855`, `4794`.

The shared access feature `4794` extends beyond the official start. The NPS
trailhead marker independently selects vertex 168, approximately 5.3 metres
away. The segment from that vertex to the loop uses about 48.32% of the source
line and is counted twice, once in each direction. Other listed segments are
counted once. Whole-access-line totals of about 3.24 and 6.72 miles would use
the wrong start; the clip is based on the marker, not fitted to NPS mileage.
Tests recompute the geodesic fraction, weighted distances, connected topology,
and closed traversal. These are approximate comparisons, not navigation tracks.

Both weather requests use the same independently sourced
[official NPS Preserve trailhead](https://www.nps.gov/grte/planyourvisit/upload/Grand-Teton-Trailhead-Map.json):
43.62646052 latitude, -110.77570036 longitude. This is intentional because the
routes share a start. It is an area forecast, not a claim of identical weather
everywhere on either route. No provider, API budget, credential, or live-data
fallback behavior changes. Without a live response, conditions remain unknown.

## Photo and reuse

Both routes reach the photographed Phelps Lake south shore. One 5,472 × 3,078
NPS/C. Adams image serves both, with consistent credit, source link, and crop
metadata. Desktop framing is `55% 5%` to keep the mountain peaks in view;
mobile framing is `55% 42%` to retain the shore and foreground bench. The
separate 2,048 × 1,152 Phelps-page image was rejected because it
falls below the current minimum height; it was not enlarged or shipped.
The shared local asset avoids a duplicate download without pretending the
two routes are the same. Final desktop/mobile crops were inspected after the
wide framing was adjusted, with synchronized visible credit and source links.

## Coverage boundary

These two profiles advance the [Grand Teton day-hike inventory](grand-teton-coverage.md),
not a claim of complete park coverage. The complete discovery set currently
has 39 in-park NPS Hiking pages, some with several route variants, plus two
adjacent Parkway listings tracked separately. Overnight backpacking, technical
climbing, and navigation remain outside the planner's scope. Each further
admission still requires sources, route reconciliation, an appropriate weather
point, a clear credited photo, and guest desktop/mobile checks.

## Verification

- All 540 unit tests across 41 files, lint, type checking, and the optimized
  production build passed after the final data/crop changes.
- All nine offline catalog/photo checks passed. All nine live NPS comparisons
  passed with unchanged source facts; older snapshot review dates were retained.
- All 36 Firefox/axe flows passed in development mode, including both new
  routes at 1280 and 390 pixels, unknown/invalid provider data, date changes,
  guest generation, source credit, and photo loading. The four new-route flows
  passed again after the final crop adjustment with no console errors/warnings,
  horizontal overflow, or automated accessibility violations.
- The in-app Browser completed signed-out live-context generation for both
  routes: live forecast/daylight, three official park notices, and standard
  review ready. Lake Creek–Woodland was checked at 390 pixels and Phelps at
  1280 pixels; both had correct page identity, no error overlay, no broken
  visible images, no horizontal overflow, and clean error/warning logs.
- The 5,000-case mocked-provider system stress run passed with zero invariant
  failures (0.055 ms local p95; not a hosted latency measurement). The original
  27-scenario report regenerated without a tracked change.
- The homepage build is 50.5 kB / 153 kB first-load JavaScript, compared with
  49.7 kB / 152 kB for the released seven-trail build. Geometry evidence and
  test fixtures are not runtime imports. No dependencies, API budgets, packing
  rules, authentication, or AI limits changed.
- No interactive login, second account, live AI request, saved-result write,
  or hosted configuration change was needed. The new branch is not published
  or merged; owner review is still required.
