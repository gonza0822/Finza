"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { authContent } from "@/lib/content/auth";
import {
  hasAuthFieldErrors,
  validateAuthFields,
  type AuthFieldErrors,
} from "@/features/auth/validateForm";
import type { AuthFormState, AuthScreen } from "@/features/auth/types";

interface AuthFormProps {
  screen: AuthScreen;
  action: (
    prev: AuthFormState | undefined,
    formData: FormData,
  ) => Promise<AuthFormState>;
}

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

/** Shows a field error with icon and text (not color alone). */
function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-start gap-1.5 text-sm text-red-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

/** Email/password form with custom field errors; native HTML tooltips are disabled. */
export function AuthForm({ screen, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const isLogin = screen === "login";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateAuthFields(screen, new FormData(event.currentTarget));
    setFieldErrors(next);
    if (hasAuthFieldErrors(next)) {
      event.preventDefault();
      const first = next.name ? "name" : next.email ? "email" : "password";
      document.getElementById(first)?.focus();
    }
  }

  function clearField(field: keyof AuthFieldErrors) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
    >
      {state?.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}

      {!isLogin ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            {authContent.nameLabel}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            onChange={() => clearField("name")}
            className={`${fieldClass} ${fieldBorder(Boolean(fieldErrors.name))}`}
          />
          {fieldErrors.name ? (
            <FieldError id="name-error" message={fieldErrors.name} />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          {authContent.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          onChange={() => clearField("email")}
          className={`${fieldClass} ${fieldBorder(Boolean(fieldErrors.email))}`}
        />
        {fieldErrors.email ? (
          <FieldError id="email-error" message={fieldErrors.email} />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          {authContent.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            maxLength={128}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : "password-hint"
            }
            onChange={() => clearField("password")}
            className={`${fieldClass} pr-12 ${fieldBorder(Boolean(fieldErrors.password))}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? authContent.hidePassword : authContent.showPassword}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {showPassword ? (
              <Eye className="size-5" aria-hidden />
            ) : (
              <EyeOff className="size-5" aria-hidden />
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <FieldError id="password-error" message={fieldErrors.password} />
        ) : (
          <p id="password-hint" className="text-xs text-muted">
            {authContent.passwordHint}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 cursor-pointer rounded-2xl bg-cta px-6 py-3.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-cta-hover focus-visible:ring-2 focus-visible:ring-teal-glow focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? isLogin
            ? authContent.pendingLogin
            : authContent.pendingRegister
          : isLogin
            ? authContent.submitLogin
            : authContent.submitRegister}
      </button>
    </form>
  );
}
