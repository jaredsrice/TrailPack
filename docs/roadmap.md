# TrailPack improvement roadmap

Status: Priority 1 is implemented on the review branch and awaiting merge approval.
Approved planning order: route options first,
repository and documentation cleanup second, interactive discovery map third.
This document is the shared to-do list and starting brief for future work.

## What is available now

The implementation branch contains 39 discovery entries and 52 route
profiles: 50 NPS-backed profiles and two mapped mixed-route estimates. Hidden
Falls, Inspiration Point, Forks of Cascade Canyon, Lake Solitude and Hurricane
Pass group their South Jenny Lake walking return with the NPS round-trip shuttle
variant. Inspiration Point also offers shuttle out/walk back and walk out/shuttle
back. Grand View Point, Moose Ponds, Granite Canyon, Marion Lake, and Open Canyon
group every evidence-complete NPS-published start found by the route audit.
This is not a production release.

Some entries have a **Before you go** note. That section appears only when a
note exists. Complete AllTrails comparisons are saved in the
[route review record](data/grand-teton-bulk-2026-09-05.md), but differences are
not consistently explained in the app. Park discovery currently uses a list.

The catalog changes are in [PR #55](https://github.com/jaredsrice/TrailPack/pull/55).
The access-route and route-audit implementation is
[PR #56](https://github.com/jaredsrice/TrailPack/pull/56), stacked on #55.
Neither this plan nor the local implementation authorizes a merge.
Use the PR's current checks to determine readiness; do not assume an older
passing result applies to a newer commit.

## Priorities and completion gates

| Priority | Work | Complete when |
|---|---|---|
| 1 | Selectable, verified access routes | The selected complete hike controls the facts, context, and packing list; differences are clear without clutter. |
| 2 | Repository and documentation cleanup | A new reader can understand the product and find the right guide; required code and evidence remain intact. |
| 3 | Interactive park and trail map | The map and accessible list lead to the same verified route-selection workflow without slowing or blocking planning. |

Keep these priorities separate in implementation and review. Do not wait for the
map to deliver route choices. Do not turn this roadmap into a requirement to
review each individual trail manually with the owner: use one consolidated
source/test report and Preview per approved batch.

## Priority 1: Complete-hike access options

### Priority 1 implementation checkpoint

- Implemented locally: shared access-route metadata and grouping; five Jenny Lake
  destinations with an explicit choice; complete-distance labels;
  separate weather coordinates, packing/review identities and saved facts;
  route changes clear stale output without generating again.
- Added source evidence for the shuttle approach and corrected the old walking
  profile's map link. The unavailable NPS CARTO line layer and approximately
  49 m dock-to-land-geometry gap are explicit comparison limitations.
- Implemented both mixed directions with separate IDs and boat reminders.
  Hiking mileage is approximately 3.7 mi from retained USGS segments; ascent is
  unverified rather than averaged or set to zero. These are labeled estimates,
  not extra official NPS snapshots. The optional Hidden Falls spur is excluded.
- Four additional NPS-published shuttle variants use their exact access subsection,
  west-dock weather reference, official values, separate NPS map and retained
  USGS corridor comparison. Related AllTrails listings are identified as comparable
  or related without replacing NPS authority.
- The in-app **How was this calculated?** disclosure explains mixed-route facts,
  method, exclusions, limitations and sources. Public comparisons distinguish a
  comparable route from a related route with a different itinerary.
- Added six evidence-complete NPS variants: Grand View Point from Jackson Lake
  Lodge, Moose Ponds Loop, Granite Canyon from Valley Trail and Rendezvous
  Mountain, and Marion Lake and Open Canyon from Rendezvous Mountain. Their
  former holds now point to the resolving profile IDs.
- The [complete day-hike audit](data/grand-teton-day-hike-audit-2026-09-09.md)
  records 26 technically eligible evidence holds, the technical-risk boundary,
  and every assumption marked for owner review. Delta Lake remains a hold because
  NPS does not publish the complete authoritative profile required by TrailPack.
- Still pending: consolidated hosted Preview and owner approval before merge. See
  [the design decision](adr/0002-complete-access-route-identity.md).
- Final local checks: 775 unit tests, 52 catalog/photo checks, 50 live NPS source
  comparisons, 5,000 stress cases, and 128 Firefox/axe flows pass. Lint, type
  checking, and the production build pass. No account or second-user checks were
  required for this data-only expansion.

### Intended experience

A user finds **Inspiration Point**, then sees a compact **Access route** control
under the name. Selecting an option reveals one short description of the full
trip and the applicable measurements. Show **Loop**, **Out-and-back**, or
**One-way (point-to-point)** beside the selected option, with a clearly labelled
total hiking distance. The packing-list summary repeats the option, route type,
and distance so the chosen itinerary remains clear after generation.

Implemented Inspiration Point options (local, awaiting release):

- **South shore walk:** walk from South Jenny Lake to the viewpoint and return
  on foot.
- **Shuttle boat:** take the boat both ways and hike from the west dock to the
  viewpoint and back. Boat distance is not hiking distance; boat logistics are
  separate from walking time.
- **Shuttle out, walk back:** boat to the west dock, hike to the viewpoint,
  then walk south along the lakeshore to Jenny Lake Trailhead.
- **Walk out, shuttle back:** walk the south lakeshore to the viewpoint, then
  descend to the west dock for the return boat. Check the last crossing first.

The north-shore approach remains a later candidate, not an automatic addition.
The mixed options have reviewed land-route geometry, but no verified mixed
ascent or identical standalone AllTrails page is claimed. Their familiar
destination and related shuttle counterpart are documented in the
[route evidence](data/inspiration-point-access-routes.md). Broader catalog work
must keep those limitations visible rather than equating tests with field surveying.

### To do

- [x] **Inventory variants across the supported catalog.** Record each named
  trail/destination, existing itinerary, proposed approach, turnaround, return
  path, transport assumption, official source, and evidence gaps. Distinguish
  access choices from clockwise/counterclockwise travel around a loop.
- [x] **Define the grouping rules.** Use the [shared glossary](../CONTEXT.md): a
  supported trail is the named planning entry, a destination is a place reached,
  and an access route is the complete chosen hike. Not every loop has a single
  destination. Do not group routes merely because their names are similar.
- [x] **Design one reusable route definition.** Give the group and each verified
  option stable identifiers. Store start, destination or turnaround, return,
  route shape, hiking distance, gain, sourced duration/difficulty, weather
  reference, source evidence, and relevant transport/access notes per option.
- [x] **Make route type and distance meaning explicit.** A loop follows a circuit
  back to its start; an out-and-back returns along the same approach; a one-way
  hike finishes at a different endpoint and needs a separate onward/return plan.
  Store the verified route type and whether each source distance is one-way or
  already the complete hike. Do not double a published round-trip distance or
  mistake a one-way distance for an out-and-back total. Leave unclear or mixed
  route descriptions explicit rather than forcing an unsupported classification.
- [x] **Use the complete hike in list creation.** Feed the selected route type,
  total walking distance, appropriate gain, and expected time into packing rules,
  including food, water, effort, and daylight guidance. Show start and finish for
  one-way options and prompt for transport/return arrangements where relevant.
  Boat/car travel is not walking distance, but known travel/wait time can affect
  the trip schedule and daylight; keep those assumptions separate and visible.
  A route-type label alone must not replace the actual itinerary measurements.
- [x] **Preserve the existing source boundary.** Keep official NPS facts separate
  from reviewed route metadata and USGS comparisons. The scheduled source
  refresh must not gain permission to create routes, rewrite geometry, or edit
  unrelated files. Extend the onboarding template and source checker together.
  Review [the existing catalog decision](adr/0001-approved-trail-catalog.md)
  before changing this boundary.
- [x] **Verify each complete itinerary.** Prefer NPS facts, compare the selected
  USGS corridor and start coordinates, and record recognizable AllTrails pages.
  Do not mix walking-route gain with shuttle-route distance, average conflicting
  provider numbers, or invent missing duration/elevation values. Page-wide time
  ranges that cover several approaches must be labelled as such.
- [x] **Handle route differences honestly.** Show a short start/return description
  up front. Put the counterpart link and specific difference under a collapsed
  **Comparing with AllTrails?** section. Use **Related route—not the same
  itinerary** when necessary, particularly for the current Valley Trail match.
  Small measurement differences belong in the details; changed starts,
  turnarounds, boat use, or summit extensions must be clear before generation.
- [x] **Build the compact chooser.** Require an explicit selection when a group
  offers multiple routes. For a single option, show its description without an
  unnecessary selector. Keep selection keyboard-accessible and readable on
  mobile. Use real controls, not decorative pills that look interactive.
- [x] **Connect every route-dependent consumer.** Selection must update displayed
  facts, the weather reference and availability state, relevant access guidance,
  packing inputs, review identity, source details, and photo/credit when the
  image differs. Keep park-wide alerts labelled park-wide unless route impact
  is supported by evidence; do not imply that every new choice needs a new NPS
  request. Shared references may reuse a valid cached response.
- [x] **Prevent stale or mixed results.** Changing the route makes the previous
  list visibly out of date and requires Generate/Update. An older weather or AI
  response must not overwrite the new selection. Selection alone must not
  consume an AI allowance. Preserve relevant user-entered trip details, but
  re-evaluate them against the new route rather than silently reusing a list.
- [x] **Keep transport and access limitations visible.** A shuttle option does
  not guarantee that the boat is operating or that a ticket is available.
  Link official operating information without inventing a live schedule. Keep
  material closures and alpine/weather limitations visible; move only supporting
  explanation into details. An unavailable feed must never mean “route open.”
- [x] **Migrate existing identities safely.** Preserve existing trail IDs and
  saved-plan meaning through explicit mappings. Old saved results retain their
  original itinerary and facts; never relabel a walking plan as a boat plan.
  Define how unsupported/retired options are shown. Keep search aliases,
  park lists, route/destination counts, and device-local popularity consistent;
  do not accidentally count one destination several times as a popular trail.
- [x] **Deliver a reusable first example, then a verified batch.** Implement
  Inspiration Point's two supported approaches first to prove the model and
  chooser. Apply that same pattern to the approved inventory in batches, with
  consolidated verification rather than repeated owner signoffs per trail.
- [x] **Update documentation with the feature.** Update README, changelog,
  coverage list, onboarding guide/template, glossary, route evidence, and this
  checklist. Record any architectural change when it is actually decided.

### Acceptance tests

- [x] Walking and shuttle options use their own full-trip values and preserve
  the correct start, turnaround, return, and source labels.
- [x] Loop, out-and-back, and one-way fixtures display consistent route types
  in selection and packing output. Tests distinguish one-way source distances
  from published totals, prevent double-counting returns, and keep transport
  separate from hiking. Missing return arrangements or uncertain route types
  stay visible instead of silently assuming a round trip.
- [x] Missing, duplicate, or changed official variant headings fail source
  checks rather than quietly selecting another approach. Unsupported options
  cannot generate a supposedly verified plan.
- [x] Switching routes updates the rule inputs and produces the expected
  recommendations where thresholds differ. It is acceptable for two correctly
  evaluated routes to yield the same items; do not force artificial differences.
- [x] Rapid selection changes, delayed responses, unavailable weather/NPS data,
  stale reviews, and repeated generation leave a consistent usable guest plan.
- [x] Legacy saved-plan fixtures keep their original meaning; API validation
  rejects mismatched route IDs/facts and preserves existing access controls.
  Use automated fixtures/mocks; do not require owner authentication or a second
  account for acceptance. Report any untested live account behavior explicitly.
- [x] Desktop and 390 px mobile checks cover selection, keyboard/focus behavior,
  readable warnings, collapsed comparisons, matching image credits, no overflow,
  and generation without signing in.
- [x] Catalog/source checks, lint, type checking, unit/integration tests, relevant
  stress cases, production build, and browser/accessibility checks pass. Review
  one consolidated source report and Preview before requesting release approval.

## Priority 2: Repository and documentation cleanup

This is the next major work point after the route-coverage PR. Begin it as a
separate reviewable branch after Priority 1 is merged or explicitly closed.

### Intended experience

A reader can quickly understand what TrailPack does, what it supports, what it
does not guarantee, and where to go next. The writing should suit a general
mid-program university audience: clear and precise without assuming a coding
background, oversimplifying the product, or removing important qualifications.

### To do

- [ ] **Audit the clutter before moving anything.** Separate files shown on
  GitHub from local generated files and editor-only clutter. Create a small
  inventory with each candidate's purpose, readers, references, and proposed
  action: keep, rewrite, move, archive, or exclude from local navigation.
- [ ] **Shorten the README into a useful front door.** Lead with the product,
  live app, supported coverage, guest workflow, limits, and a small example.
  Link setup, trail maintenance, testing, and detailed history instead of
  repeating their full content. Separate “available now” from “planned.”
- [ ] **Create a documentation index.** Organize reading paths for app users,
  contributors, trail-data maintainers, and technical reviewers. Each guide
  should state its purpose, prerequisites, and next link. Proposed destinations
  include a user guide, setup guide, contributor guide, and technical reference;
  select final filenames after checking the existing material for overlap.
- [ ] **Rewrite wording for the requested audience.** Define NPS, USGS, and AI
  once; explain specialist terms when needed. Prefer “source information” to
  unexplained “provenance,” “rule-based” to unexplained “deterministic,” and
  “automated checks” to unexplained “CI.” Keep exact code names in technical
  instructions, with a short explanation of their purpose.
- [ ] **Make the changelog a readable release history.** Describe what changed
  for users, group related updates, and clearly separate planned, unreleased,
  and released work. Link long audit results instead of duplicating them.
  Preserve historical facts, dates, and evidence; do not rewrite an old release
  as if a later feature had shipped with it.
- [ ] **Design a shallow repository layout.** Keep the root focused on the
  README, changelog, essential contribution/context instructions, and files the
  toolchain requires there. Keep app code, public assets, scripts, templates,
  tests, database files, and docs in clearly named existing folders where practical.
  Do not move configuration just to make the root look empty.
- [ ] **Archive historical material with a clear index.** Separate current
  guides from dated plans and validation records. Preserve official source
  fixtures, geometry evidence, photo permissions/credits, security summaries,
  and records required by tests. Keep internal historical framing out of public
  product introductions without erasing the underlying records.
- [ ] **Use hiding/exclusion only for the right purpose.** The repository already
  ignores dependencies, builds, test reports, environment files, and local
  private material. Adding an already tracked file to `.gitignore` does not
  remove it from GitHub. Editor exclusions affect the editor, not the repository.
  Consider optional local exclusions for generated folders; never hide source,
  security guidance, required evidence, or secrets as a substitute for fixing
  their handling. No destructive cleanup or history rewrite without approval.
- [ ] **Apply moves in small, reviewable groups.** Update imports, scripts,
  workflows, links, tests, agent instructions, and onboarding examples that use
  the old paths. Keep a before/after inventory and a reversal plan. Do not mix
  route behavior changes into the cleanup PR.
- [ ] **Update repository entry points.** Review the repository description,
  homepage, and documentation links for consistency, but change remote settings
  only with explicit approval. Keep the README, changelog, docs index, and this
  roadmap synchronized with what actually ships.

### Acceptance tests

- [ ] A non-specialist reader can find the app, supported routes, limitations,
  setup instructions, and contribution path without reading historical audits.
- [ ] No undefined essential jargon, contradictory status/counts, broken local
  links/anchors, unexplained duplicate guides, or unlabelled archived material.
- [ ] A fresh checkout still supports documented setup, tests, build, and trail
  onboarding. Necessary evidence and photo attribution remain available.
- [ ] Documentation-only rewrites receive link/anchor and whitespace checks.
  Any file moves affecting code or configuration receive the full relevant app
  and hosted checks. Report which checks actually ran.
- [ ] No credentials, personal data, required files, or historical evidence are
  exposed or lost during cleanup. Review the final diff and changed-file list.

## Priority 3: Interactive park and trail discovery map

### Future route builder

After the discovery map, consider an opt-in route builder that lets hikers join
reviewed route segments into their own itinerary. It must label user-composed
distance, gain, access, and return assumptions separately from official route
profiles. This avoids cataloging every possible permutation while preserving the
current evidence model. It is intentionally outside Priority 1 and Priority 2.

### Intended experience

A user can explore supported parks on a map, choose a park, then a named trail
and one of its supported access routes. The current list remains a full-featured
alternative. This is a discovery map, not turn-by-turn navigation or live tracking.

### To do

- [ ] **Build on Priority 1's route identities.** Use the same catalog for map,
  list, search, route chooser, and packing output; do not create a second map-only
  trail database. Keep destination, route, and park counts clearly distinguished.
- [ ] **Choose the map approach deliberately.** Compare rendering/library and
  map-data options for accessibility, loading size, attribution/reuse terms,
  API keys, service limits, and ongoing cost. Document the choice; request
  approval before introducing a paid service or new account requirement.
- [ ] **Verify marker meaning and coordinates.** Label park overview markers,
  destinations, and trailheads distinctly. A weather reference is not
  automatically the correct destination or map marker. Start with verified
  markers; show route lines only if full display-ready geometry and reuse rights
  have been checked. Existing corridor evidence is not a navigation track.
- [ ] **Create a simple browse flow.** Park selection opens its supported trails;
  trail selection opens the same route options used by the list. Support a clear
  back path, sensible bounds, and compact handling of nearby markers. Map
  gestures must not trap mobile page scrolling.
- [ ] **Preserve access without a map.** Keep all parks, trails, and route options
  available by keyboard and screen reader in the list. Provide text alternatives
  to color/position, visible focus, and readable selected states.
- [ ] **Protect performance and privacy.** Load map code only when needed; do
  not require location permission, login, or precise-location collection.
  Keep map failures independent from weather, alerts, and guest generation.
  Define loading-size and interaction budgets from a measured baseline before
  implementation, then compare equivalent desktop/mobile conditions afterward.
- [ ] **Update README, changelog, user guide, attribution, and roadmap.** Explain
  supported coverage, list fallback, and why discovery is not navigation.

### Acceptance tests

- [ ] Map and list select identical park/trail/access-route records and produce
  identical packing inputs. Unsupported areas do not appear as supported routes.
- [ ] Markers are correctly labelled and placed; verified linework, if included,
  is not confused with another variant. Credits and source links are visible.
- [ ] Keyboard, screen-reader, desktop, mobile, slow-network, missing-key, and
  map-provider-failure cases leave the list and guest planner usable.
- [ ] Measured initial load and interaction performance meet the agreed budgets;
  maps do not cause unexpected growth in weather/alert requests or AI usage.
- [ ] Relevant source, unit, build, browser/accessibility, and hosted checks pass
  before one consolidated Preview and explicit release approval.

## Reusable implementation brief

Copy the block below when starting a phase. Replace the bracketed phase with
**Priority 1**, **Priority 2**, or **Priority 3**; do not start all three at once.

> Work on [chosen priority] from `docs/roadmap.md` in the local TrailPack
> repository. First recommend a model and reasoning level, then pause for the
> owner's confirmation. After approval, inspect the current branch, PRs, shared
> glossary, catalog decision, and relevant code/docs. Preserve unrelated changes.
>
> Treat the selected phase's checklist and acceptance tests as the implementation
> brief. State the bounded batch and dependencies before editing. Distinguish
> verified facts from proposed approaches and unresolved source gaps. Preserve
> authoritative NPS values, reviewed USGS comparisons, honest AllTrails
> distinctions, guest access, guarded AI, rate limits, and clear unknown states.
> Use existing reusable definitions and verification tools; do not invent facts
> or broaden the source-refresh publisher's permissions.
>
> Keep the interface concise, with the selected complete itinerary and important
> warnings visible and supporting explanation expandable. Keep public writing
> clear for a general university audience. Update README, changelog, applicable
> guides/evidence, and this checklist with the actual result. Do not mark planned
> work implemented or unreleased work deployed.
>
> Run proportionate automated checks and record their results and gaps. Use
> fixture/mock coverage for account-related regression checks; do not request
> authentication or a second account. Do not purchase services, alter remote
> repository settings, delete material, or rewrite history without approval.
> Present one consolidated source/test report and Preview for the approved
> batch, not an owner checkoff for every trail. At the next substantive stage,
> recommend the next model/reasoning level and pause. Commit/push only within
> the authorized scope, and never merge without explicit owner approval.

## Maintenance

Check a task only after its acceptance evidence exists. Link the implementation
PR and record unresolved decisions here when a phase starts. These are future
product improvements, not retroactive claims about the current release.
