/** Asset upload button — server action wrapper with toasts and confetti on success */
"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { uploadAsset } from "@/app/actions/assets";
import { celebrateFromElement } from "@/lib/celebrate";

export function AssetUploadButton({
  assetId,
  eventId,
}: {
  assetId: string;
  eventId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.set("assetId", assetId);
      fd.set("eventId", eventId);
      fd.set("file", file);
      await uploadAsset(fd);
      setDone(true);
      toast.success("Asset uploaded", {
        id: toastId,
        description: "Bright.Blue creative will review and get back to you.",
      });
      celebrateFromElement(buttonRef.current);
    } catch (e) {
      toast.error("Upload failed", {
        id: toastId,
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
        <CheckCircle2 size={12} />
        Uploaded — pending Bright.Blue review
      </span>
    );
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        ref={buttonRef}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        size="sm"
      >
        {uploading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        {uploading ? "Uploading…" : "Upload file"}
      </Button>
    </div>
  );
}
