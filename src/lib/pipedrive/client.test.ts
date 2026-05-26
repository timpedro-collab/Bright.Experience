/**
 * Tests for the Pipedrive REST client. We use MSW to intercept HTTP so
 * the client exercises real fetch wiring (URL building, query-param
 * placement, status-code branches) without ever leaving the test
 * process.
 *
 * The Supabase service-role client is mocked so `loadPipedriveConfig`
 * can be driven through both the env-only path and the row-loaded path.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/handlers";
import {
  addNoteToDeal,
  updateDealCustomFields,
  searchPersonByEmail,
  getCurrentPipedriveUser,
  getDeal,
  loadPipedriveConfig,
  type PipedriveConfig,
} from "./client";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let supabase: MockSupabase;
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

const config: PipedriveConfig = {
  apiToken: "test-token",
  baseUrl: "https://api.pipedrive.com",
  fieldKeyLastActivityAt: "abc123",
  fieldKeyHealthStatus: "def456",
  fieldKeyDeliveredEvents: "ghi789",
  healthOptionGreenId: 1,
  healthOptionAmberId: 2,
  healthOptionRedId: 3,
  defaultPipelineId: 1,
};

describe("loadPipedriveConfig", () => {
  it("returns null when neither a row nor env var is set", async () => {
    supabase.setTableResponse("pipedrive_config", { data: null, error: null });
    delete process.env.PIPEDRIVE_API_TOKEN;
    const result = await loadPipedriveConfig();
    expect(result).toBeNull();
  });

  it("falls back to env var when no row exists", async () => {
    supabase.setTableResponse("pipedrive_config", { data: null, error: null });
    process.env.PIPEDRIVE_API_TOKEN = "env-token";
    const result = await loadPipedriveConfig();
    expect(result?.apiToken).toBe("env-token");
    expect(result?.baseUrl).toBe("https://api.pipedrive.com");
    delete process.env.PIPEDRIVE_API_TOKEN;
  });

  it("prefers the row over the env var", async () => {
    supabase.setTableResponse("pipedrive_config", {
      data: { api_token: "row-token", base_url: "https://row.pipedrive.com" },
      error: null,
    });
    process.env.PIPEDRIVE_API_TOKEN = "env-token";
    const result = await loadPipedriveConfig();
    expect(result?.apiToken).toBe("row-token");
    expect(result?.baseUrl).toBe("https://row.pipedrive.com");
    delete process.env.PIPEDRIVE_API_TOKEN;
  });
});

describe("addNoteToDeal", () => {
  it("POSTs to /v1/notes with the deal id and content", async () => {
    const captured: { url: string; body: unknown } = { url: "", body: null };
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", async ({ request }) => {
        captured.url = request.url;
        captured.body = await request.json();
        return HttpResponse.json({ success: true, data: { id: 1 } });
      })
    );
    const result = await addNoteToDeal(config, 42, "Hello world");
    expect(result.ok).toBe(true);
    expect(captured.url).toContain("api_token=test-token");
    expect(captured.body).toEqual({ deal_id: 42, content: "Hello world" });
  });

  it("returns auth_failed on 401", async () => {
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", () =>
        new HttpResponse(null, { status: 401 })
      )
    );
    const result = await addNoteToDeal(config, 42, "hi");
    expect(result).toEqual({ ok: false, status: 401, reason: "auth_failed" });
  });

  it("returns rate_limited on 429", async () => {
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", () =>
        new HttpResponse(null, { status: 429 })
      )
    );
    const result = await addNoteToDeal(config, 42, "hi");
    expect(result).toEqual({ ok: false, status: 429, reason: "rate_limited" });
  });

  it("returns not_found on 404", async () => {
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    const result = await addNoteToDeal(config, 42, "hi");
    expect(result).toEqual({ ok: false, status: 404, reason: "not_found" });
  });

  it("returns the pipedrive error when success is false", async () => {
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", () =>
        HttpResponse.json({ success: false, error: "bad_payload" })
      )
    );
    const result = await addNoteToDeal(config, 42, "hi");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bad_payload");
  });

  it("returns network_error on fetch failure", async () => {
    server.use(
      http.post("https://api.pipedrive.com/v1/notes", () => HttpResponse.error())
    );
    const result = await addNoteToDeal(config, 42, "hi");
    expect(result.ok).toBe(false);
  });
});

describe("updateDealCustomFields", () => {
  it("PUTs to /v1/deals/{id} with the field map", async () => {
    let captured: unknown = null;
    server.use(
      http.put("https://api.pipedrive.com/v1/deals/42", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ success: true, data: { id: 42 } });
      })
    );
    const result = await updateDealCustomFields(config, 42, { abc123: 5 });
    expect(result.ok).toBe(true);
    expect(captured).toEqual({ abc123: 5 });
  });
});

describe("searchPersonByEmail", () => {
  it("encodes the email + queries the search endpoint", async () => {
    let capturedUrl = "";
    server.use(
      http.get("https://api.pipedrive.com/v1/persons/search", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: { items: [] } });
      })
    );
    await searchPersonByEmail(config, "test+user@example.com");
    expect(capturedUrl).toContain("term=test%2Buser%40example.com");
    expect(capturedUrl).toContain("exact_match=true");
  });
});

describe("getCurrentPipedriveUser", () => {
  it("hits /v1/users/me", async () => {
    const result = await getCurrentPipedriveUser(config);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBeDefined();
    }
  });
});

describe("getDeal", () => {
  it("fetches a deal by id", async () => {
    const result = await getDeal(config, 1);
    expect(result.ok).toBe(true);
  });
});
