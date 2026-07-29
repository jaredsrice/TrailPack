# TrailPack National Park Image Sources

Date: 2026-07-25

TrailPack uses a curated local copy of official National Park Service
photographs for the homepage rotation and selected Grand Teton trail context.
The application does not hotlink the photographs.

## Usage basis

The [National Park Service copyright
disclaimer](https://www.nps.gov/aboutus/disclaimer.htm) states that works
created by NPS employees as part of their official duties are generally in the
public domain unless otherwise indicated. Every image below is credited by its
source page to NPS without a copyright symbol or third-party rights notice.
TrailPack preserves the displayed NPS/photographer credit and links the visible
credit back to the official source page.

This source ledger covers the photographs only. It does not grant permission to
use the protected NPS Arrowhead symbol, and TrailPack does not use that mark.

## Homepage rotation

| Local file | Subject | Displayed credit | Official source |
| --- | --- | --- | --- |
| `public/park-images/grand-teton-jenny-lake.jpg` | Jenny Lake Loop, Grand Teton National Park | NPS Photo / J. Bonney | [Jenny Lake Loop](https://www.nps.gov/thingstodo/jennylakeloop.htm) |
| `public/park-images/yosemite-national-park.jpg` | Upper Yosemite Fall and Merced River, Yosemite National Park | NPS Photo | [Yosemite National Park](https://www.nps.gov/yose/index.htm) |
| `public/park-images/yellowstone-national-park.jpg` | Pelican Creek and Yellowstone Lake, Yellowstone National Park | NPS Photo / Jacob W. Frank | [Yellowstone National Park](https://www.nps.gov/yell/index.htm) |
| `public/park-images/glacier-national-park.jpg` | St. Mary Valley, Glacier National Park | NPS Photo | [Glacier National Park](https://www.nps.gov/glac/index.htm) |
| `public/park-images/olympic-national-park.jpg` | Olympic high country, Olympic National Park | NPS Photo | [Olympic National Park](https://www.nps.gov/olym/index.htm) |
| `public/park-images/zion-national-park.jpg` | The Watchman, Zion National Park | NPS Photo / Shane Carte | [Zion National Park](https://www.nps.gov/zion/index.htm) |
| `public/park-images/acadia-national-park.jpg` | Atlantic coast, Acadia National Park | NPS Photo | [National Park Getaway: Acadia](https://www.nps.gov/articles/getaway-acad.htm) |

## Selected Grand Teton trail images

| Local file | Trail/location mapping | Displayed credit | Official source |
| --- | --- | --- | --- |
| `public/park-images/grand-teton-jenny-lake.jpg` | `jenny-lake-loop` | NPS Photo / J. Bonney | [Jenny Lake Loop](https://www.nps.gov/thingstodo/jennylakeloop.htm) |
| `public/park-images/grand-teton-taggart-lake.jpg` | `taggart-lake` | NPS Photo / J. Bonney | [Taggart Lake](https://www.nps.gov/thingstodo/taggartlake.htm) |
| `public/park-images/grand-teton-string-lake.jpg` | `string-lake-loop` (location-level String Lake photo) | NPS Photo / Helton | [String Lake Picnic Area](https://www.nps.gov/places/000/string-lake-picnic-area.htm) |
| `public/park-images/grand-teton-colter-bay.jpg` | `colter-bay-lakeshore-trail` | NPS Photo | [Colter Bay Lakeshore Trail](https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm) |
| `public/park-images/grand-teton-two-ocean-lake.jpg` | `two-ocean-lake-loop` | NPS Photo / J. Bonney | [Two Ocean Lake](https://www.nps.gov/thingstodo/twoocean.htm) |

## Display rules

- With no selected park or trail, the seven homepage photographs rotate every
  nine seconds.
- The user can pause and resume rotation.
- `prefers-reduced-motion: reduce` prevents automatic rotation and removes
  image-transition motion.
- Selecting Grand Teton locks the image to the park-level Jenny Lake scene.
- Selecting a supported trail locks the image to that trail or the most honest
  available NPS location-level photograph.
- Manual entry has no verified location identity, so it keeps the general park
  rotation instead of implying that a photograph depicts the entered hike.
- Each photograph has location-specific alternative text, a visible place
  label, a visible credit, and a link to the official source page.
