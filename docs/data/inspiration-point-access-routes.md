# Inspiration Point: four complete approaches

Reviewed September 7, 2026. Local implementation; not a production release.

| Access choice | Hiking total | Gain | Return plan | Forecast reference |
|---|---|---|---|---|
| South Jenny Lake walk | 5.7 mi | 870 ft | Included, back to Jenny Lake Trailhead | NPS Jenny Lake Trailhead marker |
| Round-trip shuttle + hike | 1.8 mi | 550 ft | Included, back to the west dock | NPS West Shore Boat Dock marker |
| Shuttle out, walk back | About 3.7 mi, mapped estimate | Unverified | South lakeshore walk to Jenny Lake Trailhead | NPS West Shore Boat Dock marker |
| Walk out, shuttle back | About 3.7 mi, mapped estimate | Unverified | West dock boat to east dock; last departure matters | NPS Jenny Lake Trailhead marker |

The [NPS activity page](https://www.nps.gov/thingstodo/inspirationpoint.htm)
publishes both as out-and-back hikes. Its 2–4 hour duration is page-wide. The boat
option excludes crossings, queues and parking-to-dock access from the hiking
total; check the [operator's current service and return departure](https://jennylakeboating.com/boat-trips/shuttle-service/).
The operator explicitly permits one-way crossings in either direction. No
north-shore itinerary has been admitted. Mixed mileage excludes the optional
Hidden Falls spur, boat travel and parking/dock connectors. Adding that side
trip requires extra distance and time; it is not silently included.

## Mixed-route evidence

The [mixed itinerary definition](../../src/features/trailpack/data/access-itineraries/inspiration-point-mixed.json)
uses the south-shore walking leg and the west-dock leg, meeting at the same
clipped Inspiration Point endpoint. Tests load the original
[bulk geometry archive](grand-teton-bulk-2026-09-05.geometry.json.gz) and
[shuttle geometry](inspiration-point-shuttle-2026-09-07.json), sum each leg once,
and verify adjoining endpoints. The mapped sum is approximately 3.688 mi,
displayed as **~3.7 mi**. Reversing it preserves hiking distance, not necessarily
ascent. No boat line is counted and the Hidden Falls spur (5083) is omitted.

NPS does not publish either mixed itinerary's total or elevation gain. The
official parent values are not averaged into a fictional official route.
USGS here is two-dimensional; gain stays unverified instead of becoming zero.
The mixed time range and Moderate rating are explicitly planning estimates
based on the parent approaches, not mixed-route NPS ratings. Entering expected
time out improves the packing guidance. Unknown gain uses cautious food/water
defaults; it does not qualify a hike as short and low-gain.

Only walking out and boating back depends on the last return crossing. Taking
the boat outbound requires service before starting, but its planned return is
on foot. Both options link to current boat hours rather than hard-coding a
seasonal schedule. A cancelled/missed return boat changes the hike: choose the
full walking route and regenerate rather than using the mixed mileage.

## Source comparison and limits

The [NPS shuttle map](https://www.nps.gov/maps/builder/configs/1662f767-6f02-4272-a697-a410e034ad69.json)
and [walking map](https://www.nps.gov/maps/builder/configs/3323a528-c16d-4531-a73f-547e739e5ed5.json)
are distinct. The old walking definition incorrectly linked the shuttle map;
the link is corrected without changing its ID, distance or gain.

The [retained shuttle evidence](inspiration-point-shuttle-2026-09-07.json)
contains seven original USGS feature geometries, selected endpoint clipping,
the query URL, NPS dock marker and the previously reviewed AllTrails counterpart.
The connected dock-area/Hidden Falls/viewpoint comparison is 1.852 mi, about
2.9% above the NPS total. Tests recalculate distance, connected endpoints and
viewpoint clipping from the captured vertices.

The USGS land geometry ends approximately 49 m short of the NPS dock marker;
the comparison does not measure that connector. The old NPS CARTO line service
is unavailable, so this is a reviewed corridor comparison, not an exact copy
of that layer or a navigation track. USGS gain remains unknown; no new elevation
data is claimed. Both forecast positions represent an area, not identical
conditions everywhere along the hike.

The [AllTrails shuttle route](https://www.alltrails.com/trail/us/wyoming/inspiration-point-via-jenny-lake-boat-shuttle)
was reviewed September 5 at 1.8 mi, 426 ft and Moderate difficulty. It is a
recognizable counterpart, not the authority for TrailPack's values: NPS supplies
550 ft and Easy. These differences are not averaged. The in-app comparison
disclosure now labels that relationship explicitly. That AllTrails page is a related
shuttle itinerary, not evidence that either mixed route has an identical
standalone AllTrails page. The mixed options use its recognizable destination
and approach corridor while making the different south-shore leg explicit.

## Reusing the implementation

Follow [Add a trail](../trail-onboarding.md#adding-another-way-to-reach-an-existing-destination).
Each complete itinerary keeps a stable profile ID. NPS-published options use
their own managed facts and source-section policy; mixed options use a reviewed
composition definition without a fictional snapshot. Shared metadata supplies the
discovery grouping. [The design decision](../adr/0002-complete-access-route-identity.md)
explains why saved lists retain concrete IDs instead of group-level defaults.

The wider Jenny Lake completion batch is documented in the
[September 9 route record](jenny-lake-shuttle-routes-2026-09-09.md).
