"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { CopyIcon, MapPinnedIcon } from "lucide-react"
import { toast } from "sonner"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { fmtInt } from "@/lib/format"
import type { DanhMucThe, TheDiaChi } from "@/lib/the-dia-chi-nhom"

import { GroupCardDialog, type LoiLuu, type QuyetDinh } from "./group-cards-dialog"
import { GroupCardsTable } from "./group-cards-table"
import { LENH_DUNG } from "./group-cards-text"

/**
 * /ops/group-cards «Thẻ địa chỉ nhóm» (TG1 the-dia-chi-nhom-s03): bảng thẻ của các nhóm S03 có bài + hộp duyệt. Chỉ ở
 * máy thu; trên cloud dừng ở cảnh báo. Ghi qua POST /api/v1/ops/group-cards (quyền unit.card_decide, vai ops).
 */
const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Thẻ địa chỉ nhóm" }]
const TITLE = "Thẻ địa chỉ nhóm"
const DESCRIPTION = "Dự án, phường, phân khu và bán hay thuê của từng nhóm S03 — máy dựng nháp từ bài đã đọc, người vận hành nhận, sửa hay bác."

export type GroupCardsProps = { mode: "cloud" } | { mode: "local"; the: TheDiaChi[]; danhMuc: DanhMucThe; coQuyet: boolean }

function ChuaCoThe() {
  return (
    <Empty className="border" data-group-cards-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPinnedIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa có thẻ nào</EmptyTitle>
        <EmptyDescription>
          Chạy lệnh dựng nháp trên máy thu: <code className="font-mono text-xs">{LENH_DUNG}</code>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            navigator.clipboard
              .writeText(LENH_DUNG)
              .then(() => toast.success("Đã chép lệnh"))
              .catch(() => toast.error("Không chép được — chọn lệnh và chép tay"))
          }
        >
          <CopyIcon data-icon="inline-start" aria-hidden="true" />
          Sao chép lệnh
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function GroupCardsView(props: GroupCardsProps) {
  const router = useRouter()
  const [mo, setMo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<LoiLuu | null>(null)
  const onOpen = useCallback((code: string) => {
    setError(null)
    setMo(code)
  }, [])

  if (props.mode === "cloud") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={CRUMBS} title={TITLE} stats={[]} description={DESCRIPTION} />
        <LocalOnlyAlert title="Chỉ ở máy thu">
          Thẻ địa chỉ nhóm chỉ nằm ở máy thu, không lên máy chủ. Mở cổng Ops trên máy thu để xem và duyệt.
        </LocalOnlyAlert>
      </div>
    )
  }
  const { the, danhMuc, coQuyet } = props
  const choDuyet = the.filter((t) => t.status === "nhap").length
  const target = the.find((t) => t.card_code === mo) ?? null
  const stats = the.length ? [`${fmtInt(the.length)} nhóm có thẻ`, `${fmtInt(choDuyet)} chờ duyệt`] : []

  async function luu(q: QuyetDinh) {
    if (!target) return
    setPending(true)
    setError(null)
    try {
      const r = await fetch("/api/v1/ops/group-cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardCode: target.card_code, version: target.version, ...q }),
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setError({ message: data.error ?? "Lỗi máy chủ", conflict: r.status === 409 })
        return
      }
      toast.success(q.card === "bac" ? `Đã bác thẻ ${target.card_code}` : `Đã duyệt thẻ ${target.card_code}`)
      setMo(null)
      router.refresh()
    } catch {
      setError({ message: "Lỗi mạng — thử lại", conflict: false })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={CRUMBS} title={TITLE} stats={stats} description={DESCRIPTION} />
      {the.length === 0 ? (
        <ChuaCoThe />
      ) : (
        <Frame spacing="default" className="w-full min-w-0">
          <FrameHeader className="flex min-w-0 flex-col gap-0.5">
            <FrameTitle role="heading" aria-level={2}>Thẻ theo nhóm</FrameTitle>
            <FrameDescription>
              {coQuyet ? "Mở «Duyệt thẻ» để nhận, sửa hay bác." : "Vai Người xem chỉ xem thẻ, không duyệt."} Nhóm chưa có trong sổ đứng cuối.
            </FrameDescription>
          </FrameHeader>
          <FramePanel>
            <GroupCardsTable rows={the} coQuyet={coQuyet} onOpen={onOpen} />
          </FramePanel>
        </Frame>
      )}
      <GroupCardDialog
        target={target}
        danhMuc={danhMuc}
        coQuyet={coQuyet}
        pending={pending}
        error={error}
        onClose={() => setMo(null)}
        onReload={() => {
          setError(null)
          router.refresh()
        }}
        onSubmit={luu}
      />
    </div>
  )
}
