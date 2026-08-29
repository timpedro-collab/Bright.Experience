"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, FileText, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadBriefingFile } from "@/app/actions/briefing";

interface BriefingFileUploadProps {
  eventId: string;
  existingFiles: { name: string; path: string; url: string | null }[];
  /** Internal viewers see the customer's files but don't upload here. */
  readOnly?: boolean;
}

export function BriefingFileUpload({ eventId, existingFiles, readOnly = false }: BriefingFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, startTransition] = useTransition();
  const [files, setFiles] = useState(existingFiles);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("file", file);

    startTransition(async () => {
      const result = await uploadBriefingFile(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setFiles((prev) => [
        ...prev,
        { name: result.data!.fileName, path: result.data!.storagePath, url: null },
      ]);
      toast.success("File uploaded", {
        description: result.data!.fileName,
      });
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Brand kit &amp; reference files
        </p>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {readOnly
          ? "Brand guidelines, logo packs, font files, and reference materials the customer has shared."
          : "Upload brand guidelines, logo packs, font files, reference images, or any other materials that help the creative team understand your brand."}
      </p>

      {readOnly && files.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          The customer hasn&apos;t shared any files yet.
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.path}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 text-sm"
            >
              <FileText size={14} className="text-muted-foreground shrink-0" />
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {cleanFileName(f.name)}
                  <ExternalLink size={10} className="inline ml-1 -mt-0.5" />
                </a>
              ) : (
                <span className="text-foreground truncate">{cleanFileName(f.name)}</span>
              )}
              <CheckCircle2 size={12} className="text-success ml-auto shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function cleanFileName(name: string): string {
  const parts = name.split("-");
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join("-").replace(/_/g, " ");
  }
  return name.replace(/_/g, " ");
}
