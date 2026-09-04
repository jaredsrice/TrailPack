# One approved trail definition and managed official facts

Date: 2026-09-03 (UTC)

Status: Implemented in the seven-trail catalog update

## Context

Trail admission previously required independent profile, park, photograph,
fallback, and source-policy registrations. Adding a reusable draft alone did
not prevent those runtime copies from drifting. The guarded NPS refresh also
has an important security boundary: its publisher accepts one validated JSON
artifact and must not gain permission to rewrite arbitrary application files.

## Decision

Keep one reviewed metadata definition per trail in `data/trails/`, registered
once in its index. Keep refreshable NPS facts only in the existing managed
snapshot. A small pure compiler combines the two and derives the runtime
profile, park membership, photograph, source policy, and unknown-data fallback.
Both original and newly admitted trails use this path.

The offline checker owns detailed schema and local-photo validation; the runtime
compiler does not import that validator. Catalog tests require exact registration,
matching source URLs, no orphan snapshots, and complete downstream records.

## Consequences

There are two intentionally different inputs, not two copies of official facts.
NPS refresh still updates only its existing artifact and cannot silently rewrite
geometry comparisons or photo credits. Moving every field into the per-trail
files was rejected because it would duplicate facts or broaden the privileged
publisher. Existing example conditions remain explicit fixtures; new admissions
have unknown conditions until a provider returns usable live context.

The [onboarding guide](../trail-onboarding.md) documents the small registration
surface and troubleshooting. The [admission record](../data/teton-expansion-2026-09-03.md)
distinguishes retained historical evidence from newly verified data.
