# CSE 499B Public Trail Source Feasibility

Date: 2026-07-17  
Requirement: B-01 permission-compliant public trail lookup  
Decision updated: 2026-07-20  
Status: Tetons-first NPS/USGS import selected; Nominatim remains rejected

Implementation note: TrailPack now keeps a bounded, reviewed public-source
import catalog separate from the original three curated profiles. Colter Bay
Lakeshore Trail and Two Ocean Lake Loop use official NPS display values and
reconciled NPS-origin USGS trail geometry. Search and the Grand Teton park flow
can select both imports, while unmatched searches keep the manual-entry
fallback. The rejected Nominatim adapter and route were removed.

## Decision

Use a **Tetons-first, manually approved NPS/USGS import workflow** for the
bounded B-01 slice. NPS supplies the official name, park association, distance,
climbing, duration, difficulty, and route description. USGS National Digital
Trails supplies the secondary identity/geometry comparison and source feature
IDs. TrailPack records retrieval status, source URLs, confidence, missing fields,
and any distance difference instead of blending the sources.

The first two imports are Colter Bay Lakeshore Trail and Two Ocean Lake Loop.
Their selected USGS segments total 2.331 miles versus the official 2.2 miles
(about +6%) and 6.335 miles versus the official 6.4 miles (about -1%),
respectively. Both retain NPS as the displayed authority. New Tetons trails must
pass the same individual reconciliation gate before entering the catalog;
otherwise users stay on manual entry.

Do **not** use the public OpenStreetMap Nominatim service as a supported B-01
trail-lookup provider. The 24-trail product-acceptance sample found the intended
identity anywhere for 14/24 trails (58.3%), ranked it first for 12/24 (50.0%),
and returned `ok` without the intended trail in 4/18 `ok` responses. The current
location-scoped form found 0/24 intended identities, and no intended match
established a complete hiking route or authoritative planning fields.

The sample is deliberately varied rather than statistically representative of
all U.S. trails, but it is sufficient for this product decision: both the
well-known and lesser-known cohorts found only 7/12 intended identities. The
service added just two identities beyond the official USGS trail layer while
also introducing wrong-trail selection and production rate-control risks.

The experimental adapter demonstrated controlled failure handling, attribution,
and provider-boundary design. Its code was removed after the product decision;
the validation notes preserve the evidence.

## Initial Live Feasibility Check (Superseded)

The single-trail check below justified building a small experiment; it did not
validate provider reliability. The later 24-trail evaluation supersedes its
original positive interpretation.

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
distance without separate validation. The initial plan was therefore to use the
result only for identity and coordinates while preserving missing fields and
manual entry. The later reliability study rejected even that limited supported
role.

## Provider Comparison

| Candidate | Useful capability | Constraint | B-01 role |
|---|---|---|---|
| Nominatim public service | Free-form name search, country and view-box restriction, OSM identity, coordinates, address details, names, and extra tags | Failed the 24-trail reliability gate; no complete route/planning facts; strict public-service limits; process-local queue is insufficient across Vercel instances | Rejected as a supported B-01 source; retain only as experiment evidence |
| Overpass public instances | Detailed tag, way, relation, and geometry queries, including hiking routes and paths | Shared best-effort infrastructure with load shedding; public documentation warns against relying on the public instances as a general application backend; 429 and 504 responses are expected failure modes | Do not make it a required runtime dependency for the first slice; reconsider only for a bounded enrichment experiment or a managed/self-hosted service |
| NPS API | Authoritative park, alert, place, and things-to-do content with a server-side API key | Default limit is 1,000 requests per hour; coverage does not provide a consistent national trail-statistics catalog | Continue as official enrichment, not the base public trail lookup provider |
| Recreation.gov RIDB | Federal recreation areas and facilities; facilities may represent trails and include location/organization metadata | Requires an API key and acceptance of the access agreement; coverage and fields are oriented around federal recreation inventory and do not consistently provide full hiking metrics | Keep as a possible federal-result supplement, not the first general lookup provider |
| Authoritative NPS plus USGS import process | Strong official/computed provenance; USGS supplied intended identities/components for 20/24 study trails | Manual or preprocessing-heavy; USGS geometry can be duplicated, branched, incomplete, or conflicting and requires reconciliation | Selected for the Tetons-first bounded slice; approve each import individually |
| AllTrails | Useful independent route/value plausibility comparison with recognizable user-facing hike definitions | Commercial third-party listing; values can reflect a different trace or access point and are not authoritative agency data | Manual comparison-only import gate; never populate or override TrailPack facts |
| Manual entry | Always available and does not misidentify a trail | Requires user effort and may lack source-backed planning fields | Required fallback for no result or any trail that fails review |

## Rejected Prototype Controls

The experimental implementation enforced or tested the following controls.
They explain the prototype and must not be read as approval to ship it:

- Server-side request boundary.
- Explicit user submit; no client-side autocomplete.
- Process-local one-request-per-second serialization; application-wide
  enforcement was not proven.
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

Historical prototype-only non-secret configuration:

- `TRAIL_LOOKUP_BASE_URL`: defaults to the evaluated Nominatim service and makes
  the experimental provider switchable without a client update.
- `TRAILPACK_CONTACT_URL`: public repository or project contact URL used in the
  identifying user agent.

No OpenStreetMap API key was required for the evaluated public Nominatim
endpoint. These settings are not production requirements because the provider
was rejected and its runtime code was removed. The NPS/USGS import adds no new
environment variables. Do not add AI, OAuth, or database credentials during
B-01.

## Sources

- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Nominatim search API: https://nominatim.org/release-docs/latest/api/Search/
- OpenStreetMap copyright and ODbL attribution: https://www.openstreetmap.org/copyright
- Overpass public-instance limits: https://dev.overpass-api.de/overpass-doc/en/preface/commons.html
- NPS API guides: https://www.nps.gov/subjects/developer/guides.htm
- NPS API documentation: https://www.nps.gov/subjects/developer/api-documentation.htm
- USGS National Digital Trails data: https://www.usgs.gov/national-digital-trails/data
- USGS trail dataset access: https://www.usgs.gov/national-digital-trails/how-access-or-view-usgs-trails-dataset
- Current USGS trails layer: https://carto.nationalmap.gov/arcgis/rest/services/transportation/MapServer/37
- NPS Colter Bay Lakeshore Trail: https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm
- NPS Two Ocean Lake Trailhead: https://www.nps.gov/places/000/two-ocean-lake-trailhead.htm
- NPS Two Ocean Lake activity page: https://www.nps.gov/thingstodo/twoocean.htm
- AllTrails Lakeshore Trail comparison: https://www.alltrails.com/trail/us/wyoming/colter-bay-lakeshore-trail
- AllTrails Two Ocean Lake Trail comparison: https://www.alltrails.com/trail/us/wyoming/two-ocean-lake-trail
- Recreation.gov RIDB documentation: https://ridb.recreation.gov/docs
- Recreation.gov RIDB access agreement: https://ridb.recreation.gov/access-agreement-ridb
- Corrected 24-trail reliability comparison:
  `../superpowers/validation/2026-07-17-cse-499b-nominatim-reliability.md`

## Next Implementation Slice

Complete B-01 UAT with both imported Tetons trails and the no-result manual
fallback. If the original requirement is interpreted as requiring a live
external provider on every search, record instructor approval for the saved
public-source import contingency before closing B-01. After that gate, expand
within Grand Teton one reviewed trail at a time before considering other parks.
