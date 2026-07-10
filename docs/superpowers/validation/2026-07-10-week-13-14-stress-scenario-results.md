# Week 13/14 Hiker Scenario Stress Results

Date: 2026-07-10
Project: TrailPack
Scope: current branch recommendation engine through the three hiker scenarios: seasoned hiker, casual/new hiker, and middle-of-the-road hiker.

## What Was Actually Run

- 18 app scenarios were run: 3 trails x 6 scenario templates.
- Trip timing check triggered in 8 scenarios, mainly where user duration was far outside the official profile.
- Water refill/treatment logistics appeared in 12 long-duration scenarios.
- All 18-hour edge cases moved Extra food reserve into essentials.
- All snow/ice/cold scenarios promoted Light jacket or warm layer into essentials.
- Hot/long and 18-hour cases all included refill or water treatment planning in water guidance.
- Every Taggart scenario surfaced the saved official 2026 NPS trail-work alert.
- Each app output was reviewed through three hiker scenarios, for 54 hiker-lens reads total.

This report is generated from `npm run scenario:stress`, which calls `generatePackingRecommendation`, then evaluates the app output through the hiker lenses below. The trail/weather cases are inputs to the hiker scenarios, not the main scenario structure.

## Critical Conclusions

- The current branch is much stronger than the prior stiff output for long-day food, water, headlamp, layers, Taggart alerts, abnormal duration handling, water logistics, and snow/ice traction explanation.
- The largest previous beginner-facing gap, water logistics, is now partly addressed by a separate refill/treatment card. The app still avoids naming route-specific water sources because those require verified source-backed data.
- The snow/ice gear-literacy gap is now partly addressed: microspikes are described as pull-on metal traction that must fit the user's shoes or boots, with buy/rent guidance kept generic instead of inventing a route-specific rental location.
- The seasoned-hiker lens accepts the no-invented-water-source direction. The correct next step would be verified route-specific water-source data, not freer copy.
- The middle-of-the-road lens confirms the recommendations are now more tied to duration, weather, trail conditions, and official profile context instead of reading like the same list every time.
- The 18-hour scenarios remain edge-case warnings, not normal day-hike planning. The timing card now uses stronger warning copy and the UI marks it as `Check first`.

## Source-Backed Trail Context Used By The Lenses

- Jenny Lake Loop: NPS lists 7.1 mi, 1,040 ft gain, 3-5 hours, moderate; the page also notes roots, exposed rock, narrow dirt, and popular parking.
- Taggart Lake: NPS lists 3 mi round trip, 360 ft gain, 1-2 hours, easy; the page says a section of Taggart Trail will be closed in 2026 for trail improvements.
- String Lake Loop: NPS lists 3.7 mi, 540 ft gain, 2-3 hours, easy; the page notes roots/rock, a flatter east side, and a west-side ridge.
- Grand Teton Hike Smart: NPS highlights sudden weather, lingering snow, bear spray, water, rain gear, extra layers, and navigation basics.
- NPS general water guidance says backcountry water should be filtered, purified with tablets, or boiled before drinking.

Sources checked: Jenny Lake Loop (`https://www.nps.gov/thingstodo/jennylakeloop.htm`), Taggart Lake (`https://www.nps.gov/thingstodo/taggartlake.htm`), String Lake (`https://www.nps.gov/thingstodo/stringlake.htm`), Grand Teton Hiking / Hike Smart (`https://www.nps.gov/grte/planyourvisit/hike.htm`), and NPS water treatment basics (`https://www.nps.gov/subjects/camping/what-to-bring.htm`).

## Hiker Scenario Prompts Used

### Scenario A: Seasoned Hiker

Review this TrailPack output as a seasoned Grand Teton day hiker who already knows normal packing habits, NPS trail profiles, mountain-weather volatility, bear country basics, and practical carry limits. Flag anything that is vague, unsafe, overkill, unrealistic to carry, missing, or not tied tightly enough to the route, weather, timing, trail conditions, and current NPS context.

