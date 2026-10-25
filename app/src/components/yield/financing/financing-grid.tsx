"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import {
  DataGridTable,
  DataGridTableFootRow,
  DataGridTableFootRowCell,
} from "@/components/reui/data-grid/data-grid-table"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { useTable, type ColumnDef, type ExpandedState } from "@tanstack/react-table"
import { cn } from "cn"

import { fmtPct } from "@/lib/format"
import type { FinancingLine, FinancingPlan } from "@/lib/financing"
import { ExpandCell, LabelCell, money, MonthlyCell, YearCell } from "./financing-cells"

type Col = ColumnDef<DataGridFeatures, FinancingLine>

const GRID_LINE = "border-foreground/15"

/** Mặc định mở hai mục có nhiều dòng; mục còn lại bấm để mở. */
const DEFAULT_EXPANDED: ExpandedState = { "section-expense": true, "section-debt": true }

/**
 * Dải màu của hàng mục — chép cách của @reui/data-grid-advanced-7 (trộn sẵn trên nền nên cột ghim giữ sắc).
 * Viết nguyên văn từng lớp: Tailwind chỉ sinh lớp nó đọc thấy trong mã, không sinh lớp ghép bằng hàm.
 */
const SECTION_BANDS = cn(
  "data-[row-id=section-revenue]:[&>td[class]]:bg-[color-mix(in_oklab,var(--color-emerald-500)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "data-[row-id=section-expense]:[&>td[class]]:bg-[color-mix(in_oklab,var(--color-amber-500)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "data-[row-id=section-noi]:[&>td[class]]:bg-[color-mix(in_oklab,var(--color-sky-500)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "data-[row-id=section-debt]:[&>td[class]]:bg-[color-mix(in_oklab,var(--color-violet-500)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "data-[row-id=section-cash]:[&>td[class]]:bg-[color-mix(in_oklab,var(--color-orange-500)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "data-[row-id=section-lt]:[&>td[class]]:bg-[color-mix(in_oklab,var(--muted)_10%,var(--data-grid-surface,var(--data-grid-card-surface,var(--background))))]!",
  "[&[data-row-id^=section-]]:cursor-pointer",
)

const PHONE_QUERY = "(max-width: 639px)"
const subscribePhone = (onChange: () => void) => {
  const q = window.matchMedia(PHONE_QUERY)
  q.addEventListener("change", onChange)
  return () => q.removeEventListener("change", onChange)
}
/** Điện thoại chỉ ghim nút mở + tên khoản mục, để cột số còn chỗ (như bản gốc). */
const useIsPhone = () =>
  useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false)

const TABLE_LAYOUT = { dense: true, headerSticky: true, columnsPinnable: true } as const

const TABLE_CLASS_NAMES = {
  base: "text-xs [&_tfoot_td]:bg-card [&_tfoot_td]:h-7 [&_tfoot_td]:py-0 [&_tfoot_td]:border-t",
  header: "[&_th]:bg-muted! [&_th]:h-7 [&_th]:py-0 [&_th]:font-medium [&_th]:text-foreground",
  bodyRow: cn("[&>td]:h-7 [&>td]:py-0", SECTION_BANDS),
}

function columns(horizon: number, currency: string): Col[] {
  return [
    {
      id: "expand",
      header: () => <span className="sr-only">Mở mục</span>,
      cell: ({ row }) => <ExpandCell row={row} />,
      size: 28,
      enableSorting: false,
      meta: { headerTitle: "Mở mục", headerClassName: `border-e px-0 ${GRID_LINE}`, cellClassName: `bg-muted! px-0 border-e ${GRID_LINE}` },
    },
    {
      id: "label",
      accessorFn: (r) => r.label,
      header: () => <span className="sr-only">Khoản mục</span>,
      cell: ({ row }) => <LabelCell row={row} />,
      size: 210,
      minSize: 160,
      enableSorting: false,
      meta: { headerTitle: "Khoản mục" },
    },
    {
      id: "monthly",
      accessorFn: (r) => r.monthly,
      header: "Hằng tháng",
      cell: ({ row }) => <MonthlyCell row={row} currency={currency} />,
      size: 96,
      enableSorting: false,
      meta: { headerTitle: "Hằng tháng", headerClassName: "text-end", cellClassName: "text-end" },
    },
    ...Array.from(
      { length: horizon },
      (_, year): Col => ({
        id: `year-${year}`,
        accessorFn: (r) => r.years[year] ?? null,
        header: `Năm ${year + 1}`,
        cell: ({ row }) => <YearCell row={row} year={year} currency={currency} />,
        size: 96,
        enableSorting: false,
        meta: {
          headerTitle: `Năm ${year + 1}`,
          headerClassName: `border-s text-end ${GRID_LINE}`,
          cellClassName: `border-s text-end ${GRID_LINE}`,
        },
      }),
    ),
  ]
}

/**
 * «Dòng tiền vốn vay» ở /yield — chuyển thể @reui/data-grid-advanced-7 (pro forma có mục, dòng cộng, dòng tổng
 * ghim). Khác bản gốc: chỉ đọc (tham số sửa ở form phía trên, báo cáo tính ở server từ URL nên chia sẻ được),
 * không thêm/sửa/xoá dòng, không chọn ô; cột Năm 1…5; dòng tổng là lợi nhuận trên tiền mặt bỏ ra.
 */
export function FinancingGrid({ plan, currency, horizon }: { plan: FinancingPlan; currency: string; horizon: number }) {
  const [expanded, setExpanded] = useState<ExpandedState>(DEFAULT_EXPANDED)
  const isPhone = useIsPhone()
  const pinned = isPhone ? ["expand", "label"] : ["expand", "label", "monthly"]
  const cols = useMemo(() => columns(horizon, currency), [horizon, currency])
  const table = useTable({
    features: dataGridFeatures,
    columns: cols,
    data: plan.rows,
    getRowId: (r: FinancingLine) => r.id,
    getSubRows: (r: FinancingLine) => r.subRows,
    getRowCanExpand: (row: { original: FinancingLine }) => Boolean(row.original.subRows?.length),
    state: { expanded, columnPinning: { start: pinned, end: [] } },
    onExpandedChange: setExpanded,
    autoResetExpanded: false,
    paginateExpandedRows: false,
    manualPagination: true,
  })
  const foot = [...table.getStartVisibleLeafColumns(), ...table.getCenterVisibleLeafColumns()]

  return (
    <section id="financing" aria-labelledby="financing-title" className="scroll-mt-20">
      <DataGrid
        table={table}
        recordCount={plan.rows.length}
        onRowClick={(row) => {
          if (row.level !== "section" || !row.subRows?.length) return
          setExpanded((cur) => {
            const open = cur === true ? Object.fromEntries(plan.rows.map((r) => [r.id, true])) : { ...cur }
            return { ...open, [row.id]: !open[row.id] }
          })
        }}
        tableLayout={TABLE_LAYOUT}
        tableClassNames={TABLE_CLASS_NAMES}
      >
        <Frame dense spacing="default" className="w-full">
          <FrameHeader>
            <FrameTitle id="financing-title">Dòng tiền vốn vay</FrameTitle>
            <FrameDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="tabular-nums">Khoản vay {money(plan.loan, currency)}</span>
              <span className="tabular-nums">Trả nợ {money(plan.payment, currency)}/tháng</span>
              <span className="tabular-nums">Tiền mặt bỏ ra {money(plan.cashInvested, currency)}</span>
              <span className="tabular-nums">Dòng tiền / tiền mặt năm 1: {fmtPct(plan.cashOnCash[0] ?? 0)}</span>
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="p-0">
            <DataGridContainer>
              <DataGridScrollArea>
                <DataGridTable
                  footerContent={
                    <DataGridTableFootRow>
                      <DataGridTableFootRowCell
                        colSpan={foot.filter((c) => pinned.includes(c.id)).length}
                        className="text-foreground sticky start-0 ps-9"
                      >
                        <span className="text-xs font-semibold">Lợi nhuận / tiền mặt bỏ ra</span>
                      </DataGridTableFootRowCell>
                      {foot
                        .filter((c) => !pinned.includes(c.id))
                        .map((c) => {
                          const v = c.id.startsWith("year-") ? plan.totalReturn[Number(c.id.slice(5))] : undefined
                          return (
                            <DataGridTableFootRowCell
                              key={c.id}
                              className={cn("border-s text-end font-semibold tabular-nums", GRID_LINE, v !== undefined && v < 0 ? "text-destructive" : "text-foreground")}
                            >
                              {v === undefined ? null : fmtPct(v)}
                            </DataGridTableFootRowCell>
                          )
                        })}
                    </DataGridTableFootRow>
                  }
                />
              </DataGridScrollArea>
            </DataGridContainer>
            <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">
              Lợi nhuận = dòng tiền sau nợ + gốc đã trả. Tiền mặt bỏ ra = phần vốn tự có của giá mua + nội thất ban đầu.
              Chưa tính tăng giá, lạm phát, phí giao dịch.
            </p>
          </FramePanel>
        </Frame>
      </DataGrid>
    </section>
  )
}
