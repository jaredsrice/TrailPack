/** Inspect a bounded JPEG header; a human still reviews sharpness and framing. */
export function inspectTrailPhoto(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length > 12_000_000) throw new Error("Image exceeds the 12 MB intake limit.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) {
    throw new Error("Not a JPEG file; renaming another format to .jpg does not convert it.");
  }
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) throw new Error("Unrecognized JPEG header.");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === undefined || marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (length < 8) break;
      const height = view.getUint16(offset + 3);
      const width = view.getUint16(offset + 5);
      if (width < 2_000 || height < 1_200) {
        throw new Error("Image is " + width + " x " + height +
          "; use an original at least 2000 x 1200 pixels. Do not upscale a blurry image.");
      }
      return { width, height };
    }
    offset += length;
  }
  throw new Error("Could not read JPEG dimensions; replace the damaged or unsupported image.");
}
