export type LimitedTextReadResult =
  | { status: "ok"; text: string }
  | { status: "too-large" }
  | { status: "unreadable" };

type BodySource = {
  body: ReadableStream<Uint8Array> | null;
  headers: Headers;
};

export async function readTextWithinLimit(
  source: BodySource,
  maximumBytes: number,
  signal?: AbortSignal,
): Promise<LimitedTextReadResult> {
  if (signal?.aborted) {
    await discardBody(source);
    return { status: "unreadable" };
  }
  const declaredLengthHeader = source.headers.get("content-length");
  if (declaredLengthHeader !== null) {
    const normalizedLength = declaredLengthHeader.trim();
    const declaredLength = Number(normalizedLength);
    if (
      !/^\d+$/.test(normalizedLength) ||
      !Number.isSafeInteger(declaredLength)
    ) {
      await discardBody(source);
      return { status: "unreadable" };
    }
    if (declaredLength > maximumBytes) {
      await discardBody(source);
      return { status: "too-large" };
    }
  }

  if (!source.body) {
    return { status: "ok", text: "" };
  }

  const reader = source.body.getReader();
  const onAbort = () => cancelReader(reader);
  signal?.addEventListener("abort", onAbort, { once: true });
  const decoder = new TextDecoder();
  const textChunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        cancelReader(reader);
        return { status: "too-large" };
      }
      textChunks.push(decoder.decode(value, { stream: true }));
    }
    textChunks.push(decoder.decode());
    return signal?.aborted ? { status: "unreadable" } : { status: "ok", text: textChunks.join("") };
  } catch {
    return { status: "unreadable" };
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}

export async function discardBody(source: Pick<BodySource, "body">): Promise<void> {
  if (!source.body) {
    return;
  }

  try {
    const cancellation = source.body.cancel();
    void cancellation.catch(() => undefined);
  } catch {
    // Releasing an upstream or client stream is best-effort cleanup.
  }
}

function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): void {
  try {
    const cancellation = reader.cancel();
    void cancellation.catch(() => undefined);
  } catch {
    // The measured size still determines the response when cancellation fails.
  }
}
