import { HomeHero } from "@/features/home/components/HomeHero";
import { siteContent } from "@/lib/content/site";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 sm:px-10">
        <p className="text-base font-semibold tracking-tight">{siteContent.name}</p>
      </header>
      <main className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <HomeHero />
      </main>
    </div>
  );
}
