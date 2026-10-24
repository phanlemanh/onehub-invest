"use client"

import { useMemo } from "react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge, type BadgeProps } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { dqCheckName, dqDetail, dqEntityLabel, type DqText } from "@/lib/dq-labels"
import { fmtVnDateTime } from "@/lib/format"

export type DqCheckRow = {
  check_name: string
  entity: string
  status: string
  detail: string | null
  checked_at: string
}

/** Kết quả kiểm DQ → Badge trạng thái (không tô màu chữ tay). */
const RESULT: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  pass: { label: "Đạt", variant: "success-light" },
  warn: { label: "Cảnh báo", variant: "warning-light" },
  // ON12: «fail»/«skip» thô không được lên trang (smoke AC-8); nhãn trạng thái đầy đủ là phần của ON9.
  fail: { label: "Không đạt", variant: "destructive-light" },
  skip: { label: "Bỏ qua", variant: "outline" },
}

/** Câu tiếng Việt + mã gốc trong <code> khi khuôn chưa diễn giải (ON12, lib/dq-labels). */
function DqCell({ t, muted = false }: { t: DqText; muted?: boolean }) {
  return (
    <span className={muted ? "text-muted-foreground" : undefined}>
      {t.text}
      {t.code ? (
        <>
          {" "}
          <code className="font-mono text-xs">{t.code}</code>
        </>
      ) : null}
    </span>
  )
}

export function DqChecksTable({ rows, areaNames = {} }: { rows: DqCheckRow[]; areaNames?: Record<string, string> }) {
  const names = useMemo(() => new Map(Object.entries(areaNames)), [areaNames])
  const columns = useMemo<InsightColumn<DqCheckRow>[]>(
    () => [
      {
        id: "check",
        accessorFn: (r) => dqCheckName(r.check_name).text,
        header: ({ column }) => <DataGridColumnHeader title="Kiểm" column={column} />,
        cell: ({ row }) => <DqCell t={dqCheckName(row.original.check_name)} />,
        size: 190,
        enableSorting: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Kết quả" column={column} />,
        cell: ({ row }) => {
          const r = RESULT[row.original.status] ?? { label: row.original.status, variant: "destructive-light" as const }
          return <Badge variant={r.variant}>{r.label}</Badge>
        },
        size: 120,
        enableSorting: true,
      },
      { id: "entity", accessorFn: (r) => dqEntityLabel(r.entity, names).text, header: "Đối tượng", cell: ({ row }) => <DqCell t={dqEntityLabel(row.original.entity, names)} />, size: 160 },
      {
        id: "detail",
        accessorKey: "detail",
        header: "Chi tiết",
        cell: ({ row }) => <DqCell t={dqDetail(row.original.check_name, row.original.detail)} muted />,
        size: 320,
      },
      {
        id: "at",
        accessorKey: "checked_at",
        header: ({ column }) => <DataGridColumnHeader title="Lúc kiểm" column={column} />,
        cell: ({ row }) => fmtVnDateTime(row.original.checked_at),
        size: 150,
        enableSorting: true,
      },
    ],
    [names]
  )
  return (
    <InsightGrid
      title="Kiểm chất lượng (7 ngày)"
      description="Kết quả kiểm chất lượng gần nhất — từ vựng giá trị và các kiểm khác"
      data={rows}
      columns={columns}
      getRowId={(r) => `${r.check_name}|${r.entity}|${r.checked_at}`}
      initialSort={[{ id: "at", desc: true }]}
    />
  )
}
