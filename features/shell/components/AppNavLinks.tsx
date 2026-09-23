"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "@/lib/content/app";
import { appNavIcons } from "@/features/shell/navIcons";

interface AppNavLinksProps {
  onNavigate?: () => void;
  tone: "dark" | "light";
}

/** Spec §16 destinations; active item uses aria-current, not a layout-shifting hover. */
export function AppNavLinks({ onNavigate, tone }: AppNavLinksProps) {
  const pathname = usePathname();
  const isDark = tone === "dark";

  return (
    <ul className="flex flex-col gap-1">
      {appNavItems.map((item) => {
        const Icon = appNavIcons[item.href];
        const isActive = pathname === item.href;
        const activeClass = isDark
          ? "bg-cream/15 text-cream"
          : "bg-primary/10 text-primary";
        const idleClass = isDark
          ? "text-cream/80 hover:bg-cream/10 hover:text-cream"
          : "text-foreground hover:bg-primary/5";

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none ${
                isDark ? "focus-visible:ring-cream" : "focus-visible:ring-primary"
              } ${isActive ? activeClass : idleClass}`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
