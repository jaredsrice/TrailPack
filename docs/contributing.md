# Contributing to TrailPack

TrailPack accepts focused, reviewable changes that preserve its source and
safety boundaries.

## Before editing

1. Start from a clean, current `main` branch.
2. Create a `codex/` or other purpose-specific branch.
3. Read the relevant current guide and any applicable decision under
   [`docs/adr/`](adr/).
4. Keep unrelated product, data, and documentation work in separate changes.

## Repository map

| Path | Purpose |
|---|---|
| `src/app/` | Next.js pages, authentication callback, and server routes |
| `src/features/trailpack/components/` | Planner interface |
| `src/features/trailpack/data/` | Registered trail definitions, managed facts, parks, photographs, and examples |
| `src/features/trailpack/lib/` | Packing, source, provider, validation, search, and persistence logic |
| `docs/data/` | Reviewed source and geometry evidence; several files are imported by tests |
| `scripts/` | Source checking, trail onboarding, and stress tools |
| `tests/accessibility/` | Firefox interaction and axe accessibility checks |
| `supabase/` | Database migrations and configuration |
| `templates/trails/` | Blank and worked trail-onboarding inputs |

## Match checks to the change

- Documentation wording and links: Markdown path/anchor and whitespace checks.
- Trail data: catalog, source, photo, geometry, packing, stress, build, and
  accessibility checks.
- Interface behavior: unit tests, build, Firefox interaction, accessibility,
  responsive layout, and console review.
- Authentication, storage, AI, or security boundaries: focused denial and
  failure tests plus the complete gate.
- File moves that affect imports, scripts, or automation: the complete gate.

The [testing guide](testing.md) lists the commands and evidence types.

## Trail contributions

Use one reviewed JSON definition for each complete route. Do not add a distance
or alternate start to an existing profile without preserving its identity and
return meaning. Follow [Add a trail](trail-onboarding.md) for source facts,
geometry, photographs, public comparison, weather coordinates, and access notes.

## Documentation contributions

- Keep the README short and current.
- Put detailed instructions in the matching guide and link to them once.
- Update the changelog when users would notice the result.
- Update the roadmap when scope, priority, or future work changes.
- Preserve dated records as historical evidence; do not rewrite them to imply
  later features existed earlier.
- Define unfamiliar terms and state whether a check was live, mocked, generated,
  or manual.

## Security and privacy

- Never commit environment files, provider keys, recovery material, account
  identifiers, tokens, or private saved-result content.
- Keep provider keys on the server unless a setting is explicitly designed to
  be public.
- Derive ownership from the validated Supabase session.
- Preserve bounded inputs, safe external links, no-store responses, and
  deterministic fallbacks.

## Pull request expectations

Describe the problem, resulting behavior, relevant source or design decision,
and validation that actually ran. Push the branch, open a pull request against
`main`, wait for required checks and Vercel Preview, and merge only after review.
