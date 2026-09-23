"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle, Check } from "lucide-react";
import { CURRENCIES } from "@/lib/db/enums";
import { perfilContent } from "@/lib/content/perfil";
import { FieldError } from "@/features/accounts/components/FieldError";
import { updateProfileAction } from "@/lib/actions/profile";
import type { ProfileFormState, ProfileFormValues } from "@/features/perfil/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface ProfileFormProps {
  defaults: ProfileFormValues;
}

/** Updates name, default currency, and the Libre toggle with field errors. */
export function ProfileForm({ defaults }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<ProfileFormState["fieldErrors"]>
  >({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const next: NonNullable<ProfileFormState["fieldErrors"]> = {};
    if (!name) {
      next.name = perfilContent.errors.emptyName;
    }
    setFieldErrors(next);
    if (next.name) {
      event.preventDefault();
    }
  }

  function clearField(field: keyof NonNullable<ProfileFormState["fieldErrors"]>) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const errors = { ...state?.fieldErrors, ...fieldErrors };

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
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

      {state?.success ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{state.success}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {perfilContent.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={120}
          defaultValue={defaults.name}
          disabled={pending}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          onChange={() => clearField("name")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.name))}`}
        />
        {errors.name ? <FieldError id="name-error" message={errors.name} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">{perfilContent.emailLabel}</p>
        <p className="rounded-2xl border border-primary/10 bg-cream/70 px-4 py-3 text-base text-foreground">
          {defaults.email}
        </p>
        <p className="text-sm text-muted">{perfilContent.emailHint}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">{perfilContent.currencyLabel}</p>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label={perfilContent.currencyLabel}
        >
          {CURRENCIES.map((option) => (
            <label
              key={option}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="defaultCurrency"
                value={option}
                defaultChecked={defaults.defaultCurrency === option}
                disabled={pending}
                onChange={() => clearField("defaultCurrency")}
                className="accent-primary"
              />
              {perfilContent.currencies[option]}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted">{perfilContent.currencyHint}</p>
        {errors.defaultCurrency ? (
          <FieldError id="currency-error" message={errors.defaultCurrency} />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">{perfilContent.goalsLabel}</p>
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          role="radiogroup"
          aria-label={perfilContent.goalsLabel}
        >
          <label
            className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
          >
            <input
              type="radio"
              name="goalsCountAsCommitted"
              value="true"
              defaultChecked={defaults.goalsCountAsCommitted}
              disabled={pending}
              onChange={() => clearField("goalsCountAsCommitted")}
              className="accent-primary"
            />
            {perfilContent.goalsOn}
          </label>
          <label
            className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
          >
            <input
              type="radio"
              name="goalsCountAsCommitted"
              value="false"
              defaultChecked={!defaults.goalsCountAsCommitted}
              disabled={pending}
              onChange={() => clearField("goalsCountAsCommitted")}
              className="accent-primary"
            />
            {perfilContent.goalsOff}
          </label>
        </div>
        <p className="text-sm text-muted">{perfilContent.goalsHint}</p>
        {errors.goalsCountAsCommitted ? (
          <FieldError id="goals-error" message={errors.goalsCountAsCommitted} />
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? perfilContent.pending : perfilContent.submit}
      </button>
    </form>
  );
}
