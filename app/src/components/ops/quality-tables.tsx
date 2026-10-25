"use client"

import { useMemo } from "react"
import Link from "next/link"

import { Badge } from "@/components/reui/badge"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { isThin, TU_THU_DINH_NGHIA } from "@/lib/calibration"
import { fmtInt, fmtMoney, fmtPct, fmtVnDate } from "@/lib/format"
import type { AirdnaComparison, AirdnaMarketRow, TruthfulCoverageRow } from "@/lib/queries"
import { marketNameOf, s02MarketName, shortAreaName } from "@/lib/market-names"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

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

/** Độ phủ trung thực: tự thu là mẫu discovery — % này là độ sâu hiệu chuẩn
 * (mẫu ÷ active AirDNA), không phải "đã quét hết thị trường". Trung thực =
 * nói đúng con số, không tô hồng. */
function coverageBadge(ratio: number | null) {
  if (ratio === null) return <span className="text-muted-foreground">—</span>
  const pct = ratio * 100
  const variant = pct >= 5 ? "success-light" : pct >= 1 ? "outline" : "warning-light"
  return (
    <Badge variant={variant} className="tabular-nums">
      {pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`}
    </Badge>
  )
}

export function TruthfulCoverageTable({ rows, roles = {} }: { rows: TruthfulCoverageRow[]; roles?: SourceRoles }) {
  const s02 = sourceLabel("S02", roles)
  const columns = useMemo<InsightColumn<TruthfulCoverageRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (r) => shortAreaName(r.name),
        cell: ({ row }) => shortAreaName(row.original.name),
        header: ({ column }) => <DataGridColumnHeader title="Thị trường" column={column} />,
        size: 160,
        enableSorting: true,
      },
      {
        id: "our",
        accessorFn: (r) => r.ourListings,
        header: ({ column }) => <DataGridColumnHeader title="Listing tự thu" column={column} />,
        cell: ({ row }) => fmtInt(row.original.ourListings),
        size: 130,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "airdna",
        accessorFn: (r) => r.airdnaActive,
        header: ({ column }) => (
          <DataGridColumnHeader title={`${s02} — đang hoạt động`} column={column} />
        ),
        cell: ({ row }) =>
          row.original.airdnaActive
            ? `${fmtInt(row.original.airdnaActive)}${row.original.airdnaPeriod ? ` · ${row.original.airdnaPeriod}` : ""}${row.original.nMarkets > 1 ? ` · ${row.original.nMarkets} thị trường` : ""}`
            : "—",
        size: 260, // tiêu đề «<nhãn S02> — đang hoạt động» dài: hẹp hơn thì đè cột kế (E10 ON10)
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "universe",
        accessorFn: (r) => r.airdnaUniverse,
        header: ({ column }) => (
          <DataGridColumnHeader title="Số đã mua" column={column} />
        ),
        cell: ({ row }) => fmtInt(row.original.airdnaUniverse),
        size: 120,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "ratio",
        accessorFn: (r) => r.ratio ?? -1,
        header: ({ column }) => (
          <DataGridColumnHeader title="Độ phủ trung thực" column={column} />
        ),
        cell: ({ row }) => coverageBadge(row.original.ratio),
        size: 150,
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "history",
        accessorFn: (r) => r.historyMonths,
        header: ({ column }) => (
          <DataGridColumnHeader title={`Lịch sử ${s02}`} column={column} />
        ),
        cell: ({ row }) => (row.original.historyMonths ? `${row.original.historyMonths} tháng` : "—"),
        size: 190, // «Lịch sử <nhãn S02>» — cùng lý do
        meta: NUM,
        enableSorting: true,
      },
      {
        id: "captured",
        accessorFn: (r) => r.capturedAt ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Cập nhật" column={column} />,
        cell: ({ row }) =>
          fmtVnDate(row.original.capturedAt),
        size: 110,
        enableSorting: true,
      },
    ],
    [s02]
  )
  return (
    <InsightGrid
      title="Độ phủ trung thực"
      description={`Listing tự thu ÷ listing đang hoạt động ${s02} cùng thị trường (theo bảng nối S02)`}
      data={rows}
      columns={columns}
      getRowId={(r) => r.areaId}
      footnote={`${TU_THU_DINH_NGHIA}. Tự thu là mẫu dò phục vụ hiệu chuẩn (ADR/công suất lệch <20%) — tỉ lệ thấp là đúng thiết kế, không phải thiếu dữ liệu. Số đã mua = số listing ${s02} trong bản đã mua (đủ 12 tháng qua); lịch sử = chuỗi tháng đang lưu (36 tháng nguồn cung + 12 tháng ADR, công suất, doanh thu, RevPAR).`}
    />
  )
}

export function CalibrationTable({
  marketName,
  data,
  roles = {},
}: {
  marketName: string
  data: AirdnaComparison
  roles?: SourceRoles
}) {
  const s02 = sourceLabel("S02", roles)
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
        header: `${s02} (12 tháng qua)`,
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
    [s02]
  )
  const score = data.marketScore
  return (
    <InsightGrid
      title={`Hiệu chuẩn — ${marketName}`}
      description={
        score
          ? `Điểm ${s02} ${score.total} · nhu cầu ${score.rentalDemand} · tăng trưởng ${score.revenueGrowth} · mùa vụ ${score.seasonality} · quy định ${score.regulation}`
          : `Chưa có điểm ${s02}`
      }
      badge={
        <div className="flex flex-wrap items-center gap-2">
          {/* ON10: khu vực gộp nhiều market S02 → số của market đại diện; cỡ mẫu ADR/công suất < 5 → mẫu mỏng */}
          {(data.representative?.ofMarkets ?? 1) > 1 ? (
            <Badge variant="outline">{`đại diện cho ${data.representative?.ofMarkets} thị trường ${s02}`}</Badge>
          ) : null}
          {isThin(data.sampleListings ?? null) ? <Badge variant="warning-light">mẫu mỏng</Badge> : null}
          {data.capturedAt ? <Badge variant="outline">Thu {fmtVnDate(data.capturedAt)}</Badge> : null}
        </div>
      }
      data={data.metrics}
      columns={columns}
      getRowId={(r) => r.metric}
      footnote={`${TU_THU_DINH_NGHIA}. ADR, công suất tự thu = cả cửa sổ lịch đặt tương lai (bình quân theo đêm)${data.sampleListings != null ? `, từ ${fmtInt(data.sampleListings)} listing` : ""}; ${s02} = 12 tháng đã qua. Hai phương pháp khác nhau — tỉ lệ để phát hiện lệch lớn, không để thay số.`}
    />
  )
}

export function AirdnaMarketsTable({ rows, roles = {}, areaNames = {} }: { rows: AirdnaMarketRow[]; roles?: SourceRoles; areaNames?: Record<string, string> }) {
  const s02 = sourceLabel("S02", roles)
  const names = useMemo(() => new Map(Object.entries(areaNames)), [areaNames])
  const columns = useMemo<InsightColumn<AirdnaMarketRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (r) => s02MarketName(r.airdnaId, r.name).name,
        header: ({ column }) => <DataGridColumnHeader title={`Thị trường ${s02}`} column={column} />,
        size: 200,
        enableSorting: true,
      },
      {
        id: "score",
        accessorFn: (r) => r.score ?? -Infinity,
        header: ({ column }) => <DataGridColumnHeader title={`Điểm ${s02}`} column={column} />,
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
              {marketNameOf(id, names).name}
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
    [s02, names]
  )
  return (
    <InsightGrid
      title={`Thị trường ${s02} toàn quốc`}
      description="Dùng để chọn thị trường tự thu tiếp theo (G3) và kiểm tra bảng nối"
      data={rows}
      columns={columns}
      getRowId={(r) => r.airdnaId}
      initialSort={[{ id: "score", desc: true }]}
      pageSize={25}
      footnote={TU_THU_DINH_NGHIA}
    />
  )
}

/** Thị trường chưa có số nào (ON10): gộp thành một dòng thay cho hàng chục thẻ toàn «—». */
export function CalibrationEmptyLine({ names }: { names: string[] }) {
  if (names.length === 0) return null
  return <p className="text-muted-foreground text-sm">Chưa có số: {names.join(", ")}</p>
}
