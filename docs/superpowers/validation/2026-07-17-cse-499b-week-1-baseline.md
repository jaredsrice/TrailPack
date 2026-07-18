# TrailPack CSE 499B Week 1 Baseline

Date: 2026-07-17  
Status: Complete - Week 1 deployment gate closed  
Controlling requirements: `docs/superpowers/specs/2026-07-16-cse-499b-requirements.md`  
Controlling schedule: `docs/superpowers/plans/2026-07-16-cse-499b-schedule.md`

## Re-Baseline Result

CSE 499B starts from the completed CSE 499A baseline rather than reopening
recommendation polish. The active work is B-01 permission-compliant public trail
lookup. B-02 live AI, B-03 private saved results, and B-04 security verification
remain sequenced behind it.

The active checkout is:

```text
/Users/jaredrice/Developer/Senior Project Local/TrailPack
```

The older OneDrive `TrailPack/` directory contains only an empty `outputs/`
folder and is not the working repository. Future coding and verification should
use the local Developer checkout.

## Repository Evidence

- Local branch before Week 1 work: `main`
- Local and GitHub `main` commit: `c77158b580351024e43edba9388a4523f5c587f6`
- Commit subject: `docs: close CSE 499A and plan 499B (#24)`
- Worktree before the Week 1 branch: clean
- Working branch: `codex/499b-week1-baseline`
- GitHub repository: https://github.com/jaredsrice/TrailPack

Verification rerun on 2026-07-17:

- `npm test -- --run`: 126 tests across 8 files passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with the page plus weather and alert routes generated.

The test command reported a non-blocking Vitest notice that Vite now supports
TypeScript path resolution natively. This is not part of the B-01 scope unless it
becomes a defect or approved maintenance issue.

## Deployment Evidence

A reachable public production deployment is confirmed:

- Production URL: https://trailpack-ten.vercel.app
- Vercel project: `trailpack` in the owner's Hobby scope.
- Vercel domain state: `Valid Configuration` and `Production`.
- GitHub deployment environment: `Production` with a successful status for
  commit `c77158b580351024e43edba9388a4523f5c587f6`.
- Terminal verification on 2026-07-17 returned HTTP `200`, the page title
  `TrailPack`, Vercel response headers, and Next.js-rendered output.

The generated deployment URL
`trailpack-f3droyy6c-jared-s-rice.vercel.app` remains behind Vercel
authentication and is not the public demo URL. The shorter
`trailpack.vercel.app` domain serves a different application and does not belong
to this TrailPack senior-project deployment. Use
`https://trailpack-ten.vercel.app` in project records and demonstrations.

The repository was connected and deployed through Vercel's GitHub import flow,
so a local `.vercel/project.json` file and a locally installed Vercel CLI are not
required for this verified baseline.

## Environment And Account Inventory

Current code references one server-side secret:

- `NPS_API_KEY`: optional NPS alert retrieval.

B-01 does not require a new secret for the selected bounded Nominatim path. It
does require non-secret, server-side configuration for a switchable provider
base URL and an identifying public project/contact URL.

Do not create AI provider, OAuth, or database credentials during B-01. Those
belong to B-02 and B-03 after their provider and ownership decisions are
recorded.

## GitHub Backlog

The approved dependency-ordered backlog is published:

1. [#25 B-01 public trail lookup](https://github.com/jaredsrice/TrailPack/issues/25) - active and ready for agent work.
2. [#26 B-02 guarded live AI](https://github.com/jaredsrice/TrailPack/issues/26) - blocked by #25.
3. [#27 B-03 Google login and private saved results](https://github.com/jaredsrice/TrailPack/issues/27) - blocked by #26.
4. [#28 B-04 cybersecurity verification](https://github.com/jaredsrice/TrailPack/issues/28) - blocked by #25 through #27 and the release-candidate gate.

Only #25 is labeled `ready-for-agent`. The future requirements remain
`needs-triage` so the project keeps one active implementation slice.

## Public Trail Source Gate

The first B-01 slice will use bounded, directly user-triggered Nominatim search
under the public-service policy. The provider decision, operating constraints,
live feasibility evidence, comparison, and fallback requirements are recorded
in `docs/data/2026-07-17-cse-499b-public-trail-source-feasibility.md`.

Public Overpass instances are not selected as a required production backend.
NPS remains official enrichment, RIDB remains a possible federal supplement,
and the curated NPS-plus-USGS profiles keep priority over external results.

## Proposal Alignment

`Project Proposals/TrailPack_Proposal_v9.docx` supports a deployed, demo-ready
application with permission-compliant public data, missing-detail completion,
and fallback behavior. The verified Vercel production deployment satisfies that
hosting direction.

The proposal treated public lookup beyond the supported catalog as a
nice-to-have and scheduled guarded AI earlier in CSE 499B. The instructor-aligned
499B requirements and schedule deliberately supersede those details: B-01 public
trail lookup is now required and must pass before B-02 live AI begins. This is a
documented continuation-scope change, not untracked implementation drift.

## Week 1 Exit Status

| Output | Status | Evidence |
|---|---|---|
| Review 499B requirements and schedule | Complete | July 16 requirements, schedule, closeout, README, changelog, and proposal v9 reviewed |
| Confirm code baseline | Complete | Local and GitHub commit match; full automated baseline passes |
| Record environment and provider accounts | Complete for current B-01 scope | `NPS_API_KEY` plus proposed non-secret Nominatim configuration recorded without values |
| Open B-01 through B-04 issues | Complete | GitHub issues #25 through #28 |
| Select or narrow the public source | Complete for first slice | Bounded Nominatim decision with policy and fallback constraints |
| Confirm reachable deployment | Complete | Public production URL `https://trailpack-ten.vercel.app`; HTTP 200 and `TrailPack` title verified; GitHub production deployment succeeded |

## Next Action

Implement #25 from the provider boundary through one attributed search result,
missing-detail completion, rule-based packing output, and
no-result/provider-failure fallback. Do not begin B-02 until #25 passes its
acceptance and walkthrough criteria.
