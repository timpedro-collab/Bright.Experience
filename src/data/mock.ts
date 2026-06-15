import type {
  Account,
  Event,
  Milestone,
  Task,
  User,
  Asset,
  Approval,
} from "@/types";

export const currentUser: User = {
  id: "u-1",
  name: "Sarah Mitchell",
  email: "sarah@brightblue.co.uk",
  role: "events_lead",
  hasCompletedOnboarding: true,
};

export const customerUser: User = {
  id: "u-2",
  name: "James Chen",
  email: "james.chen@cocacola.com",
  role: "customer_admin",
  accountId: "acc-1",
  hasCompletedOnboarding: true,
};

const creativeUser: User = {
  id: "u-3",
  name: "Emma Wright",
  email: "emma@brightblue.co.uk",
  role: "creative_lead",
  hasCompletedOnboarding: true,
};

const opsUser: User = {
  id: "u-4",
  name: "Tom Parker",
  email: "tom@brightblue.co.uk",
  role: "operations_lead",
  hasCompletedOnboarding: true,
};

const qaUser: User = {
  id: "u-5",
  name: "Alex Rivera",
  email: "alex@brightblue.co.uk",
  hasCompletedOnboarding: true,
  role: "qa_lead",
};

export const accounts: Account[] = [
  {
    id: "acc-1",
    name: "Coca-Cola UK",
    slug: "coca-cola-uk",
  },
  {
    id: "acc-2",
    name: "Samsung Electronics",
    slug: "samsung",
  },
  {
    id: "acc-3",
    name: "Diageo",
    slug: "diageo",
  },
];

export const events: Event[] = [
  {
    id: "evt-1",
    accountId: "acc-1",
    account: accounts[0],
    name: "Coca-Cola Summer Festival 2026",
    eventType: "vending",
    packageType: "premium",
    machineType: "Experience Portal",
    venueName: "Hyde Park",
    venueAddress: "London W2 2UH",
    eventDateStart: "2026-07-15",
    eventDateEnd: "2026-07-17",
    setupDate: "2026-07-14",
    collectionDate: "2026-07-18",
    currentStage: "creative_assets",
    healthStatus: "green",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-04-02T14:30:00Z",
  },
  {
    id: "evt-2",
    accountId: "acc-2",
    account: accounts[1],
    name: "Samsung Galaxy Launch Experience",
    eventType: "activation",
    packageType: "custom",
    machineType: "Experience Portal XL",
    venueName: "Westfield London",
    venueAddress: "Ariel Way, London W12 7GF",
    eventDateStart: "2026-05-20",
    eventDateEnd: "2026-05-22",
    currentStage: "approvals",
    healthStatus: "amber",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-04-01T16:00:00Z",
  },
  {
    id: "evt-3",
    accountId: "acc-3",
    account: accounts[2],
    name: "Guinness Six Nations Fan Zone",
    eventType: "sampling",
    packageType: "standard",
    machineType: "Experience Portal Compact",
    venueName: "Twickenham Stadium",
    venueAddress: "Whitton Rd, Twickenham TW2 7BA",
    eventDateStart: "2026-06-10",
    currentStage: "kickoff_complete",
    healthStatus: "green",
    createdAt: "2026-03-20T11:00:00Z",
    updatedAt: "2026-04-03T09:00:00Z",
  },
  {
    id: "evt-4",
    accountId: "acc-1",
    account: accounts[0],
    name: "Coca-Cola Christmas Market",
    eventType: "vending",
    packageType: "premium",
    machineType: "Experience Portal",
    venueName: "Birmingham Frankfurt Market",
    venueAddress: "Victoria Square, Birmingham",
    eventDateStart: "2026-11-20",
    eventDateEnd: "2026-12-23",
    currentStage: "confirmed",
    healthStatus: "green",
    createdAt: "2026-04-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "evt-5",
    accountId: "acc-2",
    account: accounts[1],
    name: "Samsung Unpacked Pop-Up",
    eventType: "activation",
    packageType: "premium",
    machineType: "Experience Portal XL",
    venueName: "Battersea Power Station",
    venueAddress: "Circus Rd W, London SW11 8DD",
    eventDateStart: "2026-04-10",
    eventDateEnd: "2026-04-12",
    currentStage: "qa_readiness",
    healthStatus: "red",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-04-03T11:00:00Z",
  },
];

