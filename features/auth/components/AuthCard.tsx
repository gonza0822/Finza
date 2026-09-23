"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { loginAction, registerAction, signInWithGoogle } from "@/lib/actions/auth";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { authContent } from "@/lib/content/auth";

interface AuthCardProps {
  screen: "login" | "register";
  googleEnabled: boolean;
  bannerError?: string;
}

/** Auth card with brand mark; card fades in, heading and logo stay still (LCP). */
export function AuthCard({ screen, googleEnabled, bannerError }: AuthCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const heading =
    screen === "login" ? authContent.loginHeading : authContent.registerHeading;
  const lead = screen === "login" ? authContent.loginLead : authContent.registerLead;

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <BrandLogo size={48} priority className="size-12" />
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {authContent.brand}
        </span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{heading}</h1>
      {lead ? <p className="mt-2 text-base leading-7 text-muted">{lead}</p> : null}

      <motion.div
        className="mt-8 rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-lg backdrop-blur-md sm:p-8"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {bannerError ? (
          <p
            role="alert"
            className="mb-5 flex rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {bannerError}
          </p>
        ) : null}

        <AuthForm
          screen={screen}
          action={screen === "login" ? loginAction : registerAction}
        />

        {googleEnabled ? (
          <div className="mt-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-primary/15" />
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                {authContent.orGoogle}
              </span>
              <span className="h-px flex-1 bg-primary/15" />
            </div>
            <GoogleSignInButton action={signInWithGoogle} />
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-muted">
          {screen === "login" ? authContent.noAccount : authContent.hasAccount}{" "}
          <Link
            href={screen === "login" ? "/register" : "/login"}
            className="cursor-pointer font-medium text-primary transition-colors duration-200 hover:text-teal-glow focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {screen === "login" ? authContent.goRegister : authContent.goLogin}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
