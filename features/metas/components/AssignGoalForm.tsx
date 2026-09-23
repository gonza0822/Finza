"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { metasContent } from "@/lib/content/metas";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import { assignSavingsGoalAction } from "@/lib/actions/savingsGoals";
import type { AssignGoalFormState } from "@/features/metas/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

interface AssignGoalFormProps {
  goalId: string;
}

/** Adds to assigned on this goal; does not move account balances. */
export function AssignGoalForm({ goalId }: AssignGoalFormProps) {
  const [state, formAction, pending] = useActionState(assignSavingsGoalAction, undefined);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | undefined>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const raw = String(new FormData(event.currentTarget).get("amount") ?? "").trim();
    if (!raw) {
      setAmountError(metasContent.errors.emptyAmount);
      event.preventDefault();
      return;
    }
    const cents = parseMoneyToCents(raw);
    if (cents === null || cents <= 0) {
      setAmountError(metasContent.errors.invalidAmount);
      event.preventDefault();
    }
  }

  function formatOnBlur() {
    const cents = parseMoneyToCents(amount);
    if (cents === null) {
      return;
    }
    setAmount(centsToInputValue(cents));
  }

  const error = amountError ?? state?.fieldErrors?.amount;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="id" value={goalId} />
      {state?.error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="assign-amount" className="text-sm font-medium text-foreground">
          {metasContent.assignLabel}
        </label>
        <input
          id="assign-amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          disabled={pending}
          placeholder={metasContent.amountPlaceholder}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setAmount(event.target.value);
            setAmountError(undefined);
          }}
          onBlur={formatOnBlur}
          className={`${fieldClass} ${fieldBorder(Boolean(error))}`}
        />
        <p className="text-sm text-muted">{metasContent.assignHint}</p>
        {error ? <FieldError id="assign-amount-error" message={error} /> : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending ? metasContent.pendingAssign : metasContent.submitAssign}
      </button>
    </form>
  );
}
