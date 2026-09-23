import { redirect } from "next/navigation";
import { APP_HOME_PATH } from "@/lib/auth/paths";

/** Old Fase 1 URL; keep the bookmark working. */
export default function LegacyDashboardRedirect() {
  redirect(APP_HOME_PATH);
}
