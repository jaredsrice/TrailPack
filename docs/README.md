# TrailPack documentation

Use the shortest reading path that matches what you need. Current guides appear
first; dated research, project records, and screenshots are preserved in the
[archive](archive/README.md).

## I want to use TrailPack

1. Open [TrailPack](https://trailpack-ten.vercel.app).
2. Read the [user guide](user-guide.md) for trail selection, route meanings,
   source labels, saved plans, and limitations.
3. Check the [Grand Teton coverage register](data/grand-teton-coverage.md) when
   you need the exact supported starts and routes.

No account or development setup is required for the guest planner.

## I want to run or contribute to the project

1. Follow [Setup](setup.md).
2. Read [Contributing](contributing.md).
3. Use [Testing TrailPack](testing.md) to choose the correct validation gate.
4. Consult the [architecture guide](architecture.md) before changing a data or
   provider boundary.

## I want to add or maintain trail data

1. Read [Add a trail](trail-onboarding.md).
2. Review the [approved catalog decision](adr/0001-approved-trail-catalog.md)
   and [complete-route decision](adr/0002-complete-access-route-identity.md).
3. Use the current evidence in [`data/`](data/) and preserve every test-required
   JSON or geometry file at its reviewed path.
4. Check the [route audit](data/grand-teton-day-hike-audit-2026-09-09.md) before
   reconsidering a held or excluded route.

Trail admission requires reviewed NPS facts, matching route evidence, a suitable
local photograph, and an explicit decision about access and return form.

## I want technical or review evidence

- [Current 499B requirements status](requirements-status.md)
- [Final audit and acceptance](validation/2026-09-12-final-audit.md)
- [Short demo and portfolio summary](demo.md)
- [Architecture](architecture.md)
- [Domain glossary](../CONTEXT.md)
- [Architecture decisions](adr/)
- [Current generated evidence](evidence/README.md)
- [Photo source ledger](ui/2026-07-25-national-park-image-sources.md)
- [Historical validation records](archive/validation/README.md)
- [Historical project requirements and plans](archive/project/README.md)
- [Historical source research](archive/research/README.md)

## Product direction

The [roadmap](roadmap.md) records current priorities. Route coverage is complete.
The shelved product-design phase covers a less cluttered trail-selection landing
experience, an accessible interactive map, and later custom route composition
from reviewed segments.

## Repository-maintained entry points

| File | Purpose |
|---|---|
| [`README.md`](../README.md) | Product overview and quickest path into the project |
| [`CHANGELOG.md`](../CHANGELOG.md) | User-facing release history |
| [`CONTEXT.md`](../CONTEXT.md) | Shared domain terms and durable implementation rules |
| [`AGENTS.md`](../AGENTS.md) | Repository instructions for coding agents |
| [`docs/roadmap.md`](roadmap.md) | Current and planned product work |

If two documents disagree about current behavior, verify the merged code and
update the current guide. Keep dated archive records as evidence of what was
known when they were written.

## Pausing or resuming work

Use the [project handoff](project-handoff.md) for release checks, migration
preservation requirements, and the current code-audit status.
