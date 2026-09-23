import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { APP_HOME_PATH } from "@/lib/auth/paths";
import { authContent } from "@/lib/content/auth";

export const metadata: Metadata = {
  title: authContent.loginTitle,
  description: authContent.loginDescription,
  robots: { index: false, follow: false },
};

function oauthBanner(error: string | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  if (error === "password_account") {
    return authContent.errors.passwordAccount;
  }
  if (error === "OAuthAccountNotLinked" || error === "AccessDenied") {
    return authContent.errors.passwordAccount;
  }
  if (error === "OAuthCallbackError" || error === "Configuration") {
    return authContent.errors.oauth;
  }
  return undefined;
}

/** Login: credentials + Google. Redirects if already signed in. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session) {
    redirect(APP_HOME_PATH);
  }

  const params = await searchParams;
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <AuthCard
      screen="login"
      googleEnabled={googleEnabled}
      bannerError={oauthBanner(params.error)}
    />
  );
}
