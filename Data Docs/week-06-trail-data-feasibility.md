# TrailPack Week 6 Trail Data Feasibility and Fallback Decision

Date: 2026-05-28  
Updated: 2026-05-30  
Course phase: CSE 499A Week 6  
Milestone: Trail-data feasibility notes and fallback decision completed for representative trails, including returned fields, missing fields, unreliable fields, and fallback needs.

## Decision

TrailPack should use a supported trail catalog instead of asking users to manually enter base trail data for normal use.

Current MVP data plan:

1. Use **Trailforks exports** as the main trail-data source.
2. Prefer **CSV/spreadsheet** export if available.
3. If CSV is unavailable, use **KML + OSM + GPX together**.
4. Use **NPS API** for official alerts, park context, and accessibility/terrain notes.
5. Use **Open-Meteo** for weather.
6. Keep manual entry only as a fallback for unsupported trails or missing user-specific context.

Trailforks API access has been requested by email. Until API access is approved, the working path is downloaded Trailforks export data.

## Why This Works

The original concern was that public sources did not provide an AllTrails-style trail profile. NPS, OpenStreetMap, and weather APIs were useful, but they did not reliably provide distance, elevation, difficulty, route type, condition, and time in one usable profile.

Trailforks changes the feasibility picture. Its export data includes the core trail fields TrailPack needs for supported trails. This removes the need for the user to copy trail stats from another app.

## Trailforks Data

The most useful Trailforks fields for TrailPack are:

- `trailid`
- `title`
- `region_title`
- `rid`
- `difficulty`
- `difficulty_system`
- `status`
- `condition`
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
- `closed`

These fields support the main TrailPack recommendation logic:

- distance and time for total effort
- elevation gain/loss and grade for difficulty and exertion
- difficulty and physical rating for baseline effort level
- status, condition, wet-weather sensitivity, and closure data for caution labels
- trail type, direction, and surface for context

Trailforks data should still be labeled as Trailforks-sourced and should not be treated as an official safety source. NPS alerts should override or supplement Trailforks data when official warnings are available.

## Export Fallback

CSV/spreadsheet export is the cleanest format because it provides one row per trail with the selected columns.

If CSV is unavailable, use:

1. **KML** for trail ID, URL, closed flag, difficulty, direction, activity type, trail type, physical rating, distance, climb, descent, average time, and geometry.
2. **OSM** for backup Trailforks ID, region ID, surface, path type, difficulty code, and source URL.
3. **GPX** for backup geometry and elevation points.

Use this priority when merging values:

```text
CSV/API > KML ExtendedData > OSM tags > GPX/elevation-derived values > missing
```

## Jenny Lake Test

A test was run with Trailforks exports for `Jenny Lake (East)`:

- `jenny-lake-east.kml`
- `jenny-lake-east.osm`
- `jenny-lake-east.gpx`

The goal was to check whether non-CSV exports could reproduce the spreadsheet profile.

### Recovered Profile

The KML + OSM + GPX files recovered:

- Trail ID: `182005`
- Title: `Jenny Lake (East)`
- Trailforks URL: `https://www.trailforks.com/trails/jenny-lake-east/`
- Region ID: `44312`
- Activity type: `Hike`
- Difficulty: `Green`
- Direction: `Both Directions`
- Trail type: `Singletrack`
- Physical rating: `Moderate`
- Closed flag: `0`
- Surface: `dirt`
- Distance: `5068 m`, about `5.1 km` or `3.15 mi`
- Average time: `5033 seconds`, about `1 hr 24 min`
- Elevation change: `21.6 m`
- Max elevation: `2097.5 m`
- Climb: `117 m`
- Descent: `-95 m`

Fields not recovered from the non-CSV files:

- `condition`
- `region_title`
- `usage`
- `season`
- `wet_weather`

These are useful, but they are not required for the core profile.

### Spreadsheet Comparison

The spreadsheet row showed:

```text
trailid: 182005
title: Jenny Lake (East)
region_title: Central Lakes
difficulty_system: 0
usage: 0
direction: 3
wet_weather: 0
distance: 5.1 km
time: 5033
alt_change: 21.6
alt_max: 2097.5
alt_climb: 117 m
alt_descent: -95 m
grade: 0.426
grade_max / steep downhill: -23.24
grade_min / steep uphill: 15.837
dst_climb: 2433.28
dst_descent: 2290.89
dst_flat: 343.821
```

Comparison result:

