/**
 * MSW request handlers for the Pipedrive REST API.
 *
 * Used in tests for `src/lib/pipedrive/client.ts` to assert behaviour
 * against realistic HTTP responses without ever hitting Pipedrive.
 *
 * Each test that needs a different response can call `server.use(...)`
 * with a one-off handler to override these defaults — see Vitest +
 * MSW v2 docs for the pattern.
 */

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "https://api.pipedrive.com";

export const handlers = [
  // Users / credential check
  http.get(`${BASE}/v1/users/me`, () =>
    HttpResponse.json({
      success: true,
      data: { id: 1, name: "Test User", email: "test@brightblue.test" },
    })
  ),

  // Add note to deal
  http.post(`${BASE}/v1/notes`, () =>
    HttpResponse.json({ success: true, data: { id: 42 } })
  ),

  // Update deal
  http.put(`${BASE}/v1/deals/:id`, () =>
    HttpResponse.json({ success: true, data: { id: 1 } })
  ),

  // Get a single deal
  http.get(`${BASE}/v1/deals/:id`, () =>
    HttpResponse.json({
      success: true,
      data: { id: 1, status: "open", person_id: { value: 1 } },
    })
  ),

  // Person search
  http.get(`${BASE}/v1/persons/search`, () =>
    HttpResponse.json({
      success: true,
      data: { items: [{ item: { id: 1 } }] },
    })
  ),
];

export const server = setupServer(...handlers);
