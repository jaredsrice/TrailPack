import { describe, expect, it } from "vitest";
import { inspectTrailPhoto } from "./trail-photo";

function header(width: number, height: number): Uint8Array {
  // Minimal SOF header fixture, not a decodable photograph.
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xc2, 0, 8, 8, 0, 0, 0, 0, 0]);
  const view = new DataView(bytes.buffer);
  view.setUint16(7, height);
  view.setUint16(9, width);
  return bytes;
}

describe("shared trail photo inspection", () => {
  it("reads a progressive JPEG header and accepts the minimum dimensions", () => {
    expect(inspectTrailPhoto(header(2_000, 1_200))).toEqual({ width: 2_000, height: 1_200 });
  });

  it("handles a byte view whose buffer starts before the image", () => {
    const bytes = new Uint8Array(20);
    bytes.set(header(3_000, 2_000), 4);
    expect(inspectTrailPhoto(bytes.subarray(4, 16))).toEqual({ width: 3_000, height: 2_000 });
  });

  it.each([[1_999, 1_200], [2_000, 1_199], [0, 0]])("rejects a small %s x %s image with a useful fix", (width, height) => {
    expect(() => inspectTrailPhoto(header(width, height))).toThrow("Do not upscale a blurry image");
  });

  it.each([
    new Uint8Array(),
    new Uint8Array([1, 2, 3, 4]),
    new Uint8Array([0xff, 0xd8, 0xff]),
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]),
    new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 255]),
    new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
  ])("terminates cleanly on malformed JPEG input %#", (bytes) => {
    expect(() => inspectTrailPhoto(bytes)).toThrow();
  });

  it("bounds large input without inspecting it", () => {
    expect(() => inspectTrailPhoto(new Uint8Array(12_000_001))).toThrow("12 MB");
  });
});
