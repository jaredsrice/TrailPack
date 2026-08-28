import { describe, expect, it } from "vitest";
import { readTextWithinLimit } from "./read-text-with-limit";

function streamedResponse(
  chunks: Uint8Array[],
  onCancel?: () => void,
): Response {
  let index = 0;
  return new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        if (index >= chunks.length) {
          controller.close();
          return;
        }
        controller.enqueue(chunks[index]);
        index += 1;
      },
      cancel() {
        onCancel?.();
      },
    }),
  );
}

describe("readTextWithinLimit", () => {
  it("accepts a body at the exact byte boundary", async () => {
    const body = new TextEncoder().encode("éé");

    await expect(readTextWithinLimit(streamedResponse([body]), 4)).resolves.toEqual({
      status: "ok",
      text: "éé",
    });
  });

  it("counts multibyte input as bytes and cancels above the boundary", async () => {
    let cancelled = false;
    const body = new TextEncoder().encode("éé");

    await expect(
      readTextWithinLimit(streamedResponse([body], () => { cancelled = true; }), 3),
    ).resolves.toEqual({ status: "too-large" });
    expect(cancelled).toBe(true);
  });

  it("keeps the too-large result when stream cancellation rejects", async () => {
    const body = new TextEncoder().encode("oversized");
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(body);
        },
        cancel() {
          throw new Error("cancel failed");
        },
      }),
    );

    await expect(readTextWithinLimit(response, 4)).resolves.toEqual({
      status: "too-large",
    });
  });

  it("rejects a declared oversized body before consuming it", async () => {
    let pulled = false;
    const response = new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          pulled = true;
          controller.enqueue(new TextEncoder().encode("small"));
        },
      }),
      { headers: { "content-length": "65" } },
    );

    await expect(readTextWithinLimit(response, 64)).resolves.toEqual({
      status: "too-large",
    });
    expect(pulled).toBe(false);
  });

  it("rejects malformed content-length metadata", async () => {
    const response = new Response("{}", {
      headers: { "content-length": "not-a-number" },
    });

    await expect(readTextWithinLimit(response, 64)).resolves.toEqual({
      status: "unreadable",
    });
  });

  it("returns unreadable when the stream fails", async () => {
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(new Error("read failed"));
        },
      }),
    );

    await expect(readTextWithinLimit(response, 64)).resolves.toEqual({
      status: "unreadable",
    });
  });
});
