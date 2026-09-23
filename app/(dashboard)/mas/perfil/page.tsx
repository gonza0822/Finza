import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { perfilContent } from "@/lib/content/perfil";
import { getUserSettings } from "@/lib/services/userSettingsService";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { ProfileForm } from "@/features/perfil/components/ProfileForm";

export const metadata: Metadata = {
  title: perfilContent.metaTitle,
  description: perfilContent.metaDescription,
};

/** Signed-in profile: name, default currency, and Libre toggle. */
export default async function PerfilPage() {
  const userId = await requireUserId();
  const settings = await getUserSettings(userId);
  if (!settings) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={perfilContent.title}
        backHref="/mas"
        backLabel={perfilContent.backToMas}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <ProfileForm
          defaults={{
            name: settings.name,
            email: settings.email,
            defaultCurrency: settings.defaultCurrency,
            goalsCountAsCommitted: settings.goalsCountAsCommitted,
          }}
        />
      </div>
    </div>
  );
}
