"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ListFilter, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LEDGER_TYPES } from "@/lib/db/enums";
import { movementsContent } from "@/lib/content/movements";
import { emptyMovementFilters, NONE_CATEGORY, type MovementFilters } from "@/features/movements/filterMovements";

const fieldClass =
  "w-full rounded-2xl border border-primary/15 bg-cream px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-teal-glow/40 focus:outline-none";

interface FilterOption {
  id: string;
  name: string;
}

interface MovementFiltersDialogProps {
  filters: MovementFilters;
  accounts: FilterOption[];
  categories: FilterOption[];
  activeCount: number;
  hideAccountFilter?: boolean;
  onApply: (next: MovementFilters) => void;
}

/** Modal with amount, account, category, type, and date filters. */
export function MovementFiltersDialog({
  filters,
  accounts,
  categories,
  activeCount,
  hideAccountFilter = false,
  onApply,
}: MovementFiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(filters);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" as const };
  const wasOpen = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        triggerRef.current?.focus();
        wasOpen.current = false;
      }
      return undefined;
    }
    wasOpen.current = true;
    setDraft(filters);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusClose = window.requestAnimationFrame(() => {
      closeRef.current?.focus();
    });
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusClose);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, filters]);

  function close() {
    setOpen(false);
  }

  function apply() {
    onApply(draft);
    setOpen(false);
  }

  function clear() {
    setDraft(emptyMovementFilters);
    onApply(emptyMovementFilters);
    setOpen(false);
  }

  const modal =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open ? (
          <div key="filters-modal" className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.button
              type="button"
              aria-label={movementsContent.filtersClose}
              className="absolute inset-0 cursor-pointer bg-primary/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              onClick={close}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-primary/10 bg-surface p-6 shadow-lg sm:max-w-lg sm:rounded-3xl"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              transition={transition}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id={titleId} className="text-lg font-semibold text-foreground">
                  {movementsContent.filtersTitle}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label={movementsContent.filtersClose}
                  className="cursor-pointer rounded-xl p-2 text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <p className="col-span-2 text-sm font-medium text-foreground">{movementsContent.amountLabel}</p>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted">{movementsContent.amountFrom}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={movementsContent.amountPlaceholder}
                      value={draft.amountMin}
                      onChange={(event) => setDraft((current) => ({ ...current, amountMin: event.target.value }))}
                      className={fieldClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted">{movementsContent.amountTo}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={movementsContent.amountPlaceholder}
                      value={draft.amountMax}
                      onChange={(event) => setDraft((current) => ({ ...current, amountMax: event.target.value }))}
                      className={fieldClass}
                    />
                  </label>
                </div>

                {hideAccountFilter ? null : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{movementsContent.filterAccountLabel}</span>
                    <select
                      value={draft.accountId}
                      onChange={(event) => setDraft((current) => ({ ...current, accountId: event.target.value }))}
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="">{movementsContent.allAccounts}</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{movementsContent.colCategory}</span>
                  <select
                    value={draft.categoryId}
                    onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="">{movementsContent.allCategories}</option>
                    <option value={NONE_CATEGORY}>{movementsContent.noCategoryOption}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{movementsContent.colType}</span>
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        type: event.target.value as MovementFilters["type"],
                      }))
                    }
                    className={`${fieldClass} cursor-pointer`}
                  >
                    <option value="">{movementsContent.allTypes}</option>
                    {LEDGER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {movementsContent.types[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{movementsContent.dateFrom}</span>
                    <input
                      type="date"
                      value={draft.dateFrom}
                      onChange={(event) => setDraft((current) => ({ ...current, dateFrom: event.target.value }))}
                      className={`${fieldClass} cursor-pointer`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{movementsContent.dateTo}</span>
                    <input
                      type="date"
                      value={draft.dateTo}
                      onChange={(event) => setDraft((current) => ({ ...current, dateTo: event.target.value }))}
                      className={`${fieldClass} cursor-pointer`}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={clear}
                  className="cursor-pointer rounded-2xl border-2 border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  {movementsContent.filtersClear}
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="cursor-pointer rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {movementsContent.filtersApply}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>,
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
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <ListFilter className="size-4" aria-hidden />
        {movementsContent.filters}
        {activeCount > 0 ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-cream">
            {activeCount}
          </span>
        ) : null}
      </button>
      {modal}
    </>
  );
}
