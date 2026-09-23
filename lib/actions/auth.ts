"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { auth, signIn, signOut } from "@/auth";
import { APP_HOME_PATH } from "@/lib/auth/paths";
import { authContent } from "@/lib/content/auth";
import { consumeAuthRateLimit } from "@/lib/services/rateLimit";
import { EmailTakenError, registerUser } from "@/lib/services/authService";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import type { AuthFormState } from "@/features/auth/types";

async function clientKey(action: string, email: string): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
  return `${action}:${ip}:${email.toLowerCase()}`;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Logs in with email/password and creates a database session. */
export async function loginAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: authContent.errors.invalidInput };
  }

  if (!consumeAuthRateLimit(await clientKey("login", parsed.data.email))) {
    return { error: authContent.errors.rateLimited };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: APP_HOME_PATH,
    });
    return {};
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return { error: authContent.errors.invalidCredentials };
    }
    throw error;
  }
}

/** Registers a user then signs them in with the same credentials. */
export async function registerAction(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const name = readString(formData, "name");
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const parsed = registerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return { error: authContent.errors.invalidInput };
  }

  if (!consumeAuthRateLimit(await clientKey("register", parsed.data.email))) {
    return { error: authContent.errors.rateLimited };
  }

  try {
    await registerUser(parsed.data);
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: APP_HOME_PATH,
    });
    return {};
  } catch (error: unknown) {
    if (error instanceof EmailTakenError) {
      return { error: authContent.errors.emailTaken };
    }
    if (error instanceof AuthError) {
      return { error: authContent.errors.generic };
    }
    throw error;
  }
}

/** Starts the Google OAuth redirect. */
export async function signInWithGoogle() {
  await signIn("google", { redirectTo: APP_HOME_PATH });
}

/** Ends the Auth.js session and sends the user to login. */
export async function signOutAction() {
  const session = await auth();
  if (!session) {
    return;
  }
  await signOut({ redirectTo: "/login" });
}
