# TrailPack

Week 7 milestone: a one-page trail selection shell with a supported Jenny Lake Loop profile and rule-based packing recommendations.

## Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

## Run locally

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
4. Optionally fill in trip details.
5. Scroll to the generated packing list.
