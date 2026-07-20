# CSE 499B Official/USGS/Nominatim Trail-Data Reliability Comparison

**Date:** 2026-07-17

**Decision updated:** 2026-07-20

**Scope:** Testing, research, and reporting only

**Branch:** `codex/b01-public-trail-adapter`

**Base commit tested:** `4618d374b974f84d5653734fdb8c66f212f7de54`

**Adapter state:** Local, uncommitted B-01 work was tested in place and was not staged, committed, pushed, or deployed.

**Correction note:** The initial draft compared Nominatim with authoritative reference pages but omitted the intended USGS trail-data workflow. The 2026-07-17 revision added the missing official-source → USGS → Nominatim comparison. The 2026-07-20 decision update rejects Nominatim as a supported TrailPack lookup source after applying the full reliability evidence.

## Decision

**Do not include Nominatim as a supported B-01 lookup source.** The prototype handled provider failures safely, but the provider did not meet the practical identity-retrieval requirement. Its code and tests served as negative feasibility evidence and were removed on 2026-07-20; this report retains the results.

An authoritative NPS, USFS, or state source established the intended identity for all 24 selected trails. The current official USGS trails layer contained the intended trail or officially justified route components for 20/24 (83.3%); Nominatim name-only search contained the intended identity somewhere for 14/24 (58.3%). Twelve trails appeared in both, eight appeared only in USGS, two appeared only in Nominatim, and two appeared in neither secondary source. USGS coverage still did not establish a complete, ready-to-use hike in every match.

For Nominatim, only 12/24 (50.0%) placed the intended identity first, and 4/18 (22.2%) `ok` responses did not contain the intended trail at all. The current location-scoped query format found the intended trail for 0/24 because appending the formal park and state to the free-form search string over-constrained the search. No intended response established a complete route, Nominatim supplied no authoritative planning fields, and it added only two identities beyond USGS in this cohort.

The cohort is not a probability sample, so these percentages are not a nationwide estimate of Nominatim quality. They are nevertheless sufficient to reject this implementation for TrailPack: the deliberately varied product-acceptance sample failed equally across the well-known and lesser-known groups, with only 7/12 intended identities present in each.

## What this study does and does not measure

This study separates four different concerns:

1. **Authoritative ground truth:** whether an NPS, USFS, or state land-manager source establishes the intended trail and states distance, elevation gain/change, estimated time, difficulty, and route type.
2. **USGS bridge reliability:** whether the official USGS trails feature class contains the intended trail or justified route components, whether those features can be reconciled with the authoritative hike, and whether 3DEP can provide a clearly labeled elevation estimate on coherent paths.
3. **Nominatim search reliability:** whether the public search service returns an OpenStreetMap object corresponding to the intended named trail.
4. **TrailPack normalization reliability:** whether the adapter filters results, preserves attribution and OSM identity, labels missing planning data, and provides a manual fallback without an unhandled failure.

The 24 trails are a deliberately varied evaluation cohort, not a probability sample of all U.S. trails. The well-known/lesser-known grouping is a testing heuristic based on broad public prominence, not a measured popularity ranking. Percentages describe this sample and this test window only; they must not be generalized into a national success rate or a quality score for either provider.

## Repository and implementation reviewed

Before testing, the following were reviewed:

- `AGENTS.md`
- `README.md`
- `docs/data/2026-07-17-cse-499b-public-trail-source-feasibility.md`
- `docs/superpowers/specs/2026-07-16-cse-499b-requirements.md`
- the active 14-week schedule and B-01 adapter validation note
- `src/features/trailpack/lib/public-trail-lookup.ts`
- `src/features/trailpack/lib/public-trail-lookup.test.ts`
- `src/app/api/trailpack/trails/search/route.ts`
- `src/app/api/trailpack/trails/search/route.test.ts`
- TrailPack types and supported-trail fixtures/tests

The adapter currently:

- sends a named Nominatim Search API request with `countrycodes=us`, `limit=5`, address details, extra tags, and name details;
- sends an identifying User-Agent;
- serializes calls at a one-second minimum interval within one warm process;
- applies an eight-second timeout;
- accepts only trail-like highway or hiking/foot-route objects;
- returns no more than three normalized candidates;
- preserves OSM type, OSM ID, attribution, and an OSM source URL;
- labels all five planning fields as missing; and
- keeps manual entry available.

The location-scoped form currently constructs one free-form `q` value by joining the trail name and location with a comma. This implementation detail was the main source of the scoped-query failure observed below.

## Public Nominatim policy controls

