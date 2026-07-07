# Week 13 Demo Readiness Review

Date: 2026-07-06
Project: TrailPack
Scope: CSE 499A Week 13 bridge from rule-based prototype to guarded AI, external context, manual fallback, and demo readiness

## Integrated Work Reviewed

This review covers the merged Week 13 implementation PRs:

- PR #9: server-side external-context routes for Open-Meteo weather and NPS alerts
- PR #10: fixture-first guarded AI review contract and UI panel
- PR #11: manual-entry distance, elevation gain, and route-type fallback improvements
- PR #12: visible weather and NPS alert context-status panel

## Requirements Alignment

### MH-01: Supported Hike Input Workflow

Status: stronger than Week 12 baseline.

- The app still supports Jenny Lake Loop, Taggart Lake, and String Lake Loop.
- Manual entry now accepts distance, elevation gain, route type, expected time out, current trail conditions, and notes.
- Manual distance/elevation can raise hydration and food recommendations.
- Point-to-point manual routes add a route-planning/shuttle check.

### MH-02: Weather And Official Alert Context

Status: demonstrable for the Week 13 prototype.

- Server routes exist for Open-Meteo weather and NPS alerts.
- The main UI still uses saved demo contexts by default for stable demos.
- Supported trail pages now show weather context before the packing list.
- Supported trail pages now show NPS alert state, including saved no-active-alert fixture state.

### MH-03: Rule-Based Baseline Packing List

Status: preserved.

- Packing decisions remain rule-based.
- The guarded AI panel cannot add, remove, or relabel packing items.
- Manual entry still produces a limited fallback list without AI.

### MH-04: Recommendation Explanations And Source Labels

Status: preserved and easier to demo.

- Packing items still show reasons and source labels.
- Weather and alert context labels are now visible before the packing list.
- Official alert URL validation remains covered by unit tests.

### MH-05: Guarded AI Contract And Fallback Validation

Status: fixture-first implementation complete.

- The Jenny Lake demo builds structured AI input from trail, weather, alerts, user input, missing data, and rule-based packing output.
- A saved AI-style fixture is validated before display.
- Validation rejects unknown packing items, source-label changes, unsupported safety claims, and references to a different supported trail.
- Invalid or unavailable AI-style text falls back to template text generated from the rule-based recommendation.
- No live AI provider call is used yet.

### MH-06: Fallback And Uncertainty Handling

Status: improved.

- Manual entry no longer dead-ends.
- Missing-detail prompts now include distance, elevation gain, route type, expected time out, and trail conditions when absent.
- The manual confidence note records which manual facts were used and still labels missing source-backed weather.

## Verification

Integrated `main` verification on 2026-07-06:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Observed result:

- lint passed
- typecheck passed
- test suite passed: 8 files, 94 tests
- production build passed

Browser QA was also run during the PR work:

- Jenny Lake guarded AI review on desktop and mobile
- manual-entry distance/elevation/point-to-point flow on desktop and mobile
- Jenny Lake weather and NPS alert status panel on desktop and mobile

## Demo Script

### 1. Supported Trail Selection

Search for `Jenny Lake Loop`.

Show:

- selected trail profile
- official NPS trail stats
- USGS computed comparison and elevation-gain conflict note
- source labels in the profile summary

### 2. Weather And Alert Context

On the Jenny Lake page, show the `External context` panel.

Point out:

- `Saved demo forecast`
- forecast-based weather summary
- `No active alerts in saved fixture`
- saved-fixture retrieval labels

### 3. Rule-Based Packing List

Show the Jenny Lake packing output.

Point out:

- `Rule-based list`
- essential and optional groups
- forecast-based `Rain shell`
- official `Bear spray` source link
- missing-detail prompts for trail conditions and expected time out

### 4. Guarded AI Review

Show the `Guarded AI review` panel.

Point out:

- `Saved fixture accepted`
- trip summary generated from structured TrailPack data
- validation result confirming item names and source labels matched
- item explanation drafts are separate from packing decisions

Explain:

- AI does not create the packing list.
- If the fixture fails validation, TrailPack displays template fallback text.

### 5. Manual Fallback

Search for an unsupported hike, such as `custom ridge hike`, and choose manual entry.

Enter:

- distance: `6.2`
- elevation gain: `900`
- route type: `Point to point`

Show:

- confidence note: `Manual facts used: 6.2 mi, 900 ft gain, point-to-point`
- `Water: 2-3 liters`
- `Snacks / lunch`
- `Route plan or shuttle check`
- remaining missing prompts for expected time out and trail conditions

### 6. Optional Stress Case

In manual entry, add:

- expected time out: `7 hours`
- trail conditions: `icy and muddy`

Show:

- `Headlamp`
- `Extra food`
- `Traction devices (microspikes)`
- `Waterproof boots or gaiters`

## Remaining Week 13 Evidence Gap

Closed by follow-up tester/product feedback collected after the Week 13 review.

Feedback summary:

- The output felt too stiff and unspecific. Several items used vague language such
  as "pack more food" or "first-aid basics" without answering how much or what
  that means in practice.
- The tester wanted recommendations to answer the real question behind each item:
  what to wear on feet, how much water/food to bring per person, why bear spray
  is needed and where to get it, whether headlamp guidance changes with summer
  daylight, and whether a warm layer should be framed as a light jacket.

Follow-up action:

- Add civil-twilight/daylight context and start-time-aware headlamp logic first,
  then continue toward question-answer recommendation cards with concrete
  quantities and examples.

## CSE 499B Planning Notes

Keep these as later work unless the instructor redirects:

- live AI provider call behind the existing guarded contract
- broader supported trail coverage
- public trail lookup beyond curated profiles
- account/profile storage
- email/export flows

## Conclusion

The Week 13 technical bridge is now demo-ready for external context visibility,
manual fallback improvements, and fixture-first guarded AI validation. The app
still needs one real feedback note before the Week 13/14 evidence package is
fully complete.
