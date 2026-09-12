# Set up TrailPack

This guide prepares a local development copy. The guest planner works without
provider credentials.

## Requirements

- Git
- Node.js 20.9 or newer
- npm

Vercel currently builds the hosted application with Node.js 24.

## Install and start

From the repository root:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server uses
saved or unavailable provider states when optional services are not configured.

## Optional environment variables

Create `.env.local` in the repository root. It is ignored by Git. Never commit,
paste, or print credential values.

| Variable | Purpose |
|---|---|
| `NPS_API_KEY` | Enables live National Park Service notices and the unreleased partial lookup |
| `GEMINI_API_KEY` | Enables the guarded Gemini explanation review |
| `GEMINI_MODEL` | Overrides the default Gemini model |
| `NEXT_PUBLIC_SUPABASE_URL` | Identifies the Supabase project used for authentication and private saves |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key protected by row-level security |

The `NEXT_PUBLIC_` values are intentionally browser-visible project settings.
Do not use that prefix for private provider keys. Hosted Preview and Production
variables do not automatically configure a local checkout.

## Unreleased NPS lookup setup

The guest baseline remains usable without any credentials. The optional live
lookup requires `NPS_API_KEY`, both existing Supabase public settings, and the
reviewed migration
[`20260911000000_nps_lookup_quota.sql`](../supabase/migrations/20260911000000_nps_lookup_quota.sql).
Apply it only to the approved project/environment through the existing database
release process, before enabling a preview of the new route. Missing or failed
quota RPC configuration returns unavailable and makes no NPS request.

The public RPC can consume only a fixed shared allowance. It cannot read/reset
the table or accept client-provided limits, time, or identities. Twenty initial
tokens refill one per six seconds. This limits lookup traffic across workers
while reserving part of NPS's shared allowance for alerts. Public callers can
exhaust this guest allowance, so a busy response is expected under abuse;
all deployments sharing the same NPS key must share this quota database or use
separately budgeted keys. The bucket does not constrain other independent apps.
Manual and supported planning remain available. The 60-second result cache is
an optimization, not the quota authority.

Test the migration's permissions, concurrency and effective allowance in the
approved hosted environment before declaring rollout passed. Local SQL tests
use embedded PostgreSQL via the development-only PGlite dependency; they are
not proof of deployed database state or multi-worker behavior. See the
[provider proof](validation/2026-09-11-nps-lookup-provider-proof.md).

## Useful first checks

Hosted Google sign-in also requires the exact test callback in Supabase's
allowed redirect list. The approved branch callback is
`https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app/auth/callback`.
Do not broaden it to all Vercel deployments. Production retains its own callback.

Historical migration bookkeeping was reconciled against the actual schema on
September 12. Both the lookup quota and saved-plan permission repair are applied;
check pending migrations before pushing, rather than replaying existing SQL.

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

See [Testing TrailPack](testing.md) for the complete gate and which commands use
the network.

## Trail-data tools

Create and check an offline draft:

```sh
npm run trail:new -- example-lake-loop
npm run trail:check -- .artifacts/trail-onboarding/example-lake-loop/trail.json
```

Drafts are written under ignored `.artifacts/` storage. Follow the
[trail-onboarding guide](trail-onboarding.md) before adding anything to the
catalog.

## Common setup problems

- If generated Next.js types are missing, run `npm run typecheck`; it runs
  `next typegen` before TypeScript.
- If Firefox is missing for browser checks, run
  `npx playwright install --with-deps firefox`.
- If a local provider variable changes, restart the development server.
- If live NPS checking fails, distinguish a network or upstream page failure
  from a source-data difference before changing snapshots.
- Use `npm ci`, rather than a partial dependency update, when reproducing CI.
