"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import {
  uploadComplianceDocument,
  reviewComplianceDocument,
} from "@/app/actions/compliance";
import {
  DOC_TYPE_LABELS,
  type ComplianceDocument,
  type ComplianceStatus,
} from "@/types/compliance";

interface ComplianceChecklistProps {
  eventId: string;
  documents: ComplianceDocument[];
  isInternal: boolean;
}

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; icon: React.ReactNode; className: string }> = {
  required: {
    label: "Required",
    icon: <ShieldAlert size={14} />,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  uploaded: {
    label: "Uploaded",
    icon: <Clock size={14} />,
    className: "bg-warning/15 text-warning border-warning/30",
  },
  under_review: {
    label: "Under review",
    icon: <Clock size={14} />,
    className: "bg-info/15 text-info border-info/30",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 size={14} />,
    className: "bg-success/15 text-success border-success/30",
  },
  expired: {
    label: "Expired",
    icon: <AlertTriangle size={14} />,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle size={14} />,
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function expiryBadge(expiresAt: string | null) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return (
      <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
        Expired
      </Badge>
    );
  }
  if (diffDays <= 7) {
    return (
      <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
        Expires in {diffDays}d
      </Badge>
    );
  }
  if (diffDays <= 30) {
    return (
      <Badge className="text-[10px] bg-warning/15 text-warning border-warning/30">
        Expires in {diffDays}d
      </Badge>
    );
  }
  return null;
}

export function ComplianceChecklist({ eventId, documents, isInternal }: ComplianceChecklistProps) {
  const approved = documents.filter((d) => d.status === "approved").length;
  const total = documents.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <ShieldCheck size={16} className={approved === total ? "text-success" : "text-muted-foreground"} />
        <span className="text-muted-foreground">
          {approved} of {total} approved
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <ComplianceRow
            key={doc.id}
            doc={doc}
            eventId={eventId}
            isInternal={isInternal}
          />
        ))}
      </div>
    </div>
  );
}

function ComplianceRow({
  doc,
  eventId,
  isInternal,
}: {
  doc: ComplianceDocument;
  eventId: string;
  isInternal: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const cfg = STATUS_CONFIG[doc.status];

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.set("docId", doc.id);
    fd.set("eventId", eventId);
    fd.set("file", file);

    startTransition(async () => {
      const result = await uploadComplianceDocument(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Document uploaded");
      router.refresh();
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleReview(decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewComplianceDocument(doc.id, eventId, decision);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Document ${decision}`);
      router.refresh();
    });
  }

  return (
    <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0">{cfg.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground truncate">{doc.title}</h4>
              <Badge className={cn("text-[10px] shrink-0", cfg.className)}>
                {cfg.label}
              </Badge>
              {expiryBadge(doc.expiresAt)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {DOC_TYPE_LABELS[doc.documentType]}
              {doc.requiredMinimum && ` · Minimum: ${doc.requiredMinimum}`}
              {doc.currentValue && ` · Current: ${doc.currentValue}`}
              {doc.expiresAt && ` · Expires: ${formatDateShort(doc.expiresAt)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}

          {!pending && (doc.status === "required" || doc.status === "rejected" || doc.status === "expired") && (
            <>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload size={12} /> Upload
              </Button>
              <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
            </>
          )}

          {!pending && isInternal && (doc.status === "uploaded" || doc.status === "under_review") && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-success"
                onClick={() => handleReview("approved")}
              >
                <CheckCircle2 size={12} /> Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleReview("rejected")}
              >
                <XCircle size={12} /> Reject
              </Button>
            </>
          )}

          {doc.fileUrl && doc.status === "approved" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText size={12} /> Uploaded
            </span>
          )}
        </div>
      </div>

      {doc.notes && isInternal && (
        <p className="mt-2 text-xs text-muted-foreground ml-7">
          {doc.notes}
        </p>
      )}
    </div>
  );
}
