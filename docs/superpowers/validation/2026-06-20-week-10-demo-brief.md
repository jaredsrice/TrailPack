# Week 10 Demo Brief

Date: 2026-06-20
Project: TrailPack
Audience: Week 10 milestone demo

## What Changed This Week

- the prototype now covers all five Week 10 evaluation scenario categories
- `String Lake Loop` is now a real hot/exposed scenario instead of another mild-weather case
- hot/exposed recommendations now add stronger hydration and heat-support items
- manual entry now returns a limited baseline packing list instead of stopping at an unsupported-state message
- the app no longer carries one scenario's user inputs into the next scenario
- wording is tighter for short hikes and missing-detail prompts only ask for inputs that actually affect the current output

## What To Demo

1. `Taggart Lake`
   - show the short, low-risk baseline recommendation
   - point out the lighter food wording: `Snack or light food`

2. `String Lake Loop`
   - show the hot/exposed scenario
   - point out `Water: 2-3 liters`, `Electrolytes or salty snack`, and `Breathable sun layer`

3. `Jenny Lake Loop`
   - first show the default mountain-weather recommendation
   - then enter `7 hours` and `icy and muddy`
   - point out the added traction, poles, waterproof footwear, extra food, and headlamp

4. `Manual entry`
   - show that incomplete data still produces a usable baseline list
   - point out the confidence note and the narrower missing-detail prompts

## What To Say

- Week 10 required scenario review and targeted prototype fixes, not a full architecture expansion.
- The recommendation engine now behaves more honestly across short, hot, slippery, and incomplete-data cases.
- The biggest functional fix was state isolation between scenarios, which makes the live demo reliable.
- The manual path is still intentionally limited, but it now fails gracefully instead of dead-ending.

## What Is Deliberately Deferred

- direct manual inputs for distance, elevation gain, and route type
- live weather and alert integrations
- broader trail coverage outside the current supported demo set
- any AI-generated recommendation path
