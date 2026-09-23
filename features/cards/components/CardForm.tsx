"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { CARD_BRANDS, CURRENCIES, type Currency } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { cardsContent } from "@/lib/content/cards";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import type { PublicMoneyAccount } from "@/features/accounts/types";
import { hasCardFieldErrors, validateCardFields } from "@/features/cards/validateForm";
import type { CreditCardFormState, CreditCardFormValues } from "@/features/cards/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

const CYCLE_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

interface CardFormProps {
  mode: "create" | "edit";
  cardId?: string;
  ledgerLocked?: boolean;
  accounts: PublicMoneyAccount[];
  defaults: CreditCardFormValues;
  action: (
    prev: CreditCardFormState | undefined,
    formData: FormData,
  ) => Promise<CreditCardFormState>;
}

/** Create/edit form with custom field errors; native HTML tooltips are disabled. */
export function CardForm({
  mode,
  cardId,
  ledgerLocked = false,
  accounts,
  defaults,
  action,
}: CardFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [currency, setCurrency] = useState<Currency>(defaults.currency);
  const [limit, setLimit] = useState(defaults.creditLimit);
  const [paymentAccountId, setPaymentAccountId] = useState(
    defaults.paymentAccountId ||
      accounts.find((account) => account.currency === defaults.currency && !account.archived)?.id ||
      "",
  );
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<CreditCardFormState["fieldErrors"]>
  >({});

  const paymentAccounts = accounts.filter((account) => {
    if (account.currency !== currency) {
      return false;
    }
    if (!account.archived) {
      return true;
    }
    return account.id === defaults.paymentAccountId;
  });

  function formatLimitOnBlur() {
    const cents = parseMoneyToCents(limit);
    if (cents === null) {
      return;
    }
    setLimit(centsToInputValue(cents));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateCardFields(new FormData(event.currentTarget));
    setFieldErrors(next);
    if (hasCardFieldErrors(next)) {
      event.preventDefault();
    }
  }

  function clearField(field: keyof NonNullable<CreditCardFormState["fieldErrors"]>) {
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
    <form action={formAction} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {cardId ? <input type="hidden" name="id" value={cardId} /> : null}
      {ledgerLocked ? <input type="hidden" name="currency" value={defaults.currency} /> : null}

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
          {cardsContent.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={80}
          defaultValue={defaults.name}
          disabled={pending}
          placeholder={cardsContent.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          onChange={() => clearField("name")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.name))}`}
        />
        {errors.name ? <FieldError id="name-error" message={errors.name} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{cardsContent.brandLabel}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CARD_BRANDS.map((brand) => (
            <label
              key={brand}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="brand"
                value={brand}
                defaultChecked={defaults.brand === brand}
                disabled={pending}
                onChange={() => clearField("brand")}
                className="accent-primary"
              />
              {cardsContent.brands[brand]}
            </label>
          ))}
        </div>
        {errors.brand ? <FieldError id="brand-error" message={errors.brand} /> : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lastFour" className="text-sm font-medium text-foreground">
          {cardsContent.lastFourLabel}
        </label>
        <input
          id="lastFour"
          name="lastFour"
          type="text"
          inputMode="numeric"
          maxLength={4}
          defaultValue={defaults.lastFour}
          disabled={pending}
          placeholder={cardsContent.lastFourPlaceholder}
          aria-invalid={Boolean(errors.lastFour)}
          aria-describedby={errors.lastFour ? "lastFour-error" : undefined}
          onChange={() => clearField("lastFour")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.lastFour))}`}
        />
        {errors.lastFour ? <FieldError id="lastFour-error" message={errors.lastFour} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {cardsContent.currencyLabel}
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
                  setPaymentAccountId("");
                  clearField("currency");
                  clearField("paymentAccountId");
                }}
                className="accent-primary"
              />
              {cardsContent.currencies[option]}
            </label>
          ))}
        </div>
        {errors.currency ? <FieldError id="currency-error" message={errors.currency} /> : null}
        {ledgerLocked ? (
          <p className="text-sm text-muted">{cardsContent.ledgerLockedHint}</p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="creditLimit" className="text-sm font-medium text-foreground">
          {cardsContent.limitLabel}
        </label>
        <div
          className={`flex items-center rounded-2xl border bg-cream transition-colors duration-200 focus-within:ring-2 ${
            errors.creditLimit
              ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-200"
              : "border-primary/15 focus-within:border-primary focus-within:ring-teal-glow/40"
          }`}
        >
          <span className="pl-4 text-sm font-medium text-muted" aria-hidden>
            {accountsContent.currencyPrefixes[currency]}
          </span>
          <input
            id="creditLimit"
            name="creditLimit"
            type="text"
            inputMode="decimal"
            value={limit}
            placeholder={cardsContent.limitPlaceholder}
            disabled={pending}
            aria-invalid={Boolean(errors.creditLimit)}
            aria-describedby={errors.creditLimit ? "creditLimit-error" : "creditLimit-hint"}
            onChange={(event) => {
              setLimit(event.target.value);
              clearField("creditLimit");
            }}
            onBlur={formatLimitOnBlur}
            className="w-full rounded-2xl bg-transparent px-3 py-3 text-base text-foreground placeholder:text-muted/60 focus:outline-none disabled:opacity-60"
          />
        </div>
        <p id="creditLimit-hint" className="text-sm text-muted">
          {cardsContent.limitHint}
        </p>
        {errors.creditLimit ? (
          <FieldError id="creditLimit-error" message={errors.creditLimit} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="closeDay" className="text-sm font-medium text-foreground">
            {cardsContent.closeDayLabel}
          </label>
          <select
            id="closeDay"
            name="closeDay"
            defaultValue={defaults.closeDay}
            disabled={pending}
            aria-invalid={Boolean(errors.closeDay)}
            aria-describedby={errors.closeDay ? "closeDay-error" : undefined}
            onChange={() => clearField("closeDay")}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.closeDay))} cursor-pointer`}
          >
            {CYCLE_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.closeDay ? <FieldError id="closeDay-error" message={errors.closeDay} /> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dueDay" className="text-sm font-medium text-foreground">
            {cardsContent.dueDayLabel}
          </label>
          <select
            id="dueDay"
            name="dueDay"
            defaultValue={defaults.dueDay}
            disabled={pending}
            aria-invalid={Boolean(errors.dueDay)}
            aria-describedby={errors.dueDay ? "dueDay-error" : undefined}
            onChange={() => clearField("dueDay")}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.dueDay))} cursor-pointer`}
          >
            {CYCLE_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.dueDay ? <FieldError id="dueDay-error" message={errors.dueDay} /> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="paymentAccountId" className="text-sm font-medium text-foreground">
          {cardsContent.paymentAccountLabel}
        </label>
        <select
          id="paymentAccountId"
          name="paymentAccountId"
          value={paymentAccountId}
          disabled={pending}
          aria-invalid={Boolean(errors.paymentAccountId)}
          aria-describedby={
            errors.paymentAccountId ? "paymentAccountId-error" : "paymentAccountId-hint"
          }
          onChange={(event) => {
            setPaymentAccountId(event.target.value);
            clearField("paymentAccountId");
          }}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.paymentAccountId))} cursor-pointer`}
        >
          <option value="">{cardsContent.paymentAccountPlaceholder}</option>
          {paymentAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <p id="paymentAccountId-hint" className="text-sm text-muted">
          {cardsContent.paymentAccountHint}
        </p>
        {errors.paymentAccountId ? (
          <FieldError id="paymentAccountId-error" message={errors.paymentAccountId} />
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          {cardsContent.notesLabel}{" "}
          <span className="font-normal text-muted">({cardsContent.notesOptional})</span>
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
            ? cardsContent.pendingCreate
            : cardsContent.pendingEdit
          : mode === "create"
            ? cardsContent.submitCreate
            : cardsContent.submitEdit}
      </button>
    </form>
  );
}
