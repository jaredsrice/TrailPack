# Week 7 Trail Data Feasibility Findings

## Core Decision

TrailPack can use National Park Service trail pages as the primary source for official trail stats, with USGS public data as the legal fallback/computation layer.

The app should not try to force USGS values to match NPS one-for-one. NPS values are official, while USGS-derived values are computed estimates based on route geometry, DEM sampling, and filtering rules.

## Source Strategy

| Data Need | Primary Source | Fallback Source | App Behavior |
|---|---|---|---|
| Distance | NPS trail page/API | USGS trail geometry | Display NPS when available |
| Elevation gain | NPS trail page/API | USGS 3DEP DEM | Display NPS when available |
| Route geometry | USGS National Digital Trails | Assembled USGS trail segments | Use for map/profile |
| Elevation profile | USGS 3DEP DEM | None for MVP | Show as computed estimate |
| Weather | Weather API | None | Live trip context |
| Alerts/closures | NPS API | NPS page scrape if needed | Live trip context |

## Jenny Lake Result

For Jenny Lake Loop, the NPS page gives:

- Distance: 7.1 mi
- Elevation gain: 1,040 ft
- Time: 3-5 hours
- Difficulty: Moderate

The USGS trail geometry matched `Jenny Lake Loop`:

- USGS attribute distance: 6.947 mi
- USGS geometry distance: 6.944 mi
- Elevation range from USGS 3DEP: about 6,785-6,901 ft
- Computed gain varied by method, roughly 700-1,200 ft

Conclusion: display NPS values, use USGS for route geometry, profile, and fallback.

## Five-Trail Queue Test

| Trail | NPS Distance/Gain | Best USGS Distance | Status |
|---|---:|---:|---|
| Jenny Lake Loop | 7.1 mi / 1,040 ft | 6.947 mi | `ok` |
| Taggart Lake | 3.0 mi / 360 ft | 2.958 mi | `ok` |
| Phelps Lake Loop | 6.4 mi / 1,060 ft | 6.415 mi | `strong_bridge` |
| String Lake Loop | 3.7 mi / 540 ft | 3.708 mi | `moderate_bridge` |
| Lake Creek-Woodland Loop | 3.0 mi / 770 ft | 3.007 mi | `distance_ok_gain_conflict` |

Route assembly improved distance accuracy. For example, Phelps Lake Loop needed the `Lake Creek Trail` and `Woodland Trail` segments added to the lake loop segment.

## Product Rule

For normal users, TrailPack should show one clean set of trail stats and the generated packing list.

Example:

```text
Jenny Lake Loop
7.1 mi | 1,040 ft gain | 3-5 hr | Moderate

Today's TrailPack
- Water: 2-3 liters
- Bear spray
- Rain shell
- Sun protection
- Snacks / lunch
- Offline map
- First-aid basics
```

Detailed source comparison should be hidden behind a small "Sources & Confidence" section.

## Implementation Notes

Store provenance for every major value:

```text
distance_miles = 7.1
distance_source = "NPS"
distance_source_url = "https://www.nps.gov/thingstodo/jennylakeloop.htm"
computed_distance_miles = 6.947
computed_distance_source = "USGS National Digital Trails"
gain_feet = 1040
gain_source = "NPS"
computed_gain_feet = 698
computed_gain_source = "USGS 3DEP"
confidence = "official_nps_with_usgs_geometry_ok"
```

Recommended confidence statuses:

- `official_nps_with_usgs_geometry_ok`
- `official_nps_with_strong_usgs_bridge`
- `official_nps_with_moderate_usgs_bridge`
- `official_nps_with_gain_conflict`
- `need_to_fill`

## Bottom Line

This is a viable legal data strategy for a national-park-focused MVP. Use NPS as the official display layer, USGS as the legal route/elevation computation layer, and TrailPack's own rules to generate the user-facing packing list.
