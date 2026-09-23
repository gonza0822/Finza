import { BrandWordmark } from "@/components/brand/BrandLogo";
import { HomeHero } from "@/features/home/components/HomeHero";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { APP_HOME_PATH } from "@/lib/auth/paths";

export default async function HomePage() {
  const session = await auth();
  if (session) {
    redirect(APP_HOME_PATH);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 py-4 sm:px-10">
        <BrandWordmark size={40} priority />
      </header>
      <main className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <HomeHero />
      </main>
    </div>
  );
}
