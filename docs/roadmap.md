# TrailPack product roadmap

Status: Priorities 1 and 2 are complete and deployed. The trail-selection
redesign, interactive map, and custom route builder remain shelved. The owner
resumed the code-quality audit on September 12, limited to necessary changes.
See the [project handoff](project-handoff.md).
Original-scope follow-ups for B-01 and B-02 were queued by the owner on
2026-09-10. See the [follow-up docket](#follow-up-docket).

## Available now

- A complete guest day-hike planner and rule-based packing list.
- Current or clearly unavailable weather and NPS notice context.
- Optional signed-in AI explanation review and private saved plans.
- Thirty-nine Grand Teton discovery entries and 52 route profiles.
- Explicit loop, out-and-back, point-to-point, shuttle, and mixed-access route
  meanings.
- A maintained trail-onboarding workflow and source-evidence model.

## Priorities

| Priority | Work | Status |
|---|---|---|
| 1 | Complete-hike access routes | Complete and deployed through PRs #55 and #56 |
| 2 | Repository and documentation cleanup | Complete and deployed through PR #57 |
| 3 | Trail discovery and route composition | Shelved; resume explicitly |

## Follow-up docket

Added at the owner's request on 2026-09-10. The
[acceptance audit and development plan](superpowers/plans/2026-09-10-499b-acceptance-audit-and-development-plan.md)
separates current acceptance gaps from original stretch extensions. Required
implementation resumed September 11 on `codex/required-completion`. The
[local verification record](validation/2026-09-11-required-completion.md)
distinguishes candidate implementation from pending hosted acceptance.
Historical records remain unchanged; other shelved work stays shelved.

| Reference | Follow-up | Current behavior and remaining scope | Status |
|---|---|---|---|
| B-01 / original SH-01 | Live public trail lookup beyond the supported catalog | Bounded NPS lookup and duration-driven partial packing pass September 12 live preview checks. Shared quota migration applied; owner review/production publication remain. | Preview verified; not released to production |
| B-02 current acceptance | Guarded explanation validation and supporting NPS maintenance | Candidate removes provider-authored prose/free-text forwarding, shows safe rejection reasons and repairs the two maintenance boundaries. Live Gemini acceptance remains pending. | Local repairs verified; not released |
| Final code audit | Necessary repairs and regression checks | Review state, provider failures, data labels, authentication, quotas, performance and tests. Preserve working architecture and trail facts. | In progress; [audit record](validation/2026-09-12-final-audit.md) |

The 499B specification is the current completion authority. Original SH-04
packing-list variants and SH-06 guest export are historical ideas, not the
current backlog. The owner has not selected alternative packing-list modes.

Source scope: `Requirements Docs/Final/w12 Requirements Spec v6.docx`, SH-01
and SH-04, retained with the owner's project documents outside this repository.
The [499B specification](archive/project/specs/2026-07-16-cse-499b-requirements.md)
and [delivery record](archive/validation/2026-08-28-cse-499b-closeout.md)
describe the later scope and its completion.

## Priority 1: Complete-hike access routes

TrailPack groups alternate approaches under a familiar destination while each
choice remains a complete, independently sourced itinerary. The selected route
controls distance, route type, weather reference, return plan, packing guidance,
saved-result identity, and transportation reminders.

The released catalog includes:

- South Jenny Lake walking and round-trip boat choices for Hidden Falls,
  Inspiration Point, Cascade Canyon, Lake Solitude, and Hurricane Pass.
- Two calculated mixed Inspiration Point directions: boat out/walk back and
  walk out/boat back.
- Separate Grand View Point, Moose Ponds, Granite Canyon, Marion Lake, and Open
  Canyon approaches where NPS publishes complete route facts.
- An evidence-hold register for routes that do not yet meet the admission rule.

The final release passed 775 unit tests, 52 catalog and photo checks, 50 live NPS
comparisons, 5,000 fixed-seed stress cases, the production build, and 128 Firefox
accessibility and interaction flows. See the [route audit](data/grand-teton-day-hike-audit-2026-09-09.md)
and [access-route decision](adr/0002-complete-access-route-identity.md).

## Priority 2: Repository and documentation cleanup

### Goal

A new reader can understand TrailPack, use the app, set it up, contribute, and
find technical evidence without reading historical project records first.

### Work

- [x] Audit tracked files, local clutter, references, and required evidence.
- [x] Shorten the README into a current product entry point.
- [x] Add separate user, setup, contribution, testing, architecture, and
  trail-maintenance reading paths.
- [x] Make the changelog a concise user-facing release history.
- [x] Separate current guides and evidence from dated research, plans,
  validation records, and interface concepts.
- [x] Preserve source fixtures, geometry, photo attribution, security records,
  and generated evidence.
- [x] Update moved paths in documents, scripts, tests, and agent instructions.
- [x] Pass the complete local validation gate.
- [x] Pass the hosted pull-request validation gates.
- [x] Merge the cleanup pull request and verify production.

## Priority 3: Trail discovery and route composition

This phase is shelved during the separate local-AI migration. When resumed,
its three connected stages should be designed together before implementation.

### Stage 1: Simplify trail selection

The current park view exposes a growing list of trails and route choices. Reduce
visual clutter while preserving quick search and the full accessible list.

Requirements:

- Group or filter trails by useful attributes such as area, effort, distance,
  route form, and current access limitations.
- Keep destinations distinct from their selectable approaches.
- Use progressive disclosure so a hiker sees enough information to choose
  without opening every route profile.
- Preserve keyboard, screen-reader, small-screen, and no-map workflows.
- Test with the current 39-entry catalog and room for additional parks.

### Stage 2: Add an interactive supported-trail map

The map should help hikers discover supported areas and select a route. It must
use the same catalog identities and source evidence as the list.

Requirements:

- Show parks, trailheads, destinations, supported corridors, and access limits
  without implying live navigation.
- Keep the list as a complete alternative to the map.
- Load map code only when it is useful so the landing experience remains fast.
- Distinguish approximate or comparison geometry from an official navigation
  track.
- Evaluate library, tile, attribution, privacy, accessibility, and hosting costs
  before choosing the implementation.

### Stage 3: Explore custom route composition

After the discovery model is stable, consider an opt-in builder that joins
reviewed route segments into a user-created itinerary.

Requirements:

- Begin and end at explicit access points, including approaches beyond a named
  trail segment.
- Make loop, out-and-back, point-to-point, turnaround, and return assumptions
  visible.
- Calculate walking distance from reviewed geometry and keep boat, tram, or
  vehicle travel separate.
- Label user-composed distance, gain, duration, difficulty, and access
  assumptions separately from official NPS facts.
- Keep unknown elevation or disconnected geometry unknown rather than filling
  gaps with zero or unrelated routes.
- Reuse the resulting complete itinerary consistently in weather, packing,
  saved plans, and source explanations.
- Prevent the number of possible combinations from cluttering ordinary search
  and park browsing.

## Out of scope for Priority 2

Priority 2 changes documentation and repository organization only. It does not
redesign the trail-selection interface, add a map, compose new routes, modify
trail facts, or change packing behavior.

## Historical detail

The full implementation-oriented roadmap used for Priority 1 is preserved in
the [dated roadmap snapshot](archive/project/2026-09-09-improvement-roadmap-snapshot.md).
