"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cardsContent } from "@/lib/content/cards";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import type { Currency } from "@/lib/db/enums";
import type { PublicCreditCard, PublicInstallmentPurchase } from "@/features/cards/types";

interface CardInstallmentListProps {
  card: PublicCreditCard;
}

/** One row per multi-payment purchase; the schedule opens in a modal. */
export function CardInstallmentList({ card }: CardInstallmentListProps) {
  const purchases = card.installmentPurchases.filter((purchase) => purchase.count > 1);
  if (purchases.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md">
      <h2 className="text-lg font-semibold text-foreground">{cardsContent.installmentsHeading}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {purchases.map((purchase) => (
          <li key={purchase.movementId}>
            <PurchaseRow purchase={purchase} currency={card.currency} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface PurchaseRowProps {
  purchase: PublicInstallmentPurchase;
  currency: Currency;
}

/** Purchase total plus a button that opens that buy’s installment schedule. */
function PurchaseRow({ purchase, currency }: PurchaseRowProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };
  const wasOpen = useRef(false);
  const title = purchase.notes ?? purchase.categoryName ?? cardsContent.noCategory;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    const node = dialogRef.current;
    if (!open || !node) {
      return undefined;
    }
    if (!node.open) {
      node.showModal();
    }
    return () => {
      if (node.isConnected && node.open) {
        node.close();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
        wasOpen.current = false;
      }
      return undefined;
    }
    wasOpen.current = true;
    const focusClose = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(focusClose);
    };
  }, [open]);

  /** Close when the click lands on the dimmed dialog frame, not the card. */
  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      setOpen(false);
    }
  }

  const modal =
    mounted &&
    open &&
    createPortal(
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-0 h-full max-h-none w-full max-w-none cursor-pointer border-0 bg-black/50 p-4 open:flex open:items-center open:justify-center backdrop:bg-transparent"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
      >
        <motion.div
          className="flex max-h-[85vh] w-full max-w-md cursor-auto flex-col rounded-3xl border border-primary/10 bg-surface p-6 shadow-lg"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold break-words text-foreground">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {cardsContent.purchaseCount(purchase.count)} ·{" "}
                {formatMoney(purchase.totalCents, currency)}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={cardsContent.closeInstallments}
              className="cursor-pointer rounded-xl p-2 text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <ul className="mt-4 flex flex-col gap-2 overflow-y-auto pr-1">
            {purchase.installments.map((item) => {
              const paid = item.remainingCents <= 0;
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-primary/10 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {cardsContent.installmentOf(item.number, item.count)}
                      {paid ? (
                        <span className="ml-2 text-xs font-medium tracking-wide text-warm uppercase">
                          {cardsContent.paidBadge}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted">
                      {cardsContent.installmentDue} {formatIsoDateEsAr(item.dueOn)}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
                    {formatMoney(paid ? item.amountCents : item.remainingCents, currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </dialog>,
      document.body,
    );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="font-medium break-words text-foreground">{title}</p>
        <p className="text-sm text-muted">
          {cardsContent.purchaseCount(purchase.count)} · {formatIsoDateEsAr(purchase.occurredOn)}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:shrink-0 sm:items-end">
        <p className="text-base font-semibold tabular-nums text-foreground sm:text-right">
          {formatMoney(purchase.remainingCents, currency)}
        </p>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {cardsContent.viewInstallments}
        </button>
      </div>
      {modal}
    </div>
  );
}
