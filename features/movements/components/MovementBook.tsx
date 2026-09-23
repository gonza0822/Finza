"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { movementsContent } from "@/lib/content/movements";
import type { PublicCategory } from "@/features/categories/types";
import type { PublicMovement } from "@/features/movements/types";
import {
  accountCell,
  accountOptionsFromMovements,
  amountCell,
  flattenCategoryOptions,
} from "@/features/movements/display";
import {
  countActiveFilters,
  emptyMovementFilters,
  filterMovements,
  type MovementFilters,
} from "@/features/movements/filterMovements";
import { VoidMovementButton } from "@/features/movements/components/VoidMovementButton";
import { MovementNoteButton } from "@/features/movements/components/MovementNoteButton";
import { MovementFiltersDialog } from "@/features/movements/components/MovementFiltersDialog";

const bookFeatures = tableFeatures({});
const columnHelper = createColumnHelper<typeof bookFeatures, PublicMovement>();

const columns = columnHelper.columns([
  columnHelper.accessor("occurredOn", {
    header: movementsContent.colDate,
    cell: (info) => formatIsoDateEsAr(info.getValue()),
  }),
  columnHelper.accessor("type", {
    header: movementsContent.colType,
    cell: (info) => {
      const movement = info.row.original;
      return (
        <>
          <span>{movementsContent.types[movement.type]}</span>
          {movement.status === "anulado" ? (
            <span className="ml-2 text-xs font-medium tracking-wide text-warm uppercase">
              {movementsContent.voidedBadge}
            </span>
          ) : null}
          {movement.type === "gasto" && movement.installmentCount > 1 ? (
            <span className="ml-2 text-xs text-muted">
              {movementsContent.installmentsSuffix(movement.installmentCount)}
            </span>
          ) : null}
        </>
      );
    },
  }),
  columnHelper.accessor((row) => row.categoryName ?? movementsContent.noCategory, {
    id: "category",
    header: movementsContent.colCategory,
  }),
  columnHelper.accessor((row) => accountCell(row), {
    id: "account",
    header: movementsContent.colAccount,
  }),
  columnHelper.display({
    id: "amount",
    header: movementsContent.colAmount,
    cell: (info) => {
      const amount = amountCell(info.row.original);
      return (
        <span className={amount.tone === "in" ? "text-teal-glow" : "text-foreground"}>{amount.text}</span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">{movementsContent.colActions}</span>,
    cell: (info) =>
      info.row.original.status === "anulado" ? null : (
        <VoidMovementButton movementId={info.row.original.id} />
      ),
  }),
  columnHelper.display({
    id: "note",
    header: () => <span className="sr-only">{movementsContent.viewNote}</span>,
    cell: (info) => {
      const note = info.row.original.notes?.trim();
      if (!note) {
        return null;
      }
      return (
        <MovementNoteButton
          note={note}
          title={
            info.row.original.type === "ajuste"
              ? movementsContent.reasonLabel
              : movementsContent.notesLabel
          }
        />
      );
    },
  }),
]);

interface MovementBookProps {
  movements: PublicMovement[];
  categories: PublicCategory[];
  hideAccountFilter?: boolean;
  tableCaption?: string;
}

const headerClass: Record<string, string> = {
  occurredOn: "w-[1%] whitespace-nowrap px-5 py-3 font-medium",
  type: "w-[1%] whitespace-nowrap px-5 py-3 font-medium",
  category: "w-[1%] px-5 py-3 font-medium max-lg:whitespace-nowrap",
  account: "w-[40%] px-5 py-3 font-medium max-lg:whitespace-nowrap",
  amount: "w-[24%] px-5 py-3 text-right font-medium max-lg:whitespace-nowrap",
  actions: "w-[1%] px-3 py-3 font-medium",
  note: "w-[1%] px-4 py-3 text-right font-medium",
};

const cellClass: Record<string, string> = {
  occurredOn: "whitespace-nowrap px-5 py-3 align-middle text-foreground",
  type: "whitespace-nowrap px-5 py-3 align-middle text-foreground",
  category: "px-5 py-3 align-middle text-foreground max-lg:whitespace-nowrap",
  account: "px-5 py-3 align-middle leading-snug text-foreground max-lg:whitespace-nowrap",
  amount: "px-5 py-3 align-middle text-right font-semibold leading-snug tabular-nums max-lg:whitespace-nowrap",
  actions: "px-3 py-3 align-middle",
  note: "px-4 py-3 align-middle text-right",
};

/** Semantic book table with search, structured filters, and TanStack rows. */
export function MovementBook({
  movements,
  categories,
  hideAccountFilter = false,
  tableCaption,
}: MovementBookProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<MovementFilters>(emptyMovementFilters);

  const filtered = useMemo(
    () => filterMovements(movements, query, filters),
    [movements, query, filters],
  );
  const accounts = useMemo(() => accountOptionsFromMovements(movements), [movements]);
  const categoryOptions = useMemo(() => flattenCategoryOptions(categories), [categories]);
  const activeCount = countActiveFilters(filters);

  const table = useTable({
    features: bookFeatures,
    columns,
    data: filtered,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{movementsContent.searchLabel}</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={movementsContent.searchPlaceholder}
            autoComplete="off"
            className="w-full rounded-2xl border border-primary/15 bg-surface py-3 pr-4 pl-11 text-base text-foreground transition-colors duration-200 placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-teal-glow/40 focus:outline-none"
          />
        </label>
        <MovementFiltersDialog
          filters={filters}
          accounts={accounts}
          categories={categoryOptions}
          activeCount={activeCount}
          hideAccountFilter={hideAccountFilter}
          onApply={setFilters}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-surface/90 px-5 py-10 text-center shadow-md">
          <p className="text-base font-semibold text-foreground">{movementsContent.noResultsTitle}</p>
          <p className="mt-2 text-sm text-muted">{movementsContent.noResultsBody}</p>
        </div>
      ) : (
        <div className="grid min-w-0 max-w-full">
          <div className="min-w-0 overflow-x-auto overscroll-x-contain contain-layout rounded-3xl border border-primary/10 bg-surface/90 shadow-md">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm lg:min-w-0">
              <caption className="sr-only">{tableCaption ?? movementsContent.tableCaption}</caption>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-primary/10 text-muted">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} scope="col" className={headerClass[header.column.id] ?? "px-5 py-3"}>
                        <table.FlexRender header={header} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const voided = row.original.status === "anulado";
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-primary/5 last:border-b-0 ${voided ? "opacity-60" : ""}`}
                    >
                      {row.getAllCells().map((cell) => (
                        <td key={cell.id} className={cellClass[cell.column.id] ?? "px-5 py-3"}>
                          <table.FlexRender cell={cell} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
