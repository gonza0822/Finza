import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Split auth shell: brand panel on large screens, form on the right. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-2">
      <AuthBrandPanel />
      <div className="relative flex flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-4rem] size-72 rounded-full bg-teal-glow/30 lg:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 left-[-3rem] size-56 rounded-full bg-warm/25"
        />
        <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
