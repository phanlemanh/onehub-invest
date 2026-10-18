"use client"

import { useMemo } from "react"
import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format"
import type { AirdnaComparison, AirdnaMarketRow } from "@/lib/queries"

const NUM = { headerClassName: "text-end", cellClassName: "text-end tabular-nums" }

type CompareRow = AirdnaComparison["metrics"][number]

/** Giá trị theo đơn vị của dòng: % (0–1 hoặc 0–100), số đếm, hay VND. */
function valueOf(v: number | null, unit: string) {
  if (v === null) return "—"
  if (unit === "%") return fmtPct(v > 1 ? v / 100 : v)
  if (unit === "") return fmtInt(v)
  return fmtMoney(v, unit)
}

/** Lệch quá 20% thì cần xem lại (ROADMAP G2: "cảnh báo lệch >20%"). */
function ratioBadge(ratio: number | null) {
  if (ratio === null) return <span className="text-muted-foreground">—</span>
  const ok = ratio >= 0.8 && ratio <= 1.2
  return (
    <Badge variant={ok ? "success-light" : "warning-light"} className="tabular-nums">
      {ratio.toFixed(2)}× · {ok ? "Khớp" : "Lệch"}
    </Badge>
  )
}

export function CalibrationTable({
  marketName,
  data,
}: {
  marketName: string
  data: AirdnaComparison
}) {
  const columns = useMemo<InsightColumn<CompareRow>[]>(
    () => [
      { id: "metric", accessorKey: "metric", header: "Chỉ số", size: 120 },
      {
        id: "ours",
        header: "Tự thu",
        cell: ({ row }) => valueOf(row.original.ourValue, row.original.ourUnit),
        size: 140,
        meta: NUM,
      },
      {
        id: "airdna",
        header: "AirDNA (12 tháng qua)",
        cell: ({ row }) => valueOf(row.original.airdnaValue, row.original.airdnaUnit),
        size: 170,
        meta: NUM,
      },
      {
        id: "ratio",
        header: "Tỉ lệ",
        cell: ({ row }) => ratioBadge(row.original.ratio),
        size: 130,
        meta: NUM,
      },
    ],
    []
  )
  const score = data.marketScore
  return (
    <InsightGrid
      title={`Hiệu chuẩn — ${marketName}`}
      description={
        score
          ? `AirDNA Market Score ${score.total} · nhu cầu ${score.rentalDemand} · tăng trưởng ${score.revenueGrowth} · mùa vụ ${score.seasonality} · quy định ${score.regulation}`
          : "Chưa có Market Score"
      }
      badge={
        data.capturedAt ? (
          <Badge variant="outline">Thu {data.capturedAt.slice(0, 10)}</Badge>
        ) : undefined
      }
      data={data.metrics}
      columns={columns}
      getRowId={(r) => r.metric}
      footnote="Tự thu = cả cửa sổ lịch đặt tương lai (bình quân theo đêm); AirDNA = 12 tháng đã qua. Hai phương pháp khác nhau — tỉ lệ để phát hiện lệch lớn, không để thay số."
    />
  )
}

export function AirdnaMarketsTable({ rows }: { rows: AirdnaMarketRow[] }) {
  const columns = useMemo<InsightColumn<AirdnaMarketRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader title="Thị trường AirDNA" column={column} />,
        size: 200,
        enableSorting: true,
      },
      {
        id: "score",
        accessorFn: (r) => r.score ?? -Infinity,
        header: ({ column }) => <DataGridColumnHeader title="Market Score" column={column} />,
        cell: ({ row }) => (row.original.score === null ? "—" : row.original.score),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "crosswalk",
        accessorFn: (r) => r.ourAreaId ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Khu vực của ta" column={column} />,
        cell: ({ row }) => {
          const id = row.original.ourAreaId
          if (!id) return <Badge variant="outline">Chưa nối</Badge>
          const [cc, ...rest] = id.split("-")
          return (
            <Link prefetch={false} href={`/${cc}/${rest.join("-")}`} className="font-medium hover:underline">
              {id}
            </Link>
          )
        },
        size: 160,
        enableSorting: true,
      },
      {
        id: "listings",
        accessorFn: (r) => r.ourListings ?? -Infinity,
        header: ({ column }) => <DataGridColumnHeader title="Listing tự thu" column={column} />,
        cell: ({ row }) => fmtInt(row.original.ourListings),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
    ],
    []
  )
  return (
    <InsightGrid
      title="Thị trường AirDNA toàn quốc"
      description="Dùng để chọn thành phố tự thu tiếp theo (G3) và kiểm tra crosswalk"
      data={rows}
      columns={columns}
      getRowId={(r) => r.airdnaId}
      initialSort={[{ id: "score", desc: true }]}
      pageSize={25}
    />
  )
}
