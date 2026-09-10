import { describe, expect, it } from "vitest";
import { parseNpsRouteVariant } from "./nps-source-integrity";

const html = `<div>Duration</div><div>1-3 Hours</div><div id="InfoAccordian__Item__Description--0">
<p><strong>Hidden Falls Via Shuttle Boat</strong></p>
<p>Hidden Falls is an easy, 1 mi RT out and back hike with 300 ft of elevation gain.</p>
<p><strong>Hidden Falls Via South Jenny Lake Loop Trail</strong></p>
<p>Hidden Falls is a moderate, 4.9 mi RT out and back hike with 620 ft of elevation gain.</p></div>`;

describe("NPS access variant selection", () => {
  it("selects the requested walking route independently of neighboring values", () => {
    expect(parseNpsRouteVariant(html, "Hidden Falls Via South Jenny Lake Loop Trail")).toMatchObject({
      distanceMiles: 4.9, elevationGainFeet: 620, difficulty: "Moderate", routeType: "out-and-back",
    });
    expect(parseNpsRouteVariant(html.replace("4.9 mi", "5.4 mi"), "Hidden Falls Via South Jenny Lake Loop Trail").distanceMiles).toBe(5.4);
    expect(parseNpsRouteVariant(html, "Hidden Falls Via Shuttle Boat").distanceMiles).toBe(1);
  });

  it("fails closed when the selected route heading disappears", () => {
    expect(parseNpsRouteVariant(html, "Hidden Falls Via North Jenny Lake")).toEqual({});
  });

  it("accepts the bold headings used by NPS for the Granite Canyon approach", () => {
    const bold = html.replaceAll("strong", "b");
    expect(parseNpsRouteVariant(bold, "Hidden Falls Via South Jenny Lake Loop Trail").distanceMiles).toBe(4.9);
  });

  it("supports an explicit accessibility heading correction without selecting another route", () => {
    const access = `<div class="AccessibilityInfo__Body"><b>Walking approach typo</b><p>4.9 mi, 620 ft of elevation gain.</p><strong>Boat approach</strong><p>1 mi, 300 ft of elevation gain.</p><p>Narrow trail with exposed roots.</p></div>`;
    const parsed = parseNpsRouteVariant(html + access, "Hidden Falls Via South Jenny Lake Loop Trail", "Walking approach typo");
    expect(parsed.accessibility).toBe("4.9 mi, 620 ft of elevation gain. Narrow trail with exposed roots.");
    expect(parseNpsRouteVariant(html + access, "Hidden Falls Via South Jenny Lake Loop Trail").accessibility).toBeUndefined();
  });

  it("does not substitute an accessibility copy when duration metrics disappear", () => {
    const missing = html.replace("4.9 mi RT out and back hike with 620 ft of elevation gain", "hike with details unavailable");
    const copy = `<div class="AccessibilityInfo__Body"><strong>Hidden Falls Via South Jenny Lake Loop Trail</strong><p>4.9 mi with 620 ft of elevation gain.</p></div>`;
    expect(parseNpsRouteVariant(missing + copy, "Hidden Falls Via South Jenny Lake Loop Trail")).toEqual({});
  });

  it("rejects duplicate matching metric sections instead of guessing", () => {
    const duplicate = html.replace(/<\/div>$/, `<strong>Hidden Falls Via South Jenny Lake Loop Trail</strong><p>5.4 mi with 700 ft of elevation gain.</p></div>`);
    expect(parseNpsRouteVariant(duplicate, "Hidden Falls Via South Jenny Lake Loop Trail")).toEqual({});
  });

  it("preserves very strenuous instead of downgrading it", () => {
    expect(parseNpsRouteVariant(html.replace("a moderate", "a very strenuous"), "Hidden Falls Via South Jenny Lake Loop Trail").difficulty).toBe("Very Strenuous");
  });

  it("selects only the matching accessibility paragraph", () => {
    const accessibility = `<div class="AccessibilityInfo__Body"><strong>Hidden Falls Via Shuttle Boat</strong><p>Short boat approach.</p><strong>Hidden Falls Via South Jenny Lake Loop Trail</strong><p>The longer walking route includes exposed roots.</p></div>`;
    expect(parseNpsRouteVariant(html + accessibility, "Hidden Falls Via South Jenny Lake Loop Trail").accessibility).toBe("The longer walking route includes exposed roots.");
    expect(parseNpsRouteVariant(html + accessibility, "Hidden Falls Via Shuttle Boat").accessibility).toBe("Short boat approach.");
  });
});
