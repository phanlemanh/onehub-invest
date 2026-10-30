"use client"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtInt, fmtVnDateTime } from "@/lib/format"

import { MoiGioiBadge } from "./people-badges"
import { AN_VOI_VIEWER } from "./people-text"

/** Bí danh đã áp quyền xem: `value` null = ẩn với vai Người xem. */
export type BiDanhHien = { kind: string; label: string; value: string | null; source: string; firstSeen: string; retired: boolean }
export type TinHien = { subjectKey: string; methodLabel: string; tierLabel: string; observedAt: string }

export type PersonProps =
  | { mode: "cloud"; partyKey: string }
  | {
      mode: "local"
      partyKey: string
      source: string
      status: string
      statusLabel: string
      moiGioi: boolean
      aliases: BiDanhHien[]
      tin: TinHien[]
      tongTin: number
      soVaiRut: number
    }

const DESCRIPTION = "Các bí danh của một người và các tin người ấy đã đăng. Chỉ đọc."

/** /ops/people/[partyKey] «Một người» — hai bảng đọc thuần dưới đầu trang. */
export function PersonView(props: PersonProps) {
  const crumbs = [{ label: "Vận hành", href: "/ops" }, { label: "Danh bạ người", href: "/ops/people" }, { label: props.partyKey }]
  if (props.mode === "cloud") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={crumbs} title="Một người" stats={[]} description={DESCRIPTION} />
        <LocalOnlyAlert title="Chỉ ở máy thu">
          Danh bạ người chỉ nằm ở máy thu, không lên máy chủ. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      </div>
    )
  }
  const { source, status, statusLabel, moiGioi, aliases, tin, tongTin, soVaiRut } = props
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={crumbs}
        title="Một người"
        stats={[source, `${fmtInt(tongTin)} tin đã đăng`, ...(status === "active" ? [] : [statusLabel])]}
        description={DESCRIPTION}
        actions={moiGioi ? <MoiGioiBadge /> : undefined}
      />
      <Frame spacing="default" className="w-full min-w-0">
        <FrameHeader>
          <FrameTitle role="heading" aria-level={2}>Bí danh</FrameTitle>
          <FrameDescription>Tên, tài khoản và SĐT băm của người này tại nguồn.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          {aliases.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Chưa có bí danh còn dùng</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Thấy từ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliases.map((a, i) => (
                  <TableRow key={`${a.kind}-${i}`} data-people-alias={a.kind}>
                    <TableCell className="text-sm">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.label}
                        {a.retired && <Badge variant="outline">Đã nghỉ</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm wrap-anywhere whitespace-normal">
                      {a.value == null ? <span className="text-muted-foreground text-xs">{AN_VOI_VIEWER}</span> : a.value}
                    </TableCell>
                    <TableCell className="text-sm" translate="no">{a.source}</TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">{fmtVnDateTime(a.firstSeen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </FramePanel>
      </Frame>
      <Frame spacing="default" className="w-full min-w-0">
        <FrameHeader>
          <FrameTitle role="heading" aria-level={2}>Tin đã đăng</FrameTitle>
          <FrameDescription data-people-vai-rut={soVaiRut}>
            {tin.length < tongTin ? `${fmtInt(tin.length)} tin mới nhất trên ${fmtInt(tongTin)}` : `${fmtInt(tongTin)} tin`}
            {soVaiRut > 0 && ` · ${fmtInt(soVaiRut)} vai đã rút không tính`}
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          {tin.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Chưa có tin nào nối về người này</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khoá tin</TableHead>
                  <TableHead>Phương pháp</TableHead>
                  <TableHead>Lớp bằng chứng</TableHead>
                  <TableHead>Ghi lúc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tin.map((t) => (
                  <TableRow key={t.subjectKey} data-people-tin="">
                    <TableCell className="font-mono text-xs" translate="no">{t.subjectKey}</TableCell>
                    <TableCell className="text-sm">{t.methodLabel}</TableCell>
                    <TableCell className="text-sm">{t.tierLabel}</TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">{fmtVnDateTime(t.observedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </FramePanel>
      </Frame>
    </div>
  )
}
