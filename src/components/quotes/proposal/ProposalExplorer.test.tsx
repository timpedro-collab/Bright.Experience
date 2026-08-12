/** Tests for the post-reveal deal explorer on the proposal page. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render as rtlRender } from "@testing-library/react";
import { render, screen, userEvent } from "@/test/render";
import { CAPABILITIES } from "@/lib/capabilities";
import { ProposalExplorer } from "./ProposalExplorer";
import {
  recordProposalExplorerChange,
  requestProposalConfiguration,
} from "@/app/actions/quotes";

vi.mock("@/app/actions/quotes", () => ({
  recordProposalExplorerChange: vi.fn(),
  requestProposalConfiguration: vi.fn(),
}));

const mockedRequest = vi.mocked(requestProposalConfiguration);
const mockedRecord = vi.mocked(recordProposalExplorerChange);

// £4,200 base fee; survey-layer is a tailorable capability at £400.
const BASE_FEE_PENCE = 420_000;
const surveyLayer = CAPABILITIES.find((c) => c.slug === "survey-layer")!;

describe("ProposalExplorer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRecord.mockResolvedValue({ success: true, data: { id: "q-1" } });
  });

  it("offers only the capabilities not already in the package", () => {
    render(
      <ProposalExplorer
        quoteId="q-1"
        baseFeePence={BASE_FEE_PENCE}
        selectedAddonSlugs={["lead-capture"]}
      />,
    );

    expect(
      screen.queryByText("Capture opted-in leads on every play"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(surveyLayer.outcome)).toBeInTheDocument();
  });

  it("renders nothing when every capability is already included", () => {
    const { container } = rtlRender(
      <ProposalExplorer
        quoteId="q-1"
        baseFeePence={BASE_FEE_PENCE}
        selectedAddonSlugs={CAPABILITIES.map((c) => c.slug)}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("updates the live investment when an add-on is toggled", async () => {
    render(
      <ProposalExplorer
        quoteId="q-1"
        baseFeePence={BASE_FEE_PENCE}
        selectedAddonSlugs={[]}
      />,
    );

    expect(screen.getByText("£4,200")).toBeInTheDocument();
    expect(screen.getByText("The package as quoted.")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("checkbox", { name: surveyLayer.outcome }),
    );

    // £4,200 + £400 survey layer.
    expect(screen.getByText("£4,600")).toBeInTheDocument();
    expect(screen.getByText(/£400 in add-ons/)).toBeInTheDocument();
  });

  it("requests the configuration and confirms without charging", async () => {
    mockedRequest.mockResolvedValue({
      success: true,
      data: { id: "q-1", addons: ["survey-layer"] },
    });

    render(
      <ProposalExplorer
        quoteId="q-1"
        baseFeePence={BASE_FEE_PENCE}
        selectedAddonSlugs={[]}
      />,
    );

    const cta = screen.getByRole("button", {
      name: "Request this configuration",
    });
    expect(cta).toBeDisabled();

    await userEvent.click(
      screen.getByRole("checkbox", { name: surveyLayer.outcome }),
    );
    await userEvent.click(cta);

    expect(mockedRequest).toHaveBeenCalledWith("q-1", ["survey-layer"]);
    expect(
      screen.getByText(/your event lead will confirm/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request this configuration" }),
    ).not.toBeInTheDocument();
  });

  it("surfaces a failure and keeps the request button available", async () => {
    mockedRequest.mockResolvedValue({ success: false, error: "nope" });

    render(
      <ProposalExplorer
        quoteId="q-1"
        baseFeePence={BASE_FEE_PENCE}
        selectedAddonSlugs={[]}
      />,
    );

    await userEvent.click(
      screen.getByRole("checkbox", { name: surveyLayer.outcome }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Request this configuration" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("nope");
    expect(
      screen.getByRole("button", { name: "Request this configuration" }),
    ).toBeInTheDocument();
  });
});
