# TrailPack Week 6 Trail Data Feasibility and Fallback Decision

Date: 2026-05-28  
Course phase: CSE 499A Week 6  
Milestone: Trail-data feasibility notes and fallback decision completed for 5-10 representative trails, including returned fields, missing fields, unreliable fields, and fallback needs.

## Summary Decision

TrailPack should use saved supported hike profiles as the primary prototype data path, with live weather added when coordinates are known.

Live public lookup is useful, but it is not reliable enough to be the only source for the Week 8 thin vertical slice. Public sources can usually help with coordinates, current forecast context, official park alerts, and some OpenStreetMap path tags. They do not consistently return the full hike-profile fields TrailPack needs, especially distance, elevation gain, route type, expected duration, and trail-specific condition details.

Recommended prototype path:

- Use saved supported hike profiles for trail name, park or region, state, coordinates, distance, elevation gain, route type, and expected duration.
- Use Open-Meteo for weather/context after TrailPack has coordinates.
- Use Nominatim only for location lookup or search suggestions after sanity-checking the result against the expected park/state.
- Use NPS API alerts as optional official context when an NPS park code applies and a real API key is available.
- Treat Overpass/OpenStreetMap trail tags as supplemental and experimental, not as the source of truth for complete hike profiles.
- Defer RIDB/Recreation.gov for the prototype unless an API key is added and a later check proves it returns useful trail-level data.

## Sources Checked

| Source | What Was Checked | Useful Returned Fields | Missing Or Unreliable Fields | Prototype Use |
|---|---|---|---|---|
| Nominatim / OpenStreetMap search | Trail and landmark name searches | Display name, latitude, longitude, OSM object type, rough category/type | Not all trail names resolve; some generic queries resolve to the wrong trail; no distance/elevation/duration | Useful for search suggestions and coordinates only after sanity checks |
| Open-Meteo Forecast API | Weather from coordinates | Current temperature, precipitation, wind speed, daily min/max, precipitation probability, timezone | No trail conditions, closures, mud, ice, shade, exposure, or route facts | Good live source for weather-based packing rules |
| National Park Service API | Park alerts, places, and things-to-do for NPS park codes | Official alert titles, alert categories, park context, broad activity/place records | DEMO_KEY rate-limited quickly; places/things-to-do were broad and not always trail-profile data | Useful optional official-alert context with a real API key and caching |
| Overpass API | Broad name searches and bounded path searches around known coordinates | Nearby `highway=path`, `foot`, `surface`, `operator`, and occasional `sac_scale` tags | Broad name searches often timed out or returned no results; bounded results may include nearby paths instead of the target trail; no standard distance/elevation/duration | Supplemental only; not reliable enough for core prototype data |
| RIDB / Recreation.gov | Basic unauthenticated request | No usable data without credentials | Returned `401 Unauthorized Access`; no RIDB key was available in the environment | Defer unless an API key is added later |

## Representative Trail Checks

Weather values below are a live snapshot from 2026-05-28. They prove field availability, not permanent trail conditions.

| Trail | Region | Public Data Found | Missing Or Risky Data | Prototype Decision |
|---|---|---|---|---|
| Delicate Arch | Arches National Park, Utah | Nominatim found Delicate Arch at `38.7434703, -109.4993193` as a natural arch. Open-Meteo returned current temperature, wind, precipitation, daily min/max, and precipitation probability. NPS alerts returned one official alert: "Trip-planning tips for 2026." A bounded Overpass query found nearby paths including `Delicate Arch Trail` with tags such as `highway=path`, `foot=designated`, `surface=ground`, `sac_scale=mountain_hiking`, and `operator=National Park Service`. | Public sources did not provide a complete hike profile with distance, elevation gain, route type, and expected duration. NPS places/things-to-do results were broad. | Use as a supported saved profile. Add live weather and optional official alert/path tags. |
| Angels Landing | Zion National Park, Utah | Nominatim found Angels Landing at `37.2693149, -112.94799` as a peak. Open-Meteo returned weather fields. NPS alerts returned several official alerts, including fire restrictions and closures. NPS things-to-do returned related Zion hiking records such as West Rim to Scout Lookout. | Overpass broad search returned no direct result. Bounded Overpass around the coordinate returned nearby East Rim/Observation Point paths, not a clean Angels Landing trail profile. Public data did not return full route facts. | Use as a supported saved profile. Add live weather and optional NPS alert context. |
| Avalanche Lake | Glacier National Park, Montana | Nominatim found Avalanche Lake at `48.6561324, -113.7868704` as a lake/water feature. Open-Meteo returned weather fields. An earlier NPS alerts check returned a Glacier alert for Going-to-the-Sun Road spring status before the NPS demo key started rate-limiting. Bounded Overpass near the profile coordinate returned nearby paths such as Avalanche Campground Trail and Trail of the Cedars. | Nominatim found the lake, not a full trail profile. Overpass results were nearby paths, not a clean complete Avalanche Lake Trail profile. NPS demo key hit HTTP 429 rate limits. | Use as a supported saved profile. Add live weather from saved coordinates. Treat NPS/OSM context as optional. |
| Fairy Falls | Yellowstone National Park, Wyoming | Nominatim found Fairy Falls at `44.5248127, -110.870018` as a waterfall after broader Yellowstone-specific queries failed. Open-Meteo returned weather fields. An earlier NPS alerts check returned Yellowstone alerts including wildlife and temporary closure notices before the NPS demo key started rate-limiting. Bounded Overpass found `Fairy Falls Trail` path records with surface tags such as gravel and dirt. | Nominatim required a fallback query. Public data still did not provide distance, elevation gain, route type, or expected duration. NPS demo key hit HTTP 429 rate limits. | Use as a supported saved profile. Add live weather and optional official-alert/path-tag context. |
| Black Elk Peak | Black Hills, South Dakota | Nominatim found Black Elk Peak at `43.8659985, -103.5310254` as a peak. A related query in the first pass found Black Elk Peak Trail as an OSM path. Open-Meteo returned weather fields from saved coordinates. | NPS alerts are not applicable because this is not an NPS park-code target. Overpass was rate-limited during the bounded retry. Public lookup did not provide a complete hike profile. | Use as a supported saved profile. Add live weather from saved coordinates. |
| Navajo Loop | Bryce Canyon National Park, Utah | Open-Meteo returned weather fields when using the saved Bryce Canyon profile coordinate `37.6229, -112.1666`. | This was the clearest Nominatim false-positive risk. Generic `Navajo Loop Trail` returned a trail in Iron County, Utah, not the Bryce Canyon trail. More targeted Nominatim queries for Bryce Canyon returned no results. NPS and Overpass retries hit rate limits. | Use only as a saved supported profile for the prototype. Do not trust generic geocoding for this trail without park/state validation. |

