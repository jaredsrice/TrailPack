# TrailPack One-Page Hybrid Flow Wireframe

Date: 2026-05-19  
Purpose: Low-fidelity wireframe for the CSE 499A Week 5 UI/UX workflow.

## Concept

TrailPack starts as one focused page instead of a multi-page app. The first impression is scenic and simple: a nature background, a large question, and one search bar. As the user makes choices, the page expands downward into trail details, missing-detail prompts, and packing recommendations.

## Desktop Wireframe

```text
+--------------------------------------------------------------------------------+
| Scenic mountain or nature background                                            |
|                                                                                |
|  TrailPack                                                                     |
|                                                                                |
|  Where would you like to go?                                                    |
|                                                                                |
|  +------------------------------------------------------------------------+    |
|  | Search a park or trail...                                              |    |
|  +------------------------------------------------------------------------+    |
|                                                                                |
|  Suggestions                                                                   |
|  +-------------------------------+  +-------------------------------+          |
|  | Supported park                |  | Supported trail               |          |
|  | Yellowstone National Park     |  | Fairy Falls Trail             |          |
|  +-------------------------------+  +-------------------------------+          |
|  +-------------------------------+  +-------------------------------+          |
|  | Supported park                |  | Manual entry                  |          |
|  | Zion National Park            |  | Enter hike details yourself   |          |
|  +-------------------------------+  +-------------------------------+          |
|                                                                                |
+--------------------------------------------------------------------------------+
| Selected destination                                                            |
| +----------------------------------------------------------------------------+ |
| | Park: Yellowstone National Park                                             | |
| | Next: Choose a trail                                                        | |
| | +----------------------------------------------------------------------+   | |
| | | Search supported trails in this park...                              |   | |
| | +----------------------------------------------------------------------+   | |
| | Trail suggestions: Fairy Falls Trail, Mount Washburn, Lone Star Geyser     | |
| +----------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------+
| Hike profile summary                                                            |
| +----------------------+ +----------------------+ +----------------------+     |
| | Distance             | | Elevation gain       | | Route type           |     |
| | 4.8 miles            | | Missing              | | Out and back         |     |
| | Supported profile    | | Missing              | | Supported profile    |     |
| +----------------------+ +----------------------+ +----------------------+     |
| +----------------------+ +----------------------+ +----------------------+     |
| | Weather              | | Expected duration    | | Known conditions     |     |
| | Rain possible        | | Missing              | | User can add notes   |     |
| | Forecast-based       | | Missing              | | User-provided        |     |
| +----------------------+ +----------------------+ +----------------------+     |
+--------------------------------------------------------------------------------+
| Missing details                                                                 |
| +----------------------------------------------------------------------------+ |
| | Add elevation gain? This helps TrailPack judge effort and footing needs.    | |
| | [ Elevation gain in feet ]                                                  | |
| |                                                                            | |
| | Add expected duration? This helps adjust water and food suggestions.        | |
| | [ Expected hours ]                                                          | |
| +----------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------+
| Suggested items                                                                 |
| +--------------------------------------+ +-----------------------------------+ |
| | Essential                            | | Optional                          | |
| | - Water                              | | - Trekking poles                  | |
| |   Reason: distance and forecast      | |   Reason: helpful if elevation    | |
| | - Rain layer                         | |   gain or slick conditions apply  | |
| |   Reason: forecast-based rain risk   | | - Extra dry socks                 | |
| | - Snack                              | |   Reason: optional for wet trail  | |
| |   Reason: expected duration missing  | |                                   | |
| +--------------------------------------+ +-----------------------------------+ |
|                                                                                |
| Missing or uncertain: elevation gain, expected duration                         |
+--------------------------------------------------------------------------------+
```

## Mobile Wireframe

```text
+--------------------------------------+
| Scenic background                    |
|                                      |
| TrailPack                            |
|                                      |
| Where would you like to go?          |
|                                      |
| +----------------------------------+ |
| | Search a park or trail...        | |
| +----------------------------------+ |
|                                      |
| Suggestions                          |
| +----------------------------------+ |
| | Supported park                   | |
| | Yellowstone National Park        | |
| +----------------------------------+ |
| | Supported trail                  | |
| | Fairy Falls Trail                | |
| +----------------------------------+ |
| | Manual entry                     | |
| | Enter hike details yourself      | |
| +----------------------------------+ |
+--------------------------------------+
| Selected destination                 |
| Park: Yellowstone National Park      |
| Choose a trail                       |
| +----------------------------------+ |
| | Search trails...                 | |
| +----------------------------------+ |
+--------------------------------------+
| Hike profile                         |
| Distance: 4.8 miles                  |
| Elevation gain: Missing              |
| Route type: Out and back             |
| Weather: Rain possible               |
+--------------------------------------+
| Missing details                      |
| Elevation gain                       |
| [ feet ]                             |
| Expected duration                    |
| [ hours ]                            |
+--------------------------------------+
| Suggested items                      |
| Essential                            |
| - Water                              |
| - Rain layer                         |
| - Snack                              |
|                                      |
| Optional                             |
| - Trekking poles                     |
| - Extra dry socks                    |
+--------------------------------------+
```

## Interaction Notes

- The page should stay in one scrolling experience.
- Suggestions should appear as the user types.
- Supported parks and trails should be visually distinct from manual entry.
- Selecting a park should reveal the trail prompt without navigating away.
- Selecting a trail should reveal the hike profile summary.
- Missing-detail prompts should appear only for fields that affect recommendations.
- The packing list should remain readable even when some details are missing.
- Source and uncertainty labels should sit close to the data or recommendation they explain.

## Prototype Notes

The first prototype can use saved data behind the scenes. The interface should still be designed as if live search may be added later. This keeps the UI stable while Week 6 determines whether live public trail lookup is reliable enough to include.
