# Changelog

This file records user-facing TrailPack releases. Detailed implementation and
verification records remain available in the [documentation archive](docs/archive/README.md).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and TrailPack uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

No changes yet.

## [0.7.1] - 2026-09-09

### Security

- Update Sharp to 0.35.4, js-yaml to 4.3.2, and Vitest and its mocker to
  4.1.11 to resolve four dependency alerts.

### Maintenance

- Refresh registered NPS source check dates after guarded live verification.
- Update CI artifact uploads to the Node.js 24 action generation already used
  by the monthly source workflow.
- Record the migration handoff, shelve future feature and rewrite work, and
  reconcile superseded pull requests and completed branches.

## [0.7.0] - 2026-09-09

### Documentation

- Reorganized the documentation around clear reading paths for hikers,
  contributors, trail-data maintainers, and technical reviewers.
- Shortened the repository front page and moved setup, testing, architecture,
  and usage detail into focused guides.
- Archived dated research, project plans, validation records, and interface
  concepts without removing their evidence.
- Moved the generated hiker-scenario report to a stable evidence path and
  updated automation to verify it there.

### Added

- Expanded Grand Teton coverage to 39 discovery entries and 52 complete route
  profiles, including reviewed Preserve, Colter Bay, Leigh Lake, Taggart Lake,
  Jenny Lake, and southern-canyon options.
- Added separate walking, round-trip boat, and mixed walk/boat choices for
  Inspiration Point. Hidden Falls, Cascade Canyon, Lake Solitude, and Hurricane
  Pass also offer distinct walking and shuttle approaches.
- Added a supported-park browser, device-local popular trails, route-specific
  photographs, and a repeatable trail-onboarding workflow.
- Added a dated day-hike audit and evidence-hold register. Routes without the
  required complete evidence, including Delta Lake, remain clearly excluded.

### Changed

- Packing guidance now uses the selected complete itinerary. Out-and-back and
  loop totals include their returns; point-to-point routes keep their one-way
  distance and identify the needed transportation or return plan.
- Mixed routes display calculated walking distance separately from NPS facts.
  Boat mileage is excluded and unknown elevation gain remains unverified.
- Trail facts retain NPS authority, reviewed USGS comparison evidence, and
  comparison-only AllTrails recognition.
- Improved startup performance, photograph transitions, alert severity,
  weather-fallback language, and trail-specific safety explanations.

### Fixed

- Corrected route-specific NPS parsing, Inspiration Point map evidence, guarded
  refresh behavior, slow-provider handling, and several accessibility and
  concurrent-request edge cases.
- Kept closed Death Canyon access visible instead of silently substituting a
  different start and old route measurements.

### Verification

- Pull requests [#44](https://github.com/jaredsrice/TrailPack/pull/44),
  [#47](https://github.com/jaredsrice/TrailPack/pull/47),
  [#48](https://github.com/jaredsrice/TrailPack/pull/48),
  [#49](https://github.com/jaredsrice/TrailPack/pull/49),
  [#50](https://github.com/jaredsrice/TrailPack/pull/50),
  [#51](https://github.com/jaredsrice/TrailPack/pull/51),
  [#52](https://github.com/jaredsrice/TrailPack/pull/52),
  [#53](https://github.com/jaredsrice/TrailPack/pull/53),
  [#55](https://github.com/jaredsrice/TrailPack/pull/55), and
  [#56](https://github.com/jaredsrice/TrailPack/pull/56) were merged and deployed.
- The final route release passed 775 unit tests, 52 catalog and photo checks,
  50 live NPS comparisons, 5,000 fixed-seed stress cases, the production build,
  and 128 Firefox accessibility and interaction flows.

## [0.6.1] - 2026-08-29

### Fixed

- Connected current NPS notices to deliberate packing-list generation and kept
  unavailable live services visibly separate from saved examples.
- Made guarded AI usage follow explicit list generation, with idempotent retries
  and a five-list hourly account allowance.

See [pull request #43](https://github.com/jaredsrice/TrailPack/pull/43).

## [0.6.0] - 2026-08-29

### Added

- Released the guarded Gemini explanation review for signed-in users with a
  server-controlled allowance and deterministic fallback.

### Fixed

- Corrected OAuth preview callbacks and the production quota function while
  preserving the rule-generated packing list as the authority.

See [pull request #41](https://github.com/jaredsrice/TrailPack/pull/41).

## [0.5.0] - 2026-08-28

### Added

- Added Google sign-in, private saved plans, owner-only deletion, protected
  automation, security headers, and controllable park photography.

### Security

- Completed dependency, static-analysis, row-level-security, secret-scanning,
  and passive web-security reviews, followed by production retesting.

See commit [`30f183c`](https://github.com/jaredsrice/TrailPack/commit/30f183cd32d5841c0cca4ace606c4498e1775ac5).

## [0.4.0] - 2026-07-29

### Added

- Added date-aware weather, daylight context, guarded AI boundaries, refreshed
  NPS photography, monthly source checks, and browser accessibility coverage.

See commit [`33fa471`](https://github.com/jaredsrice/TrailPack/commit/33fa471350608b4468714083a74f26334037cca6).

## [0.3.0] - 2026-07-20

### Added

- Added Colter Bay and Two Ocean Lake profiles and adopted the NPS plus USGS
  trail-admission workflow after comparing public data sources.

See commit [`d4cbbd7`](https://github.com/jaredsrice/TrailPack/commit/d4cbbd7f5dd33fa7c1c561ee86deac2fac239ac4).

## [0.2.0] - 2026-07-16

### Added

- Added the core supported-trail workflow, manual fallback, weather and notice
  context, daylight-aware packing, explainable recommendations, and repeatable
  stress scenarios.

See commit [`c77158b`](https://github.com/jaredsrice/TrailPack/commit/c77158b580351024e43edba9388a4523f5c587f6).

## [0.1.0] - 2026-06-14

### Added

- Created the initial Next.js prototype with a supported Jenny Lake profile,
  NPS and USGS source separation, manual fallback, and a rule-based packing list.

The complete pre-cleanup release narrative is preserved in the
[detailed changelog snapshot](docs/archive/releases/2026-09-09-detailed-changelog-snapshot.md).
