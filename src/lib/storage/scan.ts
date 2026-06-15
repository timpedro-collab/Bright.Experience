/**
 * Upload malware scanning — env-gated, graceful no-op.
 *
 * INTEGRATION: file antivirus
 *
 * Set FILE_SCAN_URL to a scanning endpoint (e.g. a ClamAV REST shim or a
 * cloud AV API) and uploads will be screened before they're committed to
 * storage. When the variable is unset the scanner degrades to a skip so the
 * upload flow keeps working in local/dev and pre-handoff environments.
 *
 * Expected endpoint contract:
 *   POST {FILE_SCAN_URL}
 *   Headers: Authorization: Bearer {FILE_SCAN_TOKEN}  (optional)
 *            Content-Type: application/octet-stream
 *            X-Filename: <original filename>
 *   Body: raw file bytes
 *   Response: 200 JSON { clean: boolean, signature?: string }
 *             A non-2xx response is treated as "scanner unavailable".
 */

export interface ScanResult {
  /** True when the file is safe to store (clean, or scanning was skipped). */
  ok: boolean;
  /** True when no scanner is configured and the check was skipped. */
  skipped: boolean;
  /** Detected signature name when a threat is found. */
  signature?: string;
  /** Human-readable detail for logs / error surfacing. */
  detail?: string;
}

function getScanConfig(): { url: string; token?: string } | null {
  const url = process.env.FILE_SCAN_URL;
  if (!url) return null;
  return { url, token: process.env.FILE_SCAN_TOKEN };
}

/**
 * Scan a file buffer for malware. Returns `{ ok: true, skipped: true }` when
 * no scanner is configured. On infection returns `{ ok: false }` with the
 * matched signature. Scanner/network failures fail-open (ok: true) so a flaky
 * scanner can't block all uploads — tune to fail-closed if your risk posture
 * requires it.
 */
export async function scanUpload(
  bytes: Uint8Array,
  filename: string,
): Promise<ScanResult> {
  const config = getScanConfig();
  if (!config) return { ok: true, skipped: true };

  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": filename,
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: bytes as unknown as BodyInit,
    });

    if (!res.ok) {
      console.error(
        `[scan] scanner returned ${res.status} — failing open for ${filename}`,
      );
      return { ok: true, skipped: true, detail: `scanner ${res.status}` };
    }

    const verdict = (await res.json()) as {
      clean?: boolean;
      signature?: string;
    };

    if (verdict.clean === false) {
      return {
        ok: false,
        skipped: false,
        signature: verdict.signature,
        detail: verdict.signature
          ? `Threat detected: ${verdict.signature}`
          : "Threat detected",
      };
    }

    return { ok: true, skipped: false };
  } catch (err) {
    console.error("[scan] scanner request failed — failing open:", err);
    return { ok: true, skipped: true, detail: "scanner unreachable" };
  }
}
