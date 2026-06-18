# TrailPack

TrailPack is a single-context hiking-planning prototype. It turns a supported
trail plus trip context into a traceable packing recommendation whose facts,
reasons, and source labels stay visible to the user.

## Trail Catalog

**Supported park**:
A park TrailPack currently knows how to browse and narrow into supported trails.
_Avoid_: destination, area, region

**Supported trail**:
A curated trail that TrailPack can route through its current end-to-end flow,
from selection to packing output.
_Avoid_: hike, route, saved trail

**Trail profile**:
The normalized description of one supported trail, including display stats,
provenance, and confidence notes.
_Avoid_: trail object, raw trail data, record

**Manual entry fallback**:
The unsupported-hike path used when TrailPack does not have a supported trail
ready for the full flow.
_Avoid_: custom trail, open search mode

## Trip Context

**Demo scenario**:
A saved weather-and-alert context used to make the prototype deterministic for a
supported trail.
_Avoid_: mock response, random sample

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

## Recommendation Output

**Packing recommendation**:
The complete output for a selected supported trail, consisting of essential
items, optional items, missing detail prompts, and a confidence note.
_Avoid_: checklist, result

**Packing list**:
The visible presentation of the essential and optional items within a packing
recommendation.
_Avoid_: recommendation engine

**Packing item**:
One recommended thing to bring, paired with a reason and provenance labels.
_Avoid_: gear row, line item