## Data Fields TrailPack Can Trust

These fields are realistic for the prototype when they come from saved supported profiles or a verified live source:

- Trail name
- Park, region, and state
- Coordinates
- Distance
- Elevation gain
- Route type
- Expected duration
- Difficulty or effort label
- Weather temperature, precipitation, wind, and forecast-based context
- Official alerts when NPS data is available
- Basic OSM path tags when Overpass returns a clearly relevant path

These fields should not be guessed from public lookup:

- Exact current trail conditions
- Mud, snow, ice, or closure status unless an official alert or user note supports it
- Water availability
- Cell coverage
- Wildlife or insect risk
- Route distance/elevation/duration when a public source did not explicitly provide it
- Review sentiment or crowd reports

## Fallback Needs

TrailPack should prompt the user only for missing details that materially change the packing list.

High-priority fallback prompts:

- How long is the hike?
- About how much elevation gain is there?
- What type of route is it?
- When do you plan to hike?
- How long do you expect to be out?
- Do you know of any current trail conditions, such as muddy, icy, exposed, shaded, or unknown?

Prototype source labels:

- `supported profile`: saved TrailPack prototype data
- `forecast-based`: Open-Meteo weather data
- `official`: NPS alert or other official source
- `user-provided`: entered or confirmed by the user
- `inferred`: derived from available data and clearly labeled as not confirmed
- `missing`: a needed field was not provided
- `unavailable`: TrailPack checked but did not get usable data
- `future work`: useful signal outside current prototype scope

## Implementation Recommendation

For the Week 8 thin vertical slice, create 2-3 saved hike profiles first. Each saved profile should include at least:

- `id`
- `name`
- `parkOrRegion`
- `state`
- `coordinates`
- `distanceMiles`
- `elevationGainFeet`
- `routeType`
- `estimatedDuration`
- `difficulty`
- `sourceLabel`

Then add live weather as a separate enrichment step:

1. User selects a supported trail.
2. TrailPack loads the saved hike profile.
3. TrailPack requests Open-Meteo weather using the saved coordinates.
4. TrailPack runs baseline recommendation rules.
5. If any important fields are missing, TrailPack shows targeted missing-detail prompts.
6. Output labels each recommendation with the data source that triggered it.

## Example Queries Used

Nominatim example:

```text
https://nominatim.openstreetmap.org/search?q=Delicate%20Arch&format=jsonv2&limit=3&addressdetails=1&extratags=1
```

Open-Meteo example:

```text
https://api.open-meteo.com/v1/forecast?latitude=38.74347&longitude=-109.49932&current=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto
```

NPS alerts example:

```text
https://developer.nps.gov/api/v1/alerts?parkCode=arch&limit=5&api_key=DEMO_KEY
```

Bounded Overpass pattern:

```text
[out:json][timeout:12];
(
  way(around:1800,38.7436,-109.4993)["highway"~"path|footway|track"];
  relation(around:1800,38.7436,-109.4993)["route"~"hiking|foot"];
);
out tags center 8;
```

RIDB unauthenticated check:

```text
https://ridb.recreation.gov/api/v1/recareas?query=Delicate%20Arch&limit=3
```

Result: `401 Unauthorized Access`, so RIDB requires an API key before meaningful feasibility testing.

## Final Week 6 Milestone Check

This feasibility pass tested six representative trails across Utah, Yellowstone, Glacier, and the Black Hills. The main result is that public sources can enrich TrailPack, but they cannot consistently replace saved supported hike profiles. The prototype should proceed with saved profiles plus live weather, with optional official alerts and OSM tags when available.
