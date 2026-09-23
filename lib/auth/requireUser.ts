import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Signed-in user id or redirect. Fail closed on every mutation and list. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}
