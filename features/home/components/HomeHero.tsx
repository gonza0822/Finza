"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { authContent } from "@/lib/content/auth";
import { siteContent } from "@/lib/content/site";

/** Renders the marketing hero; heading is not animated (LCP). CTAs respect reduced motion. */
export function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <p className="text-sm font-medium tracking-wide text-warm uppercase">
        {siteContent.heroEyebrow}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {siteContent.heroTitle}
      </h1>
      <p className="text-lg leading-7 text-muted">{siteContent.heroBody}</p>
      <motion.div
        className="flex flex-col gap-3 sm:flex-row"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Link
          href="/register"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-cta px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-cta-hover focus-visible:ring-2 focus-visible:ring-teal-glow focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {authContent.homeRegister}
        </Link>
        <Link
          href="/login"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {authContent.homeLogin}
        </Link>
      </motion.div>
    </div>
  );
}
