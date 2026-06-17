import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/data/demo-contexts";
import { SUPPORTED_TRAILS } from "@/data/supported-trails";

describe("demo contexts", () => {
  it("covers every supported trail", () => {
    expect(Object.keys(DEMO_CONTEXTS).sort()).toEqual(
      Object.keys(SUPPORTED_TRAILS).sort(),
    );
  });

  it("stores deterministic weather per supported trail", () => {
    expect(DEMO_CONTEXTS["taggart-lake"].weather.summary).toMatch(/sun/i);
    expect(DEMO_CONTEXTS["string-lake-loop"].weather.conditions).toContain("wind");
    expect(DEMO_CONTEXTS["jenny-lake-loop"].weather.conditions).toContain("rain");
  });
});
