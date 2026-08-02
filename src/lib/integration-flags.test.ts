/** Tests for the integration feature flags. */
import { describe, it, expect, afterEach, vi } from "vitest";

import { isPublicApiEnabled } from "./integration-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isPublicApiEnabled", () => {
  it("is off unless somebody switched it on", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "");
    expect(isPublicApiEnabled()).toBe(false);
  });

  it("accepts either of the two spellings deployments actually use", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "1");
    expect(isPublicApiEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "true");
    expect(isPublicApiEnabled()).toBe(true);
  });

  it("treats anything else as off, including a stray 'false'", () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "false");
    expect(isPublicApiEnabled()).toBe(false);

    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "yes");
    expect(isPublicApiEnabled()).toBe(false);
  });
});
