# Grand Teton day-hike coverage

Inventory checked: 2026-09-04 UTC. This is an admission checklist, not live
trail-condition information or a claim that every listed route is supported.

## Boundary and source

The [NPS hiking page](https://www.nps.gov/grte/planyourvisit/hike.htm) currently
features 16 suggested hikes. The park-filtered official NPS Things To Do API
returned all 53 records in one bounded page (`parkCode=grte`, `limit=100`);
41 are tagged Hiking. The [dated public inventory](grand-teton-inventory-2026-09-04.json)
retains their IDs, titles, URLs, and park names without any credential. Two are in the adjoining John D. Rockefeller, Jr.
Memorial Parkway, leaving 39 named Grand Teton hiking pages in this inventory.
The API was used for discovery only. Admission checks the individual official
page, exact route/access variant, USGS geometry, weather point, and photo.

Several pages describe more than one route, such as a shuttle-boat approach
versus walking from South Jenny Lake. One page is therefore not necessarily
one catalog profile. Never merge variants or use the shorter route's distance
for a different start. This checklist is complete for the captured NPS Hiking
records, not for every named path, unofficial route, connector, or historic walk.
Recheck NPS discovery and route variants before calling park coverage complete.

The scope is day-hike packing, not overnight backpacking, technical climbing,
or navigation. Long alpine day hikes require a separate safety and weather-area
review; a completed data template alone does not make them supported.

## Current coverage

Seven entries were released through PR #50, two Preserve loops through PR #51,
and two Colter Bay loops through PR #52, bringing Production to eleven profiles.
Leigh Lake and Bearpaw–Trapper Lakes are reviewed in the current local branch,
bringing the source catalog to thirteen. Their hosted Preview and protected
release checks remain a separate approval step.

| Area | NPS hiking page | Status / admission note |
|---|---|---|
| Colter Bay | [Lakeshore Trail](https://www.nps.gov/thingstodo/colterlakeshore.htm) | Supported as Colter Bay Lakeshore Trail; primary profile source remains the reviewed NPS places page. |
| Colter Bay | [Heron Pond–Swan Lake](https://www.nps.gov/thingstodo/heronpond-swanlake.htm) | Released in PR #52; 3.1 mi official / 3.043 mi comparison. |
| Colter Bay | [Hermitage Point](https://www.nps.gov/thingstodo/hermitagepoint.htm) | Released in PR #52 as the full point loop; 9.5 mi official / 9.692 mi comparison. |
| Jackson Lake Lodge | [Lunch Tree Hill](https://www.nps.gov/thingstodo/lunchtreehill.htm) | Supported. |
| Jackson Lake Lodge | [Christian Pond Loop](https://www.nps.gov/thingstodo/christianpond.htm) | Supported. |
| Jackson Lake Lodge | [Grand View Point](https://www.nps.gov/thingstodo/grandview.htm) | Pending; multiple starting points. |
| Two Ocean Lake | [Two Ocean Lake](https://www.nps.gov/thingstodo/twoocean.htm) | Supported; primary source remains the reviewed places page and its differing gain is disclosed. |
| Two Ocean Lake | [Emma Matilda Lake](https://www.nps.gov/thingstodo/emmamatilda.htm) | Pending. |
| Two Ocean Lake | [Two Ocean–Emma Matilda loop](https://www.nps.gov/thingstodo/twoocean-emmamatilda.htm) | Pending; full combined route. |
| Signal Mountain | [Signal Mountain Trail](https://www.nps.gov/thingstodo/signalmountain.htm) | Pending. |
| String Lake | [String Lake](https://www.nps.gov/thingstodo/stringlake.htm) | Supported as String Lake Loop. |
| String Lake | [Leigh Lake](https://www.nps.gov/thingstodo/leighlake.htm) | Reviewed locally; short out-and-back, 1.8 mi official / 1.766 mi comparison. Preview/release pending. |
| String Lake | [Bearpaw and Trapper Lakes](https://www.nps.gov/thingstodo/bearpaw-trapper.htm) | Reviewed locally; 9.2 mi official / 9.333 mi comparison to Trapper Lake without extra Bearpaw access spur. Preview/release pending. |
| String Lake | [Holly Lake](https://www.nps.gov/thingstodo/hollylake.htm) | Pending alpine/day-hike safety review. |
| String Lake | [Paintbrush–Cascade loop](https://www.nps.gov/thingstodo/paintbrushcascade.htm) | Pending alpine/day-hike safety review. |
| Jenny Lake | [Jenny Lake Loop](https://www.nps.gov/thingstodo/jennylakeloop.htm) | Supported; computed gain conflict retained. |
| Jenny Lake | [Moose Ponds](https://www.nps.gov/thingstodo/mooseponds.htm) | Pending. |
| Jenny Lake | [Hidden Falls](https://www.nps.gov/thingstodo/hiddenfalls.htm) | Pending; separate boat and walking approaches. |
| Jenny Lake | [Inspiration Point](https://www.nps.gov/thingstodo/inspirationpoint.htm) | Pending; separate boat and walking approaches. |
| Jenny Lake | [Forks of Cascade Canyon](https://www.nps.gov/thingstodo/cascadecanyon.htm) | Pending; separate boat and walking approaches. |
| Jenny Lake | [Lake Solitude](https://www.nps.gov/thingstodo/lakesolitude.htm) | Pending alpine review and approach variants. |
| Jenny Lake | [Hurricane Pass](https://www.nps.gov/thingstodo/hurricane-pass.htm) | Pending alpine review and approach variants. |
| Lupine Meadows | [Surprise and Amphitheater Lakes](https://www.nps.gov/thingstodo/amphitheaterlake.htm) | Pending alpine/day-hike safety review. |
| Lupine Meadows | [Garnet Canyon](https://www.nps.gov/thingstodo/garnetcanyon.htm) | Pending; hiking endpoint must not imply climbing support. |
| Taggart Lake | [Taggart Lake](https://www.nps.gov/thingstodo/taggartlake.htm) | Supported out-and-back. |
| Taggart Lake | [Taggart–Beaver Creek loop](https://www.nps.gov/thingstodo/taggartloop.htm) | Pending; distinct from the supported out-and-back. |
| Taggart Lake | [Taggart–Bradley loop](https://www.nps.gov/thingstodo/taggartbradley.htm) | Pending. |
| Moose | [Murie Ranch Hike](https://www.nps.gov/thingstodo/murieranchhike.htm) | Pending. |
| Preserve | [Lake Creek–Woodland loop](https://www.nps.gov/thingstodo/lakecreek-woodlandtrail.htm) | Reviewed and approved; 3.0 mi official / 2.960 mi comparison. |
| Preserve | [Phelps Lake Loop](https://www.nps.gov/thingstodo/phelpslake.htm) | Reviewed and approved; 6.4 mi official / 6.441 mi comparison. |
| Preserve | [Aspen Ridge–Boulder Ridge](https://www.nps.gov/thingstodo/aspen-boulderridge.htm) | Pending; separate extended approach. |
| Death Canyon | [Phelps Lake Overlook](https://www.nps.gov/thingstodo/phelpsoverlook.htm) | Pending; distinct start from Preserve routes. |
| Death Canyon | [Phelps Lake](https://www.nps.gov/thingstodo/phelps.htm) | Pending; out-and-back, not the Preserve loop. |
| Death Canyon | [Death Canyon–Static Peak junction](https://www.nps.gov/thingstodo/deathcanyon.htm) | Pending; endpoint is junction, not divide. |
| Death Canyon | [Static Peak Divide](https://www.nps.gov/thingstodo/staticpeak.htm) | Pending alpine/day-hike safety review. |
| Southern approaches | [Valley Trail–Phelps Lake Overlook](https://www.nps.gov/thingstodo/valley-trail-phelps-lake-overlook.htm) | Pending; distinct access and longer route. |
| Southern approaches | [Granite Canyon](https://www.nps.gov/thingstodo/granite-canyon.htm) | Pending; multiple starting points and tram dependency. |
| Southern approaches | [Marion Lake](https://www.nps.gov/thingstodo/marionlake.htm) | Pending alpine review and approach variants. |
| Southern approaches | [Open Canyon](https://www.nps.gov/thingstodo/open-canyon.htm) | Pending alpine review and approach variants. |

Adjacent Parkway listings are tracked separately:
[Polecat Creek Loop](https://www.nps.gov/thingstodo/polecatcreek.htm) and
[Flagg Canyon](https://www.nps.gov/thingstodo/flaggcanyon.htm). Their park/provider
mapping needs explicit review before admission into this Grand Teton-only intake.

## Repeatable completion check

For each candidate: confirm the exact named itinerary and start, preserve NPS
facts with missing/conflicting gains explicit, reconcile USGS segments and any
repeated or clipped access, independently verify the weather point, inspect a
sharp licensed photo, and run the [onboarding gate](../trail-onboarding.md).
Desktop/mobile guest acceptance and the protected PR/Preview review remain
required. Update this table as profiles are admitted; do not change Pending to
Supported merely because a draft passes the offline schema check.
