/**
 * Slides 1–4 of the confidential commercial plan: title, mission, customer
 * goals, and live activation imagery/video.
 */
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { DeckShellSlideProps } from "@/components/decks/DeckShell";
import { GLOW_FRAME } from "@/components/decks/deck-accents";
import { Button } from "@/components/ui/button";
import {
  COMMERCIAL_COVER,
  COMMERCIAL_MISSION,
  COMMERCIAL_PROOF,
  CUSTOMER_GOALS,
} from "@/lib/commercial-plan/content";
import {
  CommercialIndex,
  CommercialOverline,
  CommercialSlideFrame,
  commercialRise,
  commercialStagger,
} from "./commercial-slide-ui";

/** Slide 1: confidential internal title and planning horizon. */
export function CommercialCoverSlide({ onAdvance }: DeckShellSlideProps) {
  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/pitch/photos/pepsi-midplay-crowd.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/45" />
      </div>

      <CommercialSlideFrame className="relative">
        <motion.div
          variants={commercialStagger}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div variants={commercialRise}>
            <Image
              src="/brand/bright-blue-wordmark-light.png"
              alt="Bright.Blue"
              width={168}
              height={45}
              priority
            />
          </motion.div>
          <motion.div variants={commercialRise} className="mt-12">
            <CommercialOverline>{COMMERCIAL_COVER.overline}</CommercialOverline>
          </motion.div>
          <motion.h1
            variants={commercialRise}
            className="text-display-grotesk mt-4 max-w-3xl text-6xl leading-[0.94] sm:text-7xl"
          >
            {COMMERCIAL_COVER.title}{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              {COMMERCIAL_COVER.accent}
            </span>
          </motion.h1>
          <motion.p
            variants={commercialRise}
            className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            {COMMERCIAL_COVER.subtitle}
          </motion.p>
          <motion.div variants={commercialRise} className="mt-9">
            <Button
              type="button"
              onClick={onAdvance}
              className="rounded-full px-7"
            >
              {COMMERCIAL_COVER.cta}
            </Button>
          </motion.div>
        </motion.div>
      </CommercialSlideFrame>
    </div>
  );
}

/** Slide 2: the company mission in three operating pillars. */
export function CommercialMissionSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{COMMERCIAL_MISSION.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 max-w-5xl text-balance text-4xl leading-tight sm:text-5xl">
        {COMMERCIAL_MISSION.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-16 grid gap-10 md:grid-cols-3"
      >
        {COMMERCIAL_MISSION.pillars.map((pillar, index) => (
          <motion.div
            key={pillar.title}
            variants={commercialRise}
            className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
          >
            <CommercialIndex index={index} />
            <h3 className="mt-4 text-2xl font-semibold leading-tight">
              {pillar.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {pillar.line}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </CommercialSlideFrame>
  );
}

/** Slide 3: the four customer outcomes the offer is built to deliver. */
export function CustomerGoalsSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{CUSTOMER_GOALS.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {CUSTOMER_GOALS.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CUSTOMER_GOALS.items.map((item, index) => (
          <motion.div
            key={item.title}
            variants={commercialRise}
            className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
          >
            <div className="flex items-center justify-between">
              <CommercialIndex index={index} />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Goal
              </span>
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-[var(--color-bb-cyan)]">
              {item.metric}
            </p>
            <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.line}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </CommercialSlideFrame>
  );
}

/** Slide 4: video and photography proving the format in live environments. */
export function CommercialProofSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{COMMERCIAL_PROOF.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {COMMERCIAL_PROOF.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <motion.figure
          variants={commercialRise}
          className="col-span-2 lg:col-span-2"
        >
          <div className={`${GLOW_FRAME} relative aspect-[4/3]`}>
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={COMMERCIAL_PROOF.video.poster}
              className="h-full w-full object-cover"
            >
              <source src={COMMERCIAL_PROOF.video.src} type="video/mp4" />
            </video>
          </div>
          <figcaption className="mt-3 text-sm font-semibold">
            <CommercialIndex index={0} />{" "}
            <span className="ml-2">{COMMERCIAL_PROOF.video.label}</span>
          </figcaption>
        </motion.figure>
        {COMMERCIAL_PROOF.photos.map((photo, index) => (
          <motion.figure key={photo.src} variants={commercialRise}>
            <div className={`${GLOW_FRAME} relative aspect-[4/3] lg:aspect-[3/4]`}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 20vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm font-semibold">
              <CommercialIndex index={index + 1} />{" "}
              <span className="ml-2">{photo.label}</span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </CommercialSlideFrame>
  );
}
