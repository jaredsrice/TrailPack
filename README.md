# TrailPack

CSE 499 senior project for rule-based hiking packing recommendations.

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

## Run locally

From the repo root:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Week 7 scope

- One-page search-led workflow
- Supported Jenny Lake Loop profile using official NPS values
- TypeScript types for `TrailProfile`, `WeatherContext`, `AlertContext`, `SourceConfidence`, and `PackingRecommendation`
- Rule-based packing list generation (no AI)
- No Trailforks app data source

## Demo path

1. Search for `Jenny Lake` or `Grand Teton`.
2. Select the supported trail.
3. Review the hike profile and Sources & Confidence section.
4. Optionally fill in trip details (expected time out and trail conditions change the list).
5. Scroll to the generated packing list.

## Testing

Unit tests cover the rule-based packing logic and the supported trail profile:

```bash
npm test
```

## Known dependency risk (residual)

`npm audit` reports a moderate-severity advisory in `postcss` (<8.5.10,
[GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)). This
vulnerable copy of PostCSS is **bundled inside Next.js**
(`node_modules/next/node_modules/postcss`), not a direct dependency of this
project. The only `npm audit fix --force` remedy downgrades Next.js to `9.3.3`,
which is a breaking change and is intentionally not applied. The advisory affects
CSS stringify output (XSS in generated CSS), which is not part of this app's
runtime data flow. It will clear when Next.js ships a release that bundles
`postcss >= 8.5.10`. Safe in-range patch updates to other dependencies have been
applied.

## Docs

- [`CHANGELOG.md`](CHANGELOG.md) — version history and known issues
- `Data Docs/` — trail data feasibility and source strategy
- `UI Docs/` — UI/UX workflow and wireframes
