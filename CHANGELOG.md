# Changelog

All notable TrailPack changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

TrailPack is still a `0.x` prototype. A minor version marks a completed,
demo-ready product milestone; a patch version is reserved for backward-compatible
corrections within that milestone.

## [Unreleased]

No user-facing changes have been released since `0.4.0`.

## [0.4.0] - 2026-07-29

Completed the CSE 499B B-02 guarded-AI milestone and deployed it to production
as commit
[`33fa471`](https://github.com/jaredsrice/TrailPack/commit/33fa471350608b4468714083a74f26334037cca6).

### Added

- A server-only Gemini review boundary with structured output, a bounded
  timeout, explicit provider outcomes, and deterministic fallback text.
- Date-aware Open-Meteo forecasts with four-highlight and full 24-hour views,
  apparent temperature, precipitation, conditions, wind, and a planned-start
  timeline.
- Sunrise, sunset, first-light, and last-light markers from
  Sunrise-Sunset.org.
- A national-park field-guide interface with locally served, officially sourced
  NPS photography, park/trail image locking, credits, and source links.
- A guarded monthly NPS source refresh for all five supported trails. Safe,
  confirmed changes can update one managed snapshot; ambiguous or unsafe
  results leave saved data untouched and fail visibly.
- Official NPS accessibility and terrain text for Jenny Lake, Taggart Lake, and
  String Lake when their tracked pages publish matching guidance.
- Firefox/Playwright/axe coverage for the chooser, Grand Teton park view,
  return-to-search focus, trail selection, and a populated Jenny Lake plan.

### Changed

- Supported trails now request live weather automatically and refresh when the
  planned date changes.
- All five trails now use the user-facing `Verified NPS + USGS profile` label;
  internal profile kinds remain only for milestone traceability.
- Packing, weather, alert, trail, trip-detail, and guarded-AI surfaces now use a
  quieter responsive field-guide design with stronger safety hierarchy.
- The Gemini integration now uses the Interactions API and the documented
  `gemini-3.5-flash` default.
- Safe dependency updates moved the resolved stack to Next.js `15.5.22`,
  Tailwind CSS `4.3.3`, its PostCSS path to `8.5.23`, and compatible patched
  transitive packages. Unsupported forced downgrades were rejected.
- Vitest now uses Vite 8's native `resolve.tsconfigPaths` support; the redundant
  `vite-tsconfig-paths` plugin was removed.

### Fixed

- Prevented saved AI fixture text from being reused after live weather changes
  the current rule-based packing set.
- Corrected low-contrast text treatments and duplicate landmark naming found by
  the first automated accessibility pass.
- Assigned loading priority to the currently visible park image rather than an
  inactive rotation layer.
- Prevented unsupported or unknown trail identifiers from being treated as
  valid saved scenarios.

### Security

- AI requests exclude unrestricted notes, identity data, OAuth data, and
  provider credentials; Gemini storage is disabled with `store: false`.
- Runtime schema, source-label, packing-set, cross-trail, missing-detail, and
  safety validation runs before AI text can be displayed.
- NPS refresh writes require two identical reads, HTTPS `nps.gov` identity
  checks, bounded values, a complete five-trail snapshot, and the full
  verification suite.

### Verification

- Lint, type checking, 205 Vitest tests, three Firefox/axe flows, the production
  build, and 27 recommendation stress scenarios passed.
- The initial live NPS refresh confirmed all five supported pages; a repeat run
  made no unnecessary write.
- Production homepage, weather, and both NPS alert routes returned HTTP `200`
  after deployment.

## [0.3.0] - 2026-07-20

Completed the CSE 499B B-01 public-trail import milestone and deployed it as
commit
[`d4cbbd7`](https://github.com/jaredsrice/TrailPack/commit/d4cbbd7f5dd33fa7c1c561ee86deac2fac239ac4).

### Added

- Colter Bay Lakeshore Trail and Two Ocean Lake Loop as verified Grand Teton
  profiles.
- Detailed provenance records containing official NPS source URLs, USGS feature
  identifiers, retrieval dates, confidence, missing fields, and reconciliation
  notes.
- Search, park-view, packing, saved-fixture, and weather support for the two
  imported trails.
- A 24-trail reliability study comparing authoritative sources, USGS evidence,
  and Nominatim identity results.
- Comparison-only AllTrails checks for the two new profiles without importing
  AllTrails values into TrailPack.

### Changed

- Adopted a Tetons-first manual NPS review plus USGS geometry-reconciliation
  workflow for new supported profiles.
- Rejected Nominatim as a production TrailPack source after unreliable identity
  and ranking results; its experimental runtime adapter and route were removed.
- Kept the newer NPS 400-foot Two Ocean Lake gain while visibly recording the
  conflicting older NPS 700-foot value and comparison-only AllTrails result.

### Verification

- Provider normalization, source IDs, search selection, catalog coverage,
  packing generation, fallback behavior, and production API paths passed.
- The production homepage and required Next.js assets were publicly reachable
  after merge.

## [0.2.0] - 2026-07-16

Closed the six-requirement CSE 499A baseline and established the CSE 499B
requirements and schedule at commit
[`c77158b`](https://github.com/jaredsrice/TrailPack/commit/c77158b580351024e43edba9388a4523f5c587f6).

### Added

- Taggart Lake and String Lake Loop alongside the original Jenny Lake Loop
  profile.
- Server-side Open-Meteo weather and NPS alert routes with deterministic saved
  fixtures and labeled unavailable states.
- Civil-twilight context and start-time-aware headlamp guidance.
- A fixture-first guarded AI review with validation and template fallback.
- Manual distance, gain, route-type, duration, and condition inputs for
  unsupported hikes.
- Critical-safety grouping, trip-decision alerts, question-answer packing
  explanations, and source-backed recommendation links.
- A repeatable hiker-scenario stress command covering seasoned, casual, and
  middle-of-the-road users.

### Changed

- Reorganized application code into the `src/features/trailpack/` feature
  module.
- Replaced generic packing cards with grouped accordion recommendations,
  visible priorities, clearer actions, expandable rationale, and
  alert-affected markers.
- Refined duration-aware water, food, reserve, navigation, battery, traction,
  electrolyte, dry-sock, sun, insect, and layer guidance.
- Preserved a complete guest and rule-based workflow when live context or AI is
  unavailable.

### Fixed

- Restored pre-dawn headlamp guidance when start time is provided without an
  expected duration.
- Prevented negated trail conditions and unrelated clauses from adding
  unnecessary gear.
- Strengthened official-source validation and blocked deceptive NPS look-alike
  URLs.
- Corrected duration parsing and scenario state leakage between trails.

### Verification

- The closeout recorded all six CSE 499A requirements as complete with unit,
  scenario, build, and browser evidence.

## [0.1.0] - 2026-06-14

Initial tested TrailPack prototype.

### Added

- A Next.js, React, TypeScript, and Tailwind CSS application.
- Search for the supported Jenny Lake Loop profile with a manual-entry fallback.
- Official NPS facts displayed separately from USGS-computed comparisons.
- A deterministic essential and optional packing list using trail facts, saved
  weather, alerts, expected duration, and reported conditions.
- Trip date, duration, condition, and note inputs.
- Source links, confidence labels, and Vitest coverage for packing and
  provenance behavior.

### Changed

- Established NPS as the authority for official trail statistics and USGS as
  the public comparison/fallback source.
- Kept the NPS 1,040-foot Jenny Lake gain separate from the roughly 698-foot
  USGS method-dependent estimate.
- Limited production trail data to permission-compliant NPS and USGS sources.

### Fixed

- Correctly parsed mixed hour-and-minute durations and conservative duration
  ranges.
- Added deterministic snow, ice, mud, and wet-condition handling with
  clause-scoped negation.
- Required official packing and alert claims to include validated HTTPS NPS
  sources.

### Security

- Added source validation for official NPS links.
- Applied safe dependency updates without forcing incompatible framework
  changes.
