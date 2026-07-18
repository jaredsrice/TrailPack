# CSE 499B Public Trail Source Feasibility

Date: 2026-07-17  
Requirement: B-01 permission-compliant public trail lookup  
Status: Bounded provider decision for the first implementation slice

## Decision

Use the public OpenStreetMap Nominatim search service for the first CSE 499B
public-trail lookup slice, subject to the operating limits below.

This is a deliberately narrow decision for a low-traffic senior-project demo:

1. Search runs only after a user submits a trail name and optional location.
2. TrailPack does not send a request on every keystroke and does not implement
   autocomplete with the public service.
3. Requests go through a server-side TrailPack route with an identifying
   application user agent, a hard one-request-per-second application limit,
   caching, a small result limit, and a configurable provider base URL.
4. Results retain their OpenStreetMap object type and ID, source link,
   coordinates, retrieval status, and missing-data labels.
5. OpenStreetMap data receives visible attribution and an ODbL license link.
6. Nominatim supplies lookup and location identity, not trusted complete trail
   statistics. Distance, elevation gain, route type, duration, and difficulty
   remain missing unless a separate verified source supports them.
7. A failed, empty, throttled, or ambiguous response returns the user to the
   existing manual entry fallback without a dead end.

This decision is acceptable for the bounded class project because the public
Nominatim policy permits moderate, directly user-triggered website searches.
It is not a long-term production capacity commitment. TrailPack must be able to
switch to another Nominatim-compatible service or a self-hosted instance without
a client application update.

## Live Feasibility Check

A live request on 2026-07-17 searched for `Angels Landing Trail` within a
Zion-area bounding box. Nominatim returned an OpenStreetMap `way` categorized as
`highway=path` with these useful fields:

- OpenStreetMap object type and ID
- trail name and display name
- latitude, longitude, and bounding box
- county, state, country, and country code
- available extra tags such as access, surface, incline, and operator

The same name without location scoping also returned an unrelated residential
road in Nevada. This proves that location context and result classification are
required; name matching alone is not sufficient.

Some OpenStreetMap extra tags may describe only one way segment. For example, a
distance-like tag on a returned way must not be presented as the full trail
distance without separate validation. The first slice should therefore use the
result for identity and coordinates, expose missing planning fields, and let the
user complete those fields through manual entry.

## Provider Comparison

| Candidate | Useful capability | Constraint | B-01 role |
|---|---|---|---|
| Nominatim public service | Free-form name search, country and view-box restriction, OSM identity, coordinates, address details, names, and extra tags | Absolute maximum of one request per second; identifying user agent or referrer; attribution; caching; no autocomplete; moderate end-user-triggered use only; policy may change | Selected for the bounded lookup slice |
| Overpass public instances | Detailed tag, way, relation, and geometry queries, including hiking routes and paths | Shared best-effort infrastructure with load shedding; public documentation warns against relying on the public instances as a general application backend; 429 and 504 responses are expected failure modes | Do not make it a required runtime dependency for the first slice; reconsider only for a bounded enrichment experiment or a managed/self-hosted service |
| NPS API | Authoritative park, alert, place, and things-to-do content with a server-side API key | Default limit is 1,000 requests per hour; coverage does not provide a consistent national trail-statistics catalog | Continue as official enrichment, not the base public trail lookup provider |
| Recreation.gov RIDB | Federal recreation areas and facilities; facilities may represent trails and include location/organization metadata | Requires an API key and acceptance of the access agreement; coverage and fields are oriented around federal recreation inventory and do not consistently provide full hiking metrics | Keep as a possible federal-result supplement, not the first general lookup provider |
| Existing NPS plus USGS catalog process | Strong official/computed provenance for curated profiles | Manual or preprocessing-heavy and not a broad live search experience | Preserve for curated supported trails; do not replace it with weaker public-search facts |

## Required Nominatim Contract

The implementation must enforce these provider rules rather than leaving them
as documentation only:

- Server-side request boundary.
- Explicit user submit; no client-side autocomplete.
- Application-wide rate limit of at most one request per second.
- Identifying `User-Agent` containing the TrailPack repository or contact URL.
- Normalized, trimmed query with a maximum length and United States country
  restriction for the current product scope.
- Optional state, park, or view-box context to reduce ambiguous matches.
- Small result limit and filtering that prefers trail-like OSM categories and
  types without claiming that every matching object is a complete route.
- Response caching and a provider base URL that can be changed server-side.
- Timeout, malformed-response, 429, 5xx, empty, and ambiguous-result handling.
- Visible `OpenStreetMap contributors` attribution linked to the OSM copyright
  and ODbL page.
- Original OSM object identity and source URL preserved in the normalized
  result.
- Missing distance, elevation gain, route type, duration, and difficulty remain
  explicit and flow into the manual entry fallback.

## Environment And Provider Inventory

Current server secret:

- `NPS_API_KEY`: optional live NPS alert enrichment; already referenced by the
  application.

Proposed non-secret B-01 configuration:

- `TRAIL_LOOKUP_BASE_URL`: defaults to the approved Nominatim service and makes
  the provider switchable without a client update.
- `TRAILPACK_CONTACT_URL`: public repository or project contact URL used in the
  identifying user agent.

No OpenStreetMap API key is required for the selected public Nominatim endpoint.
Do not add AI, OAuth, or database credentials during B-01.

## Sources

- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Nominatim search API: https://nominatim.org/release-docs/latest/api/Search/
- OpenStreetMap copyright and ODbL attribution: https://www.openstreetmap.org/copyright
- Overpass public-instance limits: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
- NPS API guides: https://www.nps.gov/subjects/developer/guides.htm
- NPS API documentation: https://www.nps.gov/subjects/developer/api-documentation.htm
- Recreation.gov RIDB documentation: https://ridb.recreation.gov/docs
- Recreation.gov RIDB access agreement: https://ridb.recreation.gov/access-agreement-ridb

## Next Implementation Slice

Implement issue #25 as one vertical slice: a submitted search reaches a
server-side provider adapter, returns a normalized and attributed trail result,
allows the user to fill important missing facts, and generates the existing
rule-based packing recommendation. Keep the curated catalog first and preserve
manual fallback for every provider failure state.
