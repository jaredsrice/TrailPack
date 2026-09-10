# Grand Teton day-hike coverage

Inventory checked: 2026-09-09 UTC. This is an admission checklist, not live
trail-condition information or a claim that every listed route is supported.

## Boundary and source

The [NPS hiking page](https://www.nps.gov/grte/planyourvisit/hike.htm) currently
features 16 suggested hikes. The park-filtered official NPS Things To Do API
returned all 53 records in one bounded page (`parkCode=grte`, `limit=100`);
41 are tagged Hiking. The API tags both adjacent Parkway listings as `grte` too.
The September 9 product decision includes them in the audit boundary while
keeping them on an evidence hold until complete USGS corridors can be retained.
The [dated public inventory](grand-teton-inventory-2026-09-04.json)
retains their IDs, titles, URLs, and park names without any credential. Two are
in the adjoining John D. Rockefeller, Jr. Memorial Parkway, alongside 39 named
Grand Teton hiking pages in this inventory.
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

The current source contains 39 discovery entries and 52 route profiles: 50
NPS-backed profiles plus two calculated mixed Inspiration Point itineraries.
All captured in-park NPS Hiking pages have a corresponding selected profile;
six additional NPS-published access variants are now distinct choices. This is
not a claim that every approach is open. See the
[bulk admission record](grand-teton-bulk-2026-09-05.md) and the
[complete route audit](grand-teton-day-hike-audit-2026-09-09.md).

| Area | NPS hiking page | Status / admission note |
|---|---|---|
| Colter Bay | [Lakeshore Trail](https://www.nps.gov/thingstodo/colterlakeshore.htm) | Supported as Colter Bay Lakeshore Trail; primary profile source remains the reviewed NPS places page. |
| Colter Bay | [Heron Pond–Swan Lake](https://www.nps.gov/thingstodo/heronpond-swanlake.htm) | Released in PR #52; 3.1 mi official / 3.043 mi comparison. |
| Colter Bay | [Hermitage Point](https://www.nps.gov/thingstodo/hermitagepoint.htm) | Released in PR #52 as the full point loop; 9.5 mi official / 9.692 mi comparison. |
| Jackson Lake Lodge | [Lunch Tree Hill](https://www.nps.gov/thingstodo/lunchtreehill.htm) | Supported. |
| Jackson Lake Lodge | [Christian Pond Loop](https://www.nps.gov/thingstodo/christianpond.htm) | Supported. |
| Jackson Lake Lodge | [Grand View Point](https://www.nps.gov/thingstodo/grandview.htm) | Two choices: Grand View Point Trailhead (2.6 mi NPS / 2.711 mi comparison) and Jackson Lake Lodge (5.8 mi / 5.679 mi). |
| Two Ocean Lake | [Two Ocean Lake](https://www.nps.gov/thingstodo/twoocean.htm) | Supported; primary source remains the reviewed places page and its differing gain is disclosed. |
| Two Ocean Lake | [Emma Matilda Lake](https://www.nps.gov/thingstodo/emmamatilda.htm) | Locally admitted: Emma Matilda Lake Loop; 10.7 mi NPS / 10.604 mi comparison. Preview/release pending. |
| Two Ocean Lake | [Two Ocean–Emma Matilda loop](https://www.nps.gov/thingstodo/twoocean-emmamatilda.htm) | Locally admitted: Two Ocean Lake - Emma Matilda Lake Loop; 13.2 mi NPS / 13.180 mi comparison. Preview/release pending. |
| Signal Mountain | [Signal Mountain Trail](https://www.nps.gov/thingstodo/signalmountain.htm) | Locally admitted: Signal Mountain Trail; 6.7 mi NPS / 6.398 mi comparison. Preview/release pending. |
| String Lake | [String Lake](https://www.nps.gov/thingstodo/stringlake.htm) | Supported as String Lake Loop. |
| String Lake | [Leigh Lake](https://www.nps.gov/thingstodo/leighlake.htm) | Released in PR #53; short out-and-back, 1.8 mi official / 1.766 mi comparison. |
| String Lake | [Bearpaw and Trapper Lakes](https://www.nps.gov/thingstodo/bearpaw-trapper.htm) | Released in PR #53; 9.2 mi official / 9.333 mi comparison to Trapper Lake without extra Bearpaw access spur. |
| String Lake | [Holly Lake](https://www.nps.gov/thingstodo/hollylake.htm) | Locally admitted: Holly Lake; 12.8 mi NPS / 12.657 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| String Lake | [Paintbrush–Cascade loop](https://www.nps.gov/thingstodo/paintbrushcascade.htm) | Locally admitted: Paintbrush Canyon - Cascade Canyon Loop; 19.9 mi NPS / 19.371 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| Jenny Lake | [Jenny Lake Loop](https://www.nps.gov/thingstodo/jennylakeloop.htm) | Supported; computed gain conflict retained. |
| Jenny Lake | [Moose Ponds](https://www.nps.gov/thingstodo/mooseponds.htm) | Two choices: short out-and-back (2.0 mi NPS / 1.940 mi comparison) and full loop (3.4 mi / 3.090 mi). |
| Jenny Lake | [Hidden Falls](https://www.nps.gov/thingstodo/hiddenfalls.htm) | Locally admitted: Hidden Falls via South Jenny Lake; 4.9 mi NPS / 4.918 mi comparison. Preview/release pending. |
| Jenny Lake | [Inspiration Point](https://www.nps.gov/thingstodo/inspirationpoint.htm) | Locally admitted: Inspiration Point via South Jenny Lake; 5.7 mi NPS / 5.587 mi comparison. Preview/release pending. |
| Jenny Lake | [Forks of Cascade Canyon](https://www.nps.gov/thingstodo/cascadecanyon.htm) | Locally admitted: Forks of Cascade Canyon via South Jenny Lake; 13.3 mi NPS / 13.288 mi comparison. Preview/release pending. |
| Jenny Lake | [Lake Solitude](https://www.nps.gov/thingstodo/lakesolitude.htm) | Locally admitted: Lake Solitude via South Jenny Lake; 18.3 mi NPS / 18.822 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| Jenny Lake | [Hurricane Pass](https://www.nps.gov/thingstodo/hurricane-pass.htm) | Locally admitted: Hurricane Pass via South Jenny Lake; 23.9 mi NPS / 24.369 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| Lupine Meadows | [Surprise and Amphitheater Lakes](https://www.nps.gov/thingstodo/amphitheaterlake.htm) | Locally admitted: Surprise and Amphitheater Lakes; 9.8 mi NPS / 9.913 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| Lupine Meadows | [Garnet Canyon](https://www.nps.gov/thingstodo/garnetcanyon.htm) | Locally admitted: Garnet Canyon; 8.2 mi NPS / 8.239 mi comparison. Alpine/day-hike limitations retained. Preview/release pending. |
| Taggart Lake | [Taggart Lake](https://www.nps.gov/thingstodo/taggartlake.htm) | Supported out-and-back. |
| Taggart Lake | [Taggart–Beaver Creek loop](https://www.nps.gov/thingstodo/taggartloop.htm) | Reviewed locally; distinct 3.8 mi loop / 3.760 mi USGS corridor. Preview/release pending. |
| Taggart Lake | [Taggart–Bradley loop](https://www.nps.gov/thingstodo/taggartbradley.htm) | Reviewed locally; 5.6 mi loop / 5.697 mi USGS corridor. Preview/release pending. |
| Moose | [Murie Ranch Hike](https://www.nps.gov/thingstodo/murieranchhike.htm) | Locally admitted: Murie Ranch Hike; 1.1 mi NPS / 1.155 mi comparison. Preview/release pending. |
| Preserve | [Lake Creek–Woodland loop](https://www.nps.gov/thingstodo/lakecreek-woodlandtrail.htm) | Reviewed and approved; 3.0 mi official / 2.960 mi comparison. |
| Preserve | [Phelps Lake Loop](https://www.nps.gov/thingstodo/phelpslake.htm) | Reviewed and approved; 6.4 mi official / 6.441 mi comparison. |
| Preserve | [Aspen Ridge–Boulder Ridge](https://www.nps.gov/thingstodo/aspen-boulderridge.htm) | Locally admitted: Aspen Ridge - Boulder Ridge Loop; 6.2 mi NPS / 6.240 mi comparison. Preview/release pending. |
| Death Canyon | [Phelps Lake Overlook](https://www.nps.gov/thingstodo/phelpsoverlook.htm) | Locally admitted: Phelps Lake Overlook from Death Canyon; 2 mi NPS / 1.984 mi comparison. Old-start access CLOSED; dated restriction retained. Preview/release pending. |
| Death Canyon | [Phelps Lake](https://www.nps.gov/thingstodo/phelps.htm) | Locally admitted: Phelps Lake from Death Canyon; 3.7 mi NPS / 3.684 mi comparison. Old-start access CLOSED; dated restriction retained. Preview/release pending. |
| Death Canyon | [Death Canyon–Static Peak junction](https://www.nps.gov/thingstodo/deathcanyon.htm) | Locally admitted: Death Canyon to Static Peak Divide Junction; 7.7 mi NPS / 7.696 mi comparison. Old-start access CLOSED; dated restriction retained. Preview/release pending. |
| Death Canyon | [Static Peak Divide](https://www.nps.gov/thingstodo/staticpeak.htm) | Locally admitted: Static Peak Divide; 16 mi NPS / 16.065 mi comparison. Old-start access CLOSED; dated restriction retained. Preview/release pending. |
| Southern approaches | [Valley Trail–Phelps Lake Overlook](https://www.nps.gov/thingstodo/valley-trail-phelps-lake-overlook.htm) | Locally admitted: Valley Trail to Phelps Lake Overlook; 13.2 mi NPS / 13.181 mi comparison. Preview/release pending. |
| Southern approaches | [Granite Canyon](https://www.nps.gov/thingstodo/granite-canyon.htm) | Three choices: Granite Canyon Trailhead out-and-back (13.4 mi), Valley Trail out-and-back (15.0 mi), and Rendezvous Mountain to Teton Village (12.9 mi one-way). |
| Southern approaches | [Marion Lake](https://www.nps.gov/thingstodo/marionlake.htm) | Two choices: Granite Canyon Trailhead out-and-back (18.8 mi) and Rendezvous Mountain summit loop (14.7 mi). Alpine and summit-access limitations retained. |
| Southern approaches | [Open Canyon](https://www.nps.gov/thingstodo/open-canyon.htm) | Two choices: closed Death Canyon start (14.8 mi out-and-back) and Rendezvous Mountain to Teton Village (19.4 mi one-way). Closure and summit-access limits remain explicit. |

Adjacent Parkway listings are inside the approved audit boundary and tracked as
geometry evidence holds:
[Polecat Creek Loop](https://www.nps.gov/thingstodo/polecatcreek.htm) and
[Flagg Canyon](https://www.nps.gov/thingstodo/flaggcanyon.htm). NPS publishes
complete facts, but the current USGS layer lacks Polecat's loop and includes
only a short Flagg access segment. Neither is represented as verified yet.

## Repeatable completion check

For each candidate: confirm the exact named itinerary and start, preserve NPS
facts with missing/conflicting gains explicit, reconcile USGS segments and any
repeated or clipped access, independently verify the weather point, inspect a
sharp licensed photo, and run the [onboarding gate](../trail-onboarding.md).
Desktop/mobile guest acceptance and the protected PR/Preview review remain
required. Update this table as profiles are admitted; do not change Pending to
Supported merely because a draft passes the offline schema check.
