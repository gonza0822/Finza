"use client";

import { useActionState, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  RECURRENCE_CLASSES,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_KINDS,
  type RecurrenceFrequency,
  type RecurrenceKind,
} from "@/lib/db/enums";
import { planificacionContent } from "@/lib/content/planificacion";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { FieldError } from "@/features/accounts/components/FieldError";
import type { PublicMoneyAccount } from "@/features/accounts/types";
import type { PublicCreditCard } from "@/features/cards/types";
import type { PublicCategory } from "@/features/categories/types";
import type { RecurrenceFormState, RecurrenceFormValues } from "@/features/planificacion/types";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface RecurrenceFormProps {
  mode: "create" | "edit";
  ruleId?: string;
  accounts: PublicMoneyAccount[];
  cards: PublicCreditCard[];
  categories: PublicCategory[];
  defaults: RecurrenceFormValues;
  action: (
    prev: RecurrenceFormState | undefined,
    formData: FormData,
  ) => Promise<RecurrenceFormState>;
}

/** Create/edit a repeating gasto or ingreso; confirm/omit happens on the month list. */
export function RecurrenceForm({
  mode,
  ruleId,
  accounts,
  cards,
  categories,
  defaults,
  action,
}: RecurrenceFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState<RecurrenceKind>(defaults.kind);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(defaults.frequency);
  const [paidWith, setPaidWith] = useState<"cuenta" | "tarjeta">(
    kind === "ingreso" ? "cuenta" : defaults.paidWith,
  );
  const [amount, setAmount] = useState(defaults.amount);
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<RecurrenceFormState["fieldErrors"]>
  >({});

  const effectivePaid = kind === "ingreso" ? "cuenta" : paidWith;
  const kindCategories = categories.filter((item) => item.kind === kind);

  function clearField(field: keyof NonNullable<RecurrenceFormState["fieldErrors"]>) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    const next: NonNullable<RecurrenceFormState["fieldErrors"]> = {};
    if (!String(form.get("name") ?? "").trim()) {
      next.name = planificacionContent.errors.emptyName;
    }
    const cents = parseMoneyToCents(String(form.get("amount") ?? ""));
    if (cents === null || cents <= 0) {
      next.amount = planificacionContent.errors.emptyAmount;
    }
    if (!String(form.get("categoryId") ?? "")) {
      next.categoryId = planificacionContent.errors.emptyCategory;
    }
    if (effectivePaid === "cuenta" && !String(form.get("accountId") ?? "")) {
      next.accountId = planificacionContent.errors.emptyAccount;
    }
    if (effectivePaid === "tarjeta" && !String(form.get("creditCardId") ?? "")) {
      next.creditCardId = planificacionContent.errors.emptyCard;
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
    }
  }

  const errors = { ...state?.fieldErrors, ...fieldErrors };

  return (
    <form action={formAction} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {ruleId ? <input type="hidden" name="id" value={ruleId} /> : null}
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
          {planificacionContent.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaults.name}
          disabled={pending}
          aria-invalid={Boolean(errors.name)}
          onChange={() => clearField("name")}
          placeholder={planificacionContent.namePlaceholder}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.name))}`}
        />
        {errors.name ? <FieldError id="name-error" message={errors.name} /> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{planificacionContent.kindLabel}</legend>
        <div className="grid grid-cols-2 gap-2">
          {RECURRENCE_KINDS.map((option) => (
            <label
              key={option}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="kind"
                value={option}
                checked={kind === option}
                disabled={pending}
                onChange={() => {
                  setKind(option);
                  if (option === "ingreso") {
                    setPaidWith("cuenta");
                  }
                  clearField("kind");
                  clearField("categoryId");
                }}
                className="accent-primary"
              />
              {planificacionContent.kinds[option]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ruleClass" className="text-sm font-medium text-foreground">
          {planificacionContent.classLabel}
        </label>
        <select
          id="ruleClass"
          name="ruleClass"
          defaultValue={defaults.ruleClass}
          disabled={pending}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.ruleClass))} cursor-pointer`}
        >
          {RECURRENCE_CLASSES.map((option) => (
            <option key={option} value={option}>
              {planificacionContent.classes[option]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-sm font-medium text-foreground">
          {planificacionContent.amountLabel}
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          value={amount}
          disabled={pending}
          aria-invalid={Boolean(errors.amount)}
          aria-describedby="amount-hint"
          placeholder={planificacionContent.amountPlaceholder}
          onChange={(event) => {
            setAmount(event.target.value);
            clearField("amount");
          }}
          onBlur={() => {
            const cents = parseMoneyToCents(amount);
            if (cents !== null) {
              setAmount(centsToInputValue(cents));
            }
          }}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.amount))}`}
        />
        <p id="amount-hint" className="text-sm text-muted">
          {planificacionContent.amountHint}
        </p>
        {errors.amount ? <FieldError id="amount-error" message={errors.amount} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="frequency" className="text-sm font-medium text-foreground">
          {planificacionContent.frequencyLabel}
        </label>
        <select
          id="frequency"
          name="frequency"
          value={frequency}
          disabled={pending}
          onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}
          className={`${fieldClass} ${fieldBorder(false)} cursor-pointer`}
        >
          {RECURRENCE_FREQUENCIES.map((option) => (
            <option key={option} value={option}>
              {planificacionContent.frequencies[option]}
            </option>
          ))}
        </select>
      </div>

      {frequency === "anual" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dueMonth" className="text-sm font-medium text-foreground">
            {planificacionContent.dueMonthLabel}
          </label>
          <select
            id="dueMonth"
            name="dueMonth"
            defaultValue={String(defaults.dueMonth)}
            disabled={pending}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.dueMonth))} cursor-pointer`}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={month}>
                {planificacionContent.months[month as keyof typeof planificacionContent.months]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dueDay" className="text-sm font-medium text-foreground">
          {frequency === "semanal"
            ? planificacionContent.dueDayWeeklyLabel
            : planificacionContent.dueDayLabel}
        </label>
        <select
          id="dueDay"
          name="dueDay"
          key={frequency}
          defaultValue={
            frequency === "semanal"
              ? String(defaults.dueDay >= 1 && defaults.dueDay <= 7 ? defaults.dueDay : 1)
              : String(defaults.dueDay)
          }
          disabled={pending}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.dueDay))} cursor-pointer`}
        >
          {frequency === "semanal"
            ? ([1, 2, 3, 4, 5, 6, 7] as const).map((day) => (
                <option key={day} value={day}>
                  {planificacionContent.weekdays[day]}
                </option>
              ))
            : Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
        </select>
      </div>

      {kind === "gasto" && cards.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            {planificacionContent.paidWithLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="paidWith"
                value="cuenta"
                checked={effectivePaid === "cuenta"}
                disabled={pending || accounts.length === 0}
                onChange={() => setPaidWith("cuenta")}
                className="accent-primary"
              />
              {planificacionContent.paidWith.cuenta}
            </label>
            <label
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="paidWith"
                value="tarjeta"
                checked={effectivePaid === "tarjeta"}
                disabled={pending}
                onChange={() => setPaidWith("tarjeta")}
                className="accent-primary"
              />
              {planificacionContent.paidWith.tarjeta}
            </label>
          </div>
        </fieldset>
      ) : (
        <input type="hidden" name="paidWith" value="cuenta" />
      )}

      {effectivePaid === "cuenta" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="accountId" className="text-sm font-medium text-foreground">
            {planificacionContent.accountLabel}
          </label>
          <select
            id="accountId"
            name="accountId"
            defaultValue={defaults.accountId}
            disabled={pending}
            aria-invalid={Boolean(errors.accountId)}
            onChange={() => clearField("accountId")}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.accountId))} cursor-pointer`}
          >
            <option value="">{planificacionContent.accountPlaceholder}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">{planificacionContent.accountHint}</p>
          {errors.accountId ? <FieldError id="accountId-error" message={errors.accountId} /> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="creditCardId" className="text-sm font-medium text-foreground">
            {planificacionContent.cardLabel}
          </label>
          <select
            id="creditCardId"
            name="creditCardId"
            defaultValue={defaults.creditCardId}
            disabled={pending}
            aria-invalid={Boolean(errors.creditCardId)}
            onChange={() => clearField("creditCardId")}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.creditCardId))} cursor-pointer`}
          >
            <option value="">{planificacionContent.cardPlaceholder}</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">{planificacionContent.creditHint}</p>
          {errors.creditCardId ? (
            <FieldError id="creditCardId-error" message={errors.creditCardId} />
          ) : null}
        </div>
      )}

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
          {kindCategories.map((parent) => (
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
        {errors.categoryId ? <FieldError id="categoryId-error" message={errors.categoryId} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="startsOn" className="text-sm font-medium text-foreground">
          {planificacionContent.startsOnLabel}
        </label>
        <input
          id="startsOn"
          name="startsOn"
          type="date"
          defaultValue={defaults.startsOn}
          disabled={pending}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.startsOn))} cursor-pointer`}
        />
        {errors.startsOn ? <FieldError id="startsOn-error" message={errors.startsOn} /> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="endsOn" className="text-sm font-medium text-foreground">
          {planificacionContent.endsOnLabel}{" "}
          <span className="font-normal text-muted">({planificacionContent.endsOnOptional})</span>
        </label>
        <input
          id="endsOn"
          name="endsOn"
          type="date"
          defaultValue={defaults.endsOn}
          disabled={pending}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.endsOn))} cursor-pointer`}
        />
        {errors.endsOn ? <FieldError id="endsOn-error" message={errors.endsOn} /> : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {pending
          ? mode === "create"
            ? planificacionContent.pendingCreate
            : planificacionContent.pendingEdit
          : mode === "create"
            ? planificacionContent.submitCreate
            : planificacionContent.submitEdit}
      </button>
    </form>
  );
}
