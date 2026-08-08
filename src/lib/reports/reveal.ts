/**
 * Report reveal helpers — the single headline number the report leads with,
 * and the champion credit line that makes the customer the hero of it.
 *
 * Pure module shared by the portal report, the public share page, the
 * all-hands slide and the stat-card image, so every surface leads with the
 * same number.
 */

import type { NormalisedMetrics } from "@/lib/reports/normalise";

export interface HeadlineStat {
  /** Formatted headline value, e.g. "1,877". */
  value: string;
  /** What the number is, e.g. "opted-in leads". */
  label: string;
  /** Optional supporting line, e.g. "from 5,120 plays". */
  support: string | null;
}

const fmt = (n: number) => n.toLocaleString("en-GB");

/**
 * The one number this event leads with. Preference order mirrors what a
 * buyer would brag about: opted-in leads, then plays, then footfall
 * impressions. Null when nothing was measured — surfaces then skip the hero
 * rather than reveal a zero.
 */
export function pickHeadlineStat(metrics: NormalisedMetrics): HeadlineStat | null {
  if (metrics.totalLeads > 0) {
    return {
      value: fmt(metrics.totalLeads),
      label: "opted-in leads",
      support:
        metrics.totalPlays > 0 ? `from ${fmt(metrics.totalPlays)} plays` : null,
    };
  }
  if (metrics.totalPlays > 0) {
    return {
      value: fmt(metrics.totalPlays),
      label: "plays",
      support:
        metrics.mediaImpressions > 0
          ? `seen by ${fmt(metrics.mediaImpressions)} passers-by`
          : null,
    };
  }
  if (metrics.mediaImpressions > 0) {
    return {
      value: fmt(metrics.mediaImpressions),
      label: "footfall impressions",
      support: null,
    };
  }
  return null;
}

/** "Post-Event Report — Acme Launch" → "Acme Launch". */
export function eventNameFromReportTitle(title: string | null | undefined): string {
  const t = (title ?? "").trim();
  const idx = t.indexOf("—");
  return idx >= 0 ? t.slice(idx + 1).trim() : t;
}

export interface CampaignCreditInput {
  contactName?: string | null;
  contactRole?: string | null;
  companyName?: string | null;
}

/**
 * "Campaign led by Sarah Whitmore, Marketing — Acme" — the champion gets
 * their name on the result. Null when we don't know who led it; an absent
 * credit beats a generic one.
 */
export function campaignCredit(input: CampaignCreditInput): string | null {
  const name = input.contactName?.trim();
  if (!name) return null;
  const role = input.contactRole?.trim();
  const company = input.companyName?.trim();
  let credit = `Campaign led by ${name}`;
  if (role) credit += `, ${role}`;
  if (company) credit += ` — ${company}`;
  return credit;
}
