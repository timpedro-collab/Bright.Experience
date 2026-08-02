import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/** Fresh module each time so the one-shot warning latch does not leak. */
async function loadFlag() {
  vi.resetModules();
  return (await import("./flag")).isMockMode;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "");
  vi.stubEnv("NEXT_PUBLIC_ALLOW_INSECURE_MOCK_AUTH", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isMockMode", () => {
  it("is off when the flag is unset", async () => {
    const isMockMode = await loadFlag();
    expect(isMockMode()).toBe(false);
  });

  it("is on in development for both accepted spellings", async () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const value of ["1", "true"]) {
      vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", value);
      const isMockMode = await loadFlag();
      expect(isMockMode()).toBe(true);
    }
  });

  it("ignores other truthy-looking values", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "yes");
    const isMockMode = await loadFlag();
    expect(isMockMode()).toBe(false);
  });

  it("refuses to fake auth in a production build", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "1");
    const isMockMode = await loadFlag();
    expect(isMockMode()).toBe(false);
  });

  it("explains itself once when a production build asks for mock mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "1");
    const isMockMode = await loadFlag();

    isMockMode();
    isMockMode();

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls[0]![0]).toContain(
      "has been ignored"
    );
  });

  it("allows the explicit insecure override the E2E harness sets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "1");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_INSECURE_MOCK_AUTH", "1");
    const isMockMode = await loadFlag();

    expect(isMockMode()).toBe(true);
    expect(console.error).not.toHaveBeenCalled();
  });
});
