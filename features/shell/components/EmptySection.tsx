import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptySectionProps {
  title: string;
  body: string;
  icon: LucideIcon;
  children?: ReactNode;
}

/** Placeholder for a signed-in section that has no data yet. */
export function EmptySection({
  title,
  body,
  icon: Icon,
  children,
}: EmptySectionProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <div className="mt-6 rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <Icon className="size-8 text-primary" aria-hidden />
        <p className="mt-4 text-base leading-7 text-muted">{body}</p>
        {children}
      </div>
    </div>
  );
}
