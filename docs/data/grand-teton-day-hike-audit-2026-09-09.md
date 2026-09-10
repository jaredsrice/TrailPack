# Grand Teton day-hike route audit — 2026-09-09

This audit closes the current route-coverage pass. It reviews named day hikes in
Grand Teton National Park, the adjoining NPS-managed John D. Rockefeller Jr.
Memorial Parkway, and NPS-published Teton Village starts. It does not treat the
whole geological Teton Range as one product catalog.

The machine-readable [candidate register](grand-teton-day-hike-audit-2026-09-09.json)
records every admission, evidence hold, and exclusion. AllTrails was used to
discover and compare familiar routes. NPS facts and NPS-origin USGS geometry
remain the admission authority.

The current proposal called for a small initial supported set and explicitly did
not promise perfect coverage of every trail. This audit is approved post-project
expansion work: it broadens NPS-managed Teton coverage while preserving the
proposal's day-hike, no-navigation, and evidence-quality limits.

## Decisions to review

These are the assumptions the owner authorized TrailPack to make and asked to
have marked for later review:

1. **Geographic boundary:** include Grand Teton, the adjoining Parkway, and
   NPS-published Teton Village starts; exclude routes that exist only in other
   forests, wilderness areas, or resorts.
2. **Technical boundary:** include scores 1–5 and exclude scores above 5.
   Endurance is assessed separately. Score 5 may include intermittent hands-on
   movement, boulder fields, unmaintained tread, or limited exposure when the
   warnings are explicit. Score 6 begins sustained scrambling, consequential
   off-trail routefinding, or meaningful exposure.
3. **Distinct-route rule:** add a profile when its start, access, named
   turnaround, return plan, or loop versus out-and-back form materially changes.
   Do not add arbitrary partial turnarounds or every compound permutation.
4. **Short routes:** named beginner walks remain candidates even when they are
   only 0.1–1.3 miles.
5. **Closures:** a closed route may remain only when its closure is obvious and
   maintained. Closed statistics cannot be reused for a different start.
6. **Future route builder:** a custom route builder is useful future work, but
   it is outside this batch.

## Added in this batch

| Route | NPS distance / gain | Reviewed USGS corridor | Route form |
|---|---:|---:|---|
| Grand View Point from Jackson Lake Lodge | 5.8 mi / 950 ft | 5.679 mi | Out-and-back |
| Moose Ponds Loop | 3.4 mi / 170 ft | 3.090 mi | Lollipop loop |
| Granite Canyon from Valley Trail Access | 15.0 mi / 3,250 ft | 14.982 mi | Out-and-back |
| Granite Canyon from Rendezvous Mountain | 12.9 mi / 1,480 ft gain | 12.902 mi | One-way to Teton Village |
| Marion Lake from Rendezvous Mountain | 14.7 mi / 3,990 ft | 14.670 mi | Summit loop |
| Open Canyon from Rendezvous Mountain | 19.4 mi / 3,440 ft | 19.217 mi | One-way to Teton Village |

The source pages, route sections, trailhead forecast references, photographs,
and exact corridor records are stored in the same definition format as the rest
of the catalog. The retained `grand-teton-route-expansion-2026-09-09.geometry.json.gz`
adds nine NPS-origin USGS records that were absent from the earlier selected
route archive. Tests combine it with that earlier archive and recalculate every
new distance.

Rendezvous Mountain routes state what their mileage includes. The Marion Lake
loop begins and ends at the summit, so summit access and the descent to Teton
Village are separate. The Granite and Open Canyon routes begin at the summit
and finish at Teton Village. Hikers must check tram or resort-trail access,
operating schedules, snow, and their complete transport plan.

## Evidence holds

Twenty-six technically eligible discoveries remain in the candidate register.
They are not supported profiles because at least one required element is absent:
complete NPS route facts, a matching start and return form, or a reproducible
public corridor. This includes Delta Lake. NPS recognizes and is improving that
informal route, but does not publish the complete distance, gain, duration, and
difficulty profile TrailPack requires. AllTrails alone cannot fill those fields.

Polecat Creek Loop and Flagg Canyon are within the approved boundary and have
complete NPS facts. Polecat is absent from the current USGS trail layer; Flagg
has only a short Snake River access segment there. They remain explicit geometry
holds rather than being excluded geographically.

The register also retains eight earlier evidence holds, including Paintbrush
Divide, Avalanche Divide, Glade Creek, and Old Patriarch. Routes above score 5,
multi-day backpacking itineraries, arbitrary permutations, drives, paddles, and
winter-only routes are excluded from the current product boundary.

## Maintenance rule

Re-run the NPS discovery and source-integrity checks whenever the catalog is
expanded and review the candidate register when official route pages or USGS
geometry change. Recheck all closure notes before release. Passing automated
checks confirms stored evidence consistency; it does not certify field safety
or current access.
