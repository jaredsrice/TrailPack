# Week 8 Supported Trails Design

Date: 2026-06-17
Project: TrailPack
Scope: CSE 499A Week 8 thin vertical slice

## Goal

Complete the remaining Week 8 thin-vertical-slice work by expanding TrailPack
from one supported trail profile to three supported trail profiles without
changing the current user flow.

Week 8 acceptance target:

- TrailPack exposes 2-3 saved or supported hike profiles.
- At least one supported profile routes through normalized data into a visible
  packing-list output.
- The existing missing-detail prompts remain in place for the most important
  user-provided fields.

## Chosen Trail Set

The supported set will be:

- Jenny Lake Loop
- Taggart Lake
- String Lake Loop

This set is intentionally limited to Grand Teton National Park so the current
park-selection flow, source strategy, and demo framing stay simple.

## Why This Set

- It gives a better visible spread of hike effort than using two longer loops.
- It uses trails that were already validated in the Week 7 feasibility notes.
- It preserves confidence-status variety:
  - Taggart Lake: `official_nps_with_usgs_geometry_ok`
  - String Lake Loop: `official_nps_with_moderate_usgs_bridge`
  - Jenny Lake Loop: `official_nps_with_gain_conflict`

## Architecture and Data Changes

No new feature surface will be introduced. The work stays inside the current
data-driven prototype shape.

Changes:

- Add two new `TrailProfile` entries in `src/data/supported-trails.ts`.
- Keep all three trails under the existing `grand-teton` park entry.
- Reuse the existing `TrailProfile`, `SourceConfidence`, and `SourcedValue`
  types without schema changes.
- Reuse the existing rule-based packing engine for all supported trails.

## UI and Behavior

The current UX stays intact:

- Search for a park or trail.
- Pick a supported trail.
- Review the trail summary.
- Optionally add missing details.
- Receive the packing list.

Only targeted Week 8 adjustments are expected:

- Ensure the new trail names are discoverable through the current search logic.
- Ensure the park card shows all three supported trails.
- Replace stale copy that still frames the app as a single-trail Week 7 demo.

No new pages, forms, filters, or live API wiring are part of this change.

## Testing Strategy

Use TDD for the implementation:

- Extend `src/data/supported-trails.test.ts` with failing tests for the new
  supported trail profiles and expected confidence statuses.
- Extend packing tests only where trail-agnostic behavior needs coverage across
  multiple supported profiles.
- Verify search and UI behavior through existing integration seams where
  practical, keeping Week 8 focused on the supported data slice rather than new
  feature work.

## Risks and Boundaries

- Week 8 is not the place to add live weather, live alerts, or scraping.
- Week 8 is not the place to redesign the recommendation engine.
- If some trail-level values are less complete than Jenny Lake, the app should
  still show a clean official profile with clear provenance and existing missing
  detail prompts.

## Success Criteria

This design is complete when:

- The app supports Jenny Lake Loop, Taggart Lake, and String Lake Loop.
- A user can select each trail through the existing flow.
- Each trail produces a visible packing-list output.
- Tests cover the new trail data and stay green.
