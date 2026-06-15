/** Shared compliance types and constants — importable from both server and client code. */

export type ComplianceDocType =
  | "insurance_pl"
  | "insurance_el"
  | "insurance_product"
  | "dpa"
  | "rams"
  | "h_and_s"
  | "contract"
  | "certificate"
  | "other";

export type ComplianceStatus =
  | "required"
  | "uploaded"
  | "under_review"
  | "approved"
  | "expired"
  | "rejected";

export interface ComplianceDocument {
  id: string;
  eventId: string;
  documentType: ComplianceDocType;
  title: string;
  fileUrl: string | null;
  requiredMinimum: string | null;
  currentValue: string | null;
  meetsRequirement: boolean;
  expiresAt: string | null;
  status: ComplianceStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DOC_TYPE_LABELS: Record<ComplianceDocType, string> = {
  insurance_pl: "Public Liability Insurance",
  insurance_el: "Employer's Liability Insurance",
  insurance_product: "Product Liability Insurance",
  dpa: "Data Processing Agreement",
  rams: "RAMS Documentation",
  h_and_s: "Health & Safety Certificate",
  contract: "Contract / Agreement",
  certificate: "Certificate",
  other: "Other",
};
