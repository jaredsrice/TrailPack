# TrailPack

TrailPack turns trail facts, weather, official notices, and trip details into a
practical day-hiking packing list. Its rule-based planner decides what belongs
on the list. An optional AI review connects route effort, planned timing,
conditions and packing priorities, but it cannot silently change the items or
their sources.

[Open TrailPack](https://trailpack-ten.vercel.app) ·
[Read the user guide](docs/user-guide.md) ·
[Browse the documentation](docs/README.md) ·
[View the roadmap](docs/roadmap.md)

## What you can do

- Search or browse the supported Grand Teton day hikes.
- Choose a complete access route when a destination has more than one start or
  return plan.
- Combine trail facts with a planned date, start time, expected duration, and
  reported conditions.
- Review current weather and National Park Service notices when those services
  are available.
- Generate a packing list with visible reasons and source labels.
- Use the full guest planner without creating an account.
- Sign in with Google to save private plans and request a guarded plan review.
  Complete plans receive a practical summary; incomplete plans receive a clear
  best next step.
- Enter basic facts manually for an unsupported hike and receive a limited list.

## Current coverage

The unreleased required-completion candidate also adds a separate live NPS
lookup for Zion, Acadia, and Bryce Canyon. Its partial results use NPS duration
plus manual details, not complete catalog profiles. Editing the duration keeps
it user-provided even if the original number is restored. The
[test preview](https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app)
is available. Live lookup and signed-in Gemini highlights passed hosted checks;
see the [final audit](docs/validation/2026-09-12-final-audit.md) for tests,
limitations and the publication gate. Main and the production website are unchanged.

TrailPack currently supports **39 Grand Teton discovery entries and 52 complete
route profiles**. Fifty profiles use National Park Service facts with reviewed
United States Geological Survey route evidence. Two mixed Inspiration Point
profiles use calculated walking distance and clearly retain unknown elevation
gain.

Route distance always describes the selected itinerary:

- An out-and-back distance includes the walk to the turnaround and back.
- A loop distance covers the complete circuit.
- A point-to-point distance is one way and requires a separate transportation
  or return plan.
- Boat and vehicle travel are not counted as hiking distance.

Some published routes remain in the catalog while their original access is
closed. TrailPack displays those restrictions and does not reuse old distances
for a different start. The [coverage register](docs/data/grand-teton-coverage.md)
lists every supported route, while the [day-hike audit](docs/data/grand-teton-day-hike-audit-2026-09-09.md)
records reviewed candidates and evidence holds such as Delta Lake.

## Where the information comes from

| Source | How TrailPack uses it |
|---|---|
| National Park Service (NPS) | Official trail facts, accessibility or terrain text, photographs, and current park notices |
| United States Geological Survey (USGS) | Public trail geometry used to compare or calculate route distance |
| Open-Meteo | Date-aware weather forecasts |
| Sunrise-Sunset.org | Sunrise, sunset, and civil-twilight times |
| Your trip details | Planned timing, duration, route type, and reported conditions |
| Gemini | Optional explanation review after TrailPack validates the response |

AllTrails is used only to confirm that a route is recognizable under names
hikers commonly encounter. Its values do not replace NPS facts or reviewed USGS
evidence.

## Try it locally

TrailPack uses Node.js 20.9 or newer; the hosted application builds with Node.js
24.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Provider credentials are
optional for the core guest workflow. See the [setup guide](docs/setup.md) for
environment variables and hosted-service details.

## Check a change

```sh
npm run lint
npm run docs:check
npm run typecheck
npm run test
npm run check:nps-integrity
npm run scenario:stress
npm run stress:system
npm run build
npm run test:a11y
```

The NPS integrity command contacts the registered official pages. The other
checks use repository data, local fixtures, or mocked provider boundaries unless
their guide says otherwise. See [Testing TrailPack](docs/testing.md) before
interpreting or updating generated evidence.

## Add a trail

Create a draft, check it without publishing, and submit the evidence with a
reviewed change:

```sh
npm run trail:new -- example-lake-loop
npm run trail:check -- .artifacts/trail-onboarding/example-lake-loop/trail.json
npm run trail:check -- --catalog
```

The [trail onboarding guide](docs/trail-onboarding.md) explains official facts,
route geometry, access variants, photographs, source comparisons, and the
admission checks. New parks require their own safety and data review.

## Important limits

- TrailPack supports planning; it does not replace current park guidance,
  emergency preparation, navigation, or personal judgment.
- NPS notices may cover an entire park. TrailPack does not claim that every
  notice affects the selected trail.
- Weather is tied to a reviewed route-area coordinate and may not represent
  every elevation or exposed section.
- A listed trail is not a promise that its road, trailhead, boat, tram, or route
  is open today.
- Manual-entry plans have less source information than supported profiles.
- Saved weather examples are labeled examples, not current conditions.
- AI explanations are optional and cannot change the rule-generated list.

## Documentation

The [documentation index](docs/README.md) provides separate reading paths for
app users, contributors, trail-data maintainers, and technical reviewers.

- [User guide](docs/user-guide.md)
- [Setup](docs/setup.md)
- [Contributing](docs/contributing.md)
- [Testing](docs/testing.md)
- [Architecture](docs/architecture.md)
- [Trail onboarding](docs/trail-onboarding.md)
- [Product roadmap](docs/roadmap.md)
- [Release history](CHANGELOG.md)

## Next steps

The required-completion candidate repairs the
[September 10 acceptance findings](docs/superpowers/plans/2026-09-10-499b-acceptance-audit-and-development-plan.md):
AI selects only approved fact IDs; TrailPack supplies the wording; arbitrary
trip text is omitted from the provider payload; rejected selections show a safe
reason; and NPS maintenance accepts valid Very Strenuous profiles while bounding
page reads during streaming. The candidate adds the bounded partial NPS lookup.
These changes are not yet a production release. See the
[requirements status](docs/requirements-status.md) for local versus hosted evidence.

The current completion scope is B-01 through B-04 in the 499B specification.
Alternative packing-list modes and guest export are not part of that scope.
The final code audit is limited to documented defects and necessary cleanup;
see the [audit and acceptance record](docs/validation/2026-09-12-final-audit.md).

The following product work also remains shelved until explicitly resumed:

1. Make the trail-selection landing experience easier to scan as the catalog
   grows.
2. Add an accessible interactive map for supported parks and trails.
3. Explore an opt-in route builder that joins reviewed segments while keeping
   user-created distance, gain, access, and return assumptions explicit.

See the [roadmap](docs/roadmap.md) for scope and acceptance requirements.

For the current checkout, pause state, and historical preservation notes, see the
[project handoff](docs/project-handoff.md).
