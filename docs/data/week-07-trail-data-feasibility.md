# Week 7 Trail Data Feasibility Findings

## Core Decision

TrailPack can use National Park Service trail pages as the primary source for official trail stats, with USGS public data as the legal fallback/computation layer.

The app should not try to force USGS values to match NPS one-for-one. NPS values are official, while USGS-derived values are computed estimates based on route geometry, DEM sampling, and filtering rules.

## Source Strategy

| Data Need | Primary Source | Fallback Source | App Behavior |
|---|---|---|---|
| Distance | NPS trail page | USGS trail geometry | Display NPS when available |
| Elevation gain | NPS trail page | USGS 3DEP DEM | Display NPS when available |
| Time/difficulty | NPS trail page | TrailPack estimate | Display NPS when available |
| Route geometry | USGS National Digital Trails | Assembled USGS trail segments | Use for map/profile |
| Elevation profile | USGS 3DEP DEM | None for MVP | Show as computed estimate |
| Weather | Weather API | None | Live trip context |
| Alerts/closures | NPS API | NPS page scrape if needed | Live trip context |

Important API distinction: the NPS API is still useful for alerts, park metadata, and live context, but it does not provide the specific trail stats TrailPack needs in a reliable structured way for this use case. For Jenny Lake, the usable official values came from the NPS trail page, not the API.

Getting those trail-page values would technically be scraping. This is still a legal route to take for the MVP when limited to public NPS-created trail pages, source attribution is stored, and disallowed paths such as search or loader endpoints are avoided. However, scraping is potentially less reliable than an API because page structure can change, so TrailPack should store the source URL, last-checked date, parse status, and USGS fallback values.

General source order for trail stats:

| Source | Role | Use in TrailPack |
|---|---|---|
| NPS | Official display source | Use for distance, gain, time, and difficulty when available |
| USGS | Legal fallback/computation source | Use for route geometry, elevation profile, min/max elevation, and fallback stats |
| Trailforks + USGS | Not planned for current MVP | Could be a useful backup route strategy only if Trailforks API access or written permission is granted |

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

The best Trailforks-based computation came in two steps.

Base Trailforks east/west export:

| Trailforks Export | Distance | Climb | Descent | Avg Time |
|---|---:|---:|---:|---|
| Jenny Lake East | 3.149 mi | 384 ft | 312 ft | 1 hr 24 min |
| Jenny Lake West | 1.414 mi | 151 ft | 112 ft | 42 min |
| East + West combined | 4.563 mi | 535 ft | 423 ft | 2 hr 06 min |

USGS connector segments added between the Trailforks east/west endpoints:

| Connector | Distance | Computed Gain | Computed Loss |
|---|---:|---:|---:|
| North connector | 0.255 mi | Included below | Included below |
| South connector | 2.367 mi | Included below | Included below |
| Connector total | 2.622 mi | 334 ft | 318 ft |

Best Trailforks + USGS connector estimate:

| Computation | Distance | Climb/Gain | Descent/Loss | Notes |
|---|---:|---:|---:|---|
| Trailforks East + West only | 4.563 mi | 535 ft | 423 ft | Partial route only |
| Trailforks East/West + USGS connectors | 7.185 mi | 869 ft | 741 ft | Best mixed-source estimate |

The base Trailforks east/west export was wildly off for the full-loop use case because it only covered partial segments. Adding USGS connector geometry brought the distance close to NPS, but the best mixed-source climb estimate was still about 171 ft below the official NPS gain. As of now, Trailforks is not planned as a source for the MVP. If Trailforks API access or written permission is granted later, Trailforks plus USGS connector/fallback data could be a useful backup route strategy.

| Source | Distance | Gain/Climb | Time | Notes |
|---|---:|---:|---|---|
| NPS | 7.1 mi | 1,040 ft | 3-5 hr | Official display values |
| USGS | 6.947 mi | roughly 700-1,200 ft computed | Not provided | Legal route/elevation fallback |
| Trailforks + USGS | 4.563 mi base; 7.185 mi with USGS connectors | 535 ft base; 869 ft with connectors | 2 hr 06 min base only | Not planned for MVP; useful backup if API/permission is granted |

Conclusion: NPS plus USGS fallback is good enough for the current use case. Display NPS values when available, then use USGS for route geometry, elevation profile, and fallback computation.

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

This is a viable legal data strategy for a national-park-focused MVP. NPS plus USGS fallback is good enough for the current use case: use NPS as the official display layer, USGS as the legal route/elevation computation layer, and TrailPack's own rules to generate the user-facing packing list. Trailforks plus USGS can remain a possible future backup only if Trailforks API access or written permission is granted.
