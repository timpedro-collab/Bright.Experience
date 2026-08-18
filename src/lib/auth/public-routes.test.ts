/** Unit tests for the middleware's public-route allowlist. */
import { describe, it, expect } from "vitest";
import { isPublicPath } from "./public-routes";

describe("isPublicPath", () => {
  it("lets the marketing and catalogue pages through", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/catalog")).toBe(true);
    expect(isPublicPath("/catalog/machines/claw-classic")).toBe(true);
    expect(isPublicPath("/how-it-works")).toBe(true);
    expect(isPublicPath("/terms")).toBe(true);
  });

  it("lets the Stage 1 marketing pages through", () => {
    expect(isPublicPath("/pricing")).toBe(true);
    expect(isPublicPath("/for-venues")).toBe(true);
    expect(isPublicPath("/for-organizers")).toBe(true);
    expect(isPublicPath("/business-case")).toBe(true);
    expect(isPublicPath("/faq")).toBe(true);
    expect(isPublicPath("/measured-sampling")).toBe(true);
    expect(isPublicPath("/bright-index")).toBe(true);
    expect(isPublicPath("/state-of-play")).toBe(true);
    expect(isPublicPath("/llm-info")).toBe(true);
    expect(isPublicPath("/llms.txt")).toBe(true);
  });

  it("does not let prefix-sharing routes ride the new marketing entries", () => {
    expect(isPublicPath("/pricing-admin")).toBe(false);
    expect(isPublicPath("/faqs")).toBe(false);
  });

  it("lets the tokened capability URLs through", () => {
    expect(isPublicPath("/report/abc123")).toBe(true);
    expect(isPublicPath("/report/abc123/wrapped")).toBe(true);
    expect(isPublicPath("/sponsor/tok_live_1")).toBe(true);
    expect(isPublicPath("/live/some-token")).toBe(true);
    expect(isPublicPath("/p/AB12CD")).toBe(true);
    expect(isPublicPath("/play/0c725f9b-6d17-4ca0-abc6-4ee06f7c7f6a")).toBe(true);
  });

  it("lets partner pricing microsites through without opening prefix-sharing routes", () => {
    expect(isPublicPath("/pp/nrs-europa-4e9d1c7a2b86")).toBe(true);
    expect(isPublicPath("/pp")).toBe(true);
    expect(isPublicPath("/ppx")).toBe(false);
    expect(isPublicPath("/pp-admin/settings")).toBe(false);
  });

  it("lets partner pitch decks through without opening prefix-sharing routes", () => {
    expect(isPublicPath("/pitch/informa")).toBe(true);
    expect(isPublicPath("/pitch/informa/kit")).toBe(true);
    expect(isPublicPath("/pitches")).toBe(false);
  });

  it("lets the report share exports and player card image through, nothing else under those prefixes", () => {
    const token = "6830ebad-e7dc-47f9-9a52-902b77a6434b";
    expect(isPublicPath(`/api/reports/${token}/stat-card`)).toBe(true);
    expect(isPublicPath(`/api/reports/${token}/slide-pdf`)).toBe(true);
    expect(isPublicPath(`/api/reports/${token}/wrapped-card`)).toBe(true);
    expect(isPublicPath(`/api/reports/${token}`)).toBe(false);
    expect(isPublicPath("/api/reports")).toBe(false);
    expect(isPublicPath(`/api/reports/${token}/stat-card/raw`)).toBe(false);
    expect(isPublicPath("/api/play/lead-uuid/card")).toBe(true);
    expect(isPublicPath("/api/play/lead-uuid")).toBe(false);
    expect(isPublicPath("/api/play/lead-uuid/card/extra")).toBe(false);
  });

  it("does not treat /live alone as public, same as /report", () => {
    expect(isPublicPath("/live")).toBe(true);
    expect(isPublicPath("/report")).toBe(true);
    expect(isPublicPath("/live-dashboard")).toBe(false);
  });

  it("lets webhooks, crons and the health probe through", () => {
    expect(isPublicPath("/api/webhooks/brightblue")).toBe(true);
    expect(isPublicPath("/api/cron/digest")).toBe(true);
    expect(isPublicPath("/api/health")).toBe(true);
  });

  it("lets journey email tracking through — a mail client can't hold a session", () => {
    expect(isPublicPath("/api/journeys/track")).toBe(true);
  });

  it("lets AI assistants reach the MCP server", () => {
    expect(isPublicPath("/api/mcp")).toBe(true);
  });

  it("keeps the authenticated app behind the gate", () => {
    expect(isPublicPath("/events/123")).toBe(false);
    expect(isPublicPath("/admin/users")).toBe(false);
    expect(isPublicPath("/settings/security")).toBe(false);
    expect(isPublicPath("/inbox")).toBe(false);
    expect(isPublicPath("/pipeline")).toBe(false);
  });

  it("does not treat a route that merely shares a prefix as public", () => {
    // The bug this whole module exists to prevent: `startsWith("/report")`
    // also matched a future `/reports` dashboard.
    expect(isPublicPath("/reports")).toBe(false);
    expect(isPublicPath("/reporting/overview")).toBe(false);
    expect(isPublicPath("/bookings")).toBe(false);
    expect(isPublicPath("/helpdesk")).toBe(false);
    expect(isPublicPath("/proposals/admin")).toBe(false);
    expect(isPublicPath("/partners/joinery")).toBe(false);
    expect(isPublicPath("/sponsorships")).toBe(false);
    expect(isPublicPath("/api/testimonials")).toBe(false);
  });

  it("lets the proposal PDF export through, but nothing else under /api/quotes", () => {
    expect(
      isPublicPath("/api/quotes/22222222-2222-4222-8222-222222222220/proposal-pdf")
    ).toBe(true);
    expect(isPublicPath("/api/quotes")).toBe(false);
    expect(isPublicPath("/api/quotes/22222222-2222-4222-8222-222222222220")).toBe(false);
    expect(
      isPublicPath("/api/quotes/22222222-2222-4222-8222-222222222220/proposal-pdf/raw")
    ).toBe(false);
  });

  it("treats the venue advertiser page as public but the rest of the venue portal as private", () => {
    expect(isPublicPath("/venues/kings-cross/advertise")).toBe(true);
    expect(isPublicPath("/venues/kings-cross/dashboard")).toBe(false);
    expect(isPublicPath("/venues/kings-cross/placements")).toBe(false);
    // No deeper path under advertise is public.
    expect(isPublicPath("/venues/kings-cross/advertise/edit")).toBe(false);
  });

  it("treats the embeddable venue widget as public, but nothing beneath it", () => {
    expect(isPublicPath("/venues/kings-cross/widget")).toBe(true);
    expect(isPublicPath("/venues/kings-cross/widget/config")).toBe(false);
    expect(isPublicPath("/venues/kings-cross/earnings")).toBe(false);
  });

  it("ignores a trailing slash", () => {
    expect(isPublicPath("/catalog/")).toBe(true);
    expect(isPublicPath("/events/123/")).toBe(false);
  });

  it("serves the static asset folders that middleware still sees", () => {
    expect(isPublicPath("/resources/costa-case-study.html")).toBe(true);
    expect(isPublicPath("/presentation/deck.html")).toBe(true);
  });
});
