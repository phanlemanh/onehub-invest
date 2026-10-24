"use client"

import { useMemo } from "react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { type DqCheckRow, dqResult } from "@/lib/dq-checks"
import { dqCheckName, dqDetail, dqEntityLabel, type DqText } from "@/lib/dq-labels"
import { fmtVnDateTime } from "@/lib/format"

export type { DqCheckRow }

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
        // ON13: Kiểm 150 + Kết quả 160 ≤ khung 316px ở 390px; 160 đủ cho nhãn dài nhất «Thiếu số tham chiếu».
        size: 150,
        enableSorting: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Kết quả" column={column} />,
        cell: ({ row }) => {
          // Nhãn + màu theo nghĩa của từng kiểm (ON9): kiểm số tham chiếu không bao giờ «Đạt» xanh lá.
          const r = dqResult(row.original.check_name, row.original.status)
          return <Badge variant={r.variant}>{r.label}</Badge>
        },
        size: 160,
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
      description="Bản mới nhất của mỗi kiểm theo từng đối tượng, trong 7 ngày"
      data={rows}
      columns={columns}
      getRowId={(r) => `${r.check_name}|${r.entity}|${r.checked_at}`}
      initialSort={[{ id: "at", desc: true }]}
    />
  )
}
