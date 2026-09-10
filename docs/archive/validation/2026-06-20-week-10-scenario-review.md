# Week 10 Scenario Review

Date: 2026-06-20
Project: TrailPack
Scope: CSE 499A Week 10 evaluation scenarios and prototype buffer

## Proposal Target

Week 10 from the latest proposal requires:

- `3-5` evaluation scenarios against the baseline recommendation output
- notes about which expected categories are covered, missing, or unclear
- `1-2` small rule, label, or interface fixes if the review exposes them

This review used five scenarios so every planned scenario category is covered.

## Scenario 1: Short, Low-Risk Day Hike

Scenario used:

- trail: `Taggart Lake`
- saved weather: mild and sunny
- extra user input: none

Expected categories:

- basic hydration
- snack or light food
- sun protection
- simple first-aid/safety basics
- concise output that avoids obvious overpacking

Observed output:

- `Water: 1-2 liters`
- `Snack or light food`
- `Sun protection`
- `First-aid basics`
- `Bear spray`
- optional `Light rain shell`, `Offline map`, and `Extra warm layer`

Week 10 fixes applied from this review:

- changed short-hike food wording from `Snacks / lunch` to `Snack or light food`
- softened the first-aid explanation so it no longer overstates a short hike as
  a `moderate full-day loop`
- removed the misleading planned-date prompt from the missing-details list

Final assessment:

- covered and defensible for the short-hike scenario

## Scenario 2: Hot or Exposed Hike

Scenario used:

- trail: `String Lake Loop`
- saved weather: hot, sunny, and breezy
- extra user input: none

Expected categories:

- increased hydration emphasis
- sun protection
- heat-support item such as electrolytes or salty snacks
- breathable clothing guidance
- practical heat-related reasoning tied to the forecast context

Observed output:

- `Water: 2-3 liters`
- `Sun protection`
- `Electrolytes or salty snack`
- `Breathable sun layer`
- `Bear spray`
- optional `Light rain shell`, `Offline map`, and `Extra warm layer`

Week 10 fixes applied from this review:

- changed the saved String Lake demo weather into an explicit hot/exposed scenario
- added heat-support rule output for extra hydration, electrolytes, and breathable coverage
- fixed the cross-scenario state carryover bug so String Lake no longer inherits
  `7 hours` and `icy and muddy` from the previous Jenny scenario
- softened the first-aid explanation so this shorter scenario no longer uses the
  `full-day loop` wording

Final assessment:

- covered and defensible for the hot/exposed scenario

## Scenario 3: Cool, Rainy, Windy, or Mountain-Weather Hike

Scenario used:

- trail: `Jenny Lake Loop`
- saved weather: partly sunny, chance of showers, wind
- extra user input: none

Expected categories:

- weather protection
- food/energy
- insulating or dry-layer support
- forecast-based explanation without claiming confirmed trail conditions

Observed output:

- `Water: 2-3 liters`
- `Snacks / lunch`
- `Rain shell`
- `Sun protection`
- `First-aid basics`
- optional `Offline map`, `Trekking poles`, and `Extra warm layer`

Week 10 fixes applied from this review:

- removed the planned-date prompt so the missing-details list now focuses only
  on fields that still materially change the current prototype output

Final assessment:

- covered and defensible for the mountain-weather scenario

## Scenario 4: Steep, Strenuous, or Slippery Hike

Scenario used:

- trail: `Jenny Lake Loop`
- expected duration: `7 hours`
- trail conditions: `icy and muddy`

Expected categories:

- higher hydration emphasis
- long-day food support
- traction-related gear
- optional poles
- waterproof footing support

Observed output:

- `Water: 2-3 liters`
- `Headlamp`
- `Extra food`
- `Traction devices (microspikes)`
- `Trekking poles`
- `Waterproof boots or gaiters`
- plus baseline items such as `Bear spray`, `Rain shell`, `Sun protection`,
  `Offline map`, `First-aid basics`, and `Extra warm layer`

Week 10 fixes applied from this review:

- fixed cross-scenario state reset so this strong Week 9/Week 10 demo path does
  not contaminate later scenarios

Final assessment:

- covered and still the strongest live demo path

## Scenario 5: Incomplete-Data Case

Scenario used:

- search/manual path: `Manual entry`
- extra user input: none

Expected categories:

- limited baseline packing list
- visible uncertainty or missing-data explanation
- prompts for only the supported details that improve the current fallback list

Observed output:

- `Water: 1-2 liters`
- `Snack or light food`
- `Sun protection`
- `First-aid basics`
- optional `Offline map` and `Light rain shell`
- a confidence note explicitly stating that distance, elevation gain, route type,
  and source-backed weather are still missing
- missing-detail prompts only for expected time out and current trail conditions

Week 10 fixes applied from this review:

- replaced the old manual-entry dead end with a visible limited fallback packing list
- added a confidence note that labels the incomplete-data limits honestly
- limited manual prompts to the inputs the current prototype actually accepts

Final assessment:

- covered and defensible for the incomplete-data scenario

## In-Scope Weaknesses Fixed This Week

- short-hike food wording no longer overpacks the Taggart scenario
- first-aid wording no longer overstates shorter scenarios
- String Lake now represents a true hot/exposed evaluation case
- heat-support items now appear for the hot/exposed scenario
- manual entry now produces a limited fallback packing list instead of a dead-end note
- scenario-to-scenario state carryover is gone
- the planned-date missing-detail prompt was removed until date actually changes output

## Deferred To Later Weeks

These remain real limitations, but they are later-week work rather than Week 10 fixes:

- manual entry still does not collect direct distance, elevation gain, or route-type fields
- weather and alerts are still demo data instead of live integrations
- supported coverage is still limited to three Grand Teton trails
- the project is still rule-based and does not implement the deferred AI path

## Milestone Conclusion

- all five planned scenario categories were reviewed
- the in-scope weaknesses discovered during the review were fixed
- later-week limitations are explicitly deferred rather than hidden

Week 10 is complete and demo-ready within the current prototype scope.
