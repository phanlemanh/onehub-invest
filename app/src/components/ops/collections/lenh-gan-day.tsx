"use client"

// Vùng «Lệnh gần đây» (TV4b `tam-dung-nguon-tu-cloud`): 20 lệnh mới nhất của sổ Lệnh trên cloud, mỗi lệnh một dòng tiến
// trình tới «Đã áp lúc HH:MM» (nhãn từ hàm thuần trangThaiLenh). Lệnh S03 chờ người thứ hai có Duyệt/Từ chối cho admin
// khác người gửi. Tự tải lại mỗi 30″ khi còn lệnh chưa xong và trang đang hiện.
import { useCallback, useEffect, useMemo, useState } from "react"
import { InboxIcon } from "lucide-react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { Alert, AlertAction, AlertDescription } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vai } from "@/lib/auth"
import { BAC_VAI, DANG_CHO, trangThaiLenh, type LenhHien } from "@/lib/lenh-hien"

const TIEU_DE = "Lệnh gần đây"
const MO_TA = "Lệnh tạm dừng, bật lại nguồn và tiến trình tới khi máy thu áp xong"
const NHIP_MS = 30_000
const SO_DONG = 20

type Tai = { trang: "dang-tai" } | { trang: "loi" } | { trang: "xong"; lenh: LenhHien[]; lastPullAt: string | null }

function Khung({ children }: { children: React.ReactNode }) {
  return (
    <Frame spacing="default" className="w-full min-w-0">
      <FrameHeader className="flex flex-col gap-px">
        <FrameTitle role="heading" aria-level={3}>
          {TIEU_DE}
        </FrameTitle>
        <FrameDescription>{MO_TA}</FrameDescription>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
    </Frame>
  )
}

export function LenhGanDay({
  vai,
  actor,
  taiLai,
  onTai,
}: {
  vai: Vai
  actor: string
  taiLai: number
  onTai?: (lenh: LenhHien[], lastPullAt: string | null) => void
}) {
  const [tai, setTai] = useState<Tai>({ trang: "dang-tai" })
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Mỗi lần `lan` hay `taiLai` đổi là một lượt tải; Thử lại, nhịp 30″ và sau Duyệt chỉ tăng `lan`.
  const [lan, setLan] = useState(0)
  const taiTiep = useCallback(() => setLan((n) => n + 1), [])

  useEffect(() => {
    let huy = false
    fetch("/api/v1/ops/change-requests", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        return (await res.json()) as { commands?: LenhHien[]; last_pull_at?: string | null }
      })
      .then((body) => {
        if (huy) return
        const lenh = body.commands ?? []
        setTai({ trang: "xong", lenh, lastPullAt: body.last_pull_at ?? null })
        setNowMs(Date.now())
        onTai?.(lenh, body.last_pull_at ?? null)
      })
      .catch(() => {
        if (!huy) setTai({ trang: "loi" })
      })
    return () => {
      huy = true
    }
  }, [lan, taiLai, onTai])

  const conCho = tai.trang === "xong" && tai.lenh.some((l) => DANG_CHO.includes(l.status))
  useEffect(() => {
    if (!conCho) return
    const t = setInterval(() => {
      if (document.visibilityState !== "hidden") taiTiep()
    }, NHIP_MS)
    return () => clearInterval(t)
  }, [conCho, taiTiep])

  const quyet = useCallback(
    async (id: string, decision: "approve" | "reject") => {
      await fetch(`/api/v1/ops/change-requests/${id}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      }).catch(() => null)
      taiTiep()
    },
    [taiTiep],
  )

  const lastPullAt = tai.trang === "xong" ? tai.lastPullAt : null
  const columns = useMemo<InsightColumn<LenhHien>[]>(
    () => [
      { id: "target", accessorKey: "target", header: "Nguồn", cell: ({ row }) => <span className="font-mono">{row.original.target}</span>, size: 80 },
      {
        id: "type",
        accessorKey: "type",
        header: "Loại",
        cell: ({ row }) => (row.original.type === "source.resume" ? "Bật lại" : "Tạm dừng"),
        size: 100,
      },
      {
        id: "by",
        accessorKey: "requested_by",
        header: "Người gửi",
        cell: ({ row }) => (row.original.requested_by === actor ? "Bạn" : "Thành viên khác"),
        size: 130,
      },
      {
        id: "ly-do",
        accessorFn: (l) => (typeof l.payload?.reason === "string" ? l.payload.reason : l.note) ?? "",
        header: "Lý do",
        cell: ({ row }) => {
          const l = row.original
          const v = (typeof l.payload?.reason === "string" ? l.payload.reason : l.note) || "—"
          return <span className="line-clamp-2 min-w-0">{v}</span>
        },
        size: 220,
      },
      {
        id: "tien-trinh",
        accessorKey: "status",
        header: "Tiến trình",
        cell: ({ row }) => {
          const t = trangThaiLenh(row.original, lastPullAt, nowMs)
          return (
            <div className="flex min-w-0 flex-col items-start gap-1">
              <Badge variant={t.tone}>{t.nhan}</Badge>
              {t.truoc_sau ? <span className="text-muted-foreground text-xs">{t.truoc_sau}</span> : null}
              {t.canh ? <span className="text-muted-foreground text-xs">{t.canh}</span> : null}
            </div>
          )
        },
        size: 260,
      },
      {
        id: "duyet",
        header: "",
        cell: ({ row }) => {
          const l = row.original
          const duocDuyet =
            BAC_VAI[vai] >= BAC_VAI.admin && l.status === "submitted" && (l.target !== "S03" || l.requested_by !== actor)
          if (!duocDuyet) return null
          return (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void quyet(l.id, "approve")}>
                Duyệt
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void quyet(l.id, "reject")}>
                Từ chối
              </Button>
            </div>
          )
        },
        size: 170,
      },
    ],
    [actor, vai, lastPullAt, nowMs, quyet],
  )

  if (tai.trang === "dang-tai") {
    return (
      <Khung>
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Khung>
    )
  }
  if (tai.trang === "loi") {
    return (
      <Khung>
        <Alert variant="destructive">
          <AlertDescription>Không tải được danh sách lệnh</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={taiTiep}>
              Thử lại
            </Button>
          </AlertAction>
        </Alert>
      </Khung>
    )
  }
  if (tai.lenh.length === 0) {
    return (
      <Khung>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có lệnh nào</EmptyTitle>
            <EmptyDescription>Tạm dừng một nguồn ở bảng trên</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("suc-khoe-nguon")?.scrollIntoView({ block: "start" })}
            >
              Tới bảng Sức khoẻ nguồn
            </Button>
          </EmptyContent>
        </Empty>
      </Khung>
    )
  }
  return (
    <InsightGrid
      title={TIEU_DE}
      description={MO_TA}
      data={tai.lenh.slice(0, SO_DONG)}
      columns={columns}
      getRowId={(l) => l.id}
    />
  )
}
