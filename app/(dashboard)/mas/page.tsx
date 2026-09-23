import type { Metadata } from "next";
import Link from "next/link";
import { Tags, UserRound } from "lucide-react";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { SignOutButton } from "@/features/shell/components/SignOutButton";
import { categoriesContent } from "@/lib/content/categories";
import { perfilContent } from "@/lib/content/perfil";

export const metadata: Metadata = appPageMetadata("mas");

interface MasLink {
  href: string;
  title: string;
  hint: string;
  icon: typeof UserRound;
}

const links: MasLink[] = [
  {
    href: "/mas/perfil",
    title: perfilContent.masLink,
    hint: perfilContent.masLinkHint,
    icon: UserRound,
  },
  {
    href: "/mas/categorias",
    title: categoriesContent.categoriesLink,
    hint: categoriesContent.categoriesLinkHint,
    icon: Tags,
  },
];

/** Settings hub: profile, categories, and logout. */
export default function MasPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {categoriesContent.masTitle}
        </h1>
        <p className="mt-2 text-base leading-7 text-muted">{categoriesContent.masBody}</p>
      </header>

      <nav aria-label={categoriesContent.masTitle} className="flex flex-col gap-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-primary/10 bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="flex items-center gap-3">
                <Icon className="size-5 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium text-foreground">{item.title}</span>
                  <span className="block text-sm text-muted">{item.hint}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <SignOutButton variant="onLight" />
    </div>
  );
}
