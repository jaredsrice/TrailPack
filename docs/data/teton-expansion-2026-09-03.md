# Grand Teton catalog migration and two-trail admission

Reviewed: 2026-09-03 UTC (2026-09-02 America/Denver)

Status: Owner approved release; final coordinate review recorded below. Release
status is tracked by the pull request and deployment checks, not this dated record.

## Scope and consistency

All five original trails now use the same approved JSON definition and compiler
as new admissions. Their official NPS values and review dates remain unchanged,
as do their comparison estimates, historical warnings, photographs, and saved
demo contexts. Re-running the original 27-scenario report produces the identical
tracked report after stabilizing trail-ID order. Baseline packing comparisons
also preserve recommendation items; only timestamps and the consolidated
source-confidence wording differ.

Lunch Tree Hill and Christian Pond Loop are a bounded first expansion inside
the already supported park. This advances the planned verified-catalog expansion
without adding nationwide search, new park rules, an admin service, or another
provider. It is narrower than the earlier multi-region research direction by
design. NPS remains authoritative; USGS remains a separate comparison.

The original Jenny, Taggart, and String Lake comparison records did not retain
exact selected USGS feature IDs. Their migrated definitions say so and preserve
their historical review dates. No IDs were fabricated. A fixed exception permits
inspection of only those three existing records; every new admission must retain
its exact selected IDs. Colter Bay and Two Ocean retain their existing IDs.

The [architecture decision](../adr/0001-approved-trail-catalog.md) explains why
official values stay in the managed snapshot while manually reviewed metadata
uses one definition per trail. The privileged NPS publisher and its single-file
artifact boundary are unchanged.

## New official profiles

