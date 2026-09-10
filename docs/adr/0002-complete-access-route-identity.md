# Keep complete access routes as planning identities

Date: 2026-09-07

Status: Accepted; implemented for ten grouped destinations

## Context

A destination name is not enough to plan a hike. Inspiration Point can mean a
5.7-mile walk from South Jenny Lake or a 1.8-mile hike after a boat crossing.
Existing saved lists and APIs already identify one concrete itinerary by its
trail-profile ID. Reusing that ID for a different approach would change its meaning.

## Decision

Keep one approved definition per complete access route. An NPS-published route
has a managed NPS snapshot; a derived mixed itinerary does not invent one.
The existing `inspiration-point` ID remains the south-shore walking itinerary;
`inspiration-point-shuttle` is the new round-trip boat itinerary. Optional
`trail.accessRoute` metadata groups these under the familiar Inspiration Point
name for search, park lists and device-local popularity. Single-route entries
remain usable without additional setup or an unnecessary selector.

The grouping module rejects conflicting names/parks, duplicate approach labels,
and groups that lose their original route ID. Multiple options require an
explicit choice. All subsequent weather, packing, AI and saved-list operations
use the selected concrete profile, not a group-level default. Switching routes
cancels pending work and clears the old list/review; it does not generate or
spend AI allowance. Hiker-entered date/time details are retained.

Display the source's complete hiking distance and route type together. An
out-and-back already includes its return, and a loop includes its full circuit.
Never double an NPS round-trip distance. One-way routes state that the return is
not included; a different return or transport plan needs a separately reviewed
itinerary, not a generic return-trip toggle.

## Consequences

This avoids a saved-data migration and preserves old walking names and facts.
Saved summaries already snapshot route ID, name, type, distance and gain; the
shuttle's return-boat planning item also remains in its saved packing list.
There are 39 discovery entries and 52 complete route profiles in this branch:
50 NPS-published profiles and two calculated mixed itineraries. The same identity
rule now groups Grand View Point, Moose Ponds, Granite Canyon, Marion Lake, and
Open Canyon variants found in the complete day-hike audit.
The NPS refresh publisher still owns only the managed snapshot, never group
membership, transport assumptions or geometry. NPS page-wide duration estimates
remain labeled as such rather than being silently converted to boat schedules.

Nested mutable variants inside a single planning profile were rejected: they
would require changing every API and saved-data consumer while making legacy
IDs ambiguous. North-shore returns remain unimplemented
until their complete itinerary evidence is reviewed. This does not add navigation,
overnight planning, automatic closure claims or the future interactive map.

## Mixed walking and boat directions

`inspiration-point-boat-out` and `inspiration-point-boat-back` retain separate
IDs, starting forecast points and boat reminders. Their land path is one-way
via the viewpoint; the boat completes the itinerary. The UI calls this
**Mixed walk + boat**, not a walking loop or an incomplete out-and-back.

The mixed definition references the two admitted parent routes and reviewed
USGS segments. Its approximately 3.7 miles is a land-only estimate. Neither NPS
nor the retained 2D geometry supplies mixed-route ascent: gain stays `null`,
displays as unverified, and is not treated as a short low-gain hike by packing
rules. Saved summaries keep "Unverified"; the review contract accepts explicit
unknown gain and carries the distance-estimate flag. Official park safety
guidance keeps its attribution, but inferred profile-based gear guidance does
not receive a verified-profile label.

All NPS parents and shuttle variants receive the full live-source checks. A parent distance
or gain change blocks compilation of its mixed options until their evidence is
reviewed. The publisher cannot write mixed facts or geometry. Separate tests
recompute land distance, connected segments, viewpoint clipping and directional
behavior; a green NPS report alone does not certify the mixed itinerary.
