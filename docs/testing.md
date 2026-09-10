# Testing TrailPack

Use the smallest relevant check while editing, then run the required final gate
for the affected boundaries.

## Commands

| Command | What it checks | Evidence type |
|---|---|---|
| `npm run lint` | ESLint rules and ignored generated/tooling paths | Local source |
| `npm run docs:check` | Local Markdown paths and section anchors | Repository documentation |
| `npm run typecheck` | Generated Next.js route types and TypeScript | Local source |
| `npm run test` | Unit and integration tests under `src/` | Fixtures and mocked provider boundaries |
| `npm run trail:check -- --catalog` | Trail definitions, registration, managed facts, and photographs | Local catalog and files |
| `npm run check:nps-integrity` | Registered official NPS pages against managed snapshots | Live network comparison; read-only |
| `npm run scenario:stress` | Repeatable packing scenarios and generated report freshness | Local generated evidence |
| `npm run stress:system` | Fixed-seed invariants, concurrency, bounds, and performance | Local and mocked system boundaries |
| `npm run build` | Optimized Next.js production build | Local source |
| `npm run test:a11y` | Firefox interactions, responsive states, console checks, and axe scans | Local browser using the development server |

The browser suite runs serially in Firefox with reduced motion and stores
failure screenshots or traces under `/tmp/trailpack-playwright-results/`.

## Complete application gate

Run from the repository root:

```sh
npm run lint
npm run docs:check
npm run typecheck
npm run test
npm run trail:check -- --catalog
npm run check:nps-integrity
npm run scenario:stress
npm run stress:system
npm run build
npm run test:a11y
```

`npm run scenario:stress` rewrites
[`docs/evidence/hiker-scenario-stress-report.md`](evidence/hiker-scenario-stress-report.md).
CI runs `git diff --exit-code` afterward, so the committed report must match the
current catalog and packing rules.

`npm run check:nps-integrity` contacts live NPS pages. A mismatch is not
permission to overwrite official facts immediately. Review page identity,
route section, bounds, and repeated-read agreement first. The guarded apply mode
is `npm run refresh:nps-sources` and may change only the managed snapshot after
all safety checks pass.

## Generated and ignored evidence

- NPS integrity reports: `.artifacts/nps-source-integrity/`
- System stress reports: `.artifacts/system-stress/`
- Trail drafts: `.artifacts/trail-onboarding/`
- Browser failures: `/tmp/trailpack-playwright-results/`

These paths are local or CI artifacts and are not product source. The generated
hiker-scenario report is intentionally tracked because CI verifies it.

## Pull request and deployment checks

Pull requests to `main` run lint, type checking, unit tests, live NPS comparison,
both stress suites, evidence freshness, the production build, Firefox
accessibility checks, CodeQL, and Vercel Preview. After merge, verify the same
commit reaches Vercel and the production URL returns the expected TrailPack page.

Report checks accurately. Do not describe mocked provider tests as live service
acceptance or a successful Preview as a production deployment.
