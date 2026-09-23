"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import {
  CONSUMPTION_TYPES,
  LEDGER_TYPES,
  MAX_INSTALLMENT_COUNT,
  type Currency,
  type LedgerType,
  type PaidWith,
} from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { movementsContent } from "@/lib/content/movements";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import { centsToInputValue, parseMoneyToCents } from "@/lib/money/parse";
import { splitInstallmentCents } from "@/lib/cards/splitInstallments";
import { FieldError } from "@/features/accounts/components/FieldError";
import type { PublicMoneyAccount } from "@/features/accounts/types";
import type { PublicCreditCard } from "@/features/cards/types";
import type { PublicCategory } from "@/features/categories/types";
import {
  cardPaymentChoices,
  type CardPaymentChoice,
} from "@/features/movements/cardPaymentOptions";
import {
  hasMovementFieldErrors,
  validateMovementFields,
} from "@/features/movements/validateForm";
import type { MovementFormState } from "@/features/movements/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearMovementDraft, patchMovementDraft } from "@/store/slices/movementDraftSlice";

const fieldClass =
  "w-full rounded-2xl border bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:ring-2 focus:outline-none disabled:opacity-60";

function fieldBorder(hasError: boolean): string {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
    : "border-primary/15 focus:border-primary focus:ring-teal-glow/40";
}

const choiceClass =
  "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary";

interface MovementFormProps {
  today: string;
  accounts: PublicMoneyAccount[];
  cards: PublicCreditCard[];
  categories: PublicCategory[];
  presetType?: LedgerType;
  presetCardId?: string;
  action: (
    prev: MovementFormState | undefined,
    formData: FormData,
  ) => Promise<MovementFormState>;
}

function isConsumption(type: LedgerType): boolean {
  return CONSUMPTION_TYPES.includes(type as (typeof CONSUMPTION_TYPES)[number]);
}

function visibleLedgerTypes(
  accounts: PublicMoneyAccount[],
  cards: PublicCreditCard[],
): LedgerType[] {
  return LEDGER_TYPES.filter((type) => {
    if (type === "pago_tarjeta") {
      return cards.length > 0 && accounts.length > 0;
    }
    if (type !== "gasto" && accounts.length === 0) {
      return false;
    }
    return true;
  });
}

/** Collects ids for gasto/ingreso trees, including parent and children. */
function idsForKind(categories: PublicCategory[], kind: "gasto" | "ingreso"): Set<string> {
  const ids = new Set<string>();
  for (const parent of categories) {
    if (parent.kind !== kind) {
      continue;
    }
    ids.add(parent.id);
    for (const child of parent.children) {
      ids.add(child.id);
    }
  }
  return ids;
}

/** Label for a suggested card-payment amount (due now, statement, or one cuota). */
function paymentChoiceLabel(choice: CardPaymentChoice, card: PublicCreditCard): string {
  const amount = formatMoney(choice.cents, card.currency);
  if (choice.kind === "dueNow") {
    return movementsContent.paymentMonthDueNow(amount);
  }
  if (choice.kind === "statement") {
    return movementsContent.paymentMonthStatement(formatIsoDateEsAr(card.nextDueOn), amount);
  }
  return movementsContent.paymentMonthInstallment(
    choice.title ?? movementsContent.noCategory,
    choice.number ?? 1,
    choice.count ?? 1,
    amount,
  );
}

function implicitRateHint(
  fromCents: number,
  fromCurrency: Currency,
  toCents: number,
  toCurrency: Currency,
): string | null {
  if (fromCents <= 0 || toCents <= 0) {
    return null;
  }
  const toPerOneFrom = Math.round((toCents * 100) / fromCents);
  return movementsContent.rateHint(
    formatMoney(100, fromCurrency),
    formatMoney(toPerOneFrom, toCurrency),
  );
}

