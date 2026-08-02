/** Catalog types — machines, games, packages, and case studies. */

/** Machine hardware unit in the catalog */
export interface Machine {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  specsJson: Record<string, unknown>;
  dimensions?: string;
  heroImageUrl?: string;
  galleryUrls: string[];
  videoUrl?: string;
  capabilities: string[];
  isActive: boolean;
  sortOrder: number;
}

/** Game software that runs on machines */
export interface Game {
  id: string;
  name: string;
  slug: string;
  description?: string;
  previewVideoUrl?: string;
  thumbnailUrl?: string;
  suitableFor: string[];
  category?: string;
  objectives: string[];
  crowdGuidance?: string;
  isActive: boolean;
  sortOrder: number;
}

/** Bookable package combining machine, configuration, and pricing */
export interface Package {
  id: string;
  name: string;
  slug: string;
  description?: string;
  machineId?: string;
  tier: string;
  basePrice?: number;
  durationDays?: number;
  featuresJson: string[];
  isBookable: boolean;
  sortOrder: number;
}

/** Add-on item for a package */
export interface PackageAddon {
  id: string;
  packageId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

/** Client-approved publication level for public marketing surfaces. */
export type PublicationRights = "named" | "anonymised" | "aggregate_only";

/** Published case study showcasing a past event */
export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  clientName?: string;
  eventType?: string;
  location?: string;
  description?: string;
  heroImageUrl?: string;
  galleryUrls: string[];
  statsJson: Record<string, unknown>;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  publicationRights: PublicationRights;
  anonymisedLabel?: string | null;
  isPublished: boolean;
  publishedAt?: string;
}
