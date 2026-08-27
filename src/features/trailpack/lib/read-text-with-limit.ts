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
): Promise<LimitedTextReadResult> {
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
        await cancelReader(reader);
        return { status: "too-large" };
      }
      textChunks.push(decoder.decode(value, { stream: true }));
    }
    textChunks.push(decoder.decode());
    return { status: "ok", text: textChunks.join("") };
  } catch {
    return { status: "unreadable" };
  } finally {
    reader.releaseLock();
  }
}

export async function discardBody(source: Pick<BodySource, "body">): Promise<void> {
  if (!source.body) {
    return;
  }

  try {
    await source.body.cancel();
  } catch {
    // Releasing an upstream or client stream is best-effort cleanup.
  }
}

async function cancelReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // The measured size still determines the response when cancellation fails.
  }
}