/** Ledger form; fields change by type. Draft survives route changes until saved. */
export function MovementForm({
  today,
  accounts,
  cards,
  categories,
  presetType,
  presetCardId,
  action,
}: MovementFormProps) {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.movementDraft);
  const saveStartedRef = useRef(false);
  const presetAppliedRef = useRef(false);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [fieldErrors, setFieldErrors] = useState<
    NonNullable<MovementFormState["fieldErrors"]>
  >({});
  const [paymentChoiceId, setPaymentChoiceId] = useState("");

  const types = visibleLedgerTypes(accounts, cards);
  const type = types.includes(draft.type) ? draft.type : (types[0] ?? "gasto");
  const paidWith: PaidWith =
    type !== "gasto"
      ? "cuenta"
      : cards.length === 0
        ? "cuenta"
        : accounts.length === 0
          ? "tarjeta"
          : draft.paidWith;
  const usesCard = (type === "gasto" && paidWith === "tarjeta") || type === "pago_tarjeta";

  const accountIds = new Set(accounts.map((account) => account.id));
  const cardIds = new Set(cards.map((card) => card.id));
  const creditCardId = cardIds.has(draft.creditCardId)
    ? draft.creditCardId
    : (cards[0]?.id ?? "");
  const selectedCard = cards.find((card) => card.id === creditCardId);
  const paymentAccounts = selectedCard
    ? accounts.filter((account) => account.currency === selectedCard.currency)
    : accounts;
  const paymentAccountIds = new Set(paymentAccounts.map((account) => account.id));
  const defaultPaymentId =
    selectedCard && paymentAccountIds.has(selectedCard.paymentAccountId)
      ? selectedCard.paymentAccountId
      : (paymentAccounts[0]?.id ?? "");
  const accountId = usesCard
    ? paymentAccountIds.has(draft.accountId)
      ? draft.accountId
      : defaultPaymentId
    : accountIds.has(draft.accountId)
      ? draft.accountId
      : (accounts[0]?.id ?? "");
  const origin = accounts.find((account) => account.id === accountId);
  const destAccounts = accounts.filter((account) => {
    if (account.id === accountId) {
      return false;
    }
    if (type === "transferencia") {
      return origin ? account.currency === origin.currency : true;
    }
    if (type === "conversion") {
      return origin ? account.currency !== origin.currency : true;
    }
    return true;
  });
  const destIds = new Set(destAccounts.map((account) => account.id));
  const counterAccountId = destIds.has(draft.counterAccountId) ? draft.counterAccountId : "";
  const dest = accounts.find((account) => account.id === counterAccountId);
  const categoryId =
    (type === "gasto" || type === "ingreso") && idsForKind(categories, type).has(draft.categoryId)
      ? draft.categoryId
      : "";
  const amount = draft.amount;
  const counterAmount = draft.counterAmount;
  const observedBalance = draft.observedBalance;
  const occurredOn =
    draft.occurredOn && draft.occurredOn <= today ? draft.occurredOn : today;
  const notes = draft.notes;
  const installmentCount = draft.installmentCount || "1";
  const currency: Currency =
    usesCard && selectedCard ? selectedCard.currency : (origin?.currency ?? "ARS");
  const destCurrency: Currency = dest?.currency ?? (currency === "ARS" ? "USD" : "ARS");
  const kindCategories = categories.filter((item) => item.kind === type);

  const fromCents = parseMoneyToCents(amount);
  const toCents = parseMoneyToCents(counterAmount);
  const rateHint =
    type === "conversion" && fromCents !== null && toCents !== null && origin && dest
      ? implicitRateHint(fromCents, origin.currency, toCents, dest.currency)
      : null;

  const observedCents = parseMoneyToCents(observedBalance);
  const ajusteDelta =
    type === "ajuste" && origin && observedCents !== null
      ? observedCents - origin.balanceCents
      : null;
  const overLimit =
    type === "gasto" &&
    paidWith === "tarjeta" &&
    selectedCard &&
    fromCents !== null &&
    selectedCard.debtCents + fromCents > selectedCard.creditLimitCents;
  const parsedInstallmentCount = Number(installmentCount);
  const installmentParts =
    type === "gasto" &&
    paidWith === "tarjeta" &&
    fromCents !== null &&
    Number.isInteger(parsedInstallmentCount) &&
    parsedInstallmentCount >= 1 &&
    parsedInstallmentCount <= MAX_INSTALLMENT_COUNT
      ? splitInstallmentCents(fromCents, parsedInstallmentCount)
      : null;
  const paymentChoices =
    type === "pago_tarjeta" && selectedCard ? cardPaymentChoices(selectedCard) : [];
  const selectedPaymentChoice = paymentChoices.find((choice) => choice.id === paymentChoiceId);
  const installmentPreview =
    installmentParts && selectedCard && parsedInstallmentCount > 1
      ? installmentParts[0] === installmentParts[installmentParts.length - 1]
        ? movementsContent.installmentEqualHint(
            parsedInstallmentCount,
            formatMoney(installmentParts[0] ?? 0, selectedCard.currency),
          )
        : movementsContent.installmentRemainderHint(
            parsedInstallmentCount,
            formatMoney(installmentParts[0] ?? 0, selectedCard.currency),
            formatMoney(installmentParts[installmentParts.length - 1] ?? 0, selectedCard.currency),
          )
      : null;

  useEffect(() => {
    if (presetAppliedRef.current) {
      return;
    }
    if (!presetType && !presetCardId) {
      presetAppliedRef.current = true;
      return;
    }
    const nextType =
      presetType && visibleLedgerTypes(accounts, cards).includes(presetType)
        ? presetType
        : undefined;
    const nextCardId =
      presetCardId && cards.some((card) => card.id === presetCardId) ? presetCardId : undefined;
    dispatch(
      patchMovementDraft({
        ...(nextType ? { type: nextType } : {}),
        ...(nextCardId
          ? {
              creditCardId: nextCardId,
              paidWith: nextType === "pago_tarjeta" ? "cuenta" : "tarjeta",
            }
          : {}),
      }),
    );
    presetAppliedRef.current = true;
  }, [accounts, cards, dispatch, presetCardId, presetType]);

  useEffect(() => {
    return () => {
      if (saveStartedRef.current) {
        dispatch(clearMovementDraft());
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (state?.error || state?.fieldErrors) {
      saveStartedRef.current = false;
    }
  }, [state]);

  function formatDraftMoney(field: "amount" | "counterAmount" | "observedBalance", value: string) {
    const cents = parseMoneyToCents(value);
    if (cents === null) {
      return;
    }
    dispatch(patchMovementDraft({ [field]: centsToInputValue(cents) }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const next = validateMovementFields(new FormData(event.currentTarget));
    setFieldErrors(next);
    if (hasMovementFieldErrors(next)) {
      event.preventDefault();
      return;
    }
    saveStartedRef.current = true;
  }

  function clearField(field: keyof NonNullable<MovementFormState["fieldErrors"]>) {
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
  const showAccount =
    type === "pago_tarjeta" ||
    type === "ingreso" ||
    type === "transferencia" ||
    type === "conversion" ||
    type === "ajuste" ||
    (type === "gasto" && paidWith === "cuenta");
  const showCard = usesCard;

  return (
    <form action={formAction} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      {state?.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">{movementsContent.typeLabel}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {types.map((option) => (
            <label
              key={option}
              className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
            >
              <input
                type="radio"
                name="type"
                value={option}
                checked={type === option}
                disabled={pending}
                onChange={() => {
                  dispatch(
                    patchMovementDraft({
                      type: option,
                      categoryId: "",
                      counterAccountId: "",
                    }),
                  );
                  setPaymentChoiceId("");
                  clearField("type");
                  clearField("categoryId");
                  clearField("counterAccountId");
                }}
                className="accent-primary"
              />
              {movementsContent.types[option]}
            </label>
          ))}
        </div>
        {errors.type ? <FieldError id="type-error" message={errors.type} /> : null}
      </fieldset>

      {type === "gasto" && cards.length > 0 && accounts.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            {movementsContent.paidWithLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["cuenta", "tarjeta"] as const).map((option) => (
              <label
                key={option}
                className={`${choiceClass} border-primary/15 hover:bg-primary/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10`}
              >
                <input
                  type="radio"
                  name="paidWith"
                  value={option}
                  checked={paidWith === option}
                  disabled={pending}
                  onChange={() => {
                    dispatch(patchMovementDraft({ paidWith: option }));
                    clearField("accountId");
                    clearField("creditCardId");
                  }}
                  className="accent-primary"
                />
                {movementsContent.paidWith[option]}
              </label>
            ))}
          </div>
        </fieldset>
      ) : usesCard ? (
        <input type="hidden" name="paidWith" value="tarjeta" />
      ) : type === "gasto" ? (
        <input type="hidden" name="paidWith" value="cuenta" />
      ) : null}

      {showCard ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="creditCardId" className="text-sm font-medium text-foreground">
            {movementsContent.cardLabel}
          </label>
          <select
            id="creditCardId"
            name="creditCardId"
            value={creditCardId}
            disabled={pending}
            aria-invalid={Boolean(errors.creditCardId)}
            aria-describedby={errors.creditCardId ? "creditCardId-error" : undefined}
            onChange={(event) => {
              dispatch(patchMovementDraft({ creditCardId: event.target.value, accountId: "" }));
              setPaymentChoiceId("");
              clearField("creditCardId");
              clearField("accountId");
            }}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.creditCardId))} cursor-pointer`}
          >
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
          {errors.creditCardId ? (
            <FieldError id="creditCardId-error" message={errors.creditCardId} />
          ) : null}
          <p className="text-sm text-muted">
            {type === "pago_tarjeta"
              ? movementsContent.cardPaymentHint
              : movementsContent.creditHint}
          </p>
        </div>
      ) : null}

      {showAccount ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="accountId" className="text-sm font-medium text-foreground">
            {type === "transferencia" || type === "conversion"
              ? movementsContent.accountFromLabel
              : type === "pago_tarjeta"
                ? movementsContent.accountFromLabel
                : movementsContent.accountLabel}
          </label>
          <select
            id="accountId"
            name="accountId"
            value={accountId}
            disabled={pending}
            aria-invalid={Boolean(errors.accountId)}
            aria-describedby={errors.accountId ? "accountId-error" : undefined}
            onChange={(event) => {
              dispatch(patchMovementDraft({ accountId: event.target.value, counterAccountId: "" }));
              clearField("accountId");
              clearField("counterAccountId");
            }}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.accountId))} cursor-pointer`}
          >
            {(type === "pago_tarjeta" ? paymentAccounts : accounts).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.accountId ? <FieldError id="accountId-error" message={errors.accountId} /> : null}
        </div>
      ) : null}

      {type === "transferencia" || type === "conversion" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="counterAccountId" className="text-sm font-medium text-foreground">
            {movementsContent.accountToLabel}
          </label>
          <select
            id="counterAccountId"
            name="counterAccountId"
            value={counterAccountId}
            disabled={pending}
            aria-invalid={Boolean(errors.counterAccountId)}
            aria-describedby={errors.counterAccountId ? "counterAccountId-error" : undefined}
            onChange={(event) => {
              dispatch(patchMovementDraft({ counterAccountId: event.target.value }));
              clearField("counterAccountId");
            }}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.counterAccountId))} cursor-pointer`}
          >
            <option value="">{movementsContent.accountPlaceholder}</option>
            {destAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          {errors.counterAccountId ? (
            <FieldError id="counterAccountId-error" message={errors.counterAccountId} />
          ) : null}
        </div>
      ) : null}

      {type === "pago_tarjeta" && selectedCard && paymentChoices.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="paymentChoice" className="text-sm font-medium text-foreground">
            {movementsContent.paymentMonthLabel}
          </label>
          <select
            id="paymentChoice"
            value={selectedPaymentChoice ? paymentChoiceId : ""}
            disabled={pending}
            aria-describedby="paymentChoice-hint"
            onChange={(event) => {
              const nextId = event.target.value;
              setPaymentChoiceId(nextId);
              const choice = paymentChoices.find((item) => item.id === nextId);
              if (choice) {
                dispatch(patchMovementDraft({ amount: centsToInputValue(choice.cents) }));
                clearField("amount");
                return;
              }
              dispatch(patchMovementDraft({ amount: "" }));
              clearField("amount");
            }}
            className={`${fieldClass} ${fieldBorder(false)} cursor-pointer`}
          >
            <option value="">{movementsContent.paymentMonthCustom}</option>
            {paymentChoices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {paymentChoiceLabel(choice, selectedCard)}
              </option>
            ))}
          </select>
          <p id="paymentChoice-hint" className="text-sm text-muted">
            {movementsContent.paymentMonthHint}
          </p>
        </div>
      ) : null}

      {type !== "ajuste" ? (
        <MoneyField
          id="amount"
          name="amount"
          label={type === "conversion" ? movementsContent.amountFromLabel : movementsContent.amountLabel}
          currency={currency}
          value={amount}
          error={errors.amount}
          pending={pending}
          onChange={(value) => {
            dispatch(patchMovementDraft({ amount: value }));
            clearField("amount");
            const cents = parseMoneyToCents(value);
            if (!selectedPaymentChoice || cents !== selectedPaymentChoice.cents) {
              setPaymentChoiceId("");
            }
          }}
          onBlur={() => formatDraftMoney("amount", amount)}
        />
      ) : null}

      {type === "gasto" && paidWith === "tarjeta" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="installmentCount" className="text-sm font-medium text-foreground">
            {movementsContent.installmentCountLabel}
          </label>
          <input
            id="installmentCount"
            name="installmentCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_INSTALLMENT_COUNT}
            step={1}
            value={installmentCount}
            disabled={pending}
            aria-invalid={Boolean(errors.installmentCount)}
            aria-describedby={
              errors.installmentCount ? "installmentCount-error" : "installmentCount-hint"
            }
            onChange={(event) => {
              dispatch(patchMovementDraft({ installmentCount: event.target.value }));
              clearField("installmentCount");
            }}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.installmentCount))}`}
          />
          <p id="installmentCount-hint" className="text-sm text-muted">
            {installmentPreview ?? movementsContent.installmentCountHint}
          </p>
          {errors.installmentCount ? (
            <FieldError id="installmentCount-error" message={errors.installmentCount} />
          ) : null}
        </div>
      ) : null}

      {overLimit ? (
        <p role="status" className="text-sm text-warm">
          {movementsContent.overLimitHint}
        </p>
      ) : null}

      {type === "conversion" ? (
        <>
          <MoneyField
            id="counterAmount"
            name="counterAmount"
            label={movementsContent.amountToLabel}
            currency={destCurrency}
            value={counterAmount}
            error={errors.counterAmount}
            pending={pending}
            onChange={(value) => {
              dispatch(patchMovementDraft({ counterAmount: value }));
              clearField("counterAmount");
            }}
            onBlur={() => formatDraftMoney("counterAmount", counterAmount)}
          />
          {rateHint ? <p className="text-sm text-muted">{rateHint}</p> : null}
        </>
      ) : null}

      {type === "ajuste" && origin ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted">
            {movementsContent.currentBalance} {formatMoney(origin.balanceCents, origin.currency)}.
          </p>
          <MoneyField
            id="observedBalance"
            name="observedBalance"
            label={movementsContent.observedLabel}
            currency={currency}
            value={observedBalance}
            hint={movementsContent.observedHint}
            error={errors.observedBalance}
            pending={pending}
            onChange={(value) => {
              dispatch(patchMovementDraft({ observedBalance: value }));
              clearField("observedBalance");
            }}
            onBlur={() => formatDraftMoney("observedBalance", observedBalance)}
          />
          {ajusteDelta !== null && ajusteDelta !== 0 ? (
            <p className="text-sm text-muted">
              {ajusteDelta > 0 ? movementsContent.differenceUp : movementsContent.differenceDown}{" "}
              {formatMoney(Math.abs(ajusteDelta), origin.currency)}.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="occurredOn" className="text-sm font-medium text-foreground">
          {movementsContent.dateLabel}
        </label>
        <input
          id="occurredOn"
          name="occurredOn"
          type="date"
          max={today}
          value={occurredOn}
          disabled={pending}
          aria-invalid={Boolean(errors.occurredOn)}
          aria-describedby={errors.occurredOn ? "occurredOn-error" : undefined}
          onChange={(event) => {
            dispatch(patchMovementDraft({ occurredOn: event.target.value }));
            clearField("occurredOn");
          }}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.occurredOn))} cursor-pointer`}
        />
        {errors.occurredOn ? (
          <FieldError id="occurredOn-error" message={errors.occurredOn} />
        ) : null}
      </div>

      {isConsumption(type) ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
            {movementsContent.categoryLabel}
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            disabled={pending}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
            onChange={(event) => {
              dispatch(patchMovementDraft({ categoryId: event.target.value }));
              clearField("categoryId");
            }}
            className={`${fieldClass} ${fieldBorder(Boolean(errors.categoryId))} cursor-pointer`}
          >
            <option value="">{movementsContent.categoryPlaceholder}</option>
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
          {errors.categoryId ? (
            <FieldError id="categoryId-error" message={errors.categoryId} />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          {type === "ajuste" ? (
            movementsContent.reasonLabel
          ) : (
            <>
              {movementsContent.notesLabel}{" "}
              <span className="font-normal text-muted">({movementsContent.notesOptional})</span>
            </>
          )}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          value={notes}
          disabled={pending}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          onChange={(event) => {
            dispatch(patchMovementDraft({ notes: event.target.value }));
            clearField("notes");
          }}
          className={`${fieldClass} ${fieldBorder(Boolean(errors.notes))} resize-y`}
        />
        {errors.notes ? <FieldError id="notes-error" message={errors.notes} /> : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? movementsContent.pending : movementsContent.submit}
      </button>
    </form>
  );
}

interface MoneyFieldProps {
  id: string;
  name: string;
  label: string;
  currency: Currency;
  value: string;
  error?: string;
  hint?: string;
  pending: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/** Labeled money input with currency prefix and Argentine separators. */
function MoneyField({
  id,
  name,
  label,
  currency,
  value,
  error,
  hint,
  pending,
  onChange,
  onBlur,
}: MoneyFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div
        className={`flex items-center rounded-2xl border bg-cream transition-colors duration-200 focus-within:ring-2 ${
          error
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-200"
            : "border-primary/15 focus-within:border-primary focus-within:ring-teal-glow/40"
        }`}
      >
        <span className="pl-4 text-sm font-medium text-muted" aria-hidden>
          {accountsContent.currencyPrefixes[currency]}
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={movementsContent.amountPlaceholder}
          disabled={pending}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hintId}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="w-full rounded-2xl bg-transparent px-3 py-3 text-base text-foreground placeholder:text-muted/60 focus:outline-none disabled:opacity-60"
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : id === "amount" ? (
        <p id="amount-hint" className="text-sm text-muted">
          {movementsContent.amountHint}
        </p>
      ) : null}
      {error ? <FieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}
