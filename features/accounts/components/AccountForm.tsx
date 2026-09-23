"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { ACCOUNT_TYPES, CURRENCIES, type Currency } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import {
  hasAccountFieldErrors,
  validateAccountFields,
} from "@/features/accounts/validateForm";
import type { MoneyAccountFormState, MoneyAccountFormValues } from "@/features/accounts/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface AccountFormProps {
  mode: "create" | "edit";
  accountId?: string;
  ledgerLocked?: boolean;
  defaults: MoneyAccountFormValues;
  action: (
    prev: MoneyAccountFormState | undefined,
    formData: FormData,
  ) => Promise<MoneyAccountFormState>;
}

/** Create/edit form with custom field errors; native HTML tooltips are disabled. */
export function AccountForm({
  mode,
  accountId,
  ledgerLocked = false,
  defaults,
  action,
}: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [currency, setCurrency] = useState<Currency>(defaults.currency);
  const [balance, setBalance] = useState(defaults.initialBalance);
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<MoneyAccountFormState["fieldErrors"]>
  >({});

  function formatBalanceOnBlur() {
    const cents = parseMoneyToCents(balance);
    if (cents === null) {
      return;
    }
    setBalance(centsToInputValue(cents));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateAccountFields(new FormData(event.currentTarget));
    setFieldErrors(next);
    if (hasAccountFieldErrors(next)) {
      event.preventDefault();
    }
  }

  function clearField(field: keyof NonNullable<MoneyAccountFormState["fieldErrors"]>) {
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
      {accountId ? <input type="hidden" name="id" value={accountId} /> : null}
      {ledgerLocked ? (
        <>
          <input type="hidden" name="currency" value={defaults.currency} />
          <input type="hidden" name="initialBalance" value={defaults.initialBalance} />
        </>
      ) : null}

      {state?.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {accountsContent.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={80}
          defaultValue={defaults.name}
          disabled={pending}
          placeholder={accountsContent.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          onChange={() => clearField("name")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.name))}`}
        />
        {errors.name ? <FieldError id="name-error" message={errors.name} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{accountsContent.typeLabel}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACCOUNT_TYPES.map((type) => (
            <label
              key={type}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="type"
                value={type}
                defaultChecked={defaults.type === type}
                disabled={pending}
                onChange={() => clearField("type")}
                className="accent-primary"
              />
              {accountsContent.types[type]}
            </label>
          ))}
        </div>
        {errors.type ? <FieldError id="type-error" message={errors.type} /> : null}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {accountsContent.currencyLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {CURRENCIES.map((option) => (
            <label
              key={option}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="currency"
                value={option}
                defaultChecked={defaults.currency === option}
                disabled={pending || ledgerLocked}
                onChange={() => {
                  setCurrency(option);
                  clearField("currency");
                }}
                className="accent-primary"
              />
              {accountsContent.currencies[option]}
            </label>
          ))}
        </div>
        {errors.currency ? <FieldError id="currency-error" message={errors.currency} /> : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="initialBalance" className="text-sm font-medium text-foreground">
          {accountsContent.balanceLabel}
        </label>
        <div
          className={`flex items-center rounded-2xl border bg-cream transition-colors duration-200 focus-within:ring-2 ${
            errors.initialBalance
              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-200"
              : "border-primary/15 focus-within:border-primary focus-within:ring-teal-glow/40"
          }`}
        >
          <span className="pl-4 text-sm font-medium text-muted" aria-hidden>
            {accountsContent.currencyPrefixes[currency]}
          </span>
          <input
            id="initialBalance"
            name="initialBalance"
            type="text"
            inputMode="decimal"
            value={balance}
            placeholder={accountsContent.balancePlaceholder}
            disabled={pending || ledgerLocked}
            aria-invalid={Boolean(errors.initialBalance)}
            aria-describedby={
              errors.initialBalance
                ? "initialBalance-error"
                : ledgerLocked
                  ? "initialBalance-locked"
                  : "initialBalance-hint"
            }
            onChange={(event) => {
              setBalance(event.target.value);
              clearField("initialBalance");
            }}
            onBlur={formatBalanceOnBlur}
            className="w-full rounded-2xl bg-transparent px-3 py-3 text-base text-foreground placeholder:text-muted/60 focus:outline-none disabled:opacity-60"
          />
        </div>
        {ledgerLocked ? (
          <p id="initialBalance-locked" className="text-sm text-muted">
            {accountsContent.ledgerLockedHint}
          </p>
        ) : (
          <p id="initialBalance-hint" className="text-sm text-muted">
            {accountsContent.balanceHint}
          </p>
        )}
        {errors.initialBalance ? (
          <FieldError id="initialBalance-error" message={errors.initialBalance} />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          {accountsContent.notesLabel}{" "}
          <span className="font-normal text-muted">({accountsContent.notesOptional})</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={defaults.notes}
          disabled={pending}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          onChange={() => clearField("notes")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.notes))} resize-y`}
        />
        {errors.notes ? <FieldError id="notes-error" message={errors.notes} /> : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? mode === "create"
            ? accountsContent.pendingCreate
            : accountsContent.pendingEdit
          : mode === "create"
            ? accountsContent.submitCreate
            : accountsContent.submitEdit}
      </button>
    </form>
  );
}