### Scenario B: Casual / New Hiker

Review this TrailPack output as a casual or new hiker using the app because you do not know what to bring. Flag anything confusing, intimidating, undefined, too vague, or not directly actionable. For each issue, identify the question a beginner would still have after reading the recommendation.

### Scenario C: Middle-of-the-Road Hiker

Review this TrailPack output as someone with basic hiking experience but limited expert judgment. Evaluate whether the app helps you make practical decisions for this exact trail, planned duration, start time, weather, and trail-condition scenario. Flag anything generic, repetitive, or insufficiently connected to the trip facts.

## Hiker Scenario Results

### Scenario A: Seasoned Hiker

- Jenny Lake Loop / Saved demo baseline:
  - No lens-specific issue found in this scenario.
- Jenny Lake Loop / Normal clear day with start time:
  - No lens-specific issue found in this scenario.
- Jenny Lake Loop / Wet, rainy, slower day:
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Jenny Lake Loop / Snow or ice with cold weather:
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
  - Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
- Jenny Lake Loop / Hot, exposed long day:
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Jenny Lake Loop / 18-hour edge case:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- String Lake Loop / Saved demo baseline:
  - No lens-specific issue found in this scenario.
- String Lake Loop / Normal clear day with start time:
  - No lens-specific issue found in this scenario.
- String Lake Loop / Wet, rainy, slower day:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- String Lake Loop / Snow or ice with cold weather:
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
  - Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
- String Lake Loop / Hot, exposed long day:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- String Lake Loop / 18-hour edge case:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Taggart Lake / Saved demo baseline:
  - Good: official trail-work context is visible before the user commits to the route.
- Taggart Lake / Normal clear day with start time:
  - Good: official trail-work context is visible before the user commits to the route.
- Taggart Lake / Wet, rainy, slower day:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: official trail-work context is visible before the user commits to the route.
- Taggart Lake / Snow or ice with cold weather:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
  - Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
  - Good: official trail-work context is visible before the user commits to the route.
- Taggart Lake / Hot, exposed long day:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: official trail-work context is visible before the user commits to the route.
- Taggart Lake / 18-hour edge case:
  - Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
  - Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
  - Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
  - Good: official trail-work context is visible before the user commits to the route.

### Scenario B: Casual / New Hiker

- Jenny Lake Loop / Saved demo baseline:
  - Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Jenny Lake Loop / Normal clear day with start time:
  - Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Jenny Lake Loop / Wet, rainy, slower day:
  - Clear action seen: Water - Plan for 4-6 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Jenny Lake Loop / Snow or ice with cold weather:
  - Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
- Jenny Lake Loop / Hot, exposed long day:
  - Clear action seen: Water - Plan for 4-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Jenny Lake Loop / 18-hour edge case:
  - Clear action seen: Water - Plan for 9-14 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
  - Good: headlamp is a direct instruction, not a paragraph that hides the action.
- String Lake Loop / Saved demo baseline:
  - Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- String Lake Loop / Normal clear day with start time:
  - Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- String Lake Loop / Wet, rainy, slower day:
  - Clear action seen: Water - Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- String Lake Loop / Snow or ice with cold weather:
  - Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
- String Lake Loop / Hot, exposed long day:
  - Clear action seen: Water - Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- String Lake Loop / 18-hour edge case:
  - Clear action seen: Water - Plan for 9-18 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 2 meals plus 6-9 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
  - Good: headlamp is a direct instruction, not a paragraph that hides the action.
- Taggart Lake / Saved demo baseline:
  - Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
  - Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Taggart Lake / Normal clear day with start time:
  - Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
  - Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Taggart Lake / Wet, rainy, slower day:
  - Clear action seen: Water - Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Taggart Lake / Snow or ice with cold weather:
  - Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Taggart Lake / Hot, exposed long day:
  - Clear action seen: Water - Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Taggart Lake / 18-hour edge case:
  - Clear action seen: Water - Plan for 9-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
  - Food is concrete: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
  - Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
  - Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
  - Good: headlamp is a direct instruction, not a paragraph that hides the action.

