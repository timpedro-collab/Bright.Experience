/**
 * Deterministic lead generator for the demo dataset.
 *
 * A completed event's headline "Leads" figure is derived from the play model
 * (plays × opt-in rate). For the leads list to reconcile with that headline,
 * we synthesise the matching number of individual captured contacts — each with
 * a name, email, phone, source, capture timestamp inside the show window, and
 * an age drawn so the cohort's age-band split matches the report demographics.
 *
 * Everything is seeded off the event id so re-runs and SSR/CSR renders produce
 * the exact same people in the exact same order.
 */

export interface GeneratedLead {
  event_id: string;
  machine_instance_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  custom_fields_json: { age: number; age_band: string; interest: string };
  source: string;
  captured_at: string;
  /** GDPR consent ticked at capture — same instant as the capture itself. */
  consented_at: string | null;
}

export interface GenerateLeadsOptions {
  eventId: string;
  /** Total leads to produce (matches the report's totalLeads). */
  count: number;
  /** First show day, YYYY-MM-DD. */
  startDate: string;
  /** Number of show days. */
  days: number;
  /** Age-band -> percentage split (mirrors the report demographics). */
  demographics: Record<string, number>;
  /** Peak capture hour per day; cycles if shorter than `days`. */
  peakHours?: number[];
  /** Machine instance ids to round-robin leads across (optional). */
  machineInstanceIds?: string[];
}

/** Small, fast, deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of a string, used to seed the PRNG per event. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FIRST_NAMES = [
  "Olivia", "James", "Amelia", "Noah", "Isla", "Leo", "Ava", "Arthur",
  "Mia", "Oscar", "Grace", "Harry", "Sophie", "Jack", "Freya", "Charlie",
  "Aisha", "Mohammed", "Priya", "Raj", "Chloe", "Daniel", "Maya", "Ethan",
  "Zara", "Liam", "Nia", "Finn", "Esme", "Reuben", "Carlos", "Mei",
  "Yusuf", "Hannah", "Marcus", "Sofia", "Dante", "Lucia", "Ade", "Ines",
  "Tariq", "Elena", "Kofi", "Wei", "Anya", "Diego", "Saoirse", "Tom",
  "Nadia", "Felix",
];

const LAST_NAMES = [
  "Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson",
  "Davies", "Patel", "Khan", "Robinson", "Wright", "Thompson", "Evans",
  "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Clarke",
  "Hughes", "Edwards", "Mendes", "Dubois", "O'Connor", "Lin", "Sharma",
  "Nair", "Okafor", "Rossi", "Nguyen", "Murphy", "Bell", "Walsh",
  "Ahmed", "Fischer", "Santos", "Kowalski", "Bianchi",
];

const INTERESTS = [
  "sampling", "new product", "competition", "brand news",
  "vouchers", "events", "loyalty", "stockists",
];

const SOURCES: { value: string; weight: number }[] = [
  { value: "game", weight: 0.82 },
  { value: "qr", weight: 0.12 },
  { value: "sample", weight: 0.06 },
];

const AGE_RANGES: Record<string, [number, number]> = {
  "18-24": [18, 24],
  "25-34": [25, 34],
  "35-44": [35, 44],
  "45-54": [45, 54],
  "55+": [55, 72],
};

/** Pick an index from a weighted list using a [0,1) roll. */
function weightedPick<T>(items: { value: T; weight: number }[], roll: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let acc = 0;
  const target = roll * total;
  for (const item of items) {
    acc += item.weight;
    if (target < acc) return item.value;
  }
  return items[items.length - 1].value;
}

function addDays(isoDate: string, n: number): Date {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** Gaussian-ish hour around a peak, clamped to the trading window. */
function captureHour(rand: () => number, peak: number): number {
  // Average two rolls for a soft bell, then bias toward the peak hour.
  const spread = (rand() + rand() - 1) * 3.2; // ~[-3.2, 3.2]
  const h = Math.round(peak + spread);
  return Math.min(19, Math.max(9, h));
}

/**
 * Build an age-band bucket list sized to `count` using the demographics split,
 * so the generated cohort's age distribution matches the report exactly.
 */
function ageBandPlan(count: number, demographics: Record<string, number>): string[] {
  const entries = Object.entries(demographics);
  const totalPct = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const plan: string[] = [];
  for (const [band, pct] of entries) {
    const n = Math.round((pct / totalPct) * count);
    for (let i = 0; i < n; i++) plan.push(band);
  }
  // Correct any rounding drift so the plan length is exactly `count`.
  const fallback = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "25-34";
  while (plan.length < count) plan.push(fallback);
  while (plan.length > count) plan.pop();
  return plan;
}

export function generateLeads(opts: GenerateLeadsOptions): GeneratedLead[] {
  const { eventId, count, startDate, days, demographics } = opts;
  if (count <= 0) return [];
  const peakHours = opts.peakHours ?? [14, 15, 13];
  const machineIds = opts.machineInstanceIds ?? [];
  const rand = mulberry32(hashString(eventId));

  // Distribute leads across the show days following the same gentle curve the
  // snapshots use (day 1 soft, mid strong, last softer).
  const curve = [0.96, 1.06, 1.02, 1.0, 0.98];
  const dayWeights = Array.from({ length: days }, (_, i) => curve[i % curve.length] ?? 1);
  const weightSum = dayWeights.reduce((s, w) => s + w, 0);

  const bandPlan = ageBandPlan(count, demographics);
  // Shuffle the band plan deterministically so ages aren't clustered by day.
  for (let i = bandPlan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bandPlan[i], bandPlan[j]] = [bandPlan[j], bandPlan[i]];
  }

  const leads: GeneratedLead[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const name = `${first} ${last}`;

    const emailBase = `${first}.${last}`
      .toLowerCase()
      .replace(/[^a-z.]/g, "");
    let email = `${emailBase}@example.com`;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${emailBase}${suffix}@example.com`;
      suffix++;
    }
    usedEmails.add(email);

    const phone = `+44 7700 9${String(Math.floor(rand() * 100000)).padStart(5, "0")}`;

    const band = bandPlan[i] ?? "25-34";
    const [lo, hi] = AGE_RANGES[band] ?? [25, 34];
    const age = lo + Math.floor(rand() * (hi - lo + 1));

    const interest = INTERESTS[Math.floor(rand() * INTERESTS.length)];
    const source = weightedPick(SOURCES, rand());

    // Choose a day weighted by the curve, then an hour around that day's peak.
    let dayRoll = rand() * weightSum;
    let dayIdx = 0;
    for (let d = 0; d < days; d++) {
      dayRoll -= dayWeights[d];
      if (dayRoll < 0) {
        dayIdx = d;
        break;
      }
    }
    const date = addDays(startDate, dayIdx);
    const hour = captureHour(rand, peakHours[dayIdx % peakHours.length] ?? 14);
    date.setUTCHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);

    const machine_instance_id =
      machineIds.length > 0 ? machineIds[i % machineIds.length] : null;

    leads.push({
      event_id: eventId,
      machine_instance_id,
      contact_name: name,
      contact_email: email,
      contact_phone: phone,
      custom_fields_json: { age, age_band: band, interest },
      source,
      captured_at: date.toISOString(),
      // Consent is a capture precondition when the checkbox is required, so
      // every stored lead consented at the moment of capture.
      consented_at: date.toISOString(),
    });
  }

  // Newest first, matching how the leads query orders them.
  leads.sort(
    (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
  );
  return leads;
}