The run followed the [OpenStreetMap Foundation Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) and the [Nominatim Search API documentation](https://nominatim.org/release-docs/latest/api/Search/):

- 48 requests total, sent on one thread from one machine;
- strict sequential execution with at least 1.1 seconds between requests;
- no retries, concurrent requests, autocomplete, scraping, or systematic data collection;
- an identifying User-Agent;
- no browser automation; and
- no secrets or environment-variable values printed.

This was a small, one-time evaluation. It does not authorize TrailPack to treat the public endpoint as an unrestricted production backend. Any production use must remain rate-limited, attributed, cacheable, replaceable, and compatible with the current policy.

## Evaluation cohort and authoritative reference data

`Not stated` means the cited official land-manager source did not state that field clearly enough for this study. No value was inferred from a map, endpoint elevations, a round-trip label, or a third-party trail site.

| ID | Cohort | Trail and authoritative location | Distance | Elevation gain/change | Estimated time | Difficulty | Route type | Official source |
|---|---|---|---:|---:|---:|---|---|---|
| W1 | Well-known | Angels Landing Trail — Zion National Park, Utah | 5.4 mi round trip | 1,488 ft | About 4 hr | Steep/challenging | Not stated | [NPS](https://home.nps.gov/zion/planyourvisit/angels-landing-hiking-permits.htm) |
| W2 | Well-known | Delicate Arch Trail — Arches National Park, Utah | 3 mi round trip | 538 ft change | 2–3 hr | Strenuous | Not stated | [NPS](https://www.nps.gov/places/wolfe-ranch-trailhead.htm) |
| W3 | Well-known | Mist Trail to top of Vernal Fall — Yosemite National Park, California | 2.4 mi round trip | 1,000 ft | 3 hr | Strenuous | Not stated | [NPS](https://home.nps.gov/yose/planyourvisit/vernalnevadatrail.htm) |
| W4 | Well-known | Skyline Trail — Mount Rainier National Park, Washington | 5.5 mi | 1,700 ft | 4.5 hr | Not stated | Loop | [NPS](https://www.nps.gov/mora/planyourvisit/skyline-trail.htm) |
| W5 | Well-known | Grinnell Glacier Trail — Glacier National Park, Montana | 10.2 mi round trip from trailhead | 1,600 ft | Not stated | Very challenging | Not stated | [NPS](https://home.nps.gov/glac/learn/nature/how-to-see-a-glacier.htm) |
| W6 | Well-known | Old Rag Circuit — Shenandoah National Park, Virginia | 9.4 mi | 2,348 ft | 7 hr 30 min | Very strenuous | Circuit | [NPS](https://www.nps.gov/places/000/old-rag-circuit.htm) |
| W7 | Well-known | Precipice Loop — Acadia National Park, Maine | 3.2 mi round trip | More than 1,000 ft climbed in 0.9 mi | 2–3 hr | Not stated; official warnings describe strenuous exposed climbing | Loop | [NPS](https://www.nps.gov/thingstodo/hike-precipice-loop.htm) |
| W8 | Well-known | Alum Cave Trail to Mount Le Conte — Great Smoky Mountains National Park, Tennessee | 10 mi round trip | Not stated | Not stated | Challenging | Not stated | [NPS](https://www.nps.gov/thingstodo/leconte-via-alum-cave-trail.htm) |
| W9 | Well-known | Harding Icefield Trail — Kenai Fjords National Park, Alaska | 8.2 mi round trip | About 3,100 ft | 6–8 hr | Strenuous | Not stated | [NPS](https://www.nps.gov/kefj/planyourvisit/harding_icefield_trail.htm) |
| W10 | Well-known | South Kaibab Trail to Cedar Ridge — Grand Canyon National Park, Arizona | 3 mi round trip | 1,120 ft change | 2–4 hr | Steep/difficult canyon trail | Not stated | [NPS](https://www.nps.gov/places/000/south-kaibab-trail.htm) |
| W11 | Well-known | White Dot Trail — Monadnock State Park, New Hampshire | 2 mi one way to summit | Not stated | About 2 hr to summit | Not stated | Not stated | [NH State Parks map](https://www.nhstateparks.org/NHStateParks/media/NHStateParks/PDFs/Maps/monadnock-hiking-map_info_3-2026-combined.pdf) |
| W12 | Well-known | Multnomah Falls Trail — Columbia River Gorge National Scenic Area, Oregon | Not stated for this trail alone | Not stated | Not stated | Not stated | Not stated | [USFS area trail chart](https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/stelprdb5227099.pdf) |
| L1 | Lesser-known | Cohab Canyon Trail — Capitol Reef National Park, Utah | 1.7 mi one way | 440 ft change | Not stated | Moderate | Not stated | [NPS](https://www.nps.gov/thingstodo/hike-an-easy-or-moderate-trail.htm/index.htm) |
| L2 | Lesser-known | Beaver Ponds Trail — Yellowstone National Park, Wyoming | 5 mi | More than 350 ft | 2–5 hr | Moderately strenuous | Loop | [NPS](https://www.nps.gov/thingstodo/yell-trail-beaver-ponds.htm) |
| L3 | Lesser-known | Smith Spring Trail Loop — Guadalupe Mountains National Park, Texas | 2.3 mi round trip | 402 ft | 1–2 hr | Easy to moderate | Loop | [NPS](https://www.nps.gov/thingstodo/gumo_hike_smith_springs_trail.htm) |
| L4 | Lesser-known | Sound of Silence Trail — Dinosaur National Monument, Utah | 3.2 mi round trip | About 400 ft | 1–3 hr | Moderate to difficult | Loop | [NPS](https://www.nps.gov/thingstodo/soundofsilencetrail.htm) |
| L5 | Lesser-known | Mosca Pass Trail — Great Sand Dunes National Park, Colorado | 7 mi round trip | 1,400 ft | 3.5 hr | Not stated | Not stated | [NPS](https://www.nps.gov/thingstodo/hike-montville-and-mosca-pass-trails.htm) |
| L6 | Lesser-known | Bubbles Divide Trail hike — Acadia National Park, Maine | 1.5 mi round trip | Not stated | 60–90 min | Not stated | Out and back | [NPS](https://www.nps.gov/thingstodo/hike-bubbles.htm) |
| L7 | Lesser-known | Soldier Pass Trail No. 66 — Coconino National Forest, Arizona | 2.4 mi | 450 ft | Not stated | Not stated | Not stated | [USFS recreation guide](https://www.fs.usda.gov/sites/nfs/files/legacy-media/coconino/Red%20Rock%20Recreation%20Guide%202024.pdf) |
| L8 | Lesser-known | Denny Creek Trail 1014 — Mount Baker-Snoqualmie National Forest, Washington | Not stated | Not stated | Not stated | Not stated | Not stated | [USFS](https://www.fs.usda.gov/r06/mbs/recreation/denny-creek-trailhead) |
| L9 | Lesser-known | Maxwell Falls Lower Trail 111 — Arapaho and Roosevelt National Forests, Colorado | Not stated | Not stated | Not stated | Not stated | Not stated | [USFS](https://www.fs.usda.gov/r02/arp/recreation/trails/maxwell-falls-lower-trail) |
| L10 | Lesser-known | Treasure Loop Trail — Lost Dutchman State Park, Arizona | 2.4 mi round trip | 500 ft change | Not stated | Moderate | Not stated | [Arizona State Parks](https://azstateparks.com/lost-dutchman/things-to-do/trails) |
| L11 | Lesser-known | Raven Rock Loop Trail — Raven Rock State Park, North Carolina | 2.6 mi | Not stated | Not stated | Easy | Loop | [North Carolina State Parks](https://www.ncparks.gov/state-parks/raven-rock-state-park/trails) |
| L12 | Lesser-known | Raccoon Trail — Golden Gate Canyon State Park, Colorado | 2.5 mi | Not stated | Not stated | Moderate | Loop | [Colorado Parks and Wildlife](https://cpw.state.co.us/state-parks/golden-gate-canyon-state-park/golden-gate-canyon-state-park-park-highlights) |

The cohort covers 15 states: 16 NPS trails, four USFS trails, and four state-managed trails. Selection required an authoritative source for identity and location. The stated planning fields are a separate completeness benchmark, not data that USGS or Nominatim is assumed to reproduce.

## USGS trail-data comparison

### Source and method

USGS documents National Digital Trails as an aggregation of public-domain trail data supplied by federal, state, and other partners. USGS also warns that the dataset does not represent every U.S. trail. The comparison used:

- the [USGS National Digital Trails data description](https://www.usgs.gov/national-digital-trails/data);
- the [USGS access and download instructions](https://www.usgs.gov/national-digital-trails/how-access-or-view-usgs-trails-dataset);
- the [USGS trail-data questions and answers](https://www.usgs.gov/national-digital-trails/qas-about-usgs-trail-data); and
- the current official [National Transportation Dataset Trails feature layer](https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37).

The USGS instructions offer both state downloads and map services. This run downloaded bounded GeoJSON feature extracts from the official map service rather than downloading roughly 15 complete state GeoPackages. The service and state downloads belong to the same official National Transportation Dataset trail-data family, but they can have different refresh dates; results below describe the service queried on 2026-07-17, not every historical download.

For each trail, the authoritative source established the location and target route first. USGS was then searched by name, alternate name, trail number, and a bounded location query. An identity/component match required either the intended named trail or route components explicitly justified by the official route description. Examples include the Ridge, Saddle, Weakley Hollow, and Ridge Access components of the Old Rag Circuit, and Larch Mountain Trail 441 at Multnomah Falls.

Selected features were de-duplicated where coincident source ingestions overlapped. Distance used the selected features' `lengthmiles` values; `networklength` was rejected because it can describe a much larger connected trail network. Round-trip multiplication was applied only when the authoritative route supported it. The result is a route-reconciliation test, not a claim that every USGS name match is a complete hike.

Study-only distance classes are:

- **Strong numeric bridge:** selected, route-aware USGS magnitude is within 10% of the official distance.
- **Moderate bridge:** more than 10% through 20% difference, or close magnitude with material route-assembly ambiguity.
- **Conflict:** more than 20% difference on an otherwise comparable route.
- **Partial/identity only:** incomplete target extent, target is only part of the named trail, or no official distance is available for a numeric comparison.
- **No USGS match:** intended identity or officially justified components were not found.

These thresholds are conventions for this small study, not USGS accuracy standards.

### Per-trail USGS results

| ID | Selected USGS identity/components | Route-aware USGS distance | Official comparison | Assessment |
|---|---|---:|---:|---|
| W1 | Angels Landing Trail named segment | 0.490 mi | 5.4 mi round trip | Partial/identity only; the named feature is only part of the hike |
| W2 | Delicate Arch Trail main chain | 1.529 mi one way; 3.058 mi round trip | 3.0 mi round trip; +1.9% | Strong numeric bridge; two tiny named branches excluded from the main chain |
| W3 | Mist Trail named features | 1.577 mi one way | 2.4 mi round trip to Vernal Fall | Partial/identity only; the named trail continues beyond the target endpoint |
| W4 | Skyline plus the official High Skyline alternate | 4.895 mi main; 5.641 mi including alternate | 5.5 mi loop | Moderate bridge; alternate segments overlap and require route assembly |
| W5 | Grinnell Glacier Trail named features | 3.372 mi one way | 5.1 mi one way | Partial/identity only; selected named features do not cover the official trailhead route |
| W6 | Official Old Rag route components | 7.978 mi | 9.4 mi; −15.1% | Moderate bridge; component/branch assembly remains incomplete |
| W7 | No intended Precipice Loop feature found | — | 3.2 mi round trip | No USGS match |
| W8 | Alum Cave Trail de-duplicated main path | 4.905 mi one way; 9.809 mi round trip | 10.0 mi round trip; −1.9% | Strong numeric bridge |
| W9 | Harding Icefield Trail main path | 4.072 mi one way; 8.144 mi round trip | 8.2 mi round trip; −0.7% | Strong numeric bridge |
| W10 | No South Kaibab/Cedar Ridge target found | — | 3.0 mi round trip | No USGS match |
| W11 | White Dot Trail named features | 1.761 mi one way | 2.0 mi one way; −12.0% | Moderate bridge |
| W12 | Larch Mountain Trail 441 and Multnomah viewing-deck components | Identity/components only | Official source did not state this hike alone | Partial/identity only |
| L1 | Cohab Canyon Trail main path | 1.595 mi one way | 1.7 mi one way; −6.2% | Strong numeric bridge |
| L2 | Beaver Ponds intended NPS segments | 2.010 mi | 5.0 mi loop | Partial/identity only; disconnected/incomplete target extent |
| L3 | Smith Spring Trail loop | 2.321 mi | 2.3 mi; +0.9% | Strong numeric bridge |
| L4 | Sound of Silence Trail loop | 3.049 mi | 3.2 mi; −4.7% | Strong numeric bridge |
| L5 | Mosca Pass plus visitor-area connector | 3.306 mi one way; 6.612 mi round trip | 7.0 mi round trip; −5.5% | Strong numeric bridge; connector assembly still requires confirmation |
| L6 | No intended Bubbles Divide hike found | — | 1.5 mi round trip | No USGS match |
| L7 | Soldier Pass Trail 66 named features | 2.236 mi | 2.4 mi; −6.8% | Strong numeric bridge |
| L8 | Denny Creek Trail 1014 selected features | 4.491 mi | Official source did not state distance | Partial/identity only |
| L9 | No intended Maxwell Falls Lower Trail found | — | Official source did not state distance | No USGS match |
| L10 | Treasure Loop Trail 56 named features | 2.093 mi | 2.4 mi; −12.8% | Moderate bridge |
| L11 | Raven Rock Loop named feature total | 2.195 mi | 2.6 mi; −15.6% | Moderate bridge |
| L12 | Raccoon Trail named features | 3.056 mi | 2.5 mi; +22.2% | Conflict; do not import without manual reconciliation |

### Cross-source identity coverage

`USGS match` below means the intended identity or officially justified route components were present. It does not mean a complete route was ready for import. `Nominatim match` means the intended identity appeared anywhere in the name-only response, not necessarily first.

| Coverage combination | Well-known (n=12) | Lesser-known (n=12) | Overall (n=24) |
|---|---:|---:|---:|
| Present in both USGS and Nominatim | 6 | 6 | 12 (50.0%) |
| Nominatim only | 1 | 1 | 2 (8.3%) |
| USGS only | 4 | 4 | 8 (33.3%) |
| Neither secondary source | 1 | 1 | 2 (8.3%) |
| **USGS intended identity/components total** | **10 (83.3%)** | **10 (83.3%)** | **20 (83.3%)** |
| **Nominatim intended identity total** | **7 (58.3%)** | **7 (58.3%)** | **14 (58.3%)** |

The two Nominatim-only cases were South Kaibab/Cedar Ridge (W10) and Maxwell Falls (L9). The eight USGS-only cases were Skyline (W4), Old Rag (W6), White Dot (W11), Multnomah/Larch Mountain components (W12), Smith Spring (L3), Sound of Silence (L4), Treasure Loop (L10), and Raccoon (L12). Neither secondary source found the intended Precipice Loop (W7) or Bubbles Divide hike (L6).

### USGS distance-bridge summary

The classes below are mutually exclusive and total 24 trails.

| Distance result | Count | Meaning |
|---|---:|---|
| Strong numeric bridge | 8/24 (33.3%) | Route-aware selected length was within 10% of the official value |
| Moderate bridge | 5/24 (20.8%) | Difference was more than 10% through 20%, or assembly ambiguity remained |
| Conflict | 1/24 (4.2%) | Comparable route differed by more than 20% |
| Partial/identity only | 6/24 (25.0%) | Identity was useful, but target extent or official numeric benchmark was incomplete |
| No USGS match | 4/24 (16.7%) | Intended identity/components were not found |

Thus, USGS offered useful identity/component evidence for 20/24, but only 13/24 produced a strong or moderate numeric distance bridge. Eight of those 13 were within 10% of the authoritative route distance.

### Exploratory 3DEP elevation comparison

Eight selected USGS paths were coherent enough for an elevation-profile experiment. Branched, disconnected, overlapping-alternate, or incompletely assembled paths were excluded. Coordinates were sampled at approximately 30-meter intervals through the official [USGS NLDI path-point process](https://api.water.usgs.gov/docs/nldi-pygeoapi/) using 10-meter 3DEP elevation. For open paths, the uphill-oriented traversal was used.

Raw positive accumulation is sensitive to small elevation fluctuations, so the table also reports three-point and five-point moving-average estimates. USGS states that point-query elevations are interpolated from 3DEP rather than surveyed ground truth; its published overall RMSE is 0.53 meters, while local accuracy varies by source and terrain ([USGS elevation accuracy FAQ](https://www.usgs.gov/faqs/how-accurate-are-elevations-generated-elevation-point-query-service-national-map)).

| ID | USGS path | Raw positive gain | 3-point smooth | 5-point smooth | Official gain/change | Interpretation |
|---|---:|---:|---:|---:|---:|---|
| W8 | 4.905 mi | 2,932 ft | 2,646 ft | 2,610 ft | Not stated | Computable estimate only; no official benchmark |
| W9 | 4.072 mi | 3,235 ft | 3,175 ft | 3,157 ft | About 3,100 ft | Smoothed estimates were 1.8–2.4% high |
| W11 | 1.761 mi | 1,804 ft | 1,760 ft | 1,731 ft | Not stated | Computable estimate only; no official benchmark |
| L1 | 1.595 mi | 575 ft | 440 ft | 404 ft | 440 ft change | Official value fell within the smoothing range |
| L3 | 2.321 mi | 434 ft | 394 ft | 381 ft | 402 ft | Smoothed estimates were 2.0–5.2% low |
| L4 | 3.049 mi | 466 ft | 371 ft | 331 ft | About 400 ft | Official value fell between raw and smoothed estimates |
| L7 | 2.236 mi | 613 ft | 519 ft | 489 ft | 450 ft | Smoothed estimates were 8.7–15.3% high |
| L10 | 2.093 mi | 548 ft | 496 ft | 469 ft | 500 ft change | Smoothed estimates were 0.8–6.2% low |

3DEP was directionally useful on a reconciled path, but the spread between raw and smoothed gain confirms that computed elevation gain needs a documented algorithm and an `estimated` label. It must not silently replace a land-manager value.

## Live-query method

The existing production build was started locally and queried through TrailPack's own route:

`GET /api/trailpack/trails/search`

Each trail received exactly two requests, in this order:

1. trail name only; and
2. trail name plus park/forest/state location context.

Requests were sequential, were separated by at least 1.1 seconds, and were never retried. No concurrent provider traffic was generated. All 48 requests returned HTTP 200 from the local TrailPack route. Individual request latency was observed during the run but only aggregate latency was retained, so the table does not invent per-request timing values.

### Outcome definitions

- **Correct complete route:** the intended route is returned as a complete route identity and extent.
- **Partial/segment-level:** the intended trail is identified, but the returned OSM object is a way/node or fragment and does not establish the complete hiking route.
- **Ambiguous:** multiple plausible names/locations are present, the intended trail is not ranked first, or the adapter cannot safely select a result.
- **Incorrect:** normalized candidates are returned, but the intended trail is absent.
- **No result:** the adapter returns its controlled `no-results` or ambiguous-without-candidates state.
- **Provider failure:** timeout, rate limit, unavailable provider, malformed provider response, or network failure.

## Per-query results

Every row below is one live route request. `OK`, `ambiguous`, and `no-results` are controlled adapter statuses; the assessment column evaluates those results against the authoritative trail identity.

| ID | Variant | HTTP / adapter status | Normalized result evidence | Intended identity assessment |
|---|---|---|---|---|
| W1 | Name only | 200 / `ok` | Angels Landing Trail, Washington County, Utah; OSM way `14326868` | Partial/segment-level; correct first identity |
| W1 | Name + Zion NP, Utah | 200 / `no-results` | No normalized candidate | No result |
| W2 | Name only | 200 / `ok` | Delicate Arch Trail, Grand County, Utah; OSM way `58056958` | Partial/segment-level; correct first identity |
| W2 | Name + Arches NP, Utah | 200 / `no-results` | No normalized candidate | No result |
| W3 | Name only | 200 / `ok` | First result was Mist Trail in Carlisle, Massachusetts; two later Mariposa County, California ways matched Yosemite's trail | Ambiguous; intended identity present but not first and fragmented |
| W3 | Name + Yosemite NP, California | 200 / `no-results` | No normalized candidate | No result |
| W4 | Name only | 200 / `ok` | Results in Los Angeles, California and Quincy, Massachusetts | Incorrect; Mount Rainier trail absent |
| W4 | Name + Mount Rainier NP, Washington | 200 / `no-results` | No normalized candidate | No result |
| W5 | Name only | 200 / `ok` | Grinnell Glacier Trail, Montana; OSM way `82583005` | Partial/segment-level; correct first identity |
| W5 | Name + Glacier NP, Montana | 200 / `no-results` | No normalized candidate | No result |
| W6 | Name only | 200 / `no-results` | No normalized candidate | No result |
| W6 | Name + Shenandoah NP, Virginia | 200 / `no-results` | No normalized candidate | No result |
| W7 | Name only | 200 / `ok` | Precipice Trail in Woodstock, Vermont | Incorrect; Acadia trail absent |
| W7 | Name + Acadia NP, Maine | 200 / `no-results` | No normalized candidate | No result |
| W8 | Name only | 200 / `ok` | First result was Alum Cave Trail, West Virginia; second matched Tennessee | Ambiguous; intended identity present but not first |
| W8 | Name + Great Smoky Mountains NP, Tennessee | 200 / `no-results` | No normalized candidate | No result |
| W9 | Name only | 200 / `ok` | Harding Icefield Trail, Alaska; OSM way `561120225` | Partial/segment-level; correct first identity |
| W9 | Name + Kenai Fjords NP, Alaska | 200 / `no-results` | No normalized candidate | No result |
| W10 | Name only | 200 / `ok` | South Kaibab Trail, Arizona; OSM way `144433066` | Partial/segment-level; correct trail, but Cedar Ridge day-hike extent is not established |
| W10 | Name + Grand Canyon NP, Arizona | 200 / `no-results` | No normalized candidate | No result |
| W11 | Name only | 200 / `ok` | White Dot Trail results in Goffstown, New Hampshire; Littleton, Massachusetts; and Holden, Massachusetts | Incorrect; Monadnock trail absent |
| W11 | Name + Monadnock State Park, New Hampshire | 200 / `no-results` | No normalized candidate | No result |
| W12 | Name only | 200 / `ok` | Wahclella Falls Trail and Top of Falls Trail candidates | Incorrect; intended Multnomah Falls Trail absent |
| W12 | Name + Columbia River Gorge, Oregon | 200 / `no-results` | No normalized candidate | No result |
| L1 | Name only | 200 / `ok` | Cohab Canyon Trail, Utah; OSM way `142686325` | Partial/segment-level; correct first identity |
| L1 | Name + Capitol Reef NP, Utah | 200 / `no-results` | No normalized candidate | No result |
| L2 | Name only | 200 / `ok` | Beaver Ponds Trail ways in Wyoming and Montana | Partial/segment-level; correct first identity, fragmented across ways |
| L2 | Name + Yellowstone NP, Wyoming | 200 / `no-results` | No normalized candidate | No result |
| L3 | Name only | 200 / `ambiguous` | No safe normalized candidate | Ambiguous/no result |
| L3 | Name + Guadalupe Mountains NP, Texas | 200 / `no-results` | No normalized candidate | No result |
| L4 | Name only | 200 / `no-results` | No normalized candidate | No result |
| L4 | Name + Dinosaur NM, Utah | 200 / `no-results` | No normalized candidate | No result |
| L5 | Name only | 200 / `ok` | Mosca Pass Trail, Colorado; OSM way `174977970` | Partial/segment-level; correct first identity |
| L5 | Name + Great Sand Dunes NP, Colorado | 200 / `no-results` | No normalized candidate | No result |
| L6 | Name only | 200 / `no-results` | No normalized candidate | No result |
| L6 | Name + Acadia NP, Maine | 200 / `no-results` | No normalized candidate | No result |
| L7 | Name only | 200 / `ok` | Two Soldier Pass Trail ways in Arizona | Partial/segment-level; correct first identity, fragmented across ways |
| L7 | Name + Coconino NF, Arizona | 200 / `no-results` | No normalized candidate | No result |
| L8 | Name only | 200 / `ok` | Two Denny Creek Trail ways in Washington | Partial/segment-level; correct first identity, fragmented across ways |
| L8 | Name + Mount Baker-Snoqualmie NF, Washington | 200 / `no-results` | No normalized candidate | No result |
| L9 | Name only | 200 / `ok` | Maxwell Falls Trail objects in Colorado: two ways and one node | Partial/segment-level; correct first identity, mixed object fragments |
| L9 | Name + Arapaho and Roosevelt NF, Colorado | 200 / `no-results` | No normalized candidate | No result |
| L10 | Name only | 200 / `no-results` | No normalized candidate | No result |
| L10 | Name + Lost Dutchman State Park, Arizona | 200 / `no-results` | No normalized candidate | No result |
| L11 | Name only | 200 / `ok` | Two Raven Rock Loop Trail ways in North Carolina | Partial/segment-level; correct first identity, fragmented across ways |
| L11 | Name + Raven Rock State Park, North Carolina | 200 / `no-results` | No normalized candidate | No result |
| L12 | Name only | 200 / `ambiguous` | No safe normalized candidate | Ambiguous/no result |
| L12 | Name + Golden Gate Canyon State Park, Colorado | 200 / `no-results` | No normalized candidate | No result |

No Nominatim response returned a complete hiking-route relation for an intended match. Intended matches were OSM ways/segments; Maxwell Falls also included a node. Therefore, even a correct-looking Nominatim name is evidence of identity only, not evidence of full route geometry or authoritative route statistics.

## Nominatim quantitative results

### Name-only query outcomes

These classes are mutually exclusive and total 24.

| Outcome | Well-known (n=12) | Lesser-known (n=12) | Overall (n=24) |
|---|---:|---:|---:|
| Correct complete route | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) |
| Partial/segment-level intended match | 5 (41.7%) | 7 (58.3%) | 12 (50.0%) |
| Ambiguous | 2 (16.7%) | 2 (16.7%) | 4 (16.7%) |
| Incorrect | 4 (33.3%) | 0 (0.0%) | 4 (16.7%) |
| No result | 1 (8.3%) | 3 (25.0%) | 4 (16.7%) |
| Provider failure | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) |

Additional retrieval measures:

| Measure | Result |
|---|---:|
| Intended identity ranked first, name only | 12/24 (50.0%) |
| Intended identity present anywhere, name only | 14/24 (58.3%) |
| Name-only adapter response with status `ok` | 18/24 (75.0%) |
| `ok` responses in which intended identity was absent | 4/18 (22.2%) |
| Intended identity present, scoped query | 0/24 (0.0%) |
| Queries where current location context improved retrieval | 0/24 (0.0%) |
| Scoped queries reduced to `no-results` | 24/24 (100.0%) |

The `ok` status means the adapter found trail-like OSM objects; it does not mean those objects represent the intended trail. This is why automatic acceptance of the first candidate would be unsafe.

### All 48 live requests

| Check | Result |
|---|---:|
| TrailPack route HTTP 200 | 48/48 (100.0%) |
| Attribution included | 48/48 (100.0%) |
| Manual fallback available | 48/48 (100.0%) |
| Provider outage, timeout, rate limit, malformed response, or network failure observed | 0/48 (0.0%) |
| Minimum latency | 157 ms |
| Maximum latency | 709 ms |
| Mean latency | 436 ms |
| Median latency | 483 ms |
| Mean name-only latency | 413 ms |
| Mean scoped-query latency | 459 ms |

No provider failure occurred during this short controlled sample. That observation is not evidence of long-term uptime or future absence of rate limits.

## TrailPack normalization and fallback behavior

For every normalized result inspected, TrailPack preserved:

- Nominatim/OpenStreetMap attribution;
- OSM object type and ID;
- a source URL derived from that OSM identity; and
- explicit missing-field labels for distance, elevation gain, estimated time, difficulty, and route type.

All 48 route responses kept manual entry available. Missing or ambiguous provider data therefore produced a labeled, recoverable state rather than an unhandled HTTP 500.

The adapter intentionally did not convert untrusted Nominatim `extratags` into hiking distance. This is correct: a geocoding result and a single OSM way are not sufficient evidence for a complete day-hike plan.

## Focused mocked verification

Command:

```text
rtk npm test -- --run src/features/trailpack/lib/public-trail-lookup.test.ts src/app/api/trailpack/trails/search/route.test.ts
```

Result: **PASS — 2 test files, 15 tests.**

The focused tests cover:

- policy-relevant request fields and normalization;
- absence of results and unrelated-road ambiguity;
- HTTP 429 and 503 provider responses;
- malformed payload, malformed coordinates/IDs, network failure, and timeout;
- invalid input rejected before a provider call;
- controlled route mapping for 400, 429, 502, and 503;
- `no-results` and `ambiguous` returned as HTTP 200 with manual fallback; and
- serialization of two concurrent adapter calls, including one 1,000 ms wait.

Lint, typecheck, the full test suite, and build were not rerun because no code or dependency state changed during this testing-only task.

## Queue and deployment risk

The live run respected an external 1.1-second interval, and the mocked concurrency test proves the module queue spaces calls within one warm process. It does **not** prove a global one-request-per-second ceiling across multiple serverless instances. Separate Vercel instances can each have their own in-memory queue and can collectively exceed the public service limit.

Before this feature receives real multi-user traffic, the design needs either a global/distributed limiter, a provider whose terms support the expected traffic, or a server-owned cache/lookup dataset that prevents repeated public calls. The provider must remain replaceable, as required by the public policy.

## Nominatim failure taxonomy

| Failure type | Observed live? | Controlled by current adapter/tests? | User-facing consequence |
|---|---|---|---|
| No named OSM result | Yes | Yes | Manual entry remains available |
| Trail-like result in wrong state/location | Yes | Partly; candidates are labeled, but `ok` is not correctness | User must verify; auto-selection would be unsafe |
| Intended result not ranked first | Yes | Partly | Multiple candidates require confirmation |
| Intended trail fragmented into ways/nodes | Yes | Yes, identity preserved | Cannot infer complete route or route stats |
| Location text over-constrains free-form query | Yes | Returns controlled no-result | Useful name-only matches disappear |
| Rate limit (429) | No | Mocked and controlled | Retry-later/manual fallback state |
| Provider unavailable (503/network) | No | Mocked and controlled | Provider-unavailable/manual fallback state |
| Provider timeout | No | Mocked and controlled | Provider-unavailable/manual fallback state |
| Malformed provider payload | No | Mocked and controlled | Controlled invalid-provider response |
| Multiple server instances exceed global policy rate | Not measured | Not globally controlled | Policy and availability risk |

## Key findings

1. **Authoritative sources remain the ground truth.** All 24 trail identities were established through NPS, USFS, or state land-manager sources, but those pages did not consistently state every TrailPack planning field.
2. **USGS is the stronger secondary identity source in this sample.** It contained the intended trail or officially justified route components for 20/24 trails (83.3%), compared with 14/24 (58.3%) for Nominatim name-only search.
3. **USGS coverage is not the same as a complete route.** Only 13/24 trails produced a strong or moderate numeric distance bridge. Six matches were partial/identity-only, one comparable route conflicted by more than 20%, and four intended trails were absent.
4. **3DEP can support labeled estimates after route reconciliation.** On eight coherent paths, smoothed gain was often near the official value, but results changed with the smoothing method and were not authoritative measurements.
5. **Nominatim failed the TrailPack product-acceptance test.** The intended identity appeared somewhere for only 14/24 trails, only 12/24 ranked it first, 4/18 `ok` responses omitted it, and none established a complete route relation.
6. **The current Nominatim location strategy is counterproductive.** Appending formal park/forest and state text improved 0/24 searches and changed every scoped request to `no-results`.
7. **TrailPack normalization fails safely.** Attribution, OSM identity, missing planning-data labels, and manual fallback were consistently preserved; focused failure tests passed.

## Main risks

1. **Incomplete official fields:** an authoritative identity page may omit one or more planning values; absence must remain labeled rather than filled from an unverified source.
2. **USGS route-assembly error:** a correct name may cover only a segment, while aliases, duplicated ingestions, branches, alternates, and disconnected components can distort distance.
3. **Computed-elevation false precision:** 3DEP sampling interval, path completeness, orientation, and smoothing method materially affect accumulated gain.
4. **Nominatim wrong-trail selection:** generic names such as Skyline Trail, Mist Trail, White Dot Trail, and Precipice Trail can return plausible objects in the wrong state.
5. **Nominatim false completeness:** an OSM way with the correct name may represent only one segment. It must not be treated as the full hike or as evidence for route metrics.
6. **Production rate limiting:** the in-memory Nominatim queue is per process and cannot ensure public-policy compliance across horizontally scaled Vercel instances.

## Recommendation and smallest next step

Reject the current Nominatim path and use a staged, traceable reconciliation flow:

1. Require an authoritative NPS, USFS, or state source to establish the intended trail and record only the planning fields it explicitly states.
2. Search the bounded USGS trail layer by official name, alternate name, trail number, and location. Retain USGS feature IDs, maintainer/originator fields, selected components, and the query date.
3. Reconcile selected USGS geometry against the official route description, remove coincident duplicates, and compare the route-aware distance with the official distance before accepting it.
4. Compute 3DEP elevation only after the route is coherent. Store the sampling/smoothing method and label the result `estimated`; prefer a stated authoritative value.
5. Preserve manual entry for no result, ambiguity, source conflict, or missing official fields. Keep every unavailable planning field explicitly labeled missing.

Do not restore the experimental Nominatim route, deploy it as a supported feature, or count its historical technical tests as B-01 acceptance. Preserve this reliability report so the rejected approach remains explainable.

The replacement experiment selected two Grand Teton trails for authoritative/USGS reconciliation with explicit gates: authoritative NPS URL required, USGS source feature IDs recorded, route-aware distance discrepancy checked, official values kept separate from computed values, and manual fallback retained for everything outside the verified catalog. See `2026-07-20-cse-499b-grand-teton-public-source-import.md`.

## Final acceptance assessment

| Check | Result | Evidence | Follow-up |
|---|---|---|---|
| Authoritative identity ground truth | PASS | 24/24 verified with NPS, USFS, or state sources | Retain source URL and query date per trail |
| Official planning-field completeness | PARTIAL | Official pages varied in distance, gain, time, difficulty, and route-type coverage | Label missing fields; do not infer them |
| USGS intended identity/components | PARTIAL | 20/24 present; 10/12 in each cohort | Keep manual/alternate-source path for four misses |
| USGS numeric distance bridge | PARTIAL | 8 strong, 5 moderate, 1 conflict, 6 partial/identity-only, 4 no match | Require component reconciliation and discrepancy gate |
| Exploratory 3DEP elevation | PARTIAL | Eight coherent paths profiled; estimates varied by smoothing method | Document algorithm and label every computed gain `estimated` |
| Cross-source agreement | PARTIAL | 12/24 appeared in both; 8 USGS-only; 2 Nominatim-only; 2 neither | Do not require either secondary source to agree universally |
| 24-trail, two-variant live sample | PASS | 48/48 controlled HTTP 200 responses | Preserve raw fixtures in a future sanctioned test harness if repeatability is required |
| Public-policy pacing for this run | PASS | Sequential, at least 1.1 seconds, no retries/concurrency | Retain as experiment evidence; it does not overcome reliability failure |
| Nominatim provider decision | **REJECTED** | Low identity retrieval, false-positive risk, no complete routes, no planning facts, and only two identities beyond USGS | Do not include as a supported B-01 source |
| Nominatim intended identity retrieval | FAIL | 14/24 present anywhere name-only; 12/24 first; 4/18 `ok` responses omitted the intended trail | Do not connect the prototype to the UI |
| Current Nominatim scoped query | FAIL | 0/24 intended matches; 24/24 no result | Do not spend the current B-01 slice repairing this rejected approach |
| Nominatim complete route identity/extent | FAIL | 0/24 complete route relations | Never treat a Nominatim result as full route geometry |
| Nominatim planning-data completeness | EXPECTED GAP | All returned candidates label five planning fields missing | Use authoritative/manual data source |
| Nominatim attribution and traceability | PASS | Present for every live response/result inspected | Retain only with the experimental evidence |
| Manual fallback | PASS | Available in 48/48 responses | Keep as required path |
| Mocked Nominatim error handling | PASS | 15/15 focused tests | Preserve as technical evidence; passing error tests does not validate provider fitness |
| Global Nominatim production rate-limit safety | NOT PROVEN | Queue is process-local | Additional reason not to deploy the prototype |