### Scenario C: Middle-of-the-Road Hiker

- Jenny Lake Loop / Saved demo baseline:
  - Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.
- Jenny Lake Loop / Normal clear day with start time:
  - Trip tie-in: water and food are tied to 4 hours plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
- Jenny Lake Loop / Wet, rainy, slower day:
  - Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Jenny Lake Loop / Snow or ice with cold weather:
  - Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Jenny Lake Loop / Hot, exposed long day:
  - Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
  - Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Jenny Lake Loop / 18-hour edge case:
  - Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- String Lake Loop / Saved demo baseline:
  - Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
  - Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
  - Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.
- String Lake Loop / Normal clear day with start time:
  - Trip tie-in: water and food are tied to 3 hours plus route difficulty/weather where available.
- String Lake Loop / Wet, rainy, slower day:
  - Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- String Lake Loop / Snow or ice with cold weather:
  - Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- String Lake Loop / Hot, exposed long day:
  - Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
  - Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- String Lake Loop / 18-hour edge case:
  - Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
  - Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Taggart Lake / Saved demo baseline:
  - Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
  - Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Taggart Lake / Normal clear day with start time:
  - Trip tie-in: water and food are tied to 2 hours plus route difficulty/weather where available.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Taggart Lake / Wet, rainy, slower day:
  - Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Taggart Lake / Snow or ice with cold weather:
  - Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
  - Good: poles are presented as optional support unless snow/ice changes the balance need.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Taggart Lake / Hot, exposed long day:
  - Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
  - Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Taggart Lake / 18-hour edge case:
  - Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
  - Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
  - Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

## Raw App Outputs By Trail

## Jenny Lake Loop

Official profile in app: 7.1 mi, 1040 ft gain, 3-5 hours, Moderate.

### Saved demo baseline

Intent: What the app shows before the user adds trip details.
User input: duration none, start none, conditions none.
Essential: Trail footwear, Water, Food, Bear spray, Rain shell, Sun protection, First-aid basics.
Optional: Insect repellent, Offline map, Trekking poles, Light jacket or warm layer.

Key outputs:
- Water: Bring 2-3 liters per adult. Do not treat this as a group total.
- Water logistics: not shown
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Pack one dry pair of socks.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: No lens-specific issue found in this scenario.
- Casual: Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Middle: Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.

### Normal clear day with start time

Intent: Expected day-hike behavior with duration and daylight context.
User input: duration 4 hours, start 09:00, conditions dry and clear.
Essential: Trail footwear, Water, Food, Bear spray, Sun protection, First-aid basics.
Optional: Light rain or wind shell, Insect repellent, Offline map, Trekking poles, Light jacket or warm layer.

Key outputs:
- Water: Bring 2-3 liters per adult. Do not treat this as a group total.
- Water logistics: not shown
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: No lens-specific issue found in this scenario.
- Casual: Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Middle: Trip tie-in: water and food are tied to 4 hours plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.

### Wet, rainy, slower day

Intent: Stress footwear, socks, jacket, food, water, and clarity under wet conditions.
User input: duration 7 hours, start 10:30, conditions muddy sections and wet rocks.
Essential: Trail footwear, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, First-aid basics.
Optional: Headlamp, Extra food reserve, Insect repellent, Offline map, Trekking poles, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-6 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Use waterproof hiking shoes, boots, or gaiters if the muddy sections are still present. Pack one dry pair of socks.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 7 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 4-6 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Middle: Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### Snow or ice with cold weather

Intent: Stress traction, footwear, socks, layer placement, and non-summer wording.
User input: duration 5 hours, start 09:30, conditions patchy snow and icy shaded sections.
Essential: Trail footwear, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, Traction devices (microspikes), First-aid basics, Light jacket or warm layer.
Optional: Insect repellent, Trekking poles, Offline map.

