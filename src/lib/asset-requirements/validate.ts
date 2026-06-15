/**
 * Server-side spec validation for uploaded creative.
 *
 * Produces human-readable warnings (never hard blocks — mirrors the
 * "upload anyway" UX) by comparing the measured file against the asset's
 * spec columns: minimum resolution and video duration range.
 *
 * Image dimensions are parsed directly from the file header (PNG/JPEG) so
 * we don't depend on the client being honest. Video duration/resolution
 * can't be read from headers cheaply, so we trust the client-measured
 * values passed alongside the upload.
 */

export interface MeasuredFile {
  fileType: string;
  /** Client-measured pixel width, if known. */
  width?: number;
  /** Client-measured pixel height, if known. */
  height?: number;
  /** Client-measured duration in seconds, for video. */
  durationSeconds?: number;
}

export interface AssetSpecForValidation {
  required_resolution_min?: string | null;
  required_duration_range?: string | null;
}

/** Parse "1080x1920" → { w, h }. Returns null if malformed. */
function parseResolution(value?: string | null): { w: number; h: number } | null {
  if (!value) return null;
  const m = value.toLowerCase().match(/(\d+)\s*[x×]\s*(\d+)/);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}

/** Parse "15-30" → { min, max }. Single number → exact. */
function parseRange(value?: string | null): { min: number; max: number } | null {
  if (!value) return null;
  const range = value.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const single = value.match(/(\d+(?:\.\d+)?)/);
  if (single) return { min: Number(single[1]), max: Number(single[1]) };
  return null;
}

/**
 * Read pixel dimensions from a PNG or JPEG buffer. Returns null for other
 * formats or malformed data.
 */
export function imageDimensionsFromBuffer(
  buf: Uint8Array,
): { width: number; height: number } | null {
  // PNG: 8-byte signature, then IHDR with width@16, height@20 (big-endian).
  if (
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  // JPEG: scan segments for a Start-Of-Frame marker (0xFFC0–0xFFCF except
  // C4/C8/CC), whose payload carries height then width.
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    while (offset + 8 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      const segmentLength = view.getUint16(offset + 2);
      if (isSof) {
        return {
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
        };
      }
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/** Build spec warnings for a measured upload. Empty array = clean. */
export function buildSpecWarnings(
  file: MeasuredFile,
  spec: AssetSpecForValidation,
): string[] {
  const warnings: string[] = [];

  const minRes = parseResolution(spec.required_resolution_min);
  if (minRes && file.width && file.height) {
    if (file.width < minRes.w || file.height < minRes.h) {
      warnings.push(
        `Resolution ${file.width}×${file.height}px is below the required minimum of ${minRes.w}×${minRes.h}px.`,
      );
    }
  }

  const durRange = parseRange(spec.required_duration_range);
  if (durRange && typeof file.durationSeconds === "number") {
    const d = Math.round(file.durationSeconds * 10) / 10;
    if (d < durRange.min || d > durRange.max) {
      warnings.push(
        `Duration ${d}s is outside the required ${durRange.min}–${durRange.max}s range.`,
      );
    }
  }

  return warnings;
}
