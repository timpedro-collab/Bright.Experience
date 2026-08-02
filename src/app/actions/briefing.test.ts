/**
 * Tests for briefing server actions. Focuses on the change-request path, which
 * delegates to the messaging layer once a brief is locked for build.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMessage = vi.fn();
vi.mock("@/app/actions/messages", () => ({
  sendMessage: (...args: unknown[]) => sendMessage(...args),
}));

beforeEach(() => {
  sendMessage.mockReset();
  sendMessage.mockResolvedValue({ success: true, data: { id: "msg-1" } });
});

describe("requestBriefingChange", () => {
  it("rejects an empty note without notifying anyone", async () => {
    const { requestBriefingChange } = await import("./briefing");
    const result = await requestBriefingChange("e1", "ops", "   ");
    expect(result).toEqual({
      success: false,
      error: "Please describe the change you need.",
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("posts a logistics-topic message for an ops change request", async () => {
    const { requestBriefingChange } = await import("./briefing");
    const result = await requestBriefingChange(
      "e-7",
      "ops",
      "Delivery window moved to 07:00",
    );
    expect(sendMessage).toHaveBeenCalledWith(
      "e-7",
      "Change request (logistics):\n\nDelivery window moved to 07:00",
      false,
      undefined,
      "logistics",
    );
    expect(result).toEqual({ success: true, data: { id: "msg-1" } });
  });

  it("posts a creative-topic message for a creative change request", async () => {
    const { requestBriefingChange } = await import("./briefing");
    await requestBriefingChange("e-9", "creative", "Swap the hero colour to red");
    expect(sendMessage).toHaveBeenCalledWith(
      "e-9",
      "Change request (creative):\n\nSwap the hero colour to red",
      false,
      undefined,
      "creative",
    );
  });
});
