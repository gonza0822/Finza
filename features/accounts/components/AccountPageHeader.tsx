import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AccountPageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

/** Section heading plus optional back link. One h1 per page. */
export function AccountPageHeader({ title, backHref, backLabel }: AccountPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
    </header>
  );
}
