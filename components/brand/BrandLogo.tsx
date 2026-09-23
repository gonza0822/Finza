import Image from "next/image";

interface BrandLogoProps {
  size: number;
  priority?: boolean;
  className?: string;
}

/** Renders the Finza mark. Does not animate: it is an LCP candidate on auth. */
export function BrandLogo({ size, priority = false, className }: BrandLogoProps) {
  return (
    <Image
      src="/brand/logo-finza.png"
      alt="Finza"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

interface BrandWordmarkProps {
  size?: number;
  priority?: boolean;
  tone?: "light" | "dark";
}

/** Logo plus wordmark for headers. */
export function BrandWordmark({
  size = 36,
  priority = false,
  tone = "dark",
}: BrandWordmarkProps) {
  const labelClass = tone === "light" ? "text-cream" : "text-foreground";

  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandLogo size={size} priority={priority} />
      <span className={`text-lg font-semibold tracking-tight ${labelClass}`}>Finza</span>
    </span>
  );
}
