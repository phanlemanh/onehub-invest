"use client"

import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, SearchXIcon, UsersIcon } from "lucide-react"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { fmtInt } from "@/lib/format"
import type { LocNguoi, TongQuan } from "@/lib/ops/people"

import { PeopleFilter } from "./people-filter"
import { LENH_DUNG, type HangNguoi } from "./people-text"
import { PeopleTable } from "./people-table"

/**
 * /ops/people «Danh bạ người» (`danh-ba-nguoi-tren-ops`) — người bán theo nguồn S0x, số tin đã đăng, bí danh; nhãn
 * môi giới là suy luận chỉ hiển thị. Chỉ ở máy thu: trên cloud trang dừng ở cảnh báo, không truy vấn danh bạ.
 */

export const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Danh bạ người" }]
const DESCRIPTION = "Người đăng tin theo từng nguồn, số tin đã đăng và các bí danh. Nhãn môi giới là suy luận, không lưu."

export type PeopleProps =
  | { mode: "cloud" }
  | {
      mode: "local"
      tong: TongQuan
      loc: LocNguoi
      rows: HangNguoi[]
      total: number
      page: number
      pages: number
    }

/** Đường dẫn giữ lọc, đổi trang. */
function trang(loc: LocNguoi, page: number): string {
  const p = new URLSearchParams()
  if (loc.source) p.set("source", loc.source)
  if (loc.q.trim()) p.set("q", loc.q.trim())
  if (page > 1) p.set("page", String(page))
  const s = p.toString()
  return s ? `/ops/people?${s}` : "/ops/people"
}

function DanhBaRong() {
  return (
    <Empty className="border" data-people-empty="danh-ba">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Danh bạ người chưa có ai</EmptyTitle>
        <EmptyDescription>
          Dựng danh bạ từ tin đã nạp bằng lệnh <code className="font-mono text-xs">{LENH_DUNG}</code> trên máy thu.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function LocRong() {
  return (
    <Empty data-people-empty="loc">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Không có người khớp bộ lọc</EmptyTitle>
        <EmptyDescription>Đổi nguồn hoặc chữ tìm, hay xem lại toàn bộ danh bạ.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/ops/people" />}>
          Xoá lọc
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export function PeopleView(props: PeopleProps) {
  if (props.mode === "cloud") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={CRUMBS} title="Danh bạ người" stats={[]} description={DESCRIPTION} />
        <LocalOnlyAlert title="Chỉ ở máy thu">
          Danh bạ người chỉ nằm ở máy thu, không lên máy chủ. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      </div>
    )
  }
  const { tong, loc, rows, total, page, pages } = props
  const stats =
    tong.nguoi > 0
      ? [
          `${fmtInt(tong.nguoi)} người đang dùng`,
          `${fmtInt(tong.vaiSong)} vai Người đăng`,
          tong.theoNguon.map((n) => `${n.source} ${fmtInt(n.nguoi)}`).join(" · "),
        ]
      : []
  return (
    <div className="flex flex-col gap-6">
      <PageHeader crumbs={CRUMBS} title="Danh bạ người" stats={stats} description={DESCRIPTION} />
      {tong.nguoi === 0 ? (
        <DanhBaRong />
      ) : (
        <Frame spacing="default" className="w-full min-w-0">
          <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <FrameTitle role="heading" aria-level={2}>Người</FrameTitle>
              <FrameDescription>Xếp theo số tin đã đăng, nhiều nhất trước.</FrameDescription>
            </div>
            <PeopleFilter sources={tong.theoNguon.map((n) => n.source)} source={loc.source} q={loc.q} />
          </FrameHeader>
          <FramePanel>{total === 0 ? <LocRong /> : <PeopleTable rows={rows} />}</FramePanel>
          {total > 0 && (
            <FrameFooter className="flex-row flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground text-sm tabular-nums" data-people-trang="">
                Trang {fmtInt(page)}/{fmtInt(pages)} · {fmtInt(total)} người khớp
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href={trang(loc, page - 1)} />}>
                    <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                    Trang trước
                  </Button>
                )}
                {page < pages && (
                  <Button variant="outline" size="sm" nativeButton={false} render={<Link href={trang(loc, page + 1)} />}>
                    Trang sau
                    <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </FrameFooter>
          )}
        </Frame>
      )}
    </div>
  )
}
