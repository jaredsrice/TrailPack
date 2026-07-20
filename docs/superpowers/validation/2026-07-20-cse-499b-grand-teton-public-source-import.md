# CSE 499B Grand Teton Public-Source Import Validation

Date: 2026-07-20  
Requirement: B-01 permission-compliant public trail lookup  
Branch: `codex/b01-public-trail-adapter`  
Status: Tetons-first implementation complete; visual UAT and scope acceptance pending

## Decision

Use a bounded, manually approved NPS/USGS import workflow before expanding
outside Grand Teton National Park. NPS supplies the official planning facts.
USGS National Digital Trails supplies secondary identity and geometry evidence.
TrailPack keeps the sources separate, records the selected USGS source feature
IDs, and sends any trail that has not passed review to manual entry.

The rejected Nominatim runtime adapter, route, types, and tests were removed.
The reliability study remains the evidence for that decision.

## Selected Trails

| Trail | Official NPS facts | USGS comparison | Result |
|---|---|---|---|
| Colter Bay Lakeshore Trail | 2.2 mi round trip, 100 ft climbing, 1 hour, Easy, loop | 15 NPS-origin `Lakeshore Trail` segments total 2.33107153 mi, about 5.96% above NPS | Accepted as a strong geometry bridge; NPS remains authoritative |
| Two Ocean Lake Loop | Newer NPS page: 6.4 mi round trip, 400 ft climbing, 3 hours, Moderate, circle/loop; older NPS activity page lists 700 ft and 3-5 hours | 3 NPS-origin `Two Ocean Lake Trail` segments total 6.33516917 mi, about 1.01% below NPS | Route accepted as a close geometry match; displayed gain uses the newer NPS page but remains conflict-labeled |

The saved coordinates are the centers of the selected USGS geometry extents.
They support weather lookup and are not labeled as official NPS trailhead
coordinates.

## AllTrails Comparison-Only Check

AllTrails was checked manually on 2026-07-20 as an independent plausibility
comparison. It is not an import source, does not override NPS, and is not a
runtime TrailPack dependency.

| Trail | TrailPack authority and bridge | Current AllTrails listing | Assessment |
|---|---|---|---|
| Colter Bay Lakeshore Trail | NPS: 2.2 mi, 100 ft, 1 hour, Easy, loop; USGS: 2.33107153 mi | 2.6 mi, 85 ft, 0.5-1 hour, Easy, loop | Same trail identity, route type, difficulty, and overlapping duration. AllTrails distance is 18.2% above NPS and 11.5% above USGS; gain is 15% below NPS. NPS and USGS agree more closely, so no TrailPack value changes. The difference likely reflects route tracing or access-point definition and is retained as a comparison flag, not treated as error proof. |
| Two Ocean Lake Loop | Newer NPS: 6.4 mi, 400 ft, 3 hours, Moderate, loop; older NPS: 700 ft and 3-5 hours; USGS: 6.33516917 mi | 6.4 mi, 488 ft, 2.5-3 hours, Moderate, loop | Exact distance/route/difficulty agreement and only 1.0% above USGS strongly support the route definition. The 488-ft gain is 22% above the newer NPS value and 30.3% below the older NPS value. It supports neither official gain conclusively, so the newer 400-ft display value stays visible with an explicit official-source conflict. |

Comparison URLs:

- AllTrails Lakeshore Trail:
  `https://www.alltrails.com/trail/us/wyoming/colter-bay-lakeshore-trail`
- AllTrails Two Ocean Lake Trail:
  `https://www.alltrails.com/trail/us/wyoming/two-ocean-lake-trail`

This check changes the import gate for future trails: a matching AllTrails route
is useful corroboration, a disagreement triggers route-definition review, and
neither outcome is allowed to replace authoritative or USGS-backed facts.

## Source Records

Colter Bay Lakeshore Trail:

- NPS: `https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm`
- USGS layer: `https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37`
- USGS `sourcefeatureid` values: `4757`, `4770`, `4771`, `4776`, `4778`,
  `4779`, `4796`, `4798`, `4799`, `4888`, `4889`, `4890`, `4891`, `4929`,
  `7293`

Two Ocean Lake Loop:

- NPS: `https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm`
- Conflicting NPS activity page: `https://www.nps.gov/thingstodo/twoocean.htm`
- USGS layer: `https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37`
- USGS `sourcefeatureid` values: `4882`, `7248`, `7285`

The USGS records identify National Park Service as both the primary trail
maintainer and source originator. The current profile metadata records
`profileKind: public-source-import`, `retrievalStatus: saved-fixture`, retrieval
date, source URLs, source roles and IDs, confidence, and an empty
`missingFields` list. Official NPS values are never averaged with USGS geometry
or comparison-only AllTrails values. Two Ocean's gain conflict remains visible
even though the planning field is populated.

