"use client"

import Link from "next/link"
import { CheckCheckIcon, InfoIcon, TagsIcon } from "lucide-react"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { DongThuanTruong, TienDo, TinGan } from "@/lib/labels-queries"
import { fmtInt, fmtVnDateTime } from "@/lib/format"

import { AgreementTable } from "./agreement-table"
import { LabelForm } from "./label-form"

/**
 * /ops/labels «Gắn nhãn» (PL7 `man-gan-nhan-mu`) — khuôn danh sách-chi-tiết như /ops/review: hàng chờ ngầm (tin kế do
 * máy xếp), khung chi tiết = chữ gốc của tin + biểu mẫu chín trường. Không hiện giá trị máy nào (gắn mù, AC-4).
 */

const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Gắn nhãn" }]
const DESCRIPTION = "Đọc chữ gốc của từng tin của lát và ghi chín trường lõi. Máy không cho thấy nó đã đọc ra gì."

type Props =
  | { mode: "cloud"; lat: string }
  | { mode: "local"; lat: string; coGhi: boolean; tienDo: TienDo; dongThuan: DongThuanTruong[]; tin: TinGan | null }

function thapNhat(rows: DongThuanTruong[]): number | null {
  const co = rows.map((r) => r.tiLe).filter((v): v is number => v != null)
  return co.length ? Math.min(...co) : null
}

function LabelsEmpty({ lat }: { lat: string }) {
  return (
    <Empty data-labels-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TagsIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa có tin nào của lát để gắn</EmptyTitle>
        <EmptyDescription>
          Chạy lệnh lấy mẫu ở máy thu rồi tải lại trang:{" "}
          <code className="font-mono text-xs">node pipeline/label-sample.mjs --lat {lat} --n 200 --seed &lt;chuỗi&gt;</code>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function LabelsDone() {
  return (
    <Empty data-labels-done="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckCheckIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Anh đã gắn hết tin của lát</EmptyTitle>
        <EmptyDescription>
          Tin còn lại đang chờ người khác (tin gắn trùng cần hai người). Xem độ đúng của máy ở{" "}
          <Link href="/ops/quality" className="underline underline-offset-4">Chất lượng dữ liệu</Link>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function TinFrame({ tin }: { tin: TinGan }) {
  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0 lg:sticky lg:top-4" data-labels-tin={tin.itemId}>
      <FrameHeader>
        <FrameTitle>Tin cần gắn</FrameTitle>
        <FrameDescription className="text-xs text-pretty">
          S03 · {tin.groupName ?? "nhóm không rõ"}
          {tin.postedAt ? ` · đăng ${fmtVnDateTime(tin.postedAt)}` : ""}
          {tin.doubleLabel ? " · tin gắn trùng (hai người)" : ""}
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <p className="text-sm whitespace-pre-line wrap-anywhere" data-labels-chu-goc="">
          {tin.text}
        </p>
      </FramePanel>
    </Frame>
  )
}

export function LabelsView(props: Props) {
  if (props.mode === "cloud") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={CRUMBS} title="Gắn nhãn" stats={[]} description={DESCRIPTION} />
        <LocalOnlyAlert title="Chỉ ở máy thu">
          Nhãn gắn với người gắn nên không rời máy thu. Mở cổng Ops trên máy thu để gắn nhãn.
        </LocalOnlyAlert>
      </div>
    )
  }
  const { lat, coGhi, tienDo: t, dongThuan, tin } = props
  const min = thapNhat(dongThuan)
  const stats =
    t.tong > 0
      ? [
          `Tôi đã gắn ${fmtInt(t.cuaToi)}/${fmtInt(t.tong)} tin`,
          `Cặp gắn trùng đủ hai người ${fmtInt(t.trungDu)}/${fmtInt(t.trungTong)}`,
          min == null ? "Đồng thuận: chưa đủ cặp" : `Đồng thuận thấp nhất ${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(min)}`,
        ]
      : []
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={CRUMBS} title="Gắn nhãn" stats={stats} description={DESCRIPTION} />
      {t.tong === 0 ? <LabelsEmpty lat={lat} /> : null}
      {t.tong > 0 && !coGhi ? (
        <Alert variant="info" data-labels-viewer="">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Cần vai ops để gắn nhãn</AlertTitle>
          <AlertDescription>Vai của anh chỉ xem được số tiến độ và đồng thuận.</AlertDescription>
        </Alert>
      ) : null}
      {t.tong > 0 && coGhi && !tin ? <LabelsDone /> : null}
      {t.tong > 0 && coGhi && tin ? (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <TinFrame tin={tin} />
          <LabelForm key={tin.itemId} lat={lat} itemId={tin.itemId} />
        </div>
      ) : null}
      {t.tong > 0 ? <AgreementTable rows={dongThuan} /> : null}
    </div>
  )
}
