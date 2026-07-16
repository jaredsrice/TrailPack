# Week 14 Scope And Status

Historical snapshot: this document was superseded by
`docs/superpowers/validation/2026-07-16-cse-499a-closeout.md` and the CSE 499B
requirements and schedule linked there. Its candidate backlog is not the current
499B plan.

Date: 2026-07-10
Project: TrailPack
Branch: `codex/stress-test-recommendations`

## Source Documents Checked

- `Project Proposals/TrailPack_Proposal_v9.docx`
- `Requirements Docs/Final/w12 Requirements Spec v6.docx`
- `Requirements Docs/Final/TrailPack_Week12_Requirements_Specification_Draft.md`
- `TrailPack/README.md`
- `TrailPack/CHANGELOG.md`
- `TrailPack/docs/superpowers/validation/2026-07-10-week-13-14-stress-scenario-results.md`

## Current Position

TrailPack is now past the core prototype-build phase and is in Week 14 closeout
territory. The Week 12 requirements spec is the most useful grading contract.
The original proposal remains useful background, but it is broader than the
current baseline because it allowed broader trail search and public lookup where
feasible. The requirements spec intentionally narrowed the baseline to curated
supported hike profiles plus manual fallback, with public trail lookup and
expanded coverage left as stretch work.

The current app supports the intended CSE 499A demo path: a user can choose one
of three supported Grand Teton hikes, review trail/weather/daylight/alert
context, add trip details, and receive an essential/optional packing list with
concrete recommendations, explanations, source labels, and safe fallback
behavior. Manual entry remains available for unsupported hikes.

## Scope Decisions

- Keep curated supported profiles as the baseline instead of broad live trail
  lookup. This keeps the demo permission-compliant, source-labeled, and stable.
- Keep the rule engine as the source of truth. AI is allowed to summarize,
  clarify, or review structured output, but it cannot create the packing list or
  override source labels.
- Use saved fixtures when live services are unavailable or unstable. This is
  acceptable for weather, alerts, daylight, and guarded AI validation as long as
  retrieval status and labels are visible.
- Keep guest access as the baseline. Google login, saved results, and email or
  export are stretch features, not blockers.
- Do not invent route-specific water sources, microspike rental counters, or
  trail conditions. The app now gives generic water-treatment and traction
  planning guidance, while route-specific logistics remain future work unless
  verified data exists.
- Treat abnormal planned durations, weather risks, and official danger alerts as
  trip-level signals. Critical dangers such as closure, flash flood, lightning,
  and extreme heat now create a trip-safety decision instead of being handled
  like ordinary packing adjustments.

## Must-Have Requirements Status

| Requirement | Status | Evidence |
|---|---|---|
| MH-01 Supported Hike Input Workflow | Met | Jenny Lake Loop, Taggart Lake, String Lake Loop, supported trail selection, and manual fallback are implemented. Manual distance, elevation gain, route type, expected duration, and trail conditions affect output. |
| MH-02 Weather And Official Alert Context | Met | Saved demo contexts, live route handlers, visible context states, daylight fixtures, unavailable handling, and the Taggart 2026 NPS trail-work alert fixture are implemented. |
| MH-03 Rule-Based Baseline Packing List | Met | Essential and optional packing output works without AI for every supported profile and manual entry. |
| MH-04 Recommendation Explanations And Source Labels | Met | Accordion rows show the clear recommendation first, with why, context notes, source labels, and official source links available inside the dropdown. Official labels are guarded so they require a source URL. |
| MH-05 Guarded AI Contract And Fallback Validation | Met by accepted fixture path | The app has a fixture-first guarded AI review path with validation and template fallback. Live AI remains optional under the requirements spec. |
| MH-06 Fallback And Uncertainty Handling | Met | Manual fallback, missing-detail prompts, unavailable context states, AI fallback, and source labels are implemented and tested. |

## Proposal Alignment

The proposal said TrailPack would help day hikers use trail facts, weather, and
available public context to generate a concise packing list with explanations.
That core goal is satisfied by the current prototype.

The proposal also discussed broader search, public data lookup, and additional
regions. Those remain intentionally deferred because the Week 12 requirements
spec narrowed the baseline around source-backed curated profiles and manual
fallback. This is a scope reduction, not a failure: the app still solves the
same planning problem while avoiding unreliable or permission-risky data paths.

## What Changed From Earlier Output

The hiker-scenario review exposed that the packing list was becoming more
specific but still had beginner-facing gaps. The current branch addresses the
most actionable issues:

- Long-day water now uses realistic frontcountry carry ranges instead of
  indefinitely scaling by time.
- A `Water filter or treatment backup` optional row explains filter,
  purification tablets, or boiling without inventing route-specific water
  sources.
- Overall alerts now cover unusual duration, heat/sun exposure, wet weather,
  cold/snow context, active NPS alerts, and critical danger conditions. Affected
  recommendation rows show context markers such as `Heat`, `Wet`, `Duration`,
  or `Official alert`.
- Trip safety decisions, safety-critical gear, and active-alert review rows now
  render in a first-position `Critical Safety` group. Trip decisions get a
  `Change plan` marker, while bear spray and navigation get `Safety-critical`.
- Longer trips now add a separate `Power bank / extra battery` row so phone,
  GPS, or rechargeable-headlamp dependence is visible without cluttering the
  top critical-safety group.
- Extra dry socks now appear as a separate optional row with blister and
  cold/wet-foot rationale.
- Salt support now separates `Electrolytes` from `Salty snacks`: high-heat
  sustained efforts promote electrolytes, while long non-hot days promote salty
  food and keep electrolytes optional.
- Snow and ice guidance now explains what microspikes are and that fit/buy/rent
  planning should happen before the trailhead.
- Abnormal duration now appears as a trip-level alert rather than a packing
  item.
- Taggart Lake now surfaces the saved official 2026 NPS trail-work alert.
- The scenario review is rerunnable with `npm run scenario:stress`.

## Verification Status

Current verification commands pass:

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run scenario:stress`
- `git diff --check`

The hiker scenario report covers 27 app scenarios across three supported trails
and reviews each output through three hiker lenses: seasoned, casual/new, and
middle-of-the-road. The added stress templates cover flash flood, severe storm
and lightning, and extreme heat warnings.

## Work Left For 499A

These are the remaining practical closeout tasks:

1. Commit the current branch changes.
2. Push the branch and open a pull request.
3. Run one visual walkthrough of the main demo paths in the browser.
4. Merge the PR after review/checks.
5. Prepare the final demo talking points:
   - what was planned
   - what was completed
   - what was intentionally deferred
   - what moves to 499B

No additional core recommendation feature is required for the Week 12 must-have
contract.

## 499B Candidate Backlog

Recommended first priorities for 499B:

1. Decide whether to add a live AI provider call or keep the guarded fixture path
   until the rest of the product is stronger.
2. Add verified route-specific context only when source-backed, starting with
   water-source availability, remoteness, or cell-service risk.
3. Add a small gear glossary or tooltips for microspikes, water filters,
   purification tablets, UPF clothing, and bear spray access.
4. Expand beyond the three Grand Teton supported profiles only when each profile
   has enough source-backed trail facts.
5. Consider a lightweight no-account save/export/email flow after the baseline
   demo remains stable.

## Bottom Line

The CSE 499A baseline is effectively complete once this branch is merged and a
visual demo walkthrough is confirmed. Remaining work is closeout, PR hygiene,
demo prep, and choosing the first CSE 499B backlog items.
