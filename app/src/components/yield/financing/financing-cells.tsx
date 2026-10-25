"use client"

import { type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridTableRowExpand } from "@/components/reui/data-grid/data-grid-table"
import { type Row } from "@tanstack/react-table"
import { cn } from "cn"

import { fmtMoneyCompact } from "@/lib/format"
import type { FinancingLine, FinancingSectionId } from "@/lib/financing"

type LineRow = Row<DataGridFeatures, FinancingLine>

/** Tên mục và số tổng mang sắc của mục (theo @reui/data-grid-advanced-7), dịu hơn ở nền tối. */
export const SECTION_TEXT: Record<FinancingSectionId, string> = {
  revenue: "text-emerald-700 dark:text-emerald-400",
  expense: "text-amber-700 dark:text-amber-400",
  noi: "text-sky-700 dark:text-sky-400",
  debt: "text-violet-700 dark:text-violet-400",
  cash: "text-orange-700 dark:text-orange-400",
  lt: "text-muted-foreground",
}

const FIGURE = "tabular-nums dark:text-foreground/80"

/** Tiền gọn kiểu sổ sách: «123,5 tr ₫», âm có dấu trừ thật. */
export const money = (value: number, currency: string) =>
  Math.round(value) === 0 ? "0" : fmtMoneyCompact(value, currency).replace("-", "−")

const negative = (value: number) => Math.round(value) < 0

/** Nút mở/gập riêng của mục; bấm cả hàng mục cũng mở/gập. */
export function ExpandCell({ row }: { row: LineRow }) {
  if (row.original.level !== "section" || row.subRows.length === 0) return null
  return (
    <div className="flex justify-center">
      <DataGridTableRowExpand row={row} />
    </div>
  )
}

export function LabelCell({ row }: { row: LineRow }) {
  const line = row.original
  if (line.level === "section") {
    return <span className={cn("truncate font-semibold", SECTION_TEXT[line.section])}>{line.label}</span>
  }
  return <div className="truncate ps-2">{line.label}</div>
}

function Figure({ line, value, currency }: { line: FinancingLine; value: number; currency: string }) {
  return (
    <span
      className={cn(
        FIGURE,
        line.level === "section" && "font-semibold",
        line.level === "section" && SECTION_TEXT[line.section],
        line.signed && negative(value) && "text-destructive",
      )}
    >
      {money(value, currency)}
    </span>
  )
}

export function MonthlyCell({ row, currency }: { row: LineRow; currency: string }) {
  const line = row.original
  return line.monthly === null ? null : <Figure line={line} value={line.monthly} currency={currency} />
}

export function YearCell({ row, year, currency }: { row: LineRow; year: number; currency: string }) {
  const line = row.original
  const value = line.years[year]
  return value === undefined ? null : <Figure line={line} value={value} currency={currency} />
}
