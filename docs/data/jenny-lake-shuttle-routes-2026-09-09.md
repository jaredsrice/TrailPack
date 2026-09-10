# Jenny Lake shuttle route completion

Reviewed September 9, 2026. Local implementation; not a production release.

The NPS activity pages publish shorter round-trip shuttle hikes for four
destinations that previously had only the South Jenny Lake walking itinerary in
TrailPack. This batch adds each one as a separate complete route profile.

| Destination | NPS shuttle hike | Retained USGS corridor | Public comparison |
|---|---:|---:|---|
| Hidden Falls | 1.0 mi, 300 ft, Easy | 1.119 mi, moderate bridge | Comparable AllTrails west-dock route |
| Forks of Cascade Canyon | 9.4 mi, 1,480 ft, Moderately Strenuous | 9.490 mi, strong bridge | Comparable AllTrails Cascade Canyon route |
| Lake Solitude | 14.4 mi, 2,670 ft, Strenuous | 15.024 mi, strong bridge | Related AllTrails route with different mileage |
| Hurricane Pass | 20.0 mi, 4,120 ft, Very Strenuous | 20.571 mi, strong bridge | Related AllTrails route with different access and mileage |

NPS facts remain the displayed authority. The USGS values are corridor
comparisons and are not substituted for distance, gain, duration or difficulty.
Boat crossings and parking-to-dock connectors are outside the hiking totals.
The West Shore Boat Dock marker is the weather reference for all four shuttle
profiles; it represents the route area rather than uniform conditions on longer,
higher routes.

The machine-readable [evidence manifest](jenny-lake-shuttle-routes-2026-09-09.json)
lists every retained feature ID, traversal count, clipped fraction, source map,
official value and public-route relationship. Tests load both retained geometry
archives, recompute all four corridor lengths, check their joins and compare each
managed snapshot with the exact NPS shuttle subsection.

## Map-link correction

The four pre-existing South Jenny Lake definitions incorrectly cited each
activity page's shuttle map configuration. Their supporting links now point to
the distinct walking maps. Their IDs, NPS values, USGS comparisons and saved-list
meaning did not change.

## Official variants resolved by the follow-up audit

The source review also found Grand View Point from Jackson Lake Lodge, Marion
Lake from Rendezvous Mountain and Moose Ponds Loop. Their NPS pages distinguish
those variants, but this batch's retained archive did not establish complete
route geometry for them. The September 9 follow-up audit captured the missing
USGS records and admitted all three. The manifest keeps the original reasons and
adds each resolving profile ID so the evidence history remains traceable.