Key outputs:
- Water: Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Wear shoes or boots with enough structure and tread to pair with traction devices if the slick sections are real. Pack one dry pair of socks.
- Traction: Bring pull-on traction devices such as microspikes, and test that they fit your shoes or boots before the hike.
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring an insulating warm layer plus a rain or wind shell.

Hiker lens read:
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
- Seasoned: Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
- Casual: Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
- Middle: Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### Hot, exposed long day

Intent: Stress water, food, salt/electrolytes, sun layer, and upper-range explanations.
User input: duration 8 hours, start 08:00, conditions dry trail with exposed sunny sections.
Essential: Trail footwear, Water, Water refill or treatment plan, Food, Extra food reserve, Bear spray, Sun protection, First-aid basics.
Optional: Headlamp, Light rain or wind shell, Insect repellent, Electrolytes or salty snack, Breathable sun layer, Offline map, Trekking poles, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 8 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 4-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Middle: Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
- Middle: Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### 18-hour edge case

Intent: Stress bad input, ultra-long-day scaling, refill/treatment language, headlamp, and food reserve placement.
User input: duration 18 hrs, start 12:00, conditions unknown trail conditions and possible delayed exit.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Headlamp, Extra food reserve, Bear spray, Rain shell, Sun protection, First-aid basics.
Optional: Insect repellent, Offline map, Trekking poles, Light jacket or warm layer.

Key outputs:
- Water: Plan for 9-14 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Pack one dry pair of socks.
- Traction: not shown
- Headlamp: Bring a small headlamp.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 18 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 9-14 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Casual: Good: headlamp is a direct instruction, not a paragraph that hides the action.
- Middle: Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

## String Lake Loop

Official profile in app: 3.7 mi, 540 ft gain, 2-3 Hours, Easy.

### Saved demo baseline

Intent: What the app shows before the user adds trip details.
User input: duration none, start none, conditions none.
Essential: Trail footwear, Water, Food, Bear spray, Sun protection, First-aid basics.
Optional: Light rain or wind shell, Insect repellent, Electrolytes or salty snack, Breathable sun layer, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Bring 2-3 liters per adult. Do not treat this as a group total.
- Water logistics: not shown
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: No lens-specific issue found in this scenario.
- Casual: Clear action seen: Water - Bring 2-3 liters per adult. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Middle: Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
- Middle: Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
- Middle: Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.

### Normal clear day with start time

Intent: Expected day-hike behavior with duration and daylight context.
User input: duration 3 hours, start 09:00, conditions dry and clear.
Essential: Trail footwear, Water, Food, Bear spray, Sun protection, First-aid basics.
Optional: Light rain or wind shell, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Bring 1-2 liters per person. Do not treat this as a group total.
- Water logistics: not shown
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.

Hiker lens read:
- Seasoned: No lens-specific issue found in this scenario.
- Casual: Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Middle: Trip tie-in: water and food are tied to 3 hours plus route difficulty/weather where available.

### Wet, rainy, slower day

Intent: Stress footwear, socks, jacket, food, water, and clarity under wet conditions.
User input: duration 7 hours, start 10:30, conditions muddy sections and wet rocks.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, First-aid basics.
Optional: Headlamp, Extra food reserve, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Use waterproof hiking shoes, boots, or gaiters if the muddy sections are still present. Pack one dry pair of socks.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 7 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Middle: Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### Snow or ice with cold weather

Intent: Stress traction, footwear, socks, layer placement, and non-summer wording.
User input: duration 5 hours, start 09:30, conditions patchy snow and icy shaded sections.
Essential: Trail footwear, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, Traction devices (microspikes), First-aid basics, Light jacket or warm layer.
Optional: Insect repellent, Trekking poles, Offline map.

