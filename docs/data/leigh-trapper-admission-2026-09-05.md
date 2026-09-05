# Leigh Lake and Bearpaw–Trapper Lakes: reviewed admission

Checked: 2026-09-05 UTC. These two additions are local only. Hosted Preview,
owner acceptance, and protected release remain separate steps. Production has
eleven trails through [PR #52](https://github.com/jaredsrice/TrailPack/pull/52).

## Route scope and official facts

| Route | Authoritative NPS facts | NPS/USGS geometry comparison |
|---|---|---|
| [Leigh Lake](https://www.nps.gov/thingstodo/leighlake.htm) | 1.8 mi round trip; 110 ft gain; 1–2 hours; Easy; out-and-back | 1.766219 mi, 1.9% shorter |
| [Bearpaw and Trapper Lakes](https://www.nps.gov/thingstodo/bearpaw-trapper.htm) | 9.2 mi round trip; 460 ft gain; 4–6 hours; Moderate; out-and-back | 9.333046 mi, 1.4% longer |

The short route reaches the southern shore of Leigh Lake. Continuing along its
eastern shore is a different variant and must not inherit the short route's
distance. The longer itinerary continues past the Bearpaw area to Trapper Lake
and returns along the same approach. Neither is the String Lake Loop.

The official activity pages publish trail-specific terrain/accessibility text,
including stairs, roots, and rocks. Their six managed fields are preserved in
the NPS snapshot and captured HTML excerpts. Even the original misspellings in
the Bearpaw accessibility paragraph are retained for source-integrity matching,
not silently corrected into a different official quotation. The pages were
retrieved for this review; their published update date is May 17, 2022.

NPS values remain authoritative. These USGS line records contain no independent
computed elevation gain, so gain comparison remains unknown. We do not average
provider values or claim that official gain was independently verified.

## Reproducible route comparison

[Geometry evidence](leigh-trapper-admission-2026-09-05.geometry.json) preserves
the park-wide capture hash, bounds, record count, source mix, connector vertices,
selected USGS IDs and lengths, ordered directions, excluded branch, and weather
marker. The raw 1,144-record capture is the same complete bounded park-wide
review input recorded in the [Colter Bay admission](colter-bay-admission-2026-09-04.md).
It remains outside the application and repository. No additional user download
was needed for this pair of routes.

The two [NPS](https://www.nps.gov/maps/builder/configs/4478e597-caae-44cd-9195-b78f5f076909.json)
[map configurations](https://www.nps.gov/maps/builder/configs/fd08bf57-30bb-423c-845a-c0db4a91672c.json)
both reference the official [Leigh Lake approach](https://www.nps.gov/grte/planyourvisit/upload/Leigh-Lake.json).
Use its first LineString, all 43 vertices, not the second feature's side access.
The complete approach independently recomputes to 0.489092275 mi.

| Ordered outbound leg | Direction | Miles |
|---|---|---:|
| NPS approach, feature 0 | Forward | 0.489092275 |
| USGS source ID 4833, object ID 2143466, String Lake Loop Trail | Reverse | 0.36202546 |
| USGS source ID 4831, object ID 2143464, String Lake Loop Trail | Reverse | 0.03199174 |
| Short Leigh turnaround | Retrace preceding legs | 1.766218950 RT |
| USGS source ID 4860, object ID 2143493, Leigh Lake Trail | Forward, long route only | 2.83841783 |
| USGS source ID 4835, object ID 2143468, Trapper Lake Trail | Forward, long route only | 0.94499564 |
| Trapper Lake turnaround | Retrace all outbound legs | 9.333045890 RT |

Every selected USGS segment is NPS-origin. The connector-to-USGS gap is about
4.74 m; subsequent adjoining endpoints match in the retained records.
Small positional differences are disclosed, not filled with invented geometry.
USGS totals use stored segment lengths; only the NPS connector is independently
recomputed by the committed tests. Haversine calculations use a 6,371,008.8 m
earth radius.

### Bearpaw branch decision

The official [backcountry planning page](https://www.nps.gov/grte/planyourvisit/back.htm)
currently links this [point-to-point map](https://www.nps.gov/grte/planyourvisit/upload/grte_backcountry_map_2012.jpg).
Visual inspection distinguishes the northern through-route to Trapper from the
Bearpaw campsite-access branch. The map filename dates to 2012; it corroborates
route geography, not current trail conditions or openness.

The USGS geometry independently separates source ID 7330, Bearpaw Lake Trail,
from source ID 4835, Trapper Lake Trail, at the same junction. The admitted
itinerary follows 4835 to the Trapper endpoint at
43.83401904934986, -110.73338418239369; it does not add a round-trip excursion on
7330 merely because Bearpaw appears in the hike's name. The branch record is
retained as excluded evidence and regression-tested. Extra campsite or shoreline
excursions are outside the listed day-hike variant.

The old Carto service referenced by NPS's interactive configurations could not
be retrieved: the legacy hostname failed TLS hostname verification, and the
current-host attempt did not return route JSON. No certificate check was
disabled. The comparison above uses current downloaded USGS records, the
official NPS connector, the activity descriptions, and the separately inspected
published map; it does not claim that legacy Carto geometry was fetched.

## Weather coordinate review

Both profiles use the official NPS Leigh Lake Trailhead marker:
latitude 43.78922384, longitude -110.73169202, from the
[NPS trailhead dataset](https://www.nps.gov/grte/planyourvisit/upload/Grand-Teton-Trailhead-Map.json).
The marker is approximately 3.43 m from vertex 8 of the shared approach.

It is not the southern endpoint of that approach and is not the separate
String Lake Trailhead marker. The comparison retains the full NPS access path;
trimming it at the weather marker would silently change the itinerary.
This is a trailhead-area forecast, not a navigation coordinate or a promise of
uniform weather along the entire 9.2-mile route.

## AllTrails comparison-only check

Reviewed public indexed pages on 2026-09-05. The available AllTrails pages were
cached approximately three months earlier, so their figures are not represented
as freshly verified live provider values.

| Page | Indexed figures | Disposition |
|---|---|---|
| [Leigh Lake: Short Version](https://www.alltrails.com/trail/us/wyoming/leigh-lake-trail-short-version) | 2.9 mi; 45 ft; Easy; 0.5–1 hour | The description continues along Leigh Lake's eastern shore. Different endpoint variant; not a direct comparison with NPS's 1.8-mile southern-shore hike. |
| [Bearpaw and Trapper Lake Trail](https://www.alltrails.com/trail/us/wyoming/bearpaw-and-trapper-lake-trail) | 9.2 mi; 242 ft; Moderate; 3–3.5 hours | Distance agrees with NPS. Gain and duration differ; retain NPS's 460 ft and 4–6 hours. |

No AllTrails route data, conditions, reviews, or alerts are imported into the
runtime. The catalog's primary facts remain NPS-sourced.

## Photo review

Each original JPEG is 6,016 × 3,384 pixels and is credited NPS Photo/A. Falgoust
on the corresponding official activity page. Those pages display no third-party
restriction. Credit and source links remain visible; no endorsement is implied.
Neither image was upscaled or AI-generated.

- Leigh Lake: waves, wooded slopes, and mountain peaks. Original asset:
  https://www.nps.gov/common/uploads/cropped_image/primary/C6CBD9B1-BED9-22E0-B8E1FEE02F18657E.jpg
  Desktop focal point 55% 5%; mobile 65% 45%.
- Bearpaw–Trapper: lake, green hillside, and distant mountain. Original asset:
  https://www.nps.gov/common/uploads/cropped_image/primary/C7702ED0-D53D-5015-F952F0D8D8381A00.jpg
  Desktop focal point 50% 12%; mobile 48% 45%.

Desktop focal points were raised after visual review found the initial wide
crops clipped mountain peaks. Mobile framing was retained.

## Validation and scope

- Offline catalog/template/photo check: 13 records pass.
- Unit suite: 572 tests across 44 files pass.
- Live NPS integrity: 13/13 unchanged.
- System stress: 5,000 cases, zero invariant failures, 0.042 ms p95.
- Scenario evidence regenerated with no content change.
- Lint, type checking, and optimized production build pass.
- Full fresh-development Firefox/axe run: 46 flows pass.
- All four new-trail desktop/mobile cases pass again after final focal-point
  tuning. Screenshots at 1280 and 390 px preserve the peaks, shoreline, legible
  credit, and the selected trail's matching photo.
- In-app Browser checks at http://127.0.0.1:3000/ confirm the TrailPack page,
  populated trail profiles, no framework overlay, no broken displayed images,
  no horizontal overflow, and clean error/warning logs. Leigh Lake desktop and
  Bearpaw–Trapper mobile both generate the matching packing list and standard
  review. The local provider configuration makes no paid AI request.
- Live local context returned a forecast, daylight, and three NPS park notices;
  the automated new-trail flows separately verify honest unavailable-data and
  malformed-weather fallback at both widths. No authentication was requested.

This expands the reviewed day-hike catalog and adds a small discovery feature:
device-local popular-trail ranking with randomized fallback, plus a supported-
park list that opens the existing park trail view. Only versioned trail-ID click
counts are stored locally; no account or trip data is added. The proposal's
small representative-catalog baseline is already exceeded; whole-park coverage
is an owner-requested follow-on, not a claim that the original requirements
needed every Teton route. The historical closeout remains a dated record.
An interactive supported-park map is documented as future work; the reusable
list is the current first step. No new parks, backpacking support, technical navigation, packing thresholds,
authentication, AI limits, or provider time budgets changed. Guest planning and
unknown-data fallback remain available. Hosted Preview and release are pending.
