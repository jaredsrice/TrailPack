# B-03 Google Login And Private Saved Results: Auth And Data Design

**Status:** Implementation, managed persistence, production Google OAuth, and
the complete first-user lifecycle are verified. Only the separate-second-user
privacy denial walkthrough remains before B-03 can close.

## Decision

TrailPack uses Supabase Auth for provider-managed Google identity and Supabase
Postgres for saved packing-list snapshots. TrailPack does not create a password
field, credential table, or custom account-recovery flow.

The browser and server use only `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The Google OAuth client secret belongs
only in Supabase Auth provider configuration; a Supabase service-role key is not
used by TrailPack's runtime.

## Data Minimization And Retention

Each saved row contains only:

1. A selected profile summary or manual-hike summary.
2. Trip inputs that can affect the deterministic recommendation.
3. The generated rule-based recommendation, including source labels.
4. The time saved.

The snapshot deliberately excludes free-form `notes`: they are not interpreted
by the rule engine and can contain unrelated personal information. Runtime
validation constructs a new canonical object and does not preserve unrecognized
nested fields. Guest data remains only in browser memory unless the user signs
in and presses **Save this plan**. A saved row remains until its owner deletes
it; deleting an auth user cascades to that user's saved rows.

## Ownership Model

`supabase/migrations/20260730000000_create_saved_results.sql` creates a
`saved_results` table with `user_id` referencing `auth.users`. It grants no
access to `anon`, allows authenticated users only `select`, `insert`, and
`delete`, and enables row-level security for every operation:

- select: `auth.uid() = user_id`
- insert: `auth.uid() = user_id`
- delete: `auth.uid() = user_id`

The application takes the owner ID only from the validated server-side Supabase
user (`auth.getUser()`), never from the browser request. It also scopes deletes
by both record ID and that user ID. Thus a guessed UUID cannot return, modify,
or delete another user's row; RLS remains the database-level enforcement even
if a future route filter is changed.

`supabase/migrations/20260827000000_harden_saved_results_limits.sql` also
enforces a 64 KB serialized payload ceiling and a maximum of 100 rows per user
inside Postgres. These controls apply when an authenticated client calls
Supabase directly instead of using TrailPack's server route.

## Auth And Application Flow

1. A guest completes the existing planner; no account is required and no row is
   written.
2. Choosing **Continue with Google** starts Supabase Google OAuth with the
   deployed `/auth/callback` URL.
3. The callback exchanges the PKCE code for a cookie-backed session.
4. A signed-in user may save the current bounded snapshot through the server
   route. Missing configuration, auth, and storage failures preserve the guest
   planning result.
5. `/saved` lists only the current user's rows and supports owner-only delete.

## Deployment Setup Checklist

1. Create the managed Supabase project and apply the migration above through
   its SQL editor or migration workflow.
2. In Supabase Auth, enable Google and enter the Google OAuth client ID and
   secret. Do not put that secret in this repository or Vercel environment.
3. Add exact redirect URLs for local development and the deployed test domain:
   `http://localhost:3000/auth/callback` and
   `https://trailpack-ten.vercel.app/auth/callback`. Add the specific protected
   preview URL only when it is the designated test environment.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel Preview and Production.
5. Create two non-personal Google test accounts. Verify guest generation,
   sign-in, save, a fresh-session revisit, owner delete, and a second user being
   unable to list or delete the first user's result.

## Local Verification Added

- Snapshot tests prove recommendation-relevant inputs are retained and
  free-form notes are omitted.
- The saved-result runtime contract accepts only bounded fields, exact nested
  schemas, and known source labels before a server insert.
- The server routes use `Cache-Control: no-store`, validate request size and
  shape, validate the authenticated user on every request, and avoid returning
  provider/database detail to the browser.
- Route tests cover missing sessions, malformed IDs, storage errors, successful
  owner deletion, and a second authenticated user receiving `404` without a
  delete operation against the first user's identifier.

## Managed Setup Evidence — 2026-07-31

- Created the `TrailPack` Supabase project in West US (Oregon) and linked it to
  `jaredsrice/TrailPack`.
- Applied `20260730000000_create_saved_results.sql` successfully.
- Queried the Postgres catalogs after migration. `saved_results` reported RLS
  enabled and exactly three authenticated-user policies: owner-only `SELECT`,
  owner-checked `INSERT`, and owner-only `DELETE`.
- Set the Supabase Auth site URL to `https://trailpack-ten.vercel.app` and
  allowed the exact local and production `/auth/callback` URLs.
- Added the browser-safe Supabase URL and publishable key to Vercel Preview and
  Production and to the ignored local environment file. No service-role key or
  database password was added to TrailPack.
- Created the `TrailPack Web` Google OAuth web client with exact production and
  local JavaScript origins plus the managed Supabase callback URL.
- Saved the Google client ID and secret only in Supabase Auth, enabled the
  Google provider, kept nonce checking enabled, and kept email required.
- Published the external Google OAuth audience to production so sign-in is not
  restricted to an undeclared test-user list.

The OAuth client secret was not added to this repository, Vercel, or TrailPack's
runtime environment.

## First-User Production Evidence — 2026-07-31

- Production guest planning remained usable without signing in.
- Google OAuth returned through the production callback and created a
  cookie-backed TrailPack session.
- The signed-in user saved a Jenny Lake result, opened `/saved`, revisited the
  result from a fresh browser tab, deleted it, and confirmed the empty state.
- Sign-out completed and the follow-up OAuth request displayed Google's
  **Choose an account** screen with `prompt=select_account`, proving the account
  chooser fix delivered in PR
  [#35](https://github.com/jaredsrice/TrailPack/pull/35).
- The production browser console remained free of errors during the lifecycle,
  and the temporary test row was removed.

## Security And Capacity Retest — 2026-08-28

- PR [#39](https://github.com/jaredsrice/TrailPack/pull/39) added bounded stream
  handling, exact saved-result canonicalization, owner-scoped delete tests,
  response limits, and same-origin callback validation.
- The production hardening migration completed successfully. A follow-up catalog
  query returned `true` for the validated payload constraint, enabled quota
  trigger, and security-invoker quota function.
- Lint, type checking, 239 Vitest tests, three Firefox/axe flows, the production
  build, 27 stress scenarios, and required hosted checks passed.

B-03 remains open only until a second real Google identity proves it cannot list
or delete a saved row belonging to the first identity. Code-level and database
controls are verified but are not being substituted for that acceptance step.
