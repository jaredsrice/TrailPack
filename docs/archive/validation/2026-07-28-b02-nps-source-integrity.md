# B-02 Guarded NPS Source Refresh Validation

Date: 2026-07-28 (America/Boise)
Requirement: B-02 supporting closeout task
Branch: `codex/b02-guarded-live-ai`
Status: Complete; live refresh and protected pull-request delivery passed

## Outcome

TrailPack now refreshes the saved official NPS facts for its existing supported
trails without requiring routine manual comparison. The local automatic run at
`2026-07-29T04:50:54.196Z` returned HTTP 200 for all five official pages,
reported all five profiles unchanged, and advanced the managed snapshot's check
date with zero source-value changes. A final repeat at
`2026-07-29T05:00:31.863Z` returned `UNCHANGED`, proving that another run on the
same check date creates no unnecessary snapshot write.

The same run captured trail-specific NPS accessibility information for Jenny
Lake Loop, String Lake Loop, and Taggart Lake. Colter Bay Lakeshore Trail and
Two Ocean Lake Loop currently have no matching NPS accessibility block, so the
app does not invent one.

| Trail | Live result | Automatically managed fields |
|---|---|---|
| Jenny Lake Loop | Pass: unchanged | Distance, gain, duration, difficulty, route, accessibility |
| String Lake Loop | Pass: unchanged | Distance, gain, duration, difficulty, route, accessibility |
| Taggart Lake | Pass: unchanged | Distance, gain, duration, difficulty, route, accessibility |
| Colter Bay Lakeshore Trail | Pass: unchanged | Distance, gain, duration, difficulty; accessibility when published; route remains outside this page's parser policy |
| Two Ocean Lake Loop | Pass: unchanged | Distance, gain, duration, difficulty, route; accessibility when published |

## Architecture And Write Scope

- `nps-source-integrity.ts` is the comparison module. It normalizes official
  HTML, selects the named trail's metric block, extracts the accessibility
  block when present, and returns structured observations and a report. It has
  no network, filesystem, Git, or catalog-write capability.
- `nps-source-refresh.ts` is the guarded update module. Given comparison reports
  and the current snapshot, it either produces one complete replacement
  snapshot or blocks without changing anything.
- `check-nps-source-integrity.ts` is the network/filesystem adapter. Read-only
  mode writes reports. Refresh mode may write only
  `src/features/trailpack/data/nps-source-snapshots.json`.
- Trail-profile construction reads official values, source-check dates, and
  optional accessibility text from that snapshot. USGS geometry, confidence
  policies, recommendation rules, and supported-trail membership remain in
  separately maintained code.
- The selected-trail interface shows `Accessibility and terrain` only when the
  snapshot has official NPS text. It links to the source and states that terrain
  information is not an accessibility-certification claim.

## Guarded Automatic Update

A normal NPS change no longer waits for routine manual approval:

1. Fetch every saved official NPS page sequentially.
2. Extract and compare the managed fields.
3. If any field changed, fetch only the affected pages again.
4. Require the same changed fields and same values in both reads.
5. Enforce HTTPS `nps.gov` identity, supported types, duration and text formats,
   absolute and relative numeric bounds, trail-name identity for accessibility
   text, and a maximum 15% distance difference from saved USGS geometry.
6. Write a complete managed snapshot only when every affected trail passes.
7. Run lint, all unit tests, the recommendation stress matrix, type checking,
   and the production build.
8. Commit only the snapshot file to a unique automation branch and open a pull
   request when every verification gate passes. Protected `main` remains the
   only release path.

The scheduled job runs at 15:17 UTC on the first day of each month. It also
supports manual dispatch, uploads its report for 90 days, and requests only
`contents: write` and `pull-requests: write`. The checkout is pinned to the
repository's default branch. The bot uses `GITHUB_TOKEN` to push only its
automation branch and open the reviewable refresh pull request. The refresh
workflow performs the complete verification suite before that branch is
published, and the normal required checks run again on the pull request.

## Conditions That Still Block

Automation stops without writing when it cannot establish a trustworthy value:

