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
| `NPS_API_KEY` | Enables live National Park Service notices |
| `GEMINI_API_KEY` | Enables the guarded Gemini explanation review |
| `GEMINI_MODEL` | Overrides the default Gemini model |
| `NEXT_PUBLIC_SUPABASE_URL` | Identifies the Supabase project used for authentication and private saves |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key protected by row-level security |

The `NEXT_PUBLIC_` values are intentionally browser-visible project settings.
Do not use that prefix for private provider keys. Hosted Preview and Production
variables do not automatically configure a local checkout.

## Useful first checks

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
