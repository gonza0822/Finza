"use client";

import { motion, useReducedMotion } from "framer-motion";
import { siteContent } from "@/lib/content/site";

/** Renders the marketing hero with a transform/opacity entrance that respects reduced motion. */
export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex max-w-xl flex-col gap-6"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <p className="text-sm font-medium tracking-wide text-cta uppercase">
        {siteContent.heroEyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {siteContent.heroTitle}
      </h1>
      <p className="text-lg leading-7 text-muted">{siteContent.heroBody}</p>
      <p className="text-sm text-muted">{siteContent.heroHint}</p>
    </motion.div>
  );
}