## Deferred Grand Teton Candidates

Other initial candidates were not imported because their named USGS features
did not form an equally clean one-to-one hike:

- Phelps Lake Loop: the named USGS features represented only part of the
  official loop.
- Leigh Lake: the named USGS trail extended beyond the short official day-hike
  definition.
- Hermitage Point and Amphitheater Lake: branching or route assembly required
  more judgment than this first bounded slice permits.

Deferral is not a claim that these trails are missing or unsuitable. It means
their current source reconciliation needs more review before TrailPack can
present a saved profile confidently.

## Implemented Flow

- Preserved the original three profiles as `curated`.
- Added the two new records to a separate public-source import catalog.
- Combined both sets into the selectable TrailPack catalog without adding the
  imports to the original quick-start or scenario-stress baseline.
- Added `public-trail` search results and a visible `Verified public import`
  source label.
- Added both trails to the Grand Teton park results, saved demo context, packing
  flow, guarded trail-name checks, live weather path, and park-code resolution.
- Expanded source details to show retrieval status/date, NPS and USGS links,
  USGS feature IDs, notes, confidence, and missing fields.
- Added a comparison-only AllTrails checkpoint to the import validation method;
  no AllTrails data is used by the recommendation engine.
- Preserved manual entry for every search that does not match an approved
  catalog trail.
- Added no runtime provider, secret, or environment variable. `NPS_API_KEY`
  remains optional and is used only for live NPS alerts.

## B-01 Acceptance Mapping

| Criterion | Result | Evidence / remaining gate |
|---|---|---|
| At least one trail outside the curated three can be found and selected | Pass | Two imported trails are searchable and appear in the Grand Teton park list |
| Facts retain source and do not overstate NPS authority | Pass | NPS official values and USGS computed comparison remain separate with links and IDs; Two Ocean's conflicting NPS gain values are explicit |
| Normalized result produces a packing list | Pass | Focused tests generate non-empty rule-based output for both imports |
| Important missing fields remain explicit | Pass | `missingFields` is part of every trail profile; both selected records currently have all required planning fields |
| No result has a manual fallback | Pass | Unknown search terms return only `Enter hike details yourself` |
| Runtime provider failure has a fallback | Scope decision required | This contingency deliberately has no external lookup provider at request time, so there is no runtime provider failure mode |
| Original wording requiring a live external lookup | Scope decision required | Obtain UAT/instructor acceptance that the schedule's saved public-source import contingency satisfies B-01 before closing issue #25 |

## Verification

Run from `/Users/jaredrice/Developer/Senior Project Local/TrailPack`:

| Check | Result | Evidence |
|---|---|---|
| Focused import/search/context tests | Pass | 5 files, 43 tests |
| ESLint | Pass | `npm run lint` |
| TypeScript | Pass | `npm run typecheck` |
| Full Vitest suite | Pass | 9 files, 139 tests |
| Existing scenario stress matrix | Pass | `npm run scenario:stress`; regenerated the original three-trail 27-scenario report |
| Production build | Pass | Next.js compiled `/`, `/api/trailpack/weather`, and `/api/trailpack/alerts`; the rejected trail-search route is absent |
| Local production homepage smoke check | Pass | HTTP 200 and `<title>TrailPack</title>` |
| Imported weather route smoke check | Pass | `two-ocean-lake-loop` returned HTTP 200 with live Open-Meteo and daylight context |
| Unreviewed weather trail ID | Pass | Returned controlled HTTP 400 with `Unsupported trailId query parameter.` |
| Rendered Firefox click-through | Pending | Python Playwright is not installed; Chromium and the built-in browser are prohibited, so no browser dependency was added |

The Vitest run continues to show the existing non-blocking notice that Vite can
now resolve TypeScript paths without `vite-tsconfig-paths`.

## Remaining UAT

1. In Firefox, search for `Colter Bay`, select the verified result, open
   `Sources & Confidence`, add one trip detail, and confirm the packing list.
2. Repeat with `Two Ocean` through the Grand Teton park view.
3. Search an unapproved trail such as `Cascade Canyon` and confirm manual entry.
4. Record the B-01 scope decision: accept the saved public-source import
   contingency or require a separate live-provider slice.
5. Expand to another Grand Teton trail only after its NPS/USGS reconciliation is
   documented and reviewed.

## Primary Source Guidance

- USGS National Digital Trails data:
  `https://www.usgs.gov/national-digital-trails/data`
- USGS dataset access guidance:
  `https://www.usgs.gov/national-digital-trails/how-access-or-view-usgs-trails-dataset`
- NPS developer documentation:
  `https://www.nps.gov/subjects/developer/api-documentation.htm`

This implementation stores a reviewed factual snapshot and source links. It
does not scrape agency pages on user requests or claim that the NPS API provides
a complete national trail-statistics catalog.
