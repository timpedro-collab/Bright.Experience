/**
 * Renders a PDF into a stack of <canvas> pages using pdf.js. Unlike the
 * browser's native iframe viewer, this gives a transparent surround (no dark
 * "paper mat") and the pages scale to fit the container width.
 *
 * Ported from the TheoCloud redesign. The worker is resolved with the
 * `new URL(..., import.meta.url)` pattern (Next/Turbopack + webpack friendly)
 * instead of Vite's `?url` import.
 */
"use client";

import * as React from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { cn } from "@/lib/utils";

/**
 * pdf.js touches browser-only globals (DOMMatrix, etc.) at module eval, so it
 * must never load during SSR. We import it lazily on the client and cache the
 * module promise. The worker is served as a static asset from /public so the
 * version always matches the installed `pdfjs-dist`.
 */
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

type PdfCanvasProps = {
  url: string;
  className?: string;
  pageClassName?: string;
  pageGap?: number;
  maxDpr?: number;
};

export function PdfCanvas({
  url,
  className,
  pageClassName,
  pageGap = 12,
  maxDpr = 2,
}: PdfCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [doc, setDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let task: { promise: Promise<PDFDocumentProxy>; destroy: () => Promise<void> } | null = null;
    setError(null);
    setDoc(null);
    loadPdfjs()
      .then((pdfjsLib) => {
        if (cancelled) return;
        task = pdfjsLib.getDocument({ url });
        task.promise
          .then((pdf) => {
            if (!cancelled) setDoc(pdf);
          })
          .catch((err) => {
            if (!cancelled) setError(err?.message ?? "Failed to load PDF");
          });
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load PDF viewer");
      });
    return () => {
      cancelled = true;
      task?.destroy().catch(() => {});
    };
  }, [url]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pages = React.useMemo(() => {
    if (!doc) return [] as number[];
    return Array.from({ length: doc.numPages }, (_, i) => i + 1);
  }, [doc]);

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full flex-col items-stretch", className)}
      style={{ gap: pageGap }}
    >
      {error ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          {error}
        </div>
      ) : null}
      {doc && width > 0
        ? pages.map((pageNumber) => (
            <PdfPage
              key={pageNumber}
              doc={doc}
              pageNumber={pageNumber}
              width={width}
              maxDpr={maxDpr}
              className={pageClassName}
            />
          ))
        : null}
    </div>
  );
}

function PdfPage({
  doc,
  pageNumber,
  width,
  maxDpr,
  className,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  maxDpr: number;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [aspect, setAspect] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;
    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const cssScale = width / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const viewport = page.getViewport({ scale: cssScale * dpr });
      setAspect(base.width / base.height);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(width)}px`;
      canvas.style.height = `${Math.floor(width / (base.width / base.height))}px`;
      const task = page.render({ canvas, viewport });
      renderTask = task;
      try {
        await task.promise;
      } catch {
        // Cancelled renders throw; ignore.
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [doc, pageNumber, width, maxDpr]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block w-full rounded-md bg-white shadow-sm", className)}
      style={
        aspect ? { aspectRatio: String(aspect) } : { aspectRatio: "1 / 1.4142" }
      }
    />
  );
}
