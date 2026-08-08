/** Tests for invitation-loop link building. */
import { describe, it, expect } from "vitest";
import { invitationHref } from "./invitation";

describe("invitationHref", () => {
  it("tags the landing link with the artefact as utm_source", () => {
    expect(invitationHref("report")).toBe(
      "/book?utm_source=report&utm_medium=referral&utm_campaign=invitation"
    );
  });

  it("carries the referring event for landing personalisation", () => {
    const href = invitationHref("live_dashboard", {
      fromEvent: "Acme Summer Launch",
    });
    expect(href).toContain("utm_source=live_dashboard");
    expect(href).toContain("from=Acme+Summer+Launch");
  });

  it("omits the from param when the event name is blank", () => {
    expect(invitationHref("wrapped", { fromEvent: "  " })).not.toContain(
      "from="
    );
  });
});