Key outputs:
- Water: Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here. Wear shoes or boots with enough structure and tread to pair with traction devices if the slick sections are real. Pack one dry pair of socks.
- Traction: Bring pull-on traction devices such as microspikes, and test that they fit your shoes or boots before the hike.
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring an insulating warm layer plus a rain or wind shell.

Hiker lens read:
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
- Seasoned: Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
- Casual: Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
- Middle: Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### Hot, exposed long day

Intent: Stress water, food, salt/electrolytes, sun layer, and upper-range explanations.
User input: duration 8 hours, start 08:00, conditions dry trail with exposed sunny sections.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Extra food reserve, Bear spray, Sun protection, First-aid basics.
Optional: Headlamp, Light rain or wind shell, Insect repellent, Electrolytes or salty snack, Breathable sun layer, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 8 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Middle: Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
- Middle: Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

### 18-hour edge case

Intent: Stress bad input, ultra-long-day scaling, refill/treatment language, headlamp, and food reserve placement.
User input: duration 18 hrs, start 12:00, conditions unknown trail conditions and possible delayed exit.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Headlamp, Extra food reserve, Bear spray, Sun protection, First-aid basics.
Optional: Light rain or wind shell, Insect repellent, Electrolytes or salty snack, Breathable sun layer, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 9-18 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 2 meals plus 6-9 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.
- Traction: not shown
- Headlamp: Bring a small headlamp.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 18 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Casual: Clear action seen: Water - Plan for 9-18 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 2 meals plus 6-9 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Casual: Good: headlamp is a direct instruction, not a paragraph that hides the action.
- Middle: Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
- Middle: Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.

## Taggart Lake

Official profile in app: 3 mi, 360 ft gain, 1-2 Hours, Easy.

### Saved demo baseline

Intent: What the app shows before the user adds trip details.
User input: duration none, start none, conditions none.
Essential: Trail footwear, Water, Food, Bear spray, Sun protection, First-aid basics, Review active alerts before leaving.
Optional: Light rain or wind shell, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Bring 1-2 liters per person. Do not treat this as a group total.
- Water logistics: not shown
- Food: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.

Hiker lens read:
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
- Casual: Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Middle: Trip tie-in: water and food are tied to the trail profile plus route difficulty/weather where available.
- Middle: Still asks for: Current trail conditions (muddy, icy, snow) are not known from official data alone. Your expected time out improves food, water, and daylight/headlamp guidance. Your start time would improve daylight and headlamp guidance.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

### Normal clear day with start time

Intent: Expected day-hike behavior with duration and daylight context.
User input: duration 2 hours, start 09:00, conditions dry and clear.
Essential: Trail footwear, Water, Food, Bear spray, Sun protection, First-aid basics, Review active alerts before leaving.
Optional: Light rain or wind shell, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Bring 1-2 liters per person. Do not treat this as a group total.
- Water logistics: not shown
- Food: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy.
- Traction: not shown
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.

Hiker lens read:
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Bring 1-2 liters per person. Do not treat this as a group total.
- Casual: Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Middle: Trip tie-in: water and food are tied to 2 hours plus route difficulty/weather where available.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

### Wet, rainy, slower day

Intent: Stress footwear, socks, jacket, food, water, and clarity under wet conditions.
User input: duration 7 hours, start 10:30, conditions muddy sections and wet rocks.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, First-aid basics, Review active alerts before leaving.
Optional: Headlamp, Extra food reserve, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy. Use waterproof hiking shoes, boots, or gaiters if the muddy sections are still present. Pack one dry pair of socks.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 7 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Plan for 4-5 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-4 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Middle: Trip tie-in: water and food are tied to 7 hours plus route difficulty/weather where available.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

### Snow or ice with cold weather

