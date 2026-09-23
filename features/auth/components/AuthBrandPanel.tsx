import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthBrandCards } from "@/features/auth/components/AuthBrandCards";
import { authContent } from "@/lib/content/auth";

/** Dark teal brand column for large screens; echoes the mark’s curves. */
export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:px-12 lg:py-12 xl:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 size-80 rounded-full bg-teal-glow/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-4rem] bottom-[-3rem] size-96 rounded-full bg-warm/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-12 size-40 rounded-[40%_60%_70%_30%] bg-cream/10"
      />

      <BrandLogo size={88} priority className="relative size-[88px] shrink-0" />

      <AuthBrandCards />

      <div className="relative max-w-md shrink-0">
        <p className="text-sm font-medium tracking-wide text-warm uppercase">
          {authContent.brandEyebrow}
        </p>
        <p className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-cream xl:text-5xl">
          {authContent.brandPanelTitle}
        </p>
        <p className="mt-4 text-base leading-7 text-cream/80">
          {authContent.brandPanelBody}
        </p>
      </div>
    </aside>
  );
}
