# Consolidated Grand Teton expansion and scope alignment

The owner approved adding the remaining reviewed Grand Teton routes as one batch,
with one consolidated acceptance stage rather than individual trail signoffs.

Proposal v9 in the local Project Proposals folder treats expanded trail coverage
as optional beyond a small initial supported set. The active July 16 requirements
and schedule retain day-hike scope and explicitly exclude profile count as a
primary completion criterion. Their August closeout remains separate from this
owner-requested product expansion; 39 routes were not an original graduation
requirement or a reopened security/authentication milestone.

The source now represents each of the 39 Grand Teton Hiking pages in the dated
September 4 inventory with one selected itinerary. It excludes the two adjacent
Parkway pages, unofficial routes, alternate starts not explicitly admitted,
overnight equipment, climbing, and navigation. Long alpine routes carry planning
limitations. Five published Death Canyon-start itineraries retain a dated access
restriction rather than pretending their old distances apply to an open alternate.

Local evidence: 39 catalog/photo passes, 39 live NPS source passes, 715 unit
tests, 5,000 stress cases with no invariant failures, lint/type checking, and
production build. All 98 Firefox/axe desktop/mobile flows pass, and rendered
photo crops were reviewed across the batch. Hosted Preview, owner approval,
and protected release remain pending. No authentication or second-account
walkthrough is required for this catalog change.

See the [admission record](../../data/grand-teton-bulk-2026-09-05.md) and
[coverage boundary](../../data/grand-teton-coverage.md) for source-specific detail.

## Follow-up planning

The owner subsequently requested a deferred product roadmap, ordered as complete
access-route choices, repository/documentation cleanup, then interactive park
and trail discovery. The [roadmap](../../roadmap.md) records that scope without
implementing it. It does not reopen the completed academic closeout or replace
the existing day-hike and guarded-review boundaries. In particular, grouping
destinations with several access routes is future work, not a capability claimed
for the current 39-itinerary catalog.

## September 7 implementation follow-up

Priority 1 has begun on `codex/inspiration-point-access-routes`, separate from
the catalog PR. The first example adds a round-trip shuttle profile under the
existing Inspiration Point discovery name, taking the local source to 40 route
profiles across 39 discovery entries. Existing walking IDs and saved facts stay
unchanged. This follows the owner's approved route roadmap, remains optional
post-closeout product work, and does not reopen academic milestones, add map
navigation, or change authentication/AI quota policy.

The approved mixed-route follow-up adds both one-way-boat directions locally,
bringing the source to 42 profiles across the same 39 discovery entries. Two
profiles use labeled mapped estimates rather than invented NPS mixed-route
facts; gain remains unverified. The existing day-hike and post-closeout scope
is unchanged. This remains Priority 1 product work, not a new academic
completion requirement or authorization to merge.

The September 9 completion batch admits four more NPS-published round-trip
shuttle variants: Hidden Falls, Forks of Cascade Canyon, Lake Solitude and
Hurricane Pass. The source now contains 46 profiles across the same 39 discovery
entries: 44 NPS-backed profiles and two calculated Inspiration Point routes.
Each added profile selects its exact NPS shuttle subsection and map, uses the
west-dock weather reference and retains a reproducible USGS corridor comparison.
Three other official variants remain deferred because retained complete-route
geometry is unavailable; no route was inferred from its name or headline facts.
Final local evidence for the combined branch: 46 offline catalog/photo checks,
44 live NPS comparisons, 749 unit tests, 5,000 system stress cases, lint, type
checking, production build, and all 116 Firefox/axe desktop/mobile flows pass.

Follow-up status (2026-09-09): those three holds were resolved by a new retained
USGS capture and admitted as `grand-view-point-jackson-lodge`,
`marion-lake-rendezvous`, and `moose-ponds-loop`. The complete route audit also
adds Granite Canyon Valley/Rendezvous and Open Canyon Rendezvous variants. The
current branch totals are recorded in the roadmap and changelog; the paragraph
above remains the historical checkpoint result.
