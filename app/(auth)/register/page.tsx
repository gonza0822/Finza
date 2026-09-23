import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { APP_HOME_PATH } from "@/lib/auth/paths";
import { authContent } from "@/lib/content/auth";

export const metadata: Metadata = {
  title: authContent.registerTitle,
  description: authContent.registerDescription,
  robots: { index: false, follow: false },
};

/** Register with email/password. Redirects if already signed in. */
export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    redirect(APP_HOME_PATH);
  }

  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return <AuthCard screen="register" googleEnabled={googleEnabled} />;
}
