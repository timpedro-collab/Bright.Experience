/** Tests for the game configuration Zod schemas. */
import { describe, it, expect } from "vitest";
import { saveGameConfigurationSchema } from "./game-config";
import { defaultCaptureRules } from "@/lib/capture-rules";

const VALID = {
  eventId: "e1111111-1111-1111-1111-111111111111",
  prizeMode: "guaranteed",
  prizesJson: [{ name: "Coke 330ml", quantity: 100 }],
  formFieldsJson: [{ label: "Email", type: "email", required: true }],
  includeScoreInExport: false,
  leaderboardEnabled: true,
  gameParametersJson: {},
  idleScreenConfigJson: {},
  captureRulesJson: defaultCaptureRules(),
  retentionDays: 60,
  brandedLanding: false,
};

describe("saveGameConfigurationSchema", () => {
  it("accepts a complete valid configuration", () => {
    expect(saveGameConfigurationSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a malformed event id", () => {
    const result = saveGameConfigurationSchema.safeParse({
      ...VALID,
      eventId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown prize mode", () => {
    const result = saveGameConfigurationSchema.safeParse({
      ...VALID,
      prizeMode: "everyone_wins_twice",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative prize quantities", () => {
    const result = saveGameConfigurationSchema.safeParse({
      ...VALID,
      prizesJson: [{ name: "Coke", quantity: -5 }],
    });
    expect(result.success).toBe(false);
  });

  it("bounds the retention window to 1–730 days", () => {
    expect(
      saveGameConfigurationSchema.safeParse({ ...VALID, retentionDays: 0 }).success
    ).toBe(false);
    expect(
      saveGameConfigurationSchema.safeParse({ ...VALID, retentionDays: 731 }).success
    ).toBe(false);
    expect(
      saveGameConfigurationSchema.safeParse({ ...VALID, retentionDays: 730 }).success
    ).toBe(true);
  });

  it("rejects capture rules missing required keys", () => {
    const result = saveGameConfigurationSchema.safeParse({
      ...VALID,
      captureRulesJson: { businessEmailsOnly: true },
    });
    expect(result.success).toBe(false);
  });
});
