/** Reporting types — proof-of-performance reports and category benchmarks. */

/** Discriminated report type for proof-of-performance reports */
export type ReportType = "post_event" | "mid_event" | "custom";

/** A generated proof-of-performance report for an event */
export interface EventReport {
  id: string;
  eventId: string;
  reportType: ReportType;
  title: string;
  metricsJson: Record<string, unknown>;
  predictionsJson: Record<string, unknown>;
  comparisonJson: Record<string, unknown>;
  highlightsJson: Record<string, unknown>[];
  shareToken?: string;
  generatedAt: string;
  isPublished: boolean;
  publishedAt?: string;
  /** Optional hand-written note from the delivery lead, set at publish time. */
  personalNote?: string;
  /** Display name of whoever wrote the personal note. */
  personalNoteAuthor?: string;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate performance benchmark by category */
export interface Benchmark {
  id: string;
  eventType: string;
  locationTier?: string;
  machineType?: string;
  gameType?: string;
  metricName: string;
  avgValue?: number;
  medianValue?: number;
  p25Value?: number;
  p75Value?: number;
  sampleSize: number;
  updatedAt: string;
}