- an NPS page is missing, unavailable, non-HTML, too large, or redirects away
  from official HTTPS `nps.gov`;
- a required saved field can no longer be parsed;
- the two reads disagree about either the fields or their values;
- a numeric value exceeds the automatic bounds or the NPS distance moves more
  than 15% from the reconciled USGS comparison;
- difficulty, route, duration, accessibility identity, or accessibility length
  falls outside supported formats;
- a managed snapshot or per-trail parser policy is missing; or
- lint, tests, type checking, build, commit, or push fails.

These are exceptions requiring investigation because no program can safely
decide whether an ambiguous page is a real trail change or a parser failure.
Routine confirmed changes inside the bounds are automatic.

## Access Controls

- Only the five `npsSourceUrl` values already attached to approved catalog
  profiles are requested; the job never crawls links or discovers trails.
- Requests are sequential with a 1.5-second delay, a 20-second timeout,
  no-cache request headers, a descriptive user agent, HTML validation, and a
  1 MB response limit.
- NPS `robots.txt` was reviewed on 2026-07-28. Its exclusions do not cover the
  saved `/thingstodo/` and `/places/` pages.
- The job requires no provider secret and prints no environment-variable values.
- Nothing runs in the user-facing request path.
- The original direct-push design was superseded when `main` protection became
  the repository policy. PR
  [#37](https://github.com/jaredsrice/TrailPack/pull/37) changed delivery to an
  automation branch plus pull request. PR
  [#38](https://github.com/jaredsrice/TrailPack/pull/38) then proved the full
  path by merging a verified automated snapshot update without bypassing
  `Protect Main`.

## Test Evidence

Fixtures and pure-module tests cover:

- unchanged values and official accessibility text;
- changed values without profile mutation;
- missing fields and changed HTML layout;
- a multi-route page and a route statement separated from its metric block;
- every supported profile having a parser policy and managed snapshot;
- one-read changes requiring confirmation;
- confirmed bounded value and accessibility updates;
- disagreement between repeated reads;
- implausible changes remaining unapplied; and
- human-readable comparison and refresh reports.

The first implementation run also caught a real parser-layout limitation:
Taggart Lake's route wording sat outside the selected metric block. It was
classified as a parser failure instead of a data change, fixed with an
alias-aware route lookup, and protected with a regression fixture. No Taggart
value was changed.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Focused source and profile tests | Pass | 4 files, 32 tests |
| Read-only live comparison | Pass | 5/5 unchanged; all responses HTTP 200 |
| Guarded local refresh | Pass | Refreshed check date; 0 source-value changes |
| Accessibility extraction | Pass | Three official notes matched; two pages correctly reported no NPS-specific note |
| Full lint | Pass | `npm run lint` |
| Full TypeScript check | Pass | `npm run typecheck`; route types generated successfully |
| Full Vitest suite | Pass | 19 files, 205 tests |
| Firefox accessibility tests | Pass | 3 Firefox/axe tests, including the populated accessibility panel |
| Firefox rendered QA | Pass | Desktop 1440×1000 and mobile 390×844; panel visible after Jenny Lake selection; no console errors or warnings |
| Production build | Pass | Next.js 15.5.22 compiled `/` and all three API routes |
| Recommendation stress matrix | Pass | `npm run scenario:stress`; regenerated the 27-scenario report |
| Protected delivery correction | Pass | PR #37 replaced direct push with an automation pull request |
| First automated snapshot PR | Pass | PR #38 merged as `22639af` after required checks |

The local generated report is ignored by Git. Workflow report artifacts remain
available for 90 days. Scheduled workflows run from the default branch in UTC,
may be delayed under high load, and may be disabled after 60 days of inactivity
in a public repository.

## References

- [GitHub Actions schedule event](https://docs.github.com/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub Actions token behavior](https://docs.github.com/actions/concepts/security/github_token)
- [GitHub artifact storage](https://docs.github.com/actions/using-workflows/storing-workflow-data-as-artifacts)
- [NPS robots.txt](https://www.nps.gov/robots.txt)
