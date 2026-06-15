/**
 * Asset preview dialog — renders a fitted preview of an uploaded asset
 * without leaving the page. PDFs render via the Cloud PdfCanvas (transparent
 * surround, no browser "paper mat"); images render fitted on a soft checker
 * surround. Anything else falls back to an "open in new tab" link.
 *
 * This is purely presentational — it consumes the already-resolved viewable
 * `url` (public path or signed URL) that the server provides. No upload,
 * validation, or review logic lives here.
 */
"use client";

import * as React from "react";
import { Eye, ExternalLink } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PdfCanvas } from "@/components/cloud/PdfCanvas";

function kindFromName(name?: string, url?: string): "pdf" | "image" | "other" {
  const target = (name ?? url ?? "").toLowerCase().split("?")[0];
  if (target.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/.test(target)) return "image";
  return "other";
}

export function AssetPreviewDialog({
  url,
  fileName,
  triggerClassName,
}: {
  url: string;
  fileName?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const kind = kindFromName(fileName, url);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <Eye size={14} />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName ?? "Preview"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-2xl bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-3">
          {kind === "pdf" ? (
            <PdfCanvas url={url} />
          ) : kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={fileName ?? "Asset preview"}
              className="mx-auto block max-h-[64vh] w-auto max-w-full rounded-md object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                This file type can&apos;t be previewed inline.
              </p>
              <Button asChild variant="outline" size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Open file <ExternalLink size={14} />
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
