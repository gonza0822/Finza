"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { CURRENCIES, type Currency } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { metasContent } from "@/lib/content/metas";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import { hasGoalFieldErrors, validateGoalFields } from "@/features/metas/validateGoalForm";
import type { GoalFormState, GoalFormValues } from "@/features/metas/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface GoalFormProps {
  mode: "create" | "edit";
  goalId?: string;
  defaults: GoalFormValues;
  action: (prev: GoalFormState | undefined, formData: FormData) => Promise<GoalFormState>;
}

/** Create or edit a virtual savings overlay; assigned does not move accounts. */
export function GoalForm({ mode, goalId, defaults, action }: GoalFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [targetAmount, setTargetAmount] = useState(defaults.targetAmount);
  const [assignedAmount, setAssignedAmount] = useState(defaults.assignedAmount);
  const [currency, setCurrency] = useState<Currency>(defaults.currency);
  const [fieldErrors, setFieldErrors] = useState<NonNullable<GoalFormState["fieldErrors"]>>({});

  function formatTargetOnBlur() {
    const cents = parseMoneyToCents(targetAmount);
    if (cents === null) {
      return;
    }
    setTargetAmount(centsToInputValue(cents));
  }

  function formatAssignedOnBlur() {
    const cents = parseMoneyToCents(assignedAmount);
    if (cents === null) {
      return;
    }
    setAssignedAmount(centsToInputValue(cents));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateGoalFields(new FormData(event.currentTarget), mode);
    setFieldErrors(next);
    if (hasGoalFieldErrors(next)) {
      event.preventDefault();
    }
  }

  function clearField(field: keyof NonNullable<GoalFormState["fieldErrors"]>) {
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
      {goalId ? <input type="hidden" name="id" value={goalId} /> : null}
      {state?.error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          {metasContent.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={80}
          defaultValue={defaults.name}
          disabled={pending}
          placeholder={metasContent.namePlaceholder}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          onChange={() => clearField("name")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.name))}`}
        />
        {errors.name ? <FieldError id="name-error" message={errors.name} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{metasContent.currencyLabel}</legend>
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
        <label htmlFor="targetMonth" className="text-sm font-medium text-foreground">
          {metasContent.targetMonthLabel}
        </label>
        <input
          id="targetMonth"
          name="targetMonth"
          type="month"
          defaultValue={defaults.targetMonth}
          disabled={pending}
          min="2000-01"
          max="2100-12"
          aria-invalid={Boolean(errors.targetMonth)}
          onChange={() => clearField("targetMonth")}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.targetMonth))} cursor-pointer`}
        />
        {errors.targetMonth ? <FieldError id="targetMonth-error" message={errors.targetMonth} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="targetAmount" className="text-sm font-medium text-foreground">
          {metasContent.targetLabel}
        </label>
        <input
          id="targetAmount"
          name="targetAmount"
          inputMode="decimal"
          autoComplete="off"
          value={targetAmount}
          disabled={pending}
          placeholder={metasContent.amountPlaceholder}
          aria-invalid={Boolean(errors.targetAmount)}
          onChange={(event) => {
            setTargetAmount(event.target.value);
            clearField("targetAmount");
          }}
          onBlur={formatTargetOnBlur}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.targetAmount))}`}
        />
        <p className="text-sm text-muted">{metasContent.amountHint}</p>
        {errors.targetAmount ? (
          <FieldError id="targetAmount-error" message={errors.targetAmount} />
        ) : null}
      </div>

      {mode === "create" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assignedAmount" className="text-sm font-medium text-foreground">
            {metasContent.assignedNowLabel}
          </label>
          <input
            id="assignedAmount"
            name="assignedAmount"
            inputMode="decimal"
            autoComplete="off"
            value={assignedAmount}
            disabled={pending}
            placeholder={metasContent.amountPlaceholder}
            aria-invalid={Boolean(errors.assignedAmount)}
            onChange={(event) => {
              setAssignedAmount(event.target.value);
              clearField("assignedAmount");
            }}
            onBlur={formatAssignedOnBlur}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.assignedAmount))}`}
          />
          <p className="text-sm text-muted">{metasContent.assignedNowHint}</p>
          {errors.assignedAmount ? (
            <FieldError id="assignedAmount-error" message={errors.assignedAmount} />
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 cursor-pointer rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending
          ? mode === "create"
            ? metasContent.pendingCreate
            : metasContent.pendingEdit
          : mode === "create"
            ? metasContent.submitCreate
            : metasContent.submitEdit}
      </button>
    </form>
  );
}
