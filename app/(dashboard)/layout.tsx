import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell } from "@/features/shell/components/AppShell";
import { SETUP_COOKIE } from "@/lib/onboarding/setupCookie";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Fail-closed: signed-in routes require a valid database session. */
export default async function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const path = (await headers()).get("x-finza-path") ?? "";
  const setup = (await cookies()).get(SETUP_COOKIE)?.value === "1";
  const accounts = await listActiveMoneyAccounts(session.user.id);
  const onSetup = path.startsWith("/onboarding");

  if (accounts.length === 0 && !onSetup) {
    redirect("/onboarding");
  }
  if (onSetup && accounts.length === 0 && path !== "/onboarding") {
    redirect("/onboarding");
  }
  if (onSetup && accounts.length > 0 && !setup) {
    redirect("/inicio");
  }

  return (
    <AppShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AppShell>
  );
}
