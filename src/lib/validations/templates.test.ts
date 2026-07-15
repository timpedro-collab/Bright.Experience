/**
 * Tests for the event template schemas used by the templates actions.
 */

import { describe, it, expect } from "vitest";
import {
  createTemplateSchema,
  saveTemplateDataSchema,
  saveEventAsTemplateSchema,
} from "./templates";

const TEMPLATE_ID = "00000000-0000-4000-8000-000000000101";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

describe("createTemplateSchema", () => {
  const validTemplate = {
    name: "Standard Activation",
    description: "Turnkey single-day activation.",
    eventType: "activation",
    packageType: "standard",
  };

  it("accepts a valid template", () => {
    expect(() => createTemplateSchema.parse(validTemplate)).not.toThrow();
  });

  it("accepts a null description", () => {
    expect(() =>
      createTemplateSchema.parse({ ...validTemplate, description: null })
    ).not.toThrow();
  });

  it("rejects a name shorter than two characters", () => {
    expect(() =>
      createTemplateSchema.parse({ ...validTemplate, name: "A" })
    ).toThrow(/min 2 chars/);
  });

  it("rejects an unknown event type", () => {
    expect(() =>
      createTemplateSchema.parse({ ...validTemplate, eventType: "conference" })
    ).toThrow();
  });

  it("rejects an unknown package type", () => {
    expect(() =>
      createTemplateSchema.parse({ ...validTemplate, packageType: "deluxe" })
    ).toThrow();
  });
});

describe("saveTemplateDataSchema", () => {
  it("accepts a partial editor payload", () => {
    expect(() =>
      saveTemplateDataSchema.parse({
        templateId: TEMPLATE_ID,
        tasks_json: [{ title: "Complete event briefing" }],
        game_config_defaults_json: null,
      })
    ).not.toThrow();
  });

  it("accepts an empty payload with just the template id", () => {
    expect(() => saveTemplateDataSchema.parse({ templateId: TEMPLATE_ID })).not.toThrow();
  });

  it("rejects a malformed template id", () => {
    expect(() =>
      saveTemplateDataSchema.parse({ templateId: "tmpl-1" })
    ).toThrow(/Invalid template ID/);
  });

  it("rejects a non-array milestones payload", () => {
    expect(() =>
      saveTemplateDataSchema.parse({ templateId: TEMPLATE_ID, milestones_json: "oops" })
    ).toThrow();
  });
});

describe("saveEventAsTemplateSchema", () => {
  it("accepts a valid event id and name", () => {
    expect(() =>
      saveEventAsTemplateSchema.parse({ eventId: EVENT_ID, templateName: "Coke Summer Runway" })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      saveEventAsTemplateSchema.parse({ eventId: "evt-1", templateName: "Runway" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects an empty template name", () => {
    expect(() =>
      saveEventAsTemplateSchema.parse({ eventId: EVENT_ID, templateName: "" })
    ).toThrow(/Template name is required/);
  });
});