- `distance`: matched. `5068 m` equals `5.068 km`, which rounds to `5.1 km`.
- `time`: exact.
- `alt_change`: exact.
- `alt_max`: exact.
- `alt_climb`: exact.
- `alt_descent`: exact.
- `grade`: exact from `alt_change / distance`.
- steepest uphill/downhill grades: matched from elevation points.

The only values that did not reproduce exactly were `dst_climb`, `dst_descent`, and `dst_flat`. A raw grade-threshold calculation came close:

```text
Spreadsheet:
dst_climb:   2433.28 m
dst_descent: 2290.89 m
dst_flat:     343.821 m

Best fallback calculation:
dst_climb:   2448.23 m
dst_descent: 2276.04 m
dst_flat:     343.74 m
```

The fallback is accurate enough for the MVP. If CSV/API data is available, use its exact `dst_climb`, `dst_descent`, and `dst_flat` values.

## NPS API

The NPS API key works and the main endpoints are accessible.

Useful endpoints:

- `parks`
- `alerts`
- `thingstodo`
- `places`
- `visitorcenters`
- `campgrounds`
- `parkinglots`
- `roadevents`

Useful TrailPack data:

- official alerts and closures
- park metadata
- official descriptions
- accessibility and terrain notes
- trail/activity duration when available
- parking and visitor facility context

Important finding: `thingstodo` sometimes includes useful trail information. For example, NPS returned useful records for Zion, Yellowstone, and Bryce Canyon trails, including duration, coordinates, terrain/accessibility notes, grade, surface, ascent, and cautions.

NPS should be used as official enrichment, not as the base trail database.

## Open-Meteo

Open-Meteo works when given trail coordinates.

Useful fields:

- current temperature
- precipitation
- wind speed
- daily high/low
- precipitation probability
- timezone

Open-Meteo should power weather-based packing rules.

## Recommendation Boundaries

TrailPack should separate effort recommendations from traction or hazard claims.

Good effort signals:

- `distance`
- `time`
- `difficulty`
- `physical_rating`
- `alt_climb`
- `alt_descent`
- `grade`
- `grade_max`
- `grade_min`
- `surface`

These can support recommendations such as:

- bring more water for longer or steeper hikes
- bring snacks for longer effort
- wear supportive hiking shoes for moderate climbs or steeper grades
- use caution on steep descents

Do not claim a trail is muddy, icy, slippery, technical, or requires special traction from elevation/grade alone.

Traction-specific recommendations should require at least one stronger signal:

- Trailforks `condition` says wet, muddy, snow, icy, or poor
- `wet_weather` says the trail is sensitive to wet conditions
- NPS alert mentions snow, ice, washout, flooding, closure, or hazard
- weather indicates precipitation and the trail surface supports a cautious wet-trail note
- user notes mention mud, ice, snow, creek crossings, or poor footing

Scrambling and water crossings are not reliable automatic fields from the current data. They should only appear when explicitly supported by NPS text, Trailforks condition/report data, or user-provided notes.

## Data Still Missing

Compared with a full AllTrails-style route card, the remaining weak areas are:

- real-time or recent user trail conditions
- reliable water crossings
- scrambling or technical terrain
- shade/exposure
- water availability
- cell coverage

These should be treated as optional, user-provided, official-alert-based, or future work.

## MVP Profile

TrailPack should normalize supported trails into this shape:

```ts
type SupportedHikeProfile = {
  id: string;
  name: string;
  region: string | null;
  sourceUrl: string | null;
  activityType: string | null;
  distanceMeters: number | null;
  distanceMiles: number | null;
  estimatedTimeSeconds: number | null;
  difficulty: string | null;
  physicalRating: string | null;
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
  surface: string | null;
  closed: boolean | null;
  source: "trailforks-csv" | "trailforks-kml" | "trailforks-api";
  backupSources: Array<"trailforks-osm" | "trailforks-gpx" | "nps">;
};
```

## Prototype Flow

1. Download Trailforks data for one supported region.
2. Prefer CSV/spreadsheet import if available.
3. If CSV is unavailable, import KML + OSM + GPX together.
4. Normalize the important fields into `SupportedHikeProfile`.
5. Let the user select a supported trail.
6. Add Open-Meteo weather using trail coordinates.
7. Add NPS alerts/context if the trail is inside or near an NPS park.
8. Generate the packing list from trail facts, weather, alerts, and condition/status fields.
9. Label data sources in the output.

## Final Status

TrailPack is no longer blocked on trail data.

The final Week 6 decision is:

```text
Use Trailforks exports as the supported-trail catalog.
Use KML + OSM + GPX as the fallback when CSV/API is unavailable.
Use NPS and Open-Meteo as enrichment sources.
Keep manual entry as a fallback only.
```