Intent: Stress traction, footwear, socks, layer placement, and non-summer wording.
User input: duration 5 hours, start 09:30, conditions patchy snow and icy shaded sections.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Bear spray, Rain shell, Traction devices (microspikes), First-aid basics, Review active alerts before leaving, Light jacket or warm layer.
Optional: Insect repellent, Trekking poles, Offline map.

Key outputs:
- Water: Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy. Wear shoes or boots with enough structure and tread to pair with traction devices if the slick sections are real. Pack one dry pair of socks.
- Traction: Bring pull-on traction devices such as microspikes, and test that they fit your shoes or boots before the hike.
- Headlamp: not shown
- Extra food reserve: not shown
- Layer: Bring an insulating warm layer plus a rain or wind shell.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.
- Seasoned: Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Plan for 3-4 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Middle: Trip tie-in: water and food are tied to 5 hours plus route difficulty/weather where available.
- Middle: Good: poles are presented as optional support unless snow/ice changes the balance need.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

### Hot, exposed long day

Intent: Stress water, food, salt/electrolytes, sun layer, and upper-range explanations.
User input: duration 8 hours, start 08:00, conditions dry trail with exposed sunny sections.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Extra food reserve, Bear spray, Sun protection, First-aid basics, Review active alerts before leaving.
Optional: Headlamp, Light rain or wind shell, Insect repellent, Electrolytes or salty snack, Breathable sun layer, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy.
- Traction: not shown
- Headlamp: Pack a small headlamp as a backup.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 8 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Plan for 4-8 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 1 meal plus 3-5 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Middle: Trip tie-in: water and food are tied to 8 hours plus route difficulty/weather where available.
- Middle: Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

### 18-hour edge case

Intent: Stress bad input, ultra-long-day scaling, refill/treatment language, headlamp, and food reserve placement.
User input: duration 18 hrs, start 12:00, conditions unknown trail conditions and possible delayed exit.
Essential: Trail footwear, Trip timing check, Water, Water refill or treatment plan, Food, Headlamp, Extra food reserve, Bear spray, Sun protection, First-aid basics, Review active alerts before leaving.
Optional: Light rain or wind shell, Insect repellent, Offline map, Light jacket or warm layer.

Key outputs:
- Water: Plan for 9-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Water logistics: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Food: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Footwear: Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy.
- Traction: not shown
- Headlamp: Bring a small headlamp.
- Extra food reserve: Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about 18 hr day.
- Layer: Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.
- Alert: Review active alerts before leaving: Taggart Trail 2026 construction closure.
- Timing check: Check this before packing: confirm whether this time is a typo, a long stop plan, a side trip, a closure detour, or a non-standard route.

Hiker lens read:
- Seasoned: Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.
- Seasoned: Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.
- Seasoned: Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.
- Seasoned: Good: official trail-work context is visible before the user commits to the route.
- Casual: Clear action seen: Water - Plan for 9-10 liters per adult total. Start with a realistic carry amount and identify a reliable refill or water treatment plan before leaving; do not assume you can comfortably carry the upper end. Do not treat this as a group total.
- Casual: Food is concrete: Pack 2 meals plus 6-8 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, nuts, and salty snacks.
- Casual: Water logistics are clearer: Start with the water you can realistically carry. If this plan depends on refilling, confirm a water source before leaving and bring a filter, purification tablets, or a way to boil water.
- Casual: Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.
- Casual: Good: headlamp is a direct instruction, not a paragraph that hides the action.
- Middle: Trip tie-in: water and food are tied to 18 hrs plus route difficulty/weather where available.
- Middle: Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.
- Middle: Route context: Review active alerts before leaving: Taggart Trail 2026 construction closure.

## Remaining Product Follow-Ups

- Add verified route-specific water-source data before naming actual refill points. Until then, the current app should keep telling users to verify water and carry/treat accordingly.
- Consider adding a small gear glossary or tooltip for microspikes, water filters, purification tablets, UPF clothing, and bear spray access.
- Consider adding UI tests for the `Check first` timing-warning card so the visual treatment remains stable.

