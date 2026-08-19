/**
 * The sample proof-of-performance report — the "analytics they get as
 * output" leg of the Informa pitch. Public but unlisted (noindex), like
 * the rest of /pitch. Data and layout are in SampleReportView; this page
 * only composes the shell.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SampleReportView } from "@/components/informa/SampleReportView";

export const metadata: Metadata = {
  title: "Sample proof-of-performance report · Bright.Blue",
  robots: { index: false, follow: false },
};

export default function InformaSampleReportPage() {
  return (
    <div className="theme-dark min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Image
            src="/brand/bright-blue-wordmark-light.png"
            alt="Bright.Blue"
            width={140}
            height={37}
            priority
          />
          <Link
            href="/pitch/informa"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to the pitch
          </Link>
        </header>

        <div className="mt-14 max-w-3xl">
          <p className="text-overline text-[var(--color-bb-cyan)]">
            The report every sponsor receives
          </p>
          <h1 className="text-display-grotesk mt-3 text-4xl leading-tight sm:text-5xl">
            Proof of performance, within 24 hours of close
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            This is the artefact that wins the renewal conversation: what the
            placement did, hour by hour, with every lead opted in and every
            number measured on the machine. The data below is an illustrative
            sample so you can see the output before anything ships.
          </p>
        </div>

        <div className="mt-12">
          <SampleReportView />
        </div>

        <footer className="mt-16 border-t border-border/60 py-10 text-sm text-muted-foreground">
          <p>
            Live reports are generated per sponsor, per placement, and
            delivered within 24 hours of show close.
          </p>
        </footer>
      </div>
    </div>
  );
}
