/**
 * Canonical mock objects used across the test suite.
 *
 * Each factory returns a fresh object with sensible defaults; pass
 * overrides via the optional `overrides` arg to deviate from canon.
 * This keeps tests short ("an event") rather than 30-line literals.
 */

import type {
  Event,
  Account,
  User,
  Task,
  Asset,
  Approval,
  Notification,
  Milestone,
} from "@/types";

let counter = 0;
function uuid(_prefix = ""): string {
  counter += 1;
  // Generate a syntactically valid UUID v4 with deterministic content so
  // each call produces a unique-but-stable value. Zod v4 enforces the
  // version + variant nibbles strictly, so we can't just zero-fill.
  const hex = counter.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: uuid("aaaaaaaa-aaaa-aaaa-aaaa"),
    name: "Acme Brands",
    slug: "acme",
    logoUrl: undefined,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: uuid("11111111-1111-1111-1111"),
    name: "Tim Pedro",
    email: "tim@brightblue.test",
    role: "events_lead",
    hasCompletedOnboarding: true,
    ...overrides,
  };
}

export function makeCustomerUser(overrides: Partial<User> = {}): User {
  return makeUser({
    role: "customer_admin",
    name: "Casey Customer",
    email: "casey@acme.test",
    accountId: uuid("aaaaaaaa-aaaa-aaaa-aaaa"),
    ...overrides,
  });
}

export function makeEvent(overrides: Partial<Event> = {}): Event {
  const account = overrides.account ?? makeAccount();
  return {
    id: uuid("eeeeeeee-eeee-eeee-eeee"),
    accountId: account.id,
    account,
    name: "Spring Activation",
    eventType: "activation",
    packageType: "standard",
    machineType: "Carousel",
    venueName: "ExCeL London",
    venueAddress: "Royal Victoria Dock, E16 1XL",
    eventDateStart: "2026-06-15",
    eventDateEnd: "2026-06-17",
    currentStage: "creative_assets",
    healthStatus: "green",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: uuid("ttttttttt-tttt-tttt-tttt".slice(0, 19)),
    eventId: uuid("eeeeeeee-eeee-eeee-eeee"),
    title: "Upload hero asset",
    description: "Upload your final hero asset for review",
    taskType: "customer_action",
    category: "creative",
    status: "pending",
    priority: "medium",
    isBlocking: true,
    customerVisible: true,
    sortOrder: 0,
    ...overrides,
  };
}

export function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: uuid("mmmmmmmm-mmmm-mmmm-mmmm"),
    eventId: uuid("eeeeeeee-eeee-eeee-eeee"),
    name: "Creative assets approved",
    stage: "creative_assets",
    status: "in_progress",
    sortOrder: 2,
    customerVisible: true,
    ...overrides,
  };
}

export function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: uuid("a55a55a5-a55a-a55a-a55a"),
    eventId: uuid("eeeeeeee-eeee-eeee-eeee"),
    name: "Hero image",
    assetType: "image",
    filePath: "evt/asset/a1/hero.png",
    fileUrl: "https://test.local/hero.png",
    fileName: "hero.png",
    fileSize: 12345,
    version: 1,
    status: "uploaded",
    customerVisible: true,
    reviewStatus: "pending_review",
    revisionCount: 0,
    ...overrides,
  };
}

export function makeApproval(overrides: Partial<Approval> = {}): Approval {
  return {
    id: uuid("aaaaaaaa-bbbb-cccc-dddd"),
    eventId: uuid("eeeeeeee-eeee-eeee-eeee"),
    title: "Logo v3",
    approvalType: "proof",
    status: "pending",
    requestedAt: "2026-05-01T00:00:00Z",
    revisionCount: 0,
    customerVisible: true,
    ...overrides,
  };
}

export function makeNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return {
    id: uuid("99999999-9999-9999-9999"),
    userId: uuid("11111111-1111-1111-1111"),
    type: "asset.review_needed",
    kind: "asset.review_needed",
    priority: "normal",
    actionRequired: true,
    title: "Asset ready for review",
    body: "A customer uploaded a new asset.",
    link: "/admin/asset-reviews",
    isRead: false,
    createdAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}
