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
- Repo-level agent workflow documentation in `AGENTS.md`, `CONTEXT.md`, and
  `docs/agents/`.
- The saved Week 8 implementation plan in
  `docs/superpowers/plans/2026-06-17-week-8-supported-trails.md`.
- A saved Week 8 / Week 9 validation note in
  `docs/superpowers/validation/2026-06-19-week-8-9-validation.md`.
- A saved Week 10 scenario review note in
  `docs/superpowers/validation/2026-06-20-week-10-scenario-review.md`.
- Server-side external-context route handlers for Open-Meteo weather and NPS
  alerts, with saved-fixture and unavailable-state fallbacks.
- Unit coverage for weather normalization, NPS alert normalization, supported
  park-code validation, and external-context fallback behavior.
- A fixture-first guarded AI review path for Jenny Lake Loop that builds
  structured input from TrailPack data, validates saved AI-style text, and falls
  back to template text when validation fails.
- Unit coverage for accepted AI fixture output, rejected packing-item changes,
  rejected source-label changes, unsupported safety claims, unsupported trail
  facts, and template fallback behavior.
- Manual-entry fields for distance, elevation gain, and route type so
  unsupported hikes can produce a more specific fallback list.
- Unit coverage for manual distance/gain sizing, route-type prompts, and
  point-to-point route-planning recommendations.
- A supported-trail context status panel that shows weather context and NPS
  alert state, including saved no-active-alert fixtures.
- Unit coverage for saved weather status, no-active alert status, and active
  official alert summaries.
- Civil-twilight daylight context from Sunrise-Sunset.org on the live weather
  path, plus saved daylight fixtures for supported demo trails.
- A start-time trip detail field that can affect daylight/headlamp guidance.
- Unit coverage for civil-twilight normalization, live daylight attachment,
  visible context status, and start-time-aware headlamp recommendations.
- Question-answer packing item fields and unit coverage requiring every generated
  recommendation to answer a concrete hiker question.
- Bear-spray recommendation links for official NPS guidance and current Bear
  Aware rental-location information.
- Seasonal optional insect-repellent guidance backed by NPS Hike Smart.

### Changed

- Reorganized the app code into a single `src/features/trailpack/` feature
  module and moved planning docs under `docs/data/` and `docs/ui/`.
- Updated the main app flow so each supported trail uses its own saved demo
  scenario instead of sharing one static weather context.
- Refreshed the README to describe the three supported Week 8 demo trails and
  the current verification commands.
- Tightened the agent-maintenance guidance to prefer the latest proposal version
  and keep user-facing docs aligned with merged scope.
- Recorded the current milestone status more explicitly: Week 8 is complete,
  Week 9 is complete for the baseline rule-engine milestone, the supported
  prototype remains limited to three Grand Teton trails, and the AI path is
  still deferred.
- Added a limited manual-entry fallback packing list for unsupported or
  incomplete hikes.
- Polished the Week 10 evaluation scenarios so short-hike, hot/exposed, and
  incomplete-data demo paths are cleaner and more defensible.
- Reset trip-detail state when switching trails or modes so one scenario no
  longer contaminates the next during live demos.
- Extended weather and alert context objects with retrieval status metadata so
  live, saved-fixture, and unavailable states can stay labeled.
- Updated the main output so the packing list remains explicitly rule-based
  while the guarded AI review appears as a separate validated summary panel.
- Expanded manual fallback behavior so user-entered trail facts can affect water,
  food, route-planning prompts, and the fallback confidence note.
- Made weather and NPS alert context visible before the packing list instead of
  relying only on recommendation side effects.
- Replaced obsolete technology-demo framing with a next-project-focus note for
  prototype polish, Requirements Spec work, live data, AI guardrails, and UAT.
- Polished the main app surface with quick-start trail cards, tighter card
  geometry, clearer manual-entry copy, and recommendation item counts.
- Changed headlamp guidance so supported-trail recommendations use start time,
  expected duration, sunset, and civil twilight when available instead of making
  every long summer hike treat a headlamp as automatically essential.
- Reworked packing cards from terse item/reason copy into concrete answers for
  footwear, water per adult or person, food amounts, first-aid examples, bear
  spray access, trekking poles, socks, headlamp timing, and summer layers.
- Refined packing card headings so the UI shows clean recommendation topics
  while the underlying item data keeps the hidden question each answer addresses.
- Split packing card content into `Recommendation` and `Why` sections so users
  can scan the clear action before reading the supporting trip context.
- Merged wet-footwear, tennis-shoe, gaiter, and dry-sock guidance into the single
  `Trail footwear` recommendation instead of showing separate foot-related cards.
- Added a date-gated `Insect repellent` optional card for regional bug season
  rather than making bug spray a permanent essential.
- Updated trip-detail copy so the planned date is described as seasonal
  recommendation context instead of context-only data.
- Sanitized guarded-AI fallback validation copy so stale fixture item names do
  not appear when the current rule-based list changes.
- Removed the Yellowstone insect-season source from Grand Teton-facing bug-spray
  guidance; TrailPack now treats the date window as an inference instead of
  showing another park as the source.
- Passed the richer question, recommendation, why, and answer context through
  the guarded AI input contract and updated the saved Jenny Lake fixture to match
  the new rule-based item set.

### Fixed

- Prevented unsupported or unknown trail ids from being treated like valid saved
  demo scenarios.
- Made the documented TypeScript verification flow reliable even when `.next`
  route types have not been generated yet.
- Removed the misleading planned-date prompt from the missing-details list while
  date remains a context-only field.
- Softened food and first-aid wording where the previous output overstated
  shorter scenarios.

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
