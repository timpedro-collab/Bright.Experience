/** Tests for the machine config-sync payload assembler. */
import { describe, it, expect } from "vitest";
import { buildEventConfigPayload, type EventConfigInput } from "./config-payload";
import { defaultCaptureRules } from "@/lib/capture-rules";
import type { FleetMachine } from "@/lib/configuration/resolve-config";

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const INPUT: EventConfigInput = {
  prizeMode: "guaranteed",
  prizesJson: [
    { name: "Coke 330ml", quantity: 5000 },
    { name: "Tote bag", imageUrl: "https://cdn.example/tote.png", quantity: 200, probability: 0.1 },
  ],
  formFieldsJson: [
    { label: "Email", type: "email", required: true },
    { label: "Interest", type: "select", required: false, options: ["Demos", "Pricing"] },
  ],
  leaderboardEnabled: true,
  gameParametersJson: { roundSeconds: 30 },
  idleScreenConfigJson: { headline: "Play to win" },
  captureRulesJson: defaultCaptureRules(),
  retentionDays: 60,
  brandedLanding: true,
};

const FLEET: FleetMachine[] = [
  { id: "m1", serialNumber: "BV-2001", zone: "Registration", mission: "welcome_gift" },
  { id: "m2", serialNumber: "BV-2002", zone: "Hall 3", mission: "sponsor_activation" },
];

describe("buildEventConfigPayload", () => {
  it("assembles the versioned snake_case wire contract", () => {
    const pushedAt = new Date("2026-07-24T12:00:00Z");
    const payload = buildEventConfigPayload(EVENT_ID, INPUT, [], [], pushedAt);

    expect(payload.version).toBe(2);
    expect(payload.event_id).toBe(EVENT_ID);
    expect(payload.pushed_at).toBe("2026-07-24T12:00:00.000Z");
    expect(payload.game.prize_mode).toBe("guaranteed");
    expect(payload.game.leaderboard_enabled).toBe(true);
    expect(payload.retention_days).toBe(60);
    expect(payload.branded_landing).toBe(true);
  });

  it("maps prize and form-field keys to snake_case, dropping absent optionals", () => {
    const payload = buildEventConfigPayload(EVENT_ID, INPUT);

    expect(payload.game.prizes[0]).toEqual({ name: "Coke 330ml", quantity: 5000 });
    expect(payload.game.prizes[1]).toEqual({
      name: "Tote bag",
      image_url: "https://cdn.example/tote.png",
      quantity: 200,
      probability: 0.1,
    });
    expect(payload.game.form_fields[0]).toEqual({
      label: "Email",
      type: "email",
      required: true,
    });
    expect(payload.game.form_fields[1].options).toEqual(["Demos", "Pricing"]);
  });

  it("carries every capture-quality guardrail onto the wire", () => {
    const payload = buildEventConfigPayload(EVENT_ID, INPUT);
    expect(payload.capture_rules.business_emails_only).toBe(true);
    expect(payload.capture_rules.block_duplicates).toBe(true);
    expect(payload.capture_rules.consent_required).toBe(true);
    expect(payload.capture_rules.blocked_domains).toContain("gmail.com");
    expect(payload.capture_rules.consent_text.length).toBeGreaterThan(0);
  });

  it("defaults the capture method to form entry", () => {
    expect(buildEventConfigPayload(EVENT_ID, INPUT).capture_method).toBe("form");
  });

  it("ships an empty machines array for a single-machine activation", () => {
    expect(buildEventConfigPayload(EVENT_ID, INPUT).machines).toEqual([]);
  });

  it("emits one fully-resolved block per deployed machine", () => {
    const payload = buildEventConfigPayload(EVENT_ID, INPUT, FLEET);

    expect(payload.machines).toHaveLength(2);
    expect(payload.machines[0]).toMatchObject({
      machine_instance_id: "m1",
      serial_number: "BV-2001",
      zone: "Registration",
      mission: "welcome_gift",
      is_override: false,
      retention_days: 60,
    });
    // Inheriting machines carry the show default verbatim so the machine
    // stack never has to resolve inheritance itself.
    expect(payload.machines[0].game.prize_mode).toBe("guaranteed");
    expect(payload.machines[1].capture_rules.block_duplicates).toBe(true);
  });

  it("applies a per-machine override and leaves other units on the default", () => {
    const override: EventConfigInput = {
      ...INPUT,
      machineInstanceId: "m1",
      prizeMode: "score_based",
      captureMethod: "badge_scan",
      retentionDays: 30,
      brandedLanding: false,
    };
    const payload = buildEventConfigPayload(EVENT_ID, INPUT, FLEET, [override]);

    expect(payload.machines[0]).toMatchObject({
      is_override: true,
      capture_method: "badge_scan",
      retention_days: 30,
      branded_landing: false,
    });
    expect(payload.machines[0].game.prize_mode).toBe("score_based");

    expect(payload.machines[1].is_override).toBe(false);
    expect(payload.machines[1].game.prize_mode).toBe("guaranteed");
    expect(payload.machines[1].capture_method).toBe("form");

    // The show-wide block is untouched by an override.
    expect(payload.game.prize_mode).toBe("guaranteed");
    expect(payload.retention_days).toBe(60);
  });

  it("ignores an override for a machine that is not deployed to the show", () => {
    const stray: EventConfigInput = { ...INPUT, machineInstanceId: "m9", prizeMode: "random" };
    const payload = buildEventConfigPayload(EVENT_ID, INPUT, FLEET, [stray]);

    expect(payload.machines.map((m) => m.machine_instance_id)).toEqual(["m1", "m2"]);
    expect(payload.machines.every((m) => m.game.prize_mode === "guaranteed")).toBe(true);
  });

  it("normalises a missing zone and mission to null on the wire", () => {
    const payload = buildEventConfigPayload(EVENT_ID, INPUT, [
      { id: "m3", serialNumber: "BV-2003" },
    ]);
    expect(payload.machines[0].zone).toBeNull();
    expect(payload.machines[0].mission).toBeNull();
  });
});
