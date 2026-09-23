"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cardsContent } from "@/lib/content/cards";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import type { PublicCreditCard, PublicInstallmentPurchase } from "@/features/cards/types";

interface DebtCompositionButtonProps {
  card: PublicCreditCard;
}

function purchaseTitle(purchase: PublicInstallmentPurchase): string {
  return purchase.notes ?? purchase.categoryName ?? cardsContent.noCategory;
}

function purchaseMeta(purchase: PublicInstallmentPurchase): string {
  const due = `${cardsContent.installmentDue} ${formatIsoDateEsAr(purchase.nextDueOn)}`;
  const countLabel =
    purchase.count > 1 ? cardsContent.purchaseCount(purchase.count) : cardsContent.singlePayment;
  const category = purchase.notes && purchase.categoryName ? purchase.categoryName : null;
  return category ? `${countLabel} · ${category} · ${due}` : `${countLabel} · ${due}`;
}

/** Opens remaining purchases that still make up this card’s debt, including 1/1. */
export function DebtCompositionButton({ card }: DebtCompositionButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };
  const wasOpen = useRef(false);

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
                {cardsContent.debtCompositionTitle}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {cardsContent.debtCompositionTotal} · {formatMoney(card.debtCents, card.currency)}
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
          {card.remainingPurchases.length === 0 && card.debtCents <= 0 ? (
            <p className="mt-4 text-sm leading-6 text-muted">{cardsContent.debtCompositionEmpty}</p>
          ) : card.remainingPurchases.length === 0 ? (
            <p className="mt-4 text-base font-semibold tabular-nums text-foreground">
              {formatMoney(card.debtCents, card.currency)}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2 overflow-y-auto pr-1">
              {card.remainingPurchases.map((purchase) => (
                <li
                  key={purchase.movementId}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-primary/10 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words text-foreground">{purchaseTitle(purchase)}</p>
                    <p className="text-sm text-muted">{purchaseMeta(purchase)}</p>
                  </div>
                  <p className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
                    {formatMoney(purchase.remainingCents, card.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </dialog>,
      document.body,
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center justify-center rounded-2xl border-2 border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {cardsContent.viewDebt}
      </button>
      {modal}
    </>
  );
}
