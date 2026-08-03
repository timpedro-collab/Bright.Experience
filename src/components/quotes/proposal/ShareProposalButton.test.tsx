/** Tests for the forward-to-colleague mailto button. */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { ShareProposalButton } from "./ShareProposalButton";

describe("ShareProposalButton", () => {
  let href = "";

  beforeEach(() => {
    href = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return href;
        },
        set href(value: string) {
          href = value;
        },
      },
      writable: true,
    });
  });

  it("opens a prefilled email with the proposal link", async () => {
    const proposalUrl = "https://bright.blue/p/abc123";
    render(<ShareProposalButton proposalUrl={proposalUrl} />);

    await userEvent.click(screen.getByRole("button", { name: /forward to a colleague/i }));

    expect(href).toMatch(/^mailto:\?subject=/);
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain(proposalUrl);
    expect(decoded).toContain("Worth a look");
  });

  it("names the company in the subject when provided", async () => {
    render(
      <ShareProposalButton proposalUrl="https://bright.blue/p/abc123" companyName="Acme" />,
    );

    await userEvent.click(screen.getByRole("button", { name: /forward to a colleague/i }));

    const decoded = decodeURIComponent(href);
    expect(decoded).toContain("for Acme");
  });
});
