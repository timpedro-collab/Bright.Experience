/** Tests for the capture-quality guardrail controls. */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/render";
import { CaptureQualitySection } from "./CaptureQualitySection";
import { defaultCaptureRules } from "@/lib/capture-rules";

function renderSection(overrides: Partial<Parameters<typeof CaptureQualitySection>[0]> = {}) {
  const props = {
    rules: defaultCaptureRules(),
    onRulesChange: vi.fn(),
    retentionDays: 60,
    onRetentionChange: vi.fn(),
    brandedLanding: false,
    onBrandedLandingChange: vi.fn(),
    ...overrides,
  };
  render(<CaptureQualitySection {...props} />);
  return props;
}

describe("CaptureQualitySection", () => {
  it("shows the blocklist when business-emails-only is on", () => {
    renderSection();
    expect(screen.getByText("gmail.com")).toBeInTheDocument();
    expect(screen.getByText("btinternet.com")).toBeInTheDocument();
  });

  it("hides the blocklist when business-emails-only is off", () => {
    renderSection({
      rules: { ...defaultCaptureRules(), businessEmailsOnly: false },
    });
    expect(screen.queryByText("gmail.com")).not.toBeInTheDocument();
  });

  it("normalizes and adds a new blocked domain", () => {
    const props = renderSection();
    fireEvent.change(
      screen.getByPlaceholderText(/add a domain to block/i),
      { target: { value: "  FreeNet.DE " } }
    );
    fireEvent.click(screen.getByRole("button", { name: /block domain/i }));
    expect(props.onRulesChange).toHaveBeenCalledWith(
      expect.objectContaining({
        blockedDomains: expect.arrayContaining(["freenet.de"]),
      })
    );
  });

  it("rejects a non-domain entry with an inline error", () => {
    const props = renderSection();
    fireEvent.change(
      screen.getByPlaceholderText(/add a domain to block/i),
      { target: { value: "not a domain" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /block domain/i }));
    expect(screen.getByText(/enter a domain like/i)).toBeInTheDocument();
    expect(props.onRulesChange).not.toHaveBeenCalled();
  });

  it("removes a domain from the blocklist", () => {
    const onRulesChange = vi.fn();
    renderSection({ onRulesChange });
    fireEvent.click(screen.getByRole("button", { name: "Remove gmail.com" }));
    const next = onRulesChange.mock.calls[0][0];
    expect(next.blockedDomains).not.toContain("gmail.com");
  });

  it("toggles duplicate blocking", () => {
    const props = renderSection();
    fireEvent.click(screen.getByRole("checkbox", { name: /one entry per person/i }));
    expect(props.onRulesChange).toHaveBeenCalledWith(
      expect.objectContaining({ blockDuplicates: false })
    );
  });

  it("edits the consent copy when consent is required", () => {
    const props = renderSection();
    fireEvent.change(screen.getByRole("textbox", { name: /consent copy/i }), {
      target: { value: "Custom consent line" },
    });
    expect(props.onRulesChange).toHaveBeenCalledWith(
      expect.objectContaining({ consentText: "Custom consent line" })
    );
  });

  it("updates the retention window", () => {
    const props = renderSection();
    fireEvent.change(screen.getByLabelText(/keep captured leads for/i), {
      target: { value: "90" },
    });
    expect(props.onRetentionChange).toHaveBeenCalledWith(90);
  });

  it("toggles the branded landing page upsell", () => {
    const props = renderSection();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /branded capture landing page/i })
    );
    expect(props.onBrandedLandingChange).toHaveBeenCalledWith(true);
  });
});
