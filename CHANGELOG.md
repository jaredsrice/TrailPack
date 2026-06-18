# Changelog

All meaningful changes to TrailPack are recorded here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Because TrailPack is
still a prototype, the `0.x` version number means features and data structures may
change as the project develops.

## [Unreleased]

### Added

- Taggart Lake and String Lake Loop as additional supported Grand Teton trail
  profiles alongside Jenny Lake Loop.
- Deterministic saved demo weather and alert scenarios for each supported trail.
- Search coverage and packing coverage tests for the expanded supported trail set.
- A standalone `npm run typecheck` script that runs `next typegen` before
  `tsc --noEmit` on a clean checkout.
- Repo-level agent workflow documentation in `AGENTS.md` and `docs/agents/`.
- The saved Week 8 implementation plan in
  `docs/superpowers/plans/2026-06-17-week-8-supported-trails.md`.

### Changed

- Updated the main app flow so each supported trail uses its own saved demo
  scenario instead of sharing one static weather context.
- Refreshed the README to describe the three supported Week 8 demo trails and
  the current verification commands.

### Fixed

- Prevented unsupported or unknown trail ids from being treated like valid saved
  demo scenarios.
- Made the documented TypeScript verification flow reliable even when `.next`
  route types have not been generated yet.

## [0.1.0] - 2026-06-14

Initial technical prototype for selecting a supported trail and generating a
rule-based hiking packing list.

### Added

- A Next.js, React, TypeScript, and Tailwind CSS application at the repository root.
- A one-page search flow for supported parks and trails, with a manual-entry fallback.
- A supported Jenny Lake Loop profile using official National Park Service values.
- USGS-computed distance, elevation, and elevation-gain estimates for comparison.
- Visible source and confidence information for official and computed trail data.
- A rule-based packing list with essential and optional items. The prototype does
  not use AI to interpret trip details.
- Packing rules based on official trail length and gain, demo weather, active
  alerts, expected trip duration, and user-reported trail conditions.
- Trip-detail fields for planned date, expected duration, trail conditions, and notes.
- Official source links on recommendations that claim official NPS support.
- Week 5 UI workflow documentation and Week 6-7 trail-data feasibility findings.
- Vitest unit tests for trail profiles, packing rules, duration parsing, condition
  parsing, and source provenance.

### Changed

- Set NPS trail pages as the primary source for official trail statistics.
- Set USGS trail geometry and elevation data as the legal fallback for computed
  trail values.
- Marked the Jenny Lake USGS elevation-gain estimate as conflicting with the
  official NPS value instead of presenting it as an exact match.
- Displayed the official NPS gain of 1,040 feet separately from the USGS estimate
  of about 698 feet, with a wider method-dependent range noted.
- Made expected duration and reported trail conditions affect the packing list.
- Marked planned date and notes as context-only fields until they influence rules.
- Relabeled general cell-service guidance as inferred rather than official.
- Limited the current data plan to NPS and USGS. Trailforks is not used as a
  production source without appropriate API access or permission.
- Pinned the Next.js workspace root so builds use this repository instead of a
  parent directory containing another lockfile.

### Fixed

- Corrected mixed hour-and-minute input such as `1 hour 30 minutes` so it is read
  as 1.5 hours instead of 30 hours.
- Preserved conservative handling of duration ranges such as `4-6 hours`.
- Added deterministic recognition of snow, ice, mud, and wet trail reports.
- Prevented negated reports such as `no snow`, `not muddy`, `snow-free`, and
  `clear of snow` from adding unnecessary equipment.
- Scoped negation to each clause, so `no snow, icy bridge` still recommends
  traction for the reported ice.
- Required verified official alerts to use HTTPS URLs on `nps.gov` or its
  subdomains. Malformed and deceptive look-alike URLs are rejected.
- Prevented mixed NPS and third-party alert groups from being labeled entirely
  official.
- Required every packing item labeled `official` to include a supporting source URL.

### Security

- Updated safe, compatible development dependencies without forcing breaking
  framework changes.
- Added source validation to prevent third-party or deceptive URLs from being
  presented as official NPS sources.

### Known Issues

- `npm audit` reports two moderate findings for PostCSS
  ([GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93))
  bundled inside Next.js. The documented attack requires processing untrusted CSS,
  which TrailPack does not do. The available forced fix would downgrade Next.js to
  an incompatible version, so the project will wait for a safe upstream update.
- Weather and alerts are demo data in this prototype and are not yet loaded from
  live APIs.
- Jenny Lake Loop is the only fully supported trail profile in version `0.1.0`.
