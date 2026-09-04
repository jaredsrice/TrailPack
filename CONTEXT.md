# TrailPack

TrailPack is a single-context hiking-planning prototype. It turns a supported
trail plus trip context into a traceable packing recommendation whose facts,
reasons, and source labels stay visible to the user.

## Trail Catalog

**Supported park**:
A park TrailPack currently knows how to browse and narrow into supported trails.
_Avoid_: destination, area, region

**Supported trail**:
A trail in TrailPack's verified catalog that can run through the current
end-to-end flow, from selection to packing output.
_Avoid_: hike, route, saved trail

**Curated profile**:
One of the original manually validated trail profiles.
_Avoid_: hard-coded trail, default trail

**Verified public-source import**:
A trail added through the bounded NPS/USGS reconciliation workflow. NPS facts
remain authoritative, USGS geometry remains a labeled comparison, and the saved
profile retains source records, retrieval status, confidence, and missing fields.
_Avoid_: live result, scraped trail, automatic import

**Trail profile**:
The normalized description of one supported trail, including display stats,
provenance, and confidence notes.
_Avoid_: trail object, raw trail data, record

**Trail onboarding draft**:
A proposed trail's planning facts, source evidence, photograph, and review notes
collected for catalog admission. A complete draft is not yet a supported trail.
_Avoid_: approved trail, automatic import, live lookup

**Approved trail definition**:
The reviewed identity, geometry comparison, coordinate provenance, photograph,
and source-check metadata for one catalog trail. Combined with its managed NPS
facts, it produces the same profile and supporting records for both original
and newly admitted trails. A definition alone is not live condition evidence.
_Avoid_: second official snapshot, runtime lookup, independent photo registry

**Managed NPS snapshot**:
The versioned file containing refreshable official NPS values and optional
trail-specific accessibility text for existing supported trails. A scheduled
job may update this file after two matching bounded reads and full verification,
but it cannot add catalog entries or rewrite USGS evidence.
_Avoid_: scraper database, automatic import

**Manual entry fallback**:
The unsupported-hike path used when TrailPack does not have a supported trail
ready for the full flow.
_Avoid_: custom trail, open search mode

## Trip Context

**Demo scenario**:
A saved example or explicitly unknown weather-and-alert context used as a
deterministic fallback for a supported trail. A new admission does not imply
that a saved forecast or a current alert check exists.
_Avoid_: mock response, random sample

**Live alert context**:
The current bounded NPS alert response for the selected supported trail's park.
When it is unavailable, TrailPack keeps the demo scenario visibly labeled as a
fallback rather than presenting it as current NPS data.
_Avoid_: confirmed trail condition, real-time trail status

**Trip context**:
The hike-specific details that shape a recommendation beyond the trail profile,
such as planned date, expected duration, and reported trail conditions.
_Avoid_: form state, metadata

**Missing detail prompt**:
A user-facing request for trip context that would materially improve the packing
recommendation.
_Avoid_: warning, validation error

## Provenance

**Official value**:
A displayed trail fact taken from the primary National Park Service source for a
supported trail.
_Avoid_: ground truth, final value

**Computed estimate**:
A derived trail fact from a secondary source such as USGS, shown separately from
official values when it is useful for comparison or gap-filling.
_Avoid_: replacement value, exact match

**Source confidence**:
The explanation of how comfortable TrailPack is showing the current trail facts,
especially when official and computed values agree, bridge each other, or
conflict.
_Avoid_: certainty score, trust rating

**Source label**:
A user-visible provenance tag that explains why a fact or packing item appears,
such as official, forecast-based, user-provided, or inferred.
_Avoid_: badge, status

**Official accessibility information**:
Trail-specific terrain, slope, surface, and obstacle wording published in an
NPS accessibility block and shown with its source. It describes reported
conditions but does not certify that a trail meets an accessibility standard.
_Avoid_: accessible trail, ADA rating

## Recommendation Output

**Packing recommendation**:
The complete output for a selected supported trail, consisting of essential
items, optional items, missing detail prompts, and a confidence note.
_Avoid_: checklist, result

**Packing list**:
The visible presentation of the essential and optional items within a packing
recommendation.
_Avoid_: recommendation engine

**Packing-list generation**:
A deliberate Generate or Update action that snapshots the current trail, trip,
weather, and alert context before producing one packing recommendation.
_Avoid_: field edit, automatic recalculation

**Packing item**:
One recommended thing to bring, paired with a reason and provenance labels.
_Avoid_: gear row, line item

## Guarded AI

**Rule-based baseline**:
The complete packing decision produced before AI is considered. It owns the
packing set, essential/optional priority, safety behavior, and source labels.
_Avoid_: AI input suggestion, draft list

**Guarded AI review**:
Explanatory text that may summarize or clarify a rule-based baseline only after
runtime schema, packing-set, provenance, cross-trail, and safety validation.
_Avoid_: AI recommendation, generated packing list

**Review generation identifier**:
A per-generation UUID used by the server and database to recognize retries of
the same packing-list generation without spending another account allowance or
contacting the provider twice.
_Avoid_: user id, request counter

**Live AI outcome**:
The recorded result of one guarded-review attempt, including accepted, rejected,
timed out, provider quota limited, account rate limited, duplicate generation,
sign-in required, missing key, invalid response, or provider error.
_Avoid_: success flag, AI status

**Template fallback**:
Deterministic review text rebuilt from the rule-based baseline whenever live or
fixture AI text is unavailable or fails validation.
_Avoid_: error message, degraded recommendation
