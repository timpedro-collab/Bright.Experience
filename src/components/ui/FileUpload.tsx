/** Drag-and-drop file upload component with progress states */
"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept,
  maxSizeMB = 50,
  label = "Upload file",
  hint,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(false);

      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds ${maxSizeMB}MB limit`);
        return;
      }

      setUploading(true);
      try {
        await onUpload(file);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFile]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed p-8 transition-all cursor-pointer",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30 hover:bg-muted/20",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <Loader2 size={28} className="text-primary animate-spin" />
        ) : success ? (
          <CheckCircle2 size={28} className="text-success" />
        ) : (
          <Upload size={28} className="text-muted-foreground" />
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading..." : success ? "Upload complete" : label}
          </p>
          {hint && !uploading && !success && (
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          )}
          {!uploading && !success && (
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop or click to browse (max {maxSizeMB}MB)
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <X size={14} className="text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
