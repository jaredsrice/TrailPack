# TrailPack architecture

TrailPack is a Next.js application organized around one TrailPack feature
module. The browser gathers a route and trip plan, server routes add bounded
external context, and a rule-based engine creates the authoritative packing
list.

## Planning flow

1. Search and park browsing select a supported destination.
2. A grouped destination may require a concrete access-route choice.
3. The selected profile supplies official facts, route form, coordinates,
   source information, photograph, and planning limits.
4. Server routes request weather and NPS notices or return an explicit saved or
   unavailable state.
5. The hiker adds trip details and generates a snapshot.
6. The packing engine creates ordered essential and optional recommendations.
7. The standard plan review checks that result without an account.
8. A signed-in user may save the snapshot or request one guarded AI explanation.

## Main modules

| Path | Responsibility |
|---|---|
| `src/app/` | Pages, route handlers, authentication callback, and global styles |
| `src/features/trailpack/components/` | Search, selection, context, packing, AI, and save interfaces |
| `src/features/trailpack/data/` | Approved route definitions, managed NPS facts, parks, photographs, and saved examples |
| `src/features/trailpack/lib/` | Compilation, search, packing, provider clients, validation, source refresh, and persistence |
| `src/features/trailpack/types.ts` | Shared domain and transport types |
| `docs/data/` | Retained source, geometry, and admission evidence used by documentation and tests |

The [domain glossary](../CONTEXT.md) defines the shared terms. Architecture
decisions explain the [approved catalog](adr/0001-approved-trail-catalog.md) and
[complete access-route identities](adr/0002-complete-access-route-identity.md).

## Trail and route identity

Each NPS-backed route has one JSON definition under
`src/features/trailpack/data/trails/` and one managed official-fact snapshot.
The compiler produces the runtime profile and related catalog views. Grouping
metadata connects routes that share a familiar destination without merging
their starts, distances, route forms, forecasts, or return plans.

Mixed Inspiration Point routes are derived from reviewed parent profiles and
retained USGS geometry. They have their own stable identities and calculation
disclosure but do not invent an NPS snapshot or elevation gain.

## Source boundaries

- NPS pages provide official route facts and optional terrain text.
- USGS geometry provides comparison or calculated route evidence.
- Open-Meteo provides forecast context for a reviewed coordinate.
- Sunrise-Sunset.org provides daylight boundaries.
- The NPS API provides bounded current park notices when configured.
- AllTrails is an admission comparison and is not a runtime data source.

Official, calculated, forecast, user-provided, inferred, saved-example,
unavailable, and unknown values remain distinguishable.

## Server routes

| Route | Purpose |
|---|---|
| `GET /api/trailpack/weather` | Normalize a live forecast, labeled saved example, or unavailable state |
| `GET /api/trailpack/alerts` | Return bounded NPS notices for a supported trail or park |
| `POST /api/trailpack/ai-review` | Authenticate, claim allowance, request Gemini output, and validate it |
| `POST /api/trailpack/nps-lookup` | Claim shared lookup allowance, validate NPS hiking candidates, and return partial facts |
| `GET/POST /api/trailpack/saved-results` | List or create private owned snapshots |
| `DELETE /api/trailpack/saved-results/:id` | Delete only the authenticated owner's result |
| `GET /auth/callback` | Complete the Supabase Google OAuth PKCE exchange |

Handlers validate and bound inputs before buffering or contacting providers.
Failures return controlled, non-cacheable states without exposing credentials or
provider response bodies.

## Authentication, storage, and AI

Supabase manages Google sessions and private saved results. Server code validates
the user instead of accepting an owner identifier from the browser. Database
row-level security, payload limits, result limits, and owner-scoped operations
provide additional enforcement.

In the unreleased candidate, Gemini receives only approved fact IDs and
server-constructed wording. Profile wording uses the canonical catalog, not the
browser's trail name. Fixed weather/notice flags and locally derived duration or
reported-snow flags supply context without forwarding raw trip strings, notes,
packing prose or account identifiers. Browser-supplied context remains supplied
context, not newly authenticated source evidence.

The response selects one to three unique applicable IDs. Unknown IDs, extra
fields, invalid counts and arbitrary prose fail closed. TrailPack resolves
displayed wording from its own fact set; all packing items, labels and missing
details stay rule-owned. The older saved-fixture contract accepts only template
or applicable trusted fixture wording. The normal review details display a safe
rejection explanation without echoing provider content. Rejection, timeout,
quota or provider failure preserves the baseline.

## Partial live NPS lookup

The unreleased lookup is separate from catalog admission. It queries only
Zion, Acadia or Bryce Canyon, validates hiking identity and structured duration,
and stores null distance, elevation and route type. It does not invent complete
route geometry. NPS duration seeds a conservative manual plan, with source notes
on affected items; edited duration and additional facts are user-provided.
Generate/Update is explicit. Weather/alerts/AI/private saving are not expanded.

The fixed server endpoint, streamed caps, deadlines, safe errors and one-minute
bounded cache constrain the provider boundary. A database-owned shared token
bucket is the quota authority across workers; an unavailable RPC blocks NPS
calls. The reviewed migration is applied to the shared hosted database. See the
[provider proof](validation/2026-09-11-nps-lookup-provider-proof.md) and
[candidate verification](validation/2026-09-11-required-completion.md).

## Source maintenance

The managed NPS refresh reads only registered HTTPS NPS pages, selects the exact
route section, requires repeated agreement, applies bounded validation, and can
write only `src/features/trailpack/data/nps-source-snapshots.json`. Monthly
automation opens a protected pull request rather than writing directly to
`main`.

The candidate accepts the catalog's valid `Very Strenuous` difficulty and
enforces the one-megabyte source-page cap while streaming, with a shared request
deadline. Each redirect is checked before following it. A reviewed delivery
override uses `home.nps.gov` only for the two Open Canyon profiles, retaining
their canonical saved URL and reporting the actual fetched URL. Calculated mixed
itineraries reuse their registered parent sources and separate geometry tests;
they do not gain invented official snapshots.

See [Testing TrailPack](testing.md) and [Add a trail](trail-onboarding.md) before
changing a provider, source snapshot, or route definition.
