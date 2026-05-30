# TrailPack Week 6 Trail Data Feasibility and Fallback Decision

Date: 2026-05-28  
Updated: 2026-05-30  
Course phase: CSE 499A Week 6  
Milestone: Trail-data feasibility notes and fallback decision completed for 5-10 representative trails, including returned fields, missing fields, unreliable fields, and fallback needs.

## Current Decision

TrailPack should not rely on the user manually entering base trail data for normal use. That would make the app tedious and would not solve the planning problem.

The current plan is:

1. Use **Trailforks downloaded trail data** as the main trail-data source for supported regions.
2. Use **NPS API data** for official alerts, park context, and accessibility/terrain notes.
3. Use **Open-Meteo** for live weather.
4. Use **USGS Trails** as a public-domain backup/reference for trail geometry and segment length.
5. Keep manual entry as a fallback for unsupported trails only.

Trailforks API access has been requested by email. Until API access is approved, the working use case is direct download/export of available Trailforks trail data.

## Why The Decision Changed

The first feasibility pass showed that NPS, USGS, OpenStreetMap, and weather APIs do not produce a complete AllTrails-style trail profile by themselves.

The missing piece was a practical trail dataset with fields like distance, elevation, difficulty, status, condition, and trail type. Trailforks appears to provide those fields through its trail data export tool, under a free-access/share-alike use model with proper credit.

That makes Trailforks the best current candidate for the base trail dataset.

## Current Source Status

### Trailforks

Status: **usable through direct download/export; API access requested and pending**

Trailforks is currently the strongest source for the data TrailPack needs. The export tool can provide trail rows with practical route-card fields.

Important available columns:

- `trailid`
- `title`
- `aka`
- `activitytype`
- `activitytypes`
- `difficulty`
- `status`
- `condition`
- `region_title`
- `rid`
- `difficulty_system`
- `trailtype`
- `usage`
- `direction`
- `season`
- `wet_weather`
- `distance`
- `time`
- `alt_change`
- `alt_max`
- `alt_climb`
- `alt_descent`
- `grade`
- `grade_max`
- `grade_min`
- `dst_climb`
- `dst_descent`
- `dst_flat`
- `rating`
- `ridden`
- `total_checkins`
- `total_reports`
- `total_photos`
- `total_videos`
- `views`
- `global_rank`
- `land_manager`
- `closed`
- `osmway`
- `trail_association`
- `sponsors`
- `builders`
- `maintainers`

Most useful TrailPack fields:

- Trail name: `title`, `aka`
- Trail location: `region_title`, `rid`
- Trail distance: `distance`
- Estimated time: `time`
- Difficulty: `difficulty`, `difficulty_system`
- Trail type: `trailtype`
- Use and direction: `usage`, `direction`
- Season and weather sensitivity: `season`, `wet_weather`
- Status and condition: `status`, `condition`, `closed`
- Elevation and grade: `alt_change`, `alt_max`, `alt_climb`, `alt_descent`, `grade`, `grade_max`, `grade_min`
- Uphill/downhill/flat breakdown: `dst_climb`, `dst_descent`, `dst_flat`
- Management/source context: `land_manager`, `trail_association`, `builders`, `maintainers`, `osmway`

Prototype use:

- Use downloaded Trailforks data to seed the supported trail catalog.
- Credit Trailforks in the app and documentation.
- Keep the app free-access to match the stated Trailforks data-use expectations.
- Replace download-based import with API integration only if API access is approved.

Limitations:

- Direct downloads are region-based and may require manual export steps.
- API access is not guaranteed.
- The app still needs an import/normalization step before recommendation logic can use the data.
- Trailforks data should not be treated as an official safety source. NPS alerts should still be used where available.

### National Park Service API

Status: **API key works; main endpoints are accessible**

The NPS API is useful for official context. It is not a complete trail database.

Useful endpoints checked:

- `parks`
- `alerts`
- `thingstodo`
- `places`
- `articles`
- `visitorcenters`
- `campgrounds`
- `parkinglots`
- `roadevents`
- `webcams`
- `feespasses`
- `mapdata/parkboundaries/{sitecode}`

Most useful TrailPack fields:

- Official park alerts and closures
- Park metadata and coordinates
- Official descriptions
- Trail/activity duration when available
- Accessibility and terrain notes when available
- Parking lots, visitor centers, and official park facilities

Important finding:

The `thingstodo` endpoint sometimes includes useful trail information. For example, some records include duration, location, coordinates, accessibility notes, surface, grade, width, ascent, and trail cautions.

Examples found:

- Zion: `West Rim to Scout Lookout` included duration, coordinates, and detailed accessibility/grade information.
- Zion: `Angels Landing` included trail caution details such as chains, drop-offs, narrow sections, and rocky terrain.
- Yellowstone: `Fairy Falls Trail` appeared as a trail/activity record with duration.
- Bryce Canyon: `Queen's/Navajo Combination Loop`, `Queen's Garden Trail`, and `Navajo Loop Trail` included useful duration and accessibility/terrain information.

Prototype use:

- Use NPS data as official enrichment.
- Use NPS alerts for closures, cautions, permits, and safety notices.
- Use NPS accessibility notes as source-backed terrain context when available.
- Do not depend on NPS as the only source for distance/elevation/difficulty.

### Open-Meteo

Status: **usable**

Open-Meteo reliably returned weather data when given coordinates.

Useful fields:

- Current temperature
- Precipitation
- Wind speed
- Daily high/low temperature
- Precipitation probability
- Timezone

