"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { CURRENCIES, type Currency } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { planificacionContent } from "@/lib/content/planificacion";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import {
  hasBudgetFieldErrors,
  validateBudgetFields,
} from "@/features/planificacion/validateBudgetForm";
import type { PublicCategory } from "@/features/categories/types";
import type { BudgetFormState, BudgetFormValues } from "@/features/planificacion/budgetTypes";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface BudgetFormProps {
  mode: "create" | "edit";
  budgetId?: string;
  categories: PublicCategory[];
  defaults: BudgetFormValues;
  action: (
    prev: BudgetFormState | undefined,
    formData: FormData,
  ) => Promise<BudgetFormState>;
}

/** Create/edit a monthly category cap; native HTML tooltips are disabled. */
export function BudgetForm({ mode, budgetId, categories, defaults, action }: BudgetFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [amount, setAmount] = useState(defaults.amount);
  const [currency, setCurrency] = useState<Currency>(defaults.currency);
  const [fieldErrors, setFieldErrors] = useState<NonNullable<BudgetFormState["fieldErrors"]>>({});
  const gastoCategories = categories.filter((item) => item.kind === "gasto");

  function formatAmountOnBlur() {
    const cents = parseMoneyToCents(amount);
    if (cents === null) {
      return;
    }
    setAmount(centsToInputValue(cents));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateBudgetFields(new FormData(event.currentTarget));
    setFieldErrors(next);
    if (hasBudgetFieldErrors(next)) {
      event.preventDefault();
    }
  }

  function clearField(field: keyof NonNullable<BudgetFormState["fieldErrors"]>) {
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
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {budgetId ? <input type="hidden" name="id" value={budgetId} /> : null}
      {state?.error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
          {planificacionContent.categoryLabel}
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={defaults.categoryId}
          disabled={pending}
          aria-invalid={Boolean(errors.categoryId)}
          onChange={() => clearField("categoryId")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.categoryId))} cursor-pointer`}
        >
          <option value="">{planificacionContent.categoryPlaceholder}</option>
          {gastoCategories.map((parent) => (
            <optgroup key={parent.id} label={parent.name}>
              <option value={parent.id}>{parent.name}</option>
              {parent.children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-sm text-muted">{planificacionContent.budgetCategoryHint}</p>
        {errors.categoryId ? <FieldError id="categoryId-error" message={errors.categoryId} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="yearMonth" className="text-sm font-medium text-foreground">
          {planificacionContent.budgetMonthLabel}
        </label>
        <input
          id="yearMonth"
          name="yearMonth"
          type="month"
          defaultValue={defaults.yearMonth}
          disabled={pending}
          min="2000-01"
          max="2100-12"
          aria-invalid={Boolean(errors.yearMonth)}
          onChange={() => clearField("yearMonth")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.yearMonth))} cursor-pointer`}
        />
        {errors.yearMonth ? <FieldError id="yearMonth-error" message={errors.yearMonth} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {planificacionContent.budgetCurrencyLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {CURRENCIES.map((item) => (
            <label
              key={item}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="currency"
                value={item}
                checked={currency === item}
                disabled={pending}
                onChange={() => {
                  setCurrency(item);
                  clearField("currency");
                }}
                className="accent-primary"
              />
              {accountsContent.currencies[item]}
            </label>
          ))}
        </div>
        {errors.currency ? <FieldError id="currency-error" message={errors.currency} /> : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-sm font-medium text-foreground">
          {planificacionContent.budgetAmountLabel}
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          disabled={pending}
          placeholder={planificacionContent.amountPlaceholder}
          aria-invalid={Boolean(errors.amount)}
          onChange={(event) => {
            setAmount(event.target.value);
            clearField("amount");
          }}
          onBlur={formatAmountOnBlur}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.amount))}`}
        />
        <p className="text-sm text-muted">{planificacionContent.amountHint}</p>
        {errors.amount ? <FieldError id="amount-error" message={errors.amount} /> : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 cursor-pointer rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending
          ? mode === "create"
            ? planificacionContent.pendingCreateBudget
            : planificacionContent.pendingEditBudget
          : mode === "create"
            ? planificacionContent.submitCreateBudget
            : planificacionContent.submitEditBudget}
      </button>
    </form>
  );
}
