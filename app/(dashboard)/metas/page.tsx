import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { appPages } from "@/lib/content/app";
import { metasContent } from "@/lib/content/metas";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { GoalList } from "@/features/metas/components/GoalList";
import { listSavingsGoals } from "@/lib/services/savingsGoalService";

export const metadata: Metadata = appPageMetadata("metas");

const ctaClass =
  "inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none";

/** Lists savings overlays with progress; assigning does not move accounts. */
export default async function MetasPage() {
  const userId = await requireUserId();
  const goals = await listSavingsGoals(userId);

  if (goals.length === 0) {
    return (
      <EmptySection title={metasContent.emptyTitle} body={metasContent.emptyBody} icon={Target}>
        <div className="mt-6">
          <Link href="/metas/nueva" className={ctaClass}>
            {metasContent.addGoal}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {appPages.metas.title}
        </h1>
        <Link href="/metas/nueva" className={ctaClass}>
          {metasContent.addGoal}
        </Link>
      </div>
      <GoalList goals={goals} />
    </div>
  );
}
