# TrailPack product roadmap

Status: Priority 1 is complete and deployed. Priority 2 is the current repository
and documentation cleanup. The trail-selection redesign, interactive map, and
custom route builder remain future work.

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
| 2 | Repository and documentation cleanup | In progress |
| 3 | Trail discovery and route composition | Planned |

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
- [ ] Pass the hosted pull-request validation gates.
- [ ] Merge the cleanup pull request and verify production.

## Priority 3: Trail discovery and route composition

This is the next product-design phase after Priority 2. It has three connected
stages and should be designed together before implementation.

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
