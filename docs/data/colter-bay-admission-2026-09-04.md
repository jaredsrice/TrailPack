# Colter Bay loops: reviewed admission

Checked: 2026-09-04 UTC. Status: source, geometry, coordinate, original-photo,
full local validation, and hosted desktop/mobile Preview QA are complete. Owner
approval is still required before release. Production continues to contain the
nine trails released through PRs #50 and #51.

## Official route scope

| Route | Authoritative NPS facts | Independent route comparison |
|---|---|---|
| [Heron Pond–Swan Lake Loop](https://www.nps.gov/thingstodo/heronpond-swanlake.htm) | 3.1 mi; 320 ft gain; 1–3 hours; Easy | 3.043 mi, about 1.8% shorter |
| [Hermitage Point](https://www.nps.gov/thingstodo/hermitagepoint.htm) | 9.5 mi; 930 ft gain; 4–7 hours; Moderately Strenuous | 9.692 mi, about 2.0% longer |

Both routes start in the Colter Bay trailhead area and share the same approach
past Heron Pond. The shorter loop uses the NPS-published connector toward Swan
Lake. The longer route excludes that connector and continues around Hermitage
Point before returning through the Swan Lake side. These are separate profiles;
their shared start and trail segments are not grounds to merge their facts.

NPS facts remain authoritative. No distance or gain was averaged or adjusted to
fit another provider. Independent computed gain is unavailable and stays
unknown. The captured NPS excerpts preserve the six managed profile fields,
including trail-specific terrain/accessibility text; that text is not an
accessibility certification.

## Park-wide USGS capture

The previous Grand Teton geometry file was complete for its bounded query, but
its `43.62–44.05° N` and `110.87–110.37° W` envelope was not sufficient evidence
for every route in the park. A new review capture uses the larger envelope
`[-111.00, 43.45, -110.25, 44.20]`. An independent count query returned 1,144
records, and the geometry response returned the same 1,144 WGS84 records. The
service did not signal a transfer-limit overflow.

The 1,144-record, approximately 10 MB raw response is temporary review input,
not a runtime asset or a repository payload. Its SHA-256, bounds, counts, source
mix, and all selected route records are retained in the
[geometry evidence](colter-bay-admission-2026-09-04.geometry.json). Reproduce it
against the [USGS National Map trails layer](https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37)
with `where=1=1`, an envelope spatial intersection, input/output SR 4326, the
record fields named in the admission geometry, and `returnGeometry=true`.
Always compare a fresh count with returned features instead of assuming an
absent `exceededTransferLimit` field means complete data.

This park-wide download is a common geometry base, not automatic route approval.
NPS pages and map configurations still determine the intended start, route
variant, official facts, and additional connector geometry. USGS does not
provide current conditions, alerts, official elevation gain, or packing advice.

## Route reconciliation

The [Heron Pond map configuration](https://www.nps.gov/maps/builder/configs/22f176be-16fa-4c78-9ea0-4a8b77b3f6dc.json)
and [Hermitage Point map configuration](https://www.nps.gov/maps/builder/configs/7a01bab5-a9e2-4e89-936b-92e61ee6224d.json)
identify the two intended itineraries. The current USGS layer supplies the
shared NPS-origin segments `4784`, `4777`, `4786`, `4785`, `4868`, `7284`, and
`4918`.

- Heron Pond–Swan Lake adds the official
  [NPS connector](https://www.nps.gov/grte/planyourvisit/upload/Heron-Pond-and-Swan-Lake.json),
  whose 18 vertices recompute to 0.366281 mi. Its endpoints are approximately
  6.0 m and 4.8 m from the adjoining USGS lines.
- Hermitage Point excludes that short connector and instead adds USGS segments
  `7280` and `4832` for the full point loop.
- Each route is stored as an ordered sequence. Tests verify every adjoining
  endpoint, recompute the connector and total, confirm NPS origin for every
  USGS segment, and require the total to remain within 3% of the official value.

The official NPS Colter Bay trailhead marker is 43.90107552 latitude,
-110.64206064 longitude. The two USGS route ends stop about 43.8 m and 71.6 m
from that marker and about 107.3 m from each other within the developed access
area. Those short, unmeasured parking-area links are disclosed and excluded
from both computed totals rather than invented. Both profiles use the official
marker for weather requests. It is an area forecast, not a navigation point or
a promise of the same weather across the 9.5-mile Hermitage loop.

## Public comparison check

AllTrails is comparison-only and never populates TrailPack. Checked 2026-09-04:

| Route | NPS | AllTrails | Review |
|---|---|---|---|
| Heron Pond–Swan Lake | 3.1 mi; 320 ft; 1–3 h; Easy | [3.2 mi; 239 ft; 1–1.5 h; Easy](https://www.alltrails.com/trail/us/wyoming/swan-lake-and-heron-pond-trail) | Same loop/start; distance is close. NPS gain and duration remain authoritative. |
| Hermitage Point | 9.5 mi; 930 ft; 4–7 h; Moderately Strenuous | [10.0 mi; 816 ft; 4–4.5 h; Moderate](https://www.alltrails.com/trail/us/wyoming/colter-bay-hermitage-point-trail) | Same full loop/start; distance is close. NPS gain, duration, and difficulty remain authoritative. |

The AllTrails route text also distinguishes the pond connector from continuing
around Hermitage Point. Its alerts and user conditions are not imported; live
TrailPack notices continue to come from NPS.

## Photo review

- Heron Pond: 7,952 × 4,473 JPEG, NPS Photo / C. Adams. The original is sharp
  across the pond, reflection, trees, and range. Focal points `58% 50%` desktop
  and `62% 50%` mobile keep the mountain/reflection composition.
- Hermitage Point: 6,000 × 3,375 JPEG, NPS Photo / A. Falgoust. The foreground
  yellow flowers are sharp and the distant mountains are intentionally soft.
  Focal points `58% 50%` desktop and `58% 48%` mobile keep the sharp subject in
  frame so the depth of field does not read as an accidentally blurry image.

Both photographs came from their corresponding official NPS activity pages,
retain visible credit/source links, and are served locally. Local and hosted
Preview crops passed at 1280 × 900 and 390 × 844.

## Current verification

- The offline catalog/template/photo check passes all 11 shared records.
- All 44 focused catalog, source-parser, and Colter Bay admission tests pass.
- Lint, type checking, all 553 unit tests across 42 files, and the optimized
  production build pass.
- The 5,000-case system stress run passes with zero invariant failures and a
  0.053 ms p95; the scenario report is current.
- Live NPS integrity passes with all 11 registered trail pages unchanged.
- All 40 Firefox/axe flows pass. They cover both Colter Bay trails at 1280 px
  and 390 px, guest generation, live-context fallbacks, alert behavior, image
  synchronization, and the existing planner workflows.
- Local in-app Browser checks passed for both trails at 1280 × 900 and
  390 × 844: correct page/profile identity, sharp centered photographs,
  matching credits, no visible broken images, no horizontal overflow, clean
  error/warning logs, and a complete signed-out rule-based list plus standard
  review. The observed live context returned weather and three park notices.
- The same acceptance pass succeeded on the hosted Vercel Preview for PR #52;
  all six required hosted checks are green and the pull request is clean and
  mergeable. This records technical readiness, not owner approval to merge.
- No authentication, second account, AI provider call, saved-result write, API
  limit change, packing-rule change, or alert-behavior change is part of this
  admission.
