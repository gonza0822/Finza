"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { BrandWordmark } from "@/components/brand/BrandLogo";
import { SidebarPanel, type AppShellUser } from "@/features/shell/components/SidebarPanel";
import { SignOutButton } from "@/features/shell/components/SignOutButton";
import { appShellContent } from "@/lib/content/app";
import { setSidebarOpen } from "@/store/slices/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface AppShellProps {
  user: AppShellUser;
  children: ReactNode;
}

/** Signed-in chrome: teal sidebar on desktop, drawer on smaller screens. */
export function AppShell({ user, children }: AppShellProps) {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => state.ui.isSidebarOpen);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [pathname, dispatch]);

  useEffect(() => {
    if (isSidebarOpen) {
      wasOpen.current = true;
      closeBtnRef.current?.focus();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    if (wasOpen.current) {
      menuBtnRef.current?.focus();
      wasOpen.current = false;
    }
    return undefined;
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch(setSidebarOpen(false));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSidebarOpen, dispatch]);

  function closeMenu() {
    dispatch(setSidebarOpen(false));
  }

  const isSetup = pathname.startsWith("/onboarding");

  const slideTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: "easeOut" as const };

  if (isSetup) {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-clip">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-xl focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:ring-2 focus:ring-primary"
        >
          {appShellContent.skipToContent}
        </a>
        <header className="flex h-14 items-center justify-between gap-3 border-b border-primary/10 bg-surface/80 px-4 backdrop-blur-md sm:px-8">
          <BrandWordmark size={28} />
          <SignOutButton variant="onLight" />
        </header>
        <main
          id="contenido"
          className="flex min-w-0 flex-1 flex-col overflow-x-clip px-4 py-8 sm:px-8 sm:py-10"
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full min-w-0 flex-1 overflow-x-clip">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-xl focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:ring-2 focus:ring-primary"
      >
        {appShellContent.skipToContent}
      </a>

      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
        <SidebarPanel user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-primary/10 bg-surface/80 px-4 backdrop-blur-md lg:hidden">
          <button
            ref={menuBtnRef}
            type="button"
            aria-expanded={isSidebarOpen}
            aria-controls="app-menu"
            className="cursor-pointer rounded-xl p-2 text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label={appShellContent.openMenu}
            onClick={() => dispatch(setSidebarOpen(true))}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <BrandWordmark size={28} />
        </header>

        <AnimatePresence>
          {isSidebarOpen ? (
            <motion.button
              key="menu-overlay"
              type="button"
              aria-label={appShellContent.closeMenu}
              className="fixed inset-0 z-40 cursor-pointer bg-primary/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
              onClick={closeMenu}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {isSidebarOpen ? (
            <motion.aside
              key="menu-drawer"
              id="app-menu"
              role="dialog"
              aria-modal="true"
              aria-label={appShellContent.menuDialog}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-lg lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={slideTransition}
            >
              <SidebarPanel
                user={user}
                onNavigate={closeMenu}
                closeRef={closeBtnRef}
                onClose={closeMenu}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <main
          id="contenido"
          className="flex min-w-0 flex-1 flex-col overflow-x-clip px-4 py-8 sm:px-8 sm:py-10 lg:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
