# TrailPack

TrailPack turns trail information and trip conditions into a clear hiking
packing list. It explains why each item is recommended and where the supporting
data came from.

Version `0.1.0` is a CSE 499 technical prototype. It uses fixed rules, not AI, so
the same input always produces the same result.

## How It Works

1. Search for a supported park or trail.
2. Review the official trail statistics and any computed estimates.
3. Add useful details such as expected duration or trail conditions.
4. Receive an essential and optional packing list with reasons and source labels.

The current demo supports Jenny Lake Loop, Taggart Lake, and String Lake Loop
in Grand Teton National Park.

## Supported Demo Trails

- `Jenny Lake Loop` - longer moderate loop with a known NPS versus USGS
  elevation-gain conflict that stays visibly labeled in the UI.
- `Taggart Lake` - short easy out-and-back trail with official NPS values and a
  close USGS geometry match.
- `String Lake Loop` - easy loop with a moderate USGS bridge estimate and a
  breezier saved demo weather scenario.

## Data Sources

- **NPS** is the primary source for official trail distance, elevation gain,
  difficulty, and estimated time.
- **USGS** provides public federal data for trail geometry and computed elevation
  estimates when official values are missing or need comparison.
- **User input** can add conservative recommendations for long trips, snow, ice,
  mud, or wet conditions.

Official NPS values stay visible even when a USGS calculation differs. TrailPack
labels the difference instead of averaging the numbers or hiding the conflict.

The NPS API can provide alerts and park information, but it does not provide all
the trail statistics TrailPack needs. A production version would collect those
values from public NPS trail pages, keep the source URL and attribution, follow
site access rules, and refresh cached results on a slow schedule instead of
requesting the page for every user. USGS data would fill gaps or provide a
clearly labeled computed estimate.

This approach keeps the data traceable:

- Official values link back to their NPS source.
- Computed values identify USGS as the source and remain separate from official values.
- User-reported conditions are labeled as user input.
- General recommendations are labeled as inferred rather than official.

Trailforks is not used as a production data source. It would only be considered
as a backup if suitable API access or written permission becomes available.

## Run Locally

From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), search for `Jenny Lake`,
`Taggart`, or `String Lake`, and select one of the supported trails.

## Verify the Project

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers trail values, packing rules, duration parsing, trail-condition
phrasing, and official-source validation.

## Current Limits

- Jenny Lake Loop, Taggart Lake, and String Lake Loop are the complete supported
  trail profiles in the current prototype.
- Weather and alerts use demo data instead of live APIs.
- Automatic NPS page collection and USGS processing are planned but are not yet
  part of this prototype.
- Planned date and notes are stored as context but do not yet change the list.
- `npm audit` reports a moderate PostCSS issue bundled inside Next.js. The known
  attack requires processing untrusted CSS, which TrailPack does not do. A forced
  audit fix would install an incompatible Next.js version, so the project is
  waiting for a safe upstream update.

## Technology

Next.js, React, TypeScript, Tailwind CSS, and Vitest.

## Project Documents

- [`CHANGELOG.md`](CHANGELOG.md) - version history and known issues
- [`Data Docs/`](Data%20Docs/) - data feasibility and source decisions
- [`UI Docs/`](UI%20Docs/) - workflow, wireframes, and UI planning
