"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download } from "lucide-react";
import { appShellContent } from "@/lib/content/app";

const desktopUrl = process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ?? "";
const androidUrl = process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ?? "";
const iosUrl = process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL ?? "";

/** Picks the installer for this device; hidden inside Electron or Capacitor. */
function resolveDownloadUrl(): string {
  if (typeof navigator === "undefined") {
    return desktopUrl;
  }
  const ua = navigator.userAgent;
  if (/Android/i.test(ua) && androidUrl) {
    return androidUrl;
  }
  if (/iPhone|iPad|iPod/i.test(ua) && iosUrl) {
    return iosUrl;
  }
  return desktopUrl;
}

/** Sidebar CTA to install Finza. Hidden when the user is already in the desktop app. */
export function AppDownloadButton() {
  const [href, setHref] = useState("");

  useEffect(() => {
    if (window.caminoDesktop?.isDesktop || Capacitor.isNativePlatform()) {
      return;
    }
    setHref(resolveDownloadUrl());
  }, []);

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      className="mb-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-cream/40 px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-cream/10 focus-visible:ring-2 focus-visible:ring-cream focus-visible:outline-none"
    >
      <Download className="size-4" aria-hidden />
      {appShellContent.downloadApp}
    </a>
  );
}
