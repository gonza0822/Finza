import { authContent } from "@/lib/content/auth";
import type { AuthScreen } from "@/features/auth/types";

export interface AuthFieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Client-side field checks with user-facing copy (native HTML validation is off). */
export function validateAuthFields(
  screen: AuthScreen,
  formData: FormData,
): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (screen === "register") {
    if (!name) {
      errors.name = authContent.errors.emptyName;
    } else if (name.length > 120) {
      errors.name = authContent.errors.nameTooLong;
    }
  }

  if (!email) {
    errors.email = authContent.errors.emptyEmail;
  } else if (email.length > 254 || !isLikelyEmail(email)) {
    errors.email = authContent.errors.invalidEmail;
  }

  if (!password) {
    errors.password = authContent.errors.emptyPassword;
  } else if (password.length < 8) {
    errors.password = authContent.errors.passwordTooShort;
  } else if (password.length > 128) {
    errors.password = authContent.errors.passwordTooLong;
  }

  return errors;
}

export function hasAuthFieldErrors(errors: AuthFieldErrors): boolean {
  return Boolean(errors.name || errors.email || errors.password);
}