| Trail | NPS facts used by the planner | USGS comparison |
|---|---|---|
| [Lunch Tree Hill](https://www.nps.gov/thingstodo/lunchtreehill.htm) | 0.5 mi; 110 ft gain; 20–45 minutes; Easy; lollipop route normalized as loop | 0.46720373 mi across five connected segments; approximate bridge, about 7% shorter |
| [Christian Pond Loop](https://www.nps.gov/thingstodo/christianpond.htm) | 3.5 mi; 490 ft gain; 1–3 hours; Easy; loop | 3.50532502 mi including a twice-traversed lodge access spur; within 1% |

Both official pages include trail-specific accessibility/terrain text. That text
is retained as NPS guidance, not an accessibility certification. No computed
elevation gain is available for these additions; it remains unknown rather than
copied from the official value or guessed from route length.

Managed snapshots were compared against current official HTML. The admission
fixtures retain the relevant source sections for regression checks, including
Lunch Tree Hill's minute-based duration. The live integrity check matched all
six tracked fields for both new trails, and all seven catalog entries passed.
Older snapshot dates were not rewritten merely because the unchanged page was
checked again.

## Reproducible geometry evidence

The bounded [USGS trails layer](https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37)
query returned 452 features without a transfer-limit truncation. The
[geometry evidence](teton-expansion-2026-09-03.geometry.json) records the exact
query URL, capture time, selected NPS-origin segment IDs, source lengths,
traversal counts, and endpoints.

- Lunch Tree Hill uses `4797`, `4800`, `4804`, `4805`, and `7294`, once each.
  They form the connected mapped loop. The difference from the NPS lollipop
  distance is preserved rather than forcing a numerical match.
- Christian Pond uses `4904`, `4935`, `5079`, and the shared Emma Matilda segment
  `4911`, once each. Jackson Lake Lodge spur `5078` is counted twice for the
  approach and return. The unrelated Christian Pond Spur `4894` is excluded.
- Tests recompute the weighted totals and check connected, closed endpoint
  topology. These are planning comparisons, not published navigation routes or
  proof of current access. The user-facing notes stay short; detailed route
  reconciliation remains here and in the evidence file.

## AllTrails cross-check

Compared on 2026-09-03 against the seven linked public AllTrails route pages
and each profile's primary NPS page. The readable AllTrails pages were indexed
about three months earlier; these are a dated secondary comparison, not a
claim about today's AllTrails values, weather, or access. The overview metrics
on the opened route pages take precedence over older search snippets or nearby
trail cards. No login, paid access, new provider, or automated scraper was used.

Distances are miles and gains are feet. Time and difficulty are each provider's
published estimates, not equivalent calculation methods. The six similarly
named loops are candidate counterparts, not geometry-verified exact matches.
Taggart is explicitly a different route variant.

| Trail / primary NPS source | TrailPack / NPS: distance; gain | AllTrails: distance; gain | Duration: NPS / AllTrails | Difficulty: NPS / AllTrails | Comparison outcome |
|---|---|---|---|---|---|
| [Jenny Lake Loop](https://www.nps.gov/thingstodo/jennylakeloop.htm) | 7.1; 1,040 | [7.3; 472](https://www.alltrails.com/trail/us/wyoming/jenny-lake-trail) | 3–5 h / 2.5–3 h | Moderate / Moderate | Similar named loop; 0.2 mi longer but 568 ft less gain. Gain discrepancy unresolved. |
| [String Lake Loop](https://www.nps.gov/thingstodo/stringlake.htm) | 3.7; 540 | [3.7; 262](https://www.alltrails.com/trail/us/wyoming/string-lake-trail--6) | 2–3 h / 1–1.5 h | Easy / Moderate | Distance agrees; 278 ft less gain and different difficulty. This is the full loop, not the short accessible east-shore variant. |
| [Taggart Lake](https://www.nps.gov/thingstodo/taggartlake.htm) | 3.0; 360 | [3.8; 429](https://www.alltrails.com/trail/us/wyoming/taggart-lake-loop--2) | 1–2 h / 1.5–2 h | Easy / Easy | Not equivalent: NPS out-and-back versus AllTrails loop. No matching 3.0 mi out-and-back listing was verified. |
| [Colter Bay Lakeshore Trail](https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm) | 2.2; 100 | [2.6; 85](https://www.alltrails.com/trail/us/wyoming/colter-bay-lakeshore-trail) | 1 h / 0.5–1 h | Easy / Easy | AllTrails is 0.4 mi longer (about 18%); access points/route geometry need reconciliation before treating these as identical. |
| [Two Ocean Lake Loop](https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm) | 6.4; 400 | [6.4; 488](https://www.alltrails.com/trail/us/wyoming/two-ocean-lake-trail) | 3 h / 2.5–3 h | Moderate / Moderate | Distance/difficulty agree; AllTrails gain is 88 ft higher. Excludes Grand View Point and Emma Matilda extensions. |
| [Lunch Tree Hill](https://www.nps.gov/thingstodo/lunchtreehill.htm) | 0.5; 110 | [0.5; 95](https://www.alltrails.com/trail/us/wyoming/lunch-tree-hill-trail) | 20–45 min / 30–60 min | Easy / Easy | Distance/difficulty agree; 15 ft less gain. NPS calls it a lollipop loop. |
| [Christian Pond Loop](https://www.nps.gov/thingstodo/christianpond.htm) | 3.5; 490 | [3.5; 206](https://www.alltrails.com/trail/us/wyoming/christian-pond-trail) | 1–3 h / 1–1.5 h | Easy / Moderate | Distance agrees; 284 ft less gain and different difficulty. Gain discrepancy unresolved. |

The current NPS pages still support the stored profile statistics, including
the large gain differences for Jenny, String, and Christian Pond. The cause
cannot be established from published summaries alone: different route
geometry or elevation processing are possibilities, not verified explanations.
Do not average the sources, change NPS difficulty to match a reviewer vote,
or fill unknown USGS gain fields with AllTrails numbers. Before revising an
official value, reconcile the exact route and gain method or obtain corrected
official evidence. Existing USGS comparisons remain separate and unchanged.

The displayed USGS comparison distances (Jenny 6.947, String 3.708, Taggart
2.958, Colter Bay 2.331, Two Ocean 6.335, Lunch Tree Hill 0.467, and Christian
Pond 3.505 mi) do not independently prove an AllTrails route match. Jenny's
historical 698 ft computed gain also differs from AllTrails' 472 ft; it remains
explicitly in conflict with NPS. The other computed gains remain unknown.
No original geometry evidence or review dates were rewritten for this check.

Taggart's official page still includes a 2026 trail-work notice. The comparison
does not establish which sections are currently open; current park guidance
must be checked independently. No AllTrails alert, weather, review, or photo
was imported into TrailPack.

## NPS presentation follow-up

The feed card now shows a compact notice count and a closure hint when present.
All supplied titles, descriptions, and individual source links remain available
under **NPS notices and sources**, including before list generation and notices
that do not trigger a trip decision. Saved/unavailable context is not promoted
to a current notice list.

Generated lists keep the NPS action in Critical Safety and omit the duplicate
`active-alerts` overview only when the displayed safety rows already cover it.
An alert-backed trip decision retains its visible triggering titles, park-wide
uncertainty, conditional action, and expandable evidence. Ordinary notices retain
their review row, including alongside a separate heat decision. The packing
engine, saved snapshots, weather warnings, provider requests, quotas, and timeouts
are unchanged by this presentation-only cleanup.

## Weather coordinates and unknown conditions

### Independent seven-trail coordinate review — 2026-09-04 UTC

A fresh bounded USGS query returned 452 features in WGS84 (`outSR=4326`), with
no transfer-limit truncation. All seven stored points fall in their intended
named trail/access areas. The nearest reviewed NPS-origin line is approximately
6 m from Jenny's access-area point, 503 m from Taggart, 77 m from String,
13 m from Colter Bay, 311 m from Two Ocean, 18 m from Lunch Tree Hill, and
351 m from Christian Pond. No latitude/longitude swap or wrong-park point was
found; no coordinate values needed changing.

The [captured reference pairs](weather-coordinate-review-2026-09-04.json) retain
exact NPS source-feature IDs, coordinates, and measured distances. Regression
tests compare the catalog with this independently captured evidence, in addition
to the existing tests that verify the coordinates actually sent to the provider.
To reproduce the check, query the linked layer using the recorded bounding box,
`inSR=4326`, `outSR=4326`, `returnGeometry=true`, and the recorded
`sourcefeatureid` values. Distances use a local tangent-plane point-to-line
calculation on consecutive geometry vertices; they are approximate, not a survey.

[Open-Meteo's documented default](https://open-meteo.com/en/docs) selects a land
grid cell using local elevation. The returned weather-cell center may be several
kilometres from the requested point. These are suitable area-forecast references,
not trailhead directions or promises of conditions at every elevation along a
hike. Lake-loop extent centers are intentionally retained with that limitation.
No provider option, elevation override, or weather budget changed in this review.

This coordinate check does not recreate the original three historical route
distance comparisons. The stored NPS/USGS distance differences are all below
7%, but Jenny's computed gain remains in conflict and the other six computed
gains remain unavailable. NPS values stay authoritative; unknown gain is not
represented as agreement.

The two new trails, plus previously coordinate-less Taggart and String Lake,
receive approximate trail-area points from the reviewed NPS-origin USGS geometry.
Each definition records the source URL, review date, and coordinate purpose.
These are weather query points, not trailheads or navigation coordinates.

| Trail | Latitude | Longitude |
|---|---|---|
| Taggart Lake | 43.69617884 | -110.7445076 |
| String Lake Loop | 43.79032645 | -110.73139983 |
| Lunch Tree Hill | 43.8792214 | -110.57800853 |
| Christian Pond Loop | 43.88064255 | -110.56550468 |

Mocked provider checks verify the correct latitude, longitude, and planned date
for every catalog trail. New trails contain no invented weather, daylight, or
alerts. If live weather is unavailable, the API and client preserve explicit
unknown context. Failed parsing and date changes cannot relabel it as a saved
forecast. The interface keeps standard packing rules usable and does not show
an empty saved-weather disclosure. The catalog migration itself preserves
provider budgets, cancellation, stale-response handling, packing thresholds,
and AI limits.

### Local preview timeout follow-up

After intermittent eight-second forecast timeouts in the local preview, the
weather request budget increased to 15 seconds. Optional daylight lookup has a
separate three-second limit; a daylight failure leaves successful weather live.
The page allows 25 seconds overall for the response before using its explicit
fallback. Fast responses are not delayed. NPS budgets, cancellation,
stale-response handling, packing thresholds, AI limits, and retry behavior are
unchanged; no response caching was added.

Live NPS alerts also require a server-only `NPS_API_KEY` in the ignored local
`.env.local`; hosted settings are not inherited by the local server. Trail-page
integrity checks verify catalog facts, not alert API availability.

The initial local alert check correctly reported an unavailable feed because
the key was missing. The owner subsequently saved the private setting locally.
After restarting the existing build, the NPS route returned HTTP 200 with three
live official park notices in 672 ms, while weather returned HTTP 200 with live
forecast and daylight data in 1,047 ms. These are individual local smoke-test
measurements, not latency guarantees or a hosted performance benchmark.

The local key is Git-ignored, uses no public environment-variable prefix, and
was absent from all 39 browser build assets checked. No credential value is
recorded here. No interactive login, hosted configuration change, deployment,
or live AI call was needed to complete this local setup.

## Photographs

Both NPS activity pages credit their original images to NPS, without a displayed
third-party rights restriction. The [NPS disclaimer](https://www.nps.gov/aboutus/disclaimer.htm)
was checked alongside those source pages. TrailPack retains attribution and
source links; no NPS endorsement or right to use protected marks is implied.

- Lunch Tree Hill: 5184 × 2916 JPEG, NPS Photo. Desktop framing keeps the highest
  peak visible; mobile retains the mountains, lake, and foreground.
- Christian Pond: 5472 × 3078 JPEG, NPS Photo / J. Bonney. Framing retains the
  path through the meadow and the wooded ridge at both tested widths.

The [photo ledger](../ui/2026-07-25-national-park-image-sources.md) records local
paths, credits, sources, and exact focal points. Original images and rendered
desktop/mobile crops were visually reviewed. No old photograph or homepage
carousel scene was replaced. Runtime delivery still requests appropriately
sized local-image variants instead of eagerly downloading the originals.

## Verification and release boundary

The first hosted PR gate caught duplicate React keys in source records: the
geometry comparison and coordinate review share a provider, role, and URL but
are distinct evidence. Production builds omit that development warning, which
explains the initially green local production-server run. Keys now use the
complete immutable evidence record, keeping both notes visible and stable.
The existing four new-trail browser cases require clean error/warning logs;
catalog tests also require unique complete source records. The follow-up gate
runs against development mode without weakening that assertion.

- 521 unit tests across 40 files (rerun 2026-09-04), including independently
  captured weather-coordinate checks, definition consistency, offline
  preparation/no-overwrite behavior, actual source fixtures, duration units,
  geometry reconciliation, client contracts, and seven-trail provider mapping.
- All seven definitions and local photos pass `trail:check -- --catalog`.
- All seven live NPS integrity comparisons pass unchanged.
- 5,000 system stress cases across seven trails, with 10,200 packing evaluations
  and zero invariant failures. The 2026-09-04 rerun measured p95 packing time at 0.049 ms;
  this is an in-process result, not a hosted network latency claim.
- All 32 Firefox/axe flows pass, including the two new trails at 1280-pixel
  desktop and 390-pixel mobile widths. Guest generation, source/photo identity,
  failed and unknown weather, planned-date changes, clean error/warning logs,
  no horizontal overflow, and automated accessibility checks are covered.
- The NPS presentation follow-up preserves notice descriptions/source links,
  keyboard disclosure, closure uncertainty, and non-closure guidance alongside
  heat decisions. Independent rain/heat overview warnings remain visible.
  A live in-app Browser check at 1280 × 900 and 390 × 844 showed the compact
  three-notice status and exactly one alert-backed safety action, with clean
  error/warning logs, no broken visible images, and no horizontal overflow.
  Standard review remained usable without authentication; no live AI call was
  needed. The final 2026-09-04 gate reran unit, catalog, live NPS integrity,
  deterministic scenario, system stress, lint, type/build, and all 32 UI checks.
- Separate timeout boundaries preserve live weather when it arrives after the
  old deadline, cancel stalled optional daylight, and restore usable planning
  when the entire browser weather request reaches 25 seconds.
- Lint, type checking, the production build, and documentation checks pass.
  Homepage first-load JavaScript is 152 kB, versus 150 kB before this update.
  The detailed offline validator is outside the runtime dependency path.

No interactive authentication, second account, paid/live AI review,
saved-result write, or new dependency was required. The subsequent timeout
adjustment is documented separately above. API quota stress uses local
mocks; it does not consume an owner's live allowance. No hosted PR acceptance
or production deployment is claimed by this local validation record. The owner
has approved publication; the protected pull request and deployment statuses
record whether that publication succeeds.
