"use client"

// Khu «Sổ đơn vị thu» (PL12 so-nhom-mot-noi): mọi đơn vị thu của S02, S03, S05, S06 trong sổ collection_units — mỗi
// nguồn một lưới theo khuôn lưới nhóm thu ngay trên trang (StatusGrid, tab theo trạng thái vòng đời). Admin khai thị
// trường, dự án qua hộp (action set-meta); lưu xong mới đổi hàng, theo đúng giá trị máy chủ đã ghi. Trạng thái chỉ đọc:
// S05/S06 đổi bằng công tắc lưới nhóm thu, S03 là bản soi gateway (bật/tắt là việc của TV6). Không hiện khoá nhóm.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, CopyIcon, PencilIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import type { InsightColumn } from "@/components/insight/insight-grid"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { fmtInt } from "@/lib/format"
import type { DanhMuc, DonViRow } from "@/lib/so-don-vi"

import { SectionHeader } from "../collections/section"
import { StatusGrid, type StatusTab } from "../collections/status-grid"
import { SoDonViDialog, type KhaiChoice } from "./so-don-vi-dialog"

export const LENH_DONG_BO = "node pipeline/sync-don-vi.mjs"
const NGUON = ["S02", "S03", "S05", "S06"] as const
const NGUON_CHE = ["S05", "S06"]
const TITLE: Record<string, string> = { S02: "Market S02", S03: "Nhóm S03", S05: "Nhóm S05", S06: "Vùng S06" }
const LOAI: Record<string, string> = { nhom: "nhóm", vung: "vùng", market: "market" }
const NHAN: Record<string, string> = {
  draft: "Nháp",
  active: "Đang thu",
  paused: "Tạm dừng",
  retired: "Đã gỡ",
  completed: "Đã xong",
}
const VARIANT = { active: "success-light", paused: "warning-light" } as const
const TABS: StatusTab<DonViRow>[] = [
  { value: "active", label: "Đang thu", tone: "bg-success", match: (r) => r.status === "active" },
  { value: "paused", label: "Tạm dừng", tone: "bg-warning", match: (r) => r.status === "paused" },
  { value: "khac", label: "Đã gỡ, đã xong", tone: "bg-muted-foreground/40", match: (r) => !["active", "paused"].includes(r.status) },
]

