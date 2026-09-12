# TrailPack user guide

TrailPack helps day hikers prepare a packing list from a selected route, planned
timing, forecast context, official notices, and reported trail conditions.

## Plan a supported hike

1. Search for a trail or open the supported Grand Teton park list.
2. Select the destination.
3. If several access routes are available, choose the complete itinerary you
   intend to use.
4. Review the trail facts, access notes, source information, weather state, and
   current National Park Service notices.
5. Add your date, start time, expected duration, and known conditions.
6. Select **Generate packing list**.
7. Review critical items, optional items, trip warnings, and the explanation of
   why each recommendation appears.

Changing the selected route or trip details makes the old list stale. Select
**Update packing list** to create a new snapshot.

## Understand route distance

TrailPack plans around a complete selected itinerary rather than a destination
name alone.

| Route form | Distance meaning |
|---|---|
| Loop | Complete circuit returning to its start |
| Out-and-back | Walk to the turnaround and return on the same approach |
| Point-to-point | One-way walk ending somewhere else |
| Round-trip shuttle | Hiking between the dock and destination, with boat travel in both directions |
| Mixed walk and shuttle | One direction by boat and the other by the documented walking approach |

Published NPS round-trip distance already includes the return and is never
doubled. A one-way route stays one way and displays its transportation or return
requirement. Boat, tram, vehicle, and parking-to-dock travel are separate from
hiking distance.

When reaching a destination requires another trail, TrailPack includes that
approach only when the complete itinerary has been reviewed. It does not
dynamically combine arbitrary trail segments.

## Read the source labels

**Verified NPS + USGS profile** means official NPS facts are paired with reviewed
USGS route evidence. The NPS distance remains the displayed official value even
when the USGS comparison differs.

**Calculated route** identifies a reviewed mixed itinerary whose walking
distance was reconstructed from retained geometry. The calculation disclosure
explains its sources, method, exclusions, rounding, and unknowns. Calculated
distance does not make unknown elevation gain verified.

AllTrails is a comparison used to confirm a recognizable public route name. It
does not supply TrailPack's official facts or live conditions.

## Weather and official notices

TrailPack requests a date-aware Open-Meteo forecast and daylight times. A
**Live** label describes successful retrieval; it does not mean a route is safe.
Saved examples are visibly labeled and unknown conditions remain unknown.

NPS notices may apply to an entire park. TrailPack shows the supplied notice and
its source without claiming that every selected trail is affected. Closure and
access notes remain visible on route profiles even when the official published
distance is retained for reference.

## Guest, account, and AI options

The guest planner includes the full rule-based packing list and standard plan
review. No account is required.

Google sign-in adds private saved plans and a limited Gemini explanation review.
The unreleased candidate asks AI to select approved explanation highlights;
TrailPack supplies the wording. The server validates the account and selection.
AI cannot add, remove,
reorder, or relabel packing items. Provider, quota, timeout, or validation
failures keep the rule-generated result available.

## Unsupported hikes

Manual entry accepts distance, elevation gain, route type, expected duration,
and conditions. It produces a limited list without claiming official trail,
weather, or access facts that were not supplied.

### Partial live lookup (unreleased)

After entering a trail name, open **Search live NPS hikes**, choose Zion,
Acadia or Bryce Canyon, and press **Search NPS**. Check the returned name, park,
source and duration before choosing a result. This is a hiking-activity lookup,
not a complete trail profile or a statement that access is open.

NPS's upper duration estimate seeds your time out. Add known missing details,
then press **Generate partial packing list**. Edits take effect when you press
**Update partial packing list**. Changed duration and entered distance/gain/route
are user-provided; NPS facts keep their source. Weather, daylight and alerts are
unavailable for this path, not checked and clear. It does not request AI or save
results to an account. If lookup fails, choose Manual entry in Suggestions.

Hosted availability requires the deployment and quota setup documented in the
[setup guide](setup.md).

## Planning limits

- Confirm current trail, road, boat, tram, and weather conditions before leaving.
- A trail-area forecast may not represent a summit, canyon, pass, or exposed
  section.
- TrailPack is not a navigation service or an emergency resource.
- The packing list cannot know every personal, medical, group, or equipment need.
- Closed or seasonally limited routes may remain visible with dated warnings so
  their evidence is not silently reassigned to another start.

See the [coverage register](data/grand-teton-coverage.md) for exact supported
routes and the [roadmap](roadmap.md) for planned trail-discovery improvements.