export function getMilestones(eventId: string): Milestone[] {
  const event = events.find((e) => e.id === eventId);
  if (!event) return [];

  const stageOrder = [
    "confirmed",
    "kickoff_complete",
    "creative_assets",
    "approvals",
    "build_configuration",
    "qa_readiness",
    "logistics_confirmed",
    "event_live",
    "reporting",
    "complete",
  ] as const;

  const stageLabels: Record<string, string> = {
    confirmed: "Event Confirmed",
    kickoff_complete: "Kickoff Complete",
    creative_assets: "Creative Assets Received",
    approvals: "Creative Approved",
    build_configuration: "Machine Configured",
    qa_readiness: "QA Complete",
    logistics_confirmed: "Logistics Confirmed",
    event_live: "Event Live",
    reporting: "Reporting Available",
    complete: "Event Complete",
  };

  const currentIndex = stageOrder.indexOf(event.currentStage);

  return stageOrder.map((stage, i) => ({
    id: `ms-${eventId}-${i}`,
    eventId,
    name: stageLabels[stage],
    stage,
    status:
      i < currentIndex
        ? "complete"
        : i === currentIndex
          ? "in_progress"
          : "pending",
    targetDate: getTargetDate(event.eventDateStart, i),
    completedAt: i < currentIndex ? getPastDate(currentIndex - i) : undefined,
    sortOrder: i,
    customerVisible: true,
  }));
}

function getTargetDate(eventDate: string, stageIndex: number): string {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - (9 - stageIndex) * 7);
  return d.toISOString().split("T")[0];
}

function getPastDate(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString();
}

export function getTasks(eventId: string): Task[] {
  if (eventId === "evt-1") {
    return [
      {
        id: "t-1",
        eventId,
        title: "Upload primary brand logo",
        description: "SVG or PNG format, minimum 300dpi, on transparent background",
        taskType: "customer_action",
        category: "creative",
        status: "complete",
        priority: "high",
        assignedTo: customerUser,
        dueDate: "2026-04-10",
        completedAt: "2026-04-02T10:00:00Z",
        isBlocking: true,
        customerVisible: true,
        sortOrder: 0,
      },
      {
        id: "t-2",
        eventId,
        title: "Upload brand guidelines document",
        description: "PDF with colour codes, font specifications, and usage rules",
        taskType: "customer_action",
        category: "creative",
        status: "in_progress",
        priority: "high",
        assignedTo: customerUser,
        dueDate: "2026-04-12",
        isBlocking: true,
        customerVisible: true,
        sortOrder: 1,
      },
      {
        id: "t-3",
        eventId,
        title: "Provide webform questions",
        description: "List of data capture questions for the consumer-facing form",
        taskType: "customer_action",
        category: "creative",
        status: "pending",
        priority: "medium",
        assignedTo: customerUser,
        dueDate: "2026-04-15",
        isBlocking: false,
        customerVisible: true,
        sortOrder: 2,
      },
      {
        id: "t-4",
        eventId,
        title: "Confirm prize details and quantities",
        description: "Product name, size, quantity, and any vending-specific requirements",
        taskType: "customer_action",
        category: "operations",
        status: "pending",
        priority: "high",
        assignedTo: customerUser,
        dueDate: "2026-04-18",
        isBlocking: true,
        customerVisible: true,
        sortOrder: 3,
      },
      {
        id: "t-5",
        eventId,
        title: "Provide onsite contact details",
        description: "Name, phone, and email for the person on site during the event",
        taskType: "customer_action",
        category: "logistics",
        status: "pending",
        priority: "medium",
        dueDate: "2026-05-01",
        isBlocking: false,
        customerVisible: true,
        sortOrder: 4,
      },
      {
        id: "t-6",
        eventId,
        title: "Design wrap concept",
        taskType: "internal_action",
        category: "creative",
        status: "pending",
        priority: "high",
        assignedTo: creativeUser,
        dueDate: "2026-04-20",
        isBlocking: true,
        customerVisible: false,
        sortOrder: 5,
      },
      {
        id: "t-7",
        eventId,
        title: "Configure game logic",
        taskType: "internal_action",
        category: "development",
        status: "pending",
        priority: "medium",
        assignedTo: qaUser,
        dueDate: "2026-05-15",
        isBlocking: false,
        customerVisible: false,
        sortOrder: 6,
      },
      {
        id: "t-8",
        eventId,
        title: "Arrange logistics and transport",
        taskType: "internal_action",
        category: "logistics",
        status: "pending",
        priority: "medium",
        assignedTo: opsUser,
        dueDate: "2026-06-30",
        isBlocking: false,
        customerVisible: false,
        sortOrder: 7,
      },
    ];
  }

  return [
    {
      id: "t-generic-1",
      eventId,
      title: "Upload brand assets",
      taskType: "customer_action",
      category: "creative",
      status: "pending",
      priority: "high",
      dueDate: "2026-04-20",
      isBlocking: true,
      customerVisible: true,
      sortOrder: 0,
    },
    {
      id: "t-generic-2",
      eventId,
      title: "Complete creative briefing form",
      taskType: "customer_action",
      category: "creative",
      status: "pending",
      priority: "medium",
      dueDate: "2026-04-25",
      isBlocking: false,
      customerVisible: true,
      sortOrder: 1,
    },
  ];
}

