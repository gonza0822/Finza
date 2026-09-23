import { IBM_Plex_Sans } from "next/font/google";
import type { Metadata } from "next";
import { StoreProvider } from "@/store/StoreProvider";
import { siteContent } from "@/lib/content/site";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: siteContent.title,
  description: siteContent.description,
  openGraph: {
    title: siteContent.title,
    description: siteContent.description,
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${ibmPlexSans.variable} h-full overflow-x-clip antialiased`}>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip bg-background font-sans text-foreground">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
