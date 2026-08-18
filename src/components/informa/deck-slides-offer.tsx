/**
 * Slides 5 to 8 of the Informa pitch: the Activation SKU offer, renewal
 * protection, the seller's kit preview, and the ask. Copy lives in
 * `@/lib/informa/content`.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock3 } from "lucide-react";

import {
  ACTIVATION_SKU,
  RENEWAL_PITCH,
  THE_ASK,
} from "@/lib/informa/content";
import type { SlideProps } from "./deck-slides-story";
import { cn } from "@/lib/utils";

function SlideFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 pt-12 sm:px-10",
        className
      )}
    >
      {children}
    </section>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function SkuSlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">The offer</p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {ACTIVATION_SKU.name}
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {ACTIVATION_SKU.tagline}
      </p>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-4 sm:grid-cols-2"
      >
        {ACTIVATION_SKU.parts.map((part) => (
          <motion.div
            key={part.label}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-6"
          >
            <h3 className="font-semibold text-[var(--color-bb-cyan)]">{part.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{part.detail}</p>
          </motion.div>
        ))}
      </motion.div>
    </SlideFrame>
  );
}

export function RenewalSlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Why organizers care</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {RENEWAL_PITCH.headline}
      </h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-10 space-y-5">
        {RENEWAL_PITCH.lines.map((line) => (
          <motion.p
            key={line}
            variants={rise}
            className="max-w-3xl text-lg leading-relaxed text-muted-foreground"
          >
            {line}
          </motion.p>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-10 inline-flex items-center gap-3 self-start rounded-full border border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/10 px-6 py-3"
      >
        <Clock3 className="size-5 text-[var(--color-bb-cyan)]" aria-hidden />
        <span className="text-sm font-semibold">
          Report within 24 hours of close. The industry norm is 48 to 72, when it exists at all.
        </span>
      </motion.div>
    </SlideFrame>
  );
}

export function KitPreviewSlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Sales enablement</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        Your reps can sell this tomorrow
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        A seller&apos;s kit built for a sponsorship rep with no Bright.Blue
        context: a 60 second script, three qualifying questions, an interactive
        placement calculator they can screen-share in the meeting, and the
        answers to every objection they will hear.
      </p>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          "Price a placement live, in the sponsor meeting",
          "Register the deal, get an answer in 24 hours, keep 14 days of exclusivity",
          "Co-branded one-pagers and prospectus blocks, generated in clicks",
        ].map((line) => (
          <motion.div
            key={line}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-5 text-sm leading-relaxed text-muted-foreground"
          >
            {line}
          </motion.div>
        ))}
      </motion.div>

      <Link
        href="/pitch/informa/kit"
        className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-[var(--color-bb-cobalt)] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Open the seller&apos;s kit
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </SlideFrame>
  );
}

export function AskSlide({}: SlideProps) {
  return (
    <div className="relative flex flex-1">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/partners/nrs/gallery/01-hero-pelion.jpg"
          alt=""
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      <SlideFrame className="relative items-center text-center">
        <p className="text-overline text-[var(--color-bb-cyan)]">{THE_ASK.headline}</p>
        <h2 className="text-display-grotesk mt-4 max-w-3xl text-balance text-4xl leading-tight sm:text-5xl">
          {THE_ASK.line}
        </h2>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/pitch/informa/kit"
            className="rounded-full bg-[var(--color-bb-cobalt)] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            See what your reps get
          </Link>
          <Image
            src="/brand/bright-blue-wordmark-light.png"
            alt="Bright.Blue"
            width={120}
            height={32}
          />
        </div>
      </SlideFrame>
    </div>
  );
}