Prototype use:

- Use Open-Meteo for weather-based packing rules.
- Combine weather with trail distance, elevation, difficulty, and exposure/terrain notes.

### USGS Trails

Status: **usable as a public-domain reference, but incomplete for route cards**

USGS Trails provides public-domain trail geometry and segment information.

Useful fields found:

- `name`
- `namealternate`
- `trailtype`
- `hikerpedestrian`
- `sourceoriginator`
- `primarytrailmaintainer`
- `lengthmiles`
- `networklength`
- `Shape__Length`

Important finding:

USGS can help with trail geometry and segment length, but it does not directly provide elevation gain, duration, difficulty, or exact user-facing route cards.

Examples checked:

- `Delicate Arch Trail` returned multiple segments that summed to about 1.63 miles.
- `Navajo Loop Trail` returned segments that summed to about 1.13 miles.
- `Queens Garden Trail` returned a segment of about 1.57 miles.
- `Angels Landing Trail` returned only the final Angels Landing segment, not the full route from the canyon floor.
- `Fairy Falls Trail` returned many segments, but the total did not clearly represent the exact common day-hike route.

Prototype use:

- Use USGS as a backup/reference for public-domain trail geometry and length checks.
- Do not use USGS as the primary route-card source.
- Elevation gain would require additional processing with elevation data, which is outside the current MVP.

### Nominatim / OpenStreetMap / Overpass

Status: **supplemental only**

These sources can help with coordinates, basic OSM tags, and nearby path data, but they are inconsistent for named hike routes.

Prototype use:

- Use only for optional lookup support or sanity checks.
- Do not use as the main source for TrailPack profiles.

### RIDB / Recreation.gov

Status: **deferred**

An unauthenticated RIDB request returned `401 Unauthorized Access`. RIDB may be useful later with an API key, but it is not needed for the current MVP.

### AllTrails

Status: **not used as a data source**

AllTrails has the kind of trail cards users recognize, but it is not a clean integration source for this project. TrailPack should not scrape or copy AllTrails data.

Prototype use:

- Use only as market comparison.
- Do not use AllTrails data in the app database.

## What TrailPack Still Needs

Trailforks solves many of the earlier data gaps, but the app still needs a normalization layer.

TrailPack still needs to define:

- Which regions are supported first
- Which exported Trailforks columns map into the app's hike profile model
- How difficulty codes map to user-facing labels
- How status and condition values affect packing recommendations
- How elevation fields affect water, food, effort, and traction recommendations
- How NPS alerts override or supplement Trailforks condition data
- How stale or missing Trailforks condition data should be labeled
- How to handle unsupported trails

## Current MVP Data Model

TrailPack should build a normalized profile from Trailforks, then enrich it with NPS and weather data.

```ts
type SupportedHikeProfile = {
  id: string;
  name: string;
  region: string;
  activityType: string;
  distance: string;
  estimatedTime: string | null;
  difficulty: string | null;
  trailType: string | null;
  usage: string | null;
  direction: string | null;
  season: string | null;
  status: string | null;
  condition: string | null;
  wetWeather: string | null;
  elevationChange: number | null;
  elevationMax: number | null;
  elevationClimb: number | null;
  elevationDescent: number | null;
  grade: number | null;
  gradeMax: number | null;
  gradeMin: number | null;
  climbDistance: number | null;
  descentDistance: number | null;
  flatDistance: number | null;
  landManager: string | null;
  source: "trailforks-download" | "trailforks-api";
};
```

## Recommended Prototype Flow

1. Download Trailforks data for one supported region.
2. Import the CSV/spreadsheet into TrailPack as seed data.
3. Normalize the important fields into `SupportedHikeProfile`.
4. Let the user select a supported trail.
5. Add Open-Meteo weather using trail or region coordinates.
6. Add NPS alerts/context if the trail is inside or near an NPS park.
7. Generate the packing list from trail facts, weather, alerts, and condition/status fields.
8. Clearly label data sources in the output.

## Fallback Behavior

Manual entry should not be the main user path.

Use manual entry only when:

- The trail is not in the supported Trailforks import.
- A key field is missing from the imported row.
- The user wants to add personal context, such as known mud, ice, snow, exposure, water availability, or expected pace.

High-priority fallback prompts:

- How long is the hike?
- About how much elevation gain is there?
- What type of route is it?
- When do you plan to hike?
- How long do you expect to be out?
- Do you know of any current trail conditions?

## Source Labels

TrailPack should label data clearly:

- `Trailforks download`: imported from downloaded Trailforks trail data
- `Trailforks API`: imported from Trailforks API if access is approved
- `Official`: from NPS or another official source
- `Forecast-based`: from Open-Meteo
- `User-provided`: entered or confirmed by the user
- `Inferred`: calculated by TrailPack from available data
- `Missing`: needed field was not provided
- `Unavailable`: TrailPack checked but did not get usable data
- `Future work`: useful signal outside the current prototype scope

## Final Week 6 Status

The project is no longer blocked on having no trail dataset.

Current status:

- Trailforks direct download/export appears to provide the best available trail-data foundation.
- Trailforks API access has been requested by email and is pending.
- NPS API access works and provides official enrichment data.
- Open-Meteo works for weather.
- USGS is useful as a public-domain trail geometry and length reference.
- AllTrails should not be used as a data source.

Final MVP decision:

TrailPack should use a Trailforks-based supported trail catalog, enriched with NPS and weather data. Unsupported trails can still use manual input, but manual input should not be the main user experience.
