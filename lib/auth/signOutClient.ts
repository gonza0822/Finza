"use client";

import { Capacitor, CapacitorCookies } from "@capacitor/core";
import { signOutAction } from "@/lib/actions/auth";

/** Signs out in Auth.js and clears only this origin's cookies on native Android. */
export async function signOutClient(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await CapacitorCookies.clearCookies({ url: window.location.origin });
  }
  await signOutAction();
}