export function getAssets(eventId: string): Asset[] {
  if (eventId === "evt-1") {
    return [
      {
        id: "a-1",
        eventId,
        name: "Primary Brand Logo",
        description: "Main logo for wrap and digital touchpoints",
        assetType: "logo",
        requiredFormat: "SVG or PNG (300dpi min)",
        requiredDimensions: "Minimum 2000px wide",
        fileUrl: "/uploads/coca-cola-logo.svg",
        fileName: "coca-cola-primary-logo.svg",
        fileSize: 45200,
        version: 1,
        status: "accepted",
        reviewStatus: "approved",
        revisionCount: 0,
        dueDate: "2026-04-10",
        customerVisible: true,
      },
      {
        id: "a-2",
        eventId,
        name: "Brand Guidelines",
        description: "Full brand guide with colour codes, typography, and usage rules",
        assetType: "brand_guidelines",
        requiredFormat: "PDF",
        version: 1,
        status: "required",
        reviewStatus: "pending_review",
        revisionCount: 0,
        dueDate: "2026-04-12",
        customerVisible: true,
      },
      {
        id: "a-3",
        eventId,
        name: "Campaign Hero Image",
        description: "Key visual for the Summer Festival campaign",
        assetType: "imagery",
        requiredFormat: "PNG or JPEG",
        requiredDimensions: "3840x2160 minimum",
        version: 1,
        status: "required",
        reviewStatus: "pending_review",
        revisionCount: 0,
        dueDate: "2026-04-15",
        customerVisible: true,
      },
      {
        id: "a-4",
        eventId,
        name: "Product Photography",
        description: "High-res product shots for digital displays",
        assetType: "imagery",
        requiredFormat: "PNG (transparent background)",
        requiredDimensions: "2000x2000 minimum",
        version: 1,
        status: "required",
        reviewStatus: "pending_review",
        revisionCount: 0,
        dueDate: "2026-04-18",
        customerVisible: true,
      },
    ];
  }
  return [];
}

export function getApprovals(eventId: string): Approval[] {
  if (eventId === "evt-2") {
    return [
      {
        id: "ap-1",
        eventId,
        title: "Wrap Design",
        description: "Machine wrap design for the Galaxy Launch Experience",
        approvalType: "wrap",
        status: "pending",
        previewUrl: "/previews/samsung-wrap-v2.png",
        requestedAt: "2026-03-28T14:00:00Z",
        revisionCount: 1,
        feedback: "Previous version had incorrect blue shade. Updated to Galaxy Blue #1428A0.",
        customerVisible: true,
      },
      {
        id: "ap-2",
        eventId,
        title: "Game Flow",
        description: "Interactive game sequence for the Bright.Play activation",
        approvalType: "game_flow",
        status: "approved",
        requestedAt: "2026-03-20T10:00:00Z",
        decidedAt: "2026-03-22T16:30:00Z",
        revisionCount: 0,
        customerVisible: true,
      },
      {
        id: "ap-3",
        eventId,
        title: "Webform Design",
        description: "Data capture form for lead generation",
        approvalType: "webform",
        status: "pending",
        requestedAt: "2026-03-30T09:00:00Z",
        revisionCount: 0,
        customerVisible: true,
      },
    ];
  }
  return [];
}
