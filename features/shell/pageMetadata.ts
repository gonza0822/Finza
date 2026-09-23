import type { Metadata } from "next";
import { appPages } from "@/lib/content/app";

/** Unique title and description per app section; robots come from the dashboard layout. */
export function appPageMetadata(key: keyof typeof appPages): Metadata {
  const page = appPages[key];
  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}
