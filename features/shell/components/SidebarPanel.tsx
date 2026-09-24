"use client";

import { X } from "lucide-react";
import { BrandWordmark } from "@/components/brand/BrandLogo";
import { AppNavLinks } from "@/features/shell/components/AppNavLinks";
import { AppDownloadButton } from "@/features/shell/components/AppDownloadButton";
import { SignOutButton } from "@/features/shell/components/SignOutButton";
import { appShellContent } from "@/lib/content/app";
import type { RefObject } from "react";

export interface AppShellUser {
  name: string | null | undefined;
  email: string | null | undefined;
}

interface SidebarPanelProps {
  user: AppShellUser;
  onNavigate?: () => void;
  closeRef?: RefObject<HTMLButtonElement | null>;
  onClose?: () => void;
}

function displayName(user: AppShellUser): string {
  const name = user.name?.trim();
  if (name) {
    return name;
  }
  return user.email?.trim() || "";
}

/** Teal brand column shared by the desktop sidebar and the mobile drawer. */
export function SidebarPanel({
  user,
  onNavigate,
  closeRef,
  onClose,
}: SidebarPanelProps) {
  const label = displayName(user);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-primary px-4 py-5 text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 size-44 rounded-full bg-teal-glow/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-3rem] bottom-8 size-40 rounded-full bg-warm/20"
      />

      <div className="relative mb-6 flex items-center justify-between gap-2 px-1">
        <BrandWordmark size={32} tone="light" />
        {onClose ? (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-cream transition-colors duration-200 hover:bg-cream/10 focus-visible:ring-2 focus-visible:ring-cream focus-visible:outline-none lg:hidden"
            aria-label={appShellContent.closeMenu}
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav className="relative flex-1" aria-label={appShellContent.mainNav}>
        <AppNavLinks tone="dark" onNavigate={onNavigate} />
      </nav>

      <div className="relative mt-4 border-t border-cream/15 pt-4">
        {label ? (
          <p className="mb-3 truncate px-1 text-sm text-cream/75">
            <span className="sr-only">{appShellContent.signedInAs} </span>
            {label}
          </p>
        ) : null}
        <AppDownloadButton />
        <SignOutButton />
      </div>
    </div>
  );
}