export function SoDonVi({ rows, danhMuc, loi }: { rows: DonViRow[]; danhMuc: DanhMuc; loi: boolean }) {
  const router = useRouter()
  const [units, setUnits] = useState(rows)
  const [editing, setEditing] = useState<DonViRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (loi) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Không đọc được sổ đơn vị thu</AlertTitle>
        <AlertDescription>
          <p>Sổ chưa có ở máy này hoặc cơ sở dữ liệu đang lỗi. Thử lại sau giây lát; nếu vẫn lỗi, báo đội vận hành.</p>
        </AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RotateCwIcon data-icon="inline-start" aria-hidden="true" />
            Thử lại
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  const tenThiTruong = new Map(danhMuc.markets.map((m) => [m.id, m.name]))
  const tenDuAn = new Map(danhMuc.projects.map((p) => [p.id, p.name]))
  const danhSach = (ids: (string | number)[], ten: Map<string | number, string>) =>
    ids.length ? ids.map((x) => ten.get(x) ?? String(x)).join(", ") : "—"

  const save = (u: DonViRow, choice: KhaiChoice) => {
    setError(null)
    start(async () => {
      try {
        const r = await fetch("/api/v1/ops/source-groups", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "set-meta", unitCode: u.unit_code, ...choice }),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(data.error ?? "Lỗi máy chủ")
          return
        }
        setUnits((us) =>
          us.map((x) => (x.unit_code === u.unit_code ? { ...x, market_codes: data.market_codes, project_node_ids: data.project_node_ids } : x)),
        )
        setEditing(null)
        toast.success("Đã khai thị trường, dự án")
      } catch {
        setError("Lỗi mạng")
      }
    })
  }

  const columns: InsightColumn<DonViRow>[] = [
    {
      id: "code",
      accessorKey: "unit_code",
      header: "Mã",
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span id={`don-vi-${row.original.unit_code}`} className="font-medium tabular-nums">{row.original.unit_code}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.source_code} · {LOAI[row.original.unit_type] ?? row.original.unit_type}
          </span>
        </span>
      ),
      size: 130,
    },
    {
      id: "name",
      accessorKey: "original_name",
      header: "Tên gốc",
      // Tên nhóm S05/S06 che khi chụp ảnh như lưới nhóm thu (data-tier-a); tên nhóm S03 và market S02 là tầng C.
      cell: ({ row }) => (
        <span className="truncate" data-tier-a={NGUON_CHE.includes(row.original.source_code) ? "" : undefined}>
          {row.original.original_name}
        </span>
      ),
      size: 200,
    },
    { id: "markets", header: "Thị trường", cell: ({ row }) => danhSach(row.original.market_codes, tenThiTruong as Map<string | number, string>), size: 160 },
    { id: "projects", header: "Dự án", cell: ({ row }) => danhSach(row.original.project_node_ids, tenDuAn as Map<string | number, string>), size: 160 },
    {
      id: "status",
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <span className="flex flex-col items-start gap-0.5">
          <Badge variant={VARIANT[row.original.status as keyof typeof VARIANT] ?? "outline"}>{NHAN[row.original.status] ?? row.original.status}</Badge>
          {row.original.source_code === "S03" ? <span className="text-muted-foreground text-xs">theo gateway</span> : null}
        </span>
      ),
      size: 120,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <span className="flex justify-end">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Khai thị trường, dự án"
            aria-describedby={`don-vi-${row.original.unit_code}`}
            onClick={() => {
              setError(null)
              setEditing(row.original)
            }}
          >
            <PencilIcon aria-hidden="true" />
          </Button>
        </span>
      ),
      size: 60,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {NGUON.map((code) => {
        const list = units.filter((u) => u.source_code === code)
        const moTa = `${fmtInt(list.filter((u) => u.status === "active").length)}/${fmtInt(list.length)} đơn vị đang thu`
        const title = `Sổ đơn vị thu · ${TITLE[code]}`
        if (list.length === 0) return <SoTrong key={code} code={code} title={title} />
        return (
          <StatusGrid
            key={code}
            id={`so-${code.toLowerCase()}`}
            title={title}
            description={code === "S03" ? `${moTa} · trạng thái theo gateway` : moTa}
            data={list}
            columns={columns}
            tabs={TABS}
            getRowId={(u) => u.unit_code}
          />
        )
      })}
      <SoDonViDialog
        target={editing}
        danhMuc={danhMuc}
        pending={pending}
        error={error}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(choice) => editing && save(editing, choice)}
      />
    </div>
  )
}

/** Nguồn chưa có đơn vị: S02/S03 vào sổ bằng lệnh đồng bộ ở máy thu; S05/S06 thêm ở lưới nhóm thu phía trên. */
function SoTrong({ code, title }: { code: string; title: string }) {
  const dongBo = code === "S02" || code === "S03"
  return (
    <Frame id={`so-${code.toLowerCase()}`} spacing="default" className="w-full min-w-0">
      <SectionHeader title={title} description="0 đơn vị" />
      <FramePanel>
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyTitle>Chưa có đơn vị nào</EmptyTitle>
            <EmptyDescription>
              {dongBo ? (
                <>
                  Chạy đồng bộ sổ ở máy thu để đưa đơn vị của nguồn này vào: <code className="text-xs">{LENH_DONG_BO}</code>
                </>
              ) : (
                "Thêm nhóm ở lưới nhóm thu phía trên — nhóm mới vào sổ ngay."
              )}
            </EmptyDescription>
          </EmptyHeader>
          {dongBo ? (
            <EmptyContent>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  navigator.clipboard
                    .writeText(LENH_DONG_BO)
                    .then(() => toast.success("Đã chép lệnh"))
                    .catch(() => toast.error("Không chép được — chọn lệnh và chép tay"))
                }
              >
                <CopyIcon data-icon="inline-start" aria-hidden="true" />
                Sao chép lệnh
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      </FramePanel>
    </Frame>
  )
}
