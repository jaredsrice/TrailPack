# TrailPack National Park Image Sources

Created: 2026-07-25  
Last verified: 2026-08-28

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

| Local file | Subject | Displayed credit | Desktop / mobile focal point | Official source |
| --- | --- | --- | --- | --- |
| `public/park-images/grand-teton-teton-range.jpg` | Teton Range above forest and wildflowers, Grand Teton National Park | NPS Photo / Jane Gamble | `50% 54%` / `50% 53%` | [Teton Range](https://www.nps.gov/media/photo/view.htm?id=D8FA991A-BAB6-4DA9-84CD-8B0F58A33E6A) |
| `public/park-images/yosemite-national-park.jpg` | Half Dome from Snow Creek Trail, Yosemite National Park | NPS Photo / Dory Shreve | `58% 46%` / `61% 48%` | [Half Dome](https://www.nps.gov/media/photo/view.htm?id=F0103896-0B72-4458-8DCC-9393098FCB46) |
| `public/park-images/yellowstone-national-park.jpg` | Pelican Creek and Yellowstone Lake, Yellowstone National Park | NPS Photo / Diane Renkin | `52% 50%` / `55% 50%` | [Pelican Creek](https://www.nps.gov/media/photo/view.htm?id=FF5DCB7D-1DD8-B71B-0B7B-E46B9D89458A) |
| `public/park-images/glacier-national-park.jpg` | Going-to-the-Sun Road, Glacier National Park | NPS Photo / Tim Rains | `50% 56%` / `52% 52%` | [Going-to-the-Sun Road](https://www.nps.gov/media/photo/view.htm?id=350026E2-1DD8-B71B-0BF0-87234FDB0F45) |
| `public/park-images/olympic-national-park.jpg` | Olympic Coast sea stacks, Olympic National Park | NPS Photo | `50% 42%` / `50% 45%` | [Olympic Coast](https://www.nps.gov/media/photo/view.htm?id=F24A5A69-155D-4519-3E4D-8113C1A7B030) |
| `public/park-images/zion-national-park.jpg` | Zion Canyon from Angels Landing, Zion National Park | NPS Photo | `50% 49%` / `50% 50%` | [Zion Canyon](https://www.nps.gov/media/photo/view.htm?id=27CFD31C-155D-451F-67B1-099AF8F7BC45) |
| `public/park-images/acadia-national-park.jpg` | Otter Cliff at sunrise, Acadia National Park | NPS Photo / Matthew Lambert | `60% 50%` / `68% 50%` | [Otter Cliff](https://www.nps.gov/media/photo/view.htm?id=8FC76911-1DD8-B71B-0B0C-44001AD49D55) |

## Selected Grand Teton trail images

| Local file | Trail/location mapping | Displayed credit | Official source |
| --- | --- | --- | --- |
| `public/park-images/grand-teton-jenny-lake-trail.jpg` | `jenny-lake-loop` | NPS Photo | [Jenny Lake](https://www.nps.gov/media/photo/view.htm?id=FBDA99C4-155D-451F-6708-0CF583236CF5) |
| `public/park-images/grand-teton-taggart-lake.jpg` | `taggart-lake` | NPS Photo / J. Bonney | [Taggart Lake](https://www.nps.gov/thingstodo/taggartlake.htm) |
| `public/park-images/grand-teton-string-lake.jpg` | `string-lake-loop` (location-level String Lake photo) | NPS Photo / Helton | [String Lake Picnic Area](https://www.nps.gov/places/000/string-lake-picnic-area.htm) |
| `public/park-images/grand-teton-colter-bay.jpg` | `colter-bay-lakeshore-trail` | NPS Photo | [Colter Bay Lakeshore Trail](https://www.nps.gov/places/000/colter-bay-lakeshore-trail.htm) |
| `public/park-images/grand-teton-two-ocean-lake.jpg` | `two-ocean-lake-loop` | NPS Photo / J. Bonney | [Two Ocean Lake](https://www.nps.gov/thingstodo/twoocean.htm) |

## Display rules

- With no selected park or trail, the seven homepage photographs rotate every
  nine seconds.
- The user can pause/resume, move to the previous or next photograph, or choose
  any park directly from the seven slide selectors.
- `prefers-reduced-motion: reduce` prevents automatic rotation and removes
  image-transition motion.
- Selecting Grand Teton locks the image to the park-level Teton Range scene.
- Selecting a supported trail locks the image to that trail or the most honest
  available NPS location-level photograph.
- Manual entry has no verified location identity, so it keeps the general park
  rotation instead of implying that a photograph depicts the entered hike.
- Each photograph has location-specific alternative text, a visible place
  label, a visible credit, and a link to the official source page.
- The rotation originals are at least 2,560 pixels wide (3,200 pixels for the
  Yellowstone panorama), are served at image quality `90`, and use explicit
  desktop/mobile focal points so the subject remains intentional when cropped.
- The Jenny Lake trail image is a separate 2,000-by-1,500-pixel NPS original;
  it is not reused as a generic Grand Teton rotation image.
