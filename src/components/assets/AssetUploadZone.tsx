/**
 * AssetUploadZone — Cloud-style drag-and-drop uploader for a single asset
 * slot, ported in spirit from the TheoCloud Media Library.
 *
 * It layers a richer *experience* on top of the existing single-slot
 * backend (`uploadAsset`): drag & drop, a live thumbnail, and an inline
 * spec checklist that evaluates the chosen file against the slot's
 * requirements (accepted file types + pixel dimensions) on the client —
 * before anything is sent. Off-spec files are blocked from upload so creative
 * review never receives the wrong format or dimensions by accident.
 *
 * All server logic is unchanged: validation, review states, signed URLs,
 * notifications, and auto task-completion still run inside `uploadAsset`.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MachinePreview } from "@/components/assets/MachinePreview";
import { uploadAsset } from "@/app/actions/assets";
import { celebrateFromElement } from "@/lib/celebrate";
import { slotForAsset } from "@/lib/asset-requirements/machine-placements";
import { DEFAULT_MACHINE_SLUG, type MachineSlug } from "@/lib/asset-requirements/slot-registry";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";

type CritStatus = "pending" | "pass" | "fail";

interface Criterion {
  id: string;
  label: string;
  status: CritStatus;
  detail?: string;
}

function fileExt(name: string): string {
  return (name.toLowerCase().split(".").pop() ?? "").trim();
}

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/**
 * Some OS/browser combos hand over files with an empty `type` (drag-drop of
 * less common formats, network shares). Re-wrap those with a MIME inferred
 * from the extension so the spec checklist and the server validation don't
 * falsely reject a perfectly good file.
 */
function withInferredType(file: File): File {
  if (file.type) return file;
  const mime = EXT_TO_MIME[fileExt(file.name)];
  return mime ? new File([file], file.name, { type: mime }) : file;
}

/** "PNG, SVG" from ["image/png","image/svg+xml"]. */
function prettyType(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/webp": "WEBP",
    "image/svg+xml": "SVG",
    "image/gif": "GIF",
    "application/pdf": "PDF",
    "video/mp4": "MP4",
    "video/webm": "WEBM",
    "application/postscript": "AI/EPS",
    "application/illustrator": "AI",
  };
  return map[mime] ?? mime.split("/").pop()?.toUpperCase() ?? mime;
}

/** Parse "1920 × 1080", "428x600 px", "1080×1920px" → { w, h }. */
function parseDims(s?: string): { w: number; h: number } | null {
  if (!s) return null;
  const m = s.match(/(\d{2,5})\s*[×xX]\s*(\d{2,5})/);
  if (!m) return null;
  return { w: Number(m[1]), h: Number(m[2]) };
}

function readImageDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not read image"));
    };
    img.src = url;
  });
}

/** Measure a video's pixel size + duration for server-side spec checks. */
function readVideoMeta(
  file: File,
): Promise<{ w: number; h: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        w: video.videoWidth,
        h: video.videoHeight,
        duration: video.duration,
      });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not read video"));
    };
    video.src = url;
  });
}

/** The pending (pre-upload) checklist derived purely from the spec. */
function baseCriteria(asset: Asset): Criterion[] {
  const out: Criterion[] = [];
  const types = asset.requiredFileTypes ?? [];
  const typeLabel =
    asset.requiredFormat ??
    (types.length ? types.map(prettyType).join(", ") : null);
  if (typeLabel) out.push({ id: "type", label: typeLabel, status: "pending" });
  if (parseDims(asset.requiredDimensions)) {
    out.push({
      id: "dims",
      label: asset.requiredDimensions as string,
      status: "pending",
    });
  }
  return out;
}

async function evaluateFile(asset: Asset, file: File): Promise<Criterion[]> {
  const out: Criterion[] = [];
  const types = asset.requiredFileTypes ?? [];
  const typeLabel =
    asset.requiredFormat ??
    (types.length ? types.map(prettyType).join(", ") : null);

  if (typeLabel) {
    let status: CritStatus = "pass";
    let detail: string | undefined;
    if (types.length) {
      const ok = types.includes(file.type);
      if (!ok) {
        status = "fail";
        detail = file.type ? prettyType(file.type) : `.${fileExt(file.name)}`;
      }
    }
    out.push({ id: "type", label: typeLabel, status, detail });
  }

  const dims = parseDims(asset.requiredDimensions);
  if (dims) {
    if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      try {
        const got = await readImageDims(file);
        const ok = got.w === dims.w && got.h === dims.h;
        out.push({
          id: "dims",
          label: asset.requiredDimensions as string,
          status: ok ? "pass" : "fail",
          detail: ok ? undefined : `${got.w} × ${got.h}`,
        });
      } catch {
        out.push({
          id: "dims",
          label: asset.requiredDimensions as string,
          status: "pending",
        });
      }
    } else {
      // Vector / PDF / video — can't measure pixel dims in the browser.
      out.push({
        id: "dims",
        label: asset.requiredDimensions as string,
        status: "pending",
      });
    }
  }
  return out;
}

function CriteriaList({ criteria }: { criteria: Criterion[] }) {
  if (criteria.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {criteria.map((c) => (
        <li key={c.id} className="flex items-center gap-2 text-xs">
          {c.status === "pass" ? (
            <CheckCircle2 className="size-3.5 shrink-0 text-success" />
          ) : c.status === "fail" ? (
            <XCircle className="size-3.5 shrink-0 text-destructive" />
          ) : (
            <Circle className="size-3.5 shrink-0 text-muted-foreground/50" />
          )}
          <span
            className={cn(
              c.status === "fail" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {c.label}
          </span>
          {c.detail && (
            <span className="text-destructive/90 tabular-nums">
              · got {c.detail}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AssetUploadZone({
  asset,
  machineSlug = DEFAULT_MACHINE_SLUG,
  asCreative = false,
}: {
  asset: Asset;
  machineSlug?: MachineSlug;
  /** Creative team uploading on the customer's behalf — tweaks the copy. */
  asCreative?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [staged, setStaged] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "video">("image");
  const [criteria, setCriteria] = useState<Criterion[]>(() =>
    baseCriteria(asset),
  );
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const stageFile = useCallback(
    async (rawFile: File) => {
      const file = withInferredType(rawFile);
      if (preview) URL.revokeObjectURL(preview);
      setStaged(file);
      const isPreviewableImage =
        file.type.startsWith("image/") && file.type !== "image/svg+xml";
      const isPreviewableVideo = file.type.startsWith("video/");
      setPreviewKind(isPreviewableVideo ? "video" : "image");
      setPreview(
        isPreviewableImage || isPreviewableVideo
          ? URL.createObjectURL(file)
          : null,
      );
      setCriteria(await evaluateFile(asset, file));
    },
    [asset, preview],
  );

  const clearStaged = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setStaged(null);
    setPreview(null);
    setCriteria(baseCriteria(asset));
    if (inputRef.current) inputRef.current.value = "";
  }, [asset, preview]);

  const hasFailures = criteria.some((c) => c.status === "fail");
  const slot = slotForAsset(asset.name, machineSlug);
  const machine = slot?.preview ?? null;

  async function doUpload() {
    if (!staged) return;
    // Spec-aware gate: never send a file that already failed type/dimension checks.
    if (hasFailures) {
      toast.error("File doesn't match the spec", {
        description:
          "Fix the failed checklist items (format or dimensions) before uploading — this keeps creative review unblocked.",
      });
      return;
    }
    setUploading(true);
    const toastId = toast.loading(`Uploading ${staged.name}…`);
    const fd = new FormData();
    fd.set("assetId", asset.id);
    fd.set("eventId", asset.eventId);
    fd.set("file", staged);

    // Forward client-measured media metadata so the server can validate
    // against the spec (resolution minimum, video duration range).
    try {
      if (
        staged.type.startsWith("image/") &&
        staged.type !== "image/svg+xml"
      ) {
        const { w, h } = await readImageDims(staged);
        fd.set("width", String(w));
        fd.set("height", String(h));
      } else if (staged.type.startsWith("video/")) {
        const { w, h, duration } = await readVideoMeta(staged);
        fd.set("width", String(w));
        fd.set("height", String(h));
        fd.set("durationSeconds", String(duration));
      }
    } catch {
      // measurement is best-effort; server falls back to header parsing
    }

    const result = await uploadAsset(fd);
    setUploading(false);
    if (!result.success) {
      toast.error("Upload failed", { id: toastId, description: result.error });
      return;
    }
    toast.success("Asset uploaded", {
      id: toastId,
      description: asCreative
        ? "Uploaded on the customer's behalf. Review and approve it in the queue when ready."
        : "Bright.Blue creative will review and get back to you.",
    });
    celebrateFromElement(zoneRef.current);
    clearStaged();
    router.refresh();
  }

  // ── Empty drop zone (no file staged) ─────────────────────────────
  if (!staged) {
    const browse = () => inputRef.current?.click();
    return (
      <div className="mt-3">
        <div
          ref={zoneRef}
          role="button"
          tabIndex={0}
          onClick={browse}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              browse();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOver) setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void stageFile(file);
          }}
          className={cn(
            "flex flex-col gap-3 rounded-2xl border border-dashed px-4 py-4 transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30 hover:border-primary/50",
          )}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
              <Upload className="size-4" />
            </span>
            <span className="text-foreground">
              <span className="font-medium">Drag &amp; drop</span>
              <span className="text-muted-foreground"> or </span>
              <span className="font-semibold text-primary underline-offset-2 hover:underline">
                browse
              </span>
            </span>
          </div>
          {criteria.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="text-overline text-muted-foreground mb-2">
                Spec checklist
              </p>
              <CriteriaList criteria={criteria} />
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void stageFile(file);
          }}
        />
      </div>
    );
  }

  // ── Staged file (preview + checklist + confirm / warning) ────────
  return (
    <div ref={zoneRef} className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        {preview && previewKind === "video" ? (
          <video
            src={preview}
            className="size-14 shrink-0 rounded-lg border border-border object-cover bg-card"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="size-14 shrink-0 rounded-lg border border-border object-cover bg-card"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground text-overline">
            {fileExt(staged.name).toUpperCase() || "FILE"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {staged.name}
            </p>
            <button
              type="button"
              onClick={clearStaged}
              disabled={uploading}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {(staged.size / 1024).toFixed(0)} KB
          </p>
          {criteria.length > 0 && (
            <div className="mt-3">
              <CriteriaList criteria={criteria} />
            </div>
          )}
        </div>
      </div>

      {machine && preview && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-overline text-muted-foreground mb-2">
            Live preview — on the machine
          </p>
          <MachinePreview
            preview={machine}
            overlaySrc={preview}
            overlayKind={previewKind}
            className="mx-auto max-w-[280px]"
          />
        </div>
      )}

      {hasFailures && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
          <TriangleAlert className="size-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-xs text-foreground/90 leading-snug">
            This file is <span className="font-semibold">off-spec</span>. Swap it
            for a file that matches the checklist — we block upload so creative
            review stays unblocked.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={doUpload}
          disabled={uploading || hasFailures}
          size="sm"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <Button
          onClick={clearStaged}
          disabled={uploading}
          size="sm"
          variant="ghost"
        >
          Choose a different file
        </Button>
      </div>
    </div>
  );
}
