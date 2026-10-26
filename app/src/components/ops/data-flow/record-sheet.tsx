"use client"

import { XIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { FlowRecord } from "@/lib/data-flow-queries"
import { fmtInt, fmtMoneyCompact, fmtVnDateTime } from "@/lib/format"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"
import { LABELS_VI } from "@/lib/vocab.generated"

import { levelOf } from "./records-filter"

/**
 * Hồ sơ một tin (xem trước TV10) — cùng khuôn sheet chi tiết của @reui/solution-agents-5 như /ops/review: đầu = tên +
 * badge, thân cuộn = các tầng của tin. Ô chưa có dữ liệu ghi rõ «chưa có» kèm hàng lộ trình sẽ lấp nó.
 */

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground text-end" : "text-end tabular-nums"}>{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </section>
  )
}

export const recordTitle = (r: FlowRecord) =>
  [
    LABELS_VI.kind[r.kind as keyof typeof LABELS_VI.kind] ?? r.kind,
    r.priceVnd ? fmtMoneyCompact(r.priceVnd, "VND") : "chưa rõ giá",
    r.areaM2 ? `${fmtInt(r.areaM2)} m²` : null,
  ]
    .filter(Boolean)
    .join(" · ")

export function RecordSheet({ record, roles, onOpenChange }: { record: FlowRecord | null; roles: SourceRoles; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={record !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        {record && (
          <>
            <SheetHeader className="gap-2 border-b">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle>{recordTitle(record)}</SheetTitle>
                <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Đóng" />}>
                  <XIcon aria-hidden />
                </SheetClose>
              </div>
              <SheetDescription className="text-xs tabular-nums">
                {sourceLabel(record.source, roles)} · lần đầu {fmtVnDateTime(record.firstSeen)}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={record.linked ? "success-light" : "info-light"}>
                  {levelOf(record)} · {LABELS_VI.data_level[levelOf(record)]}
                </Badge>
                <Badge variant="outline">Độ tin trích xuất {LABELS_VI.confidence[record.confidence as keyof typeof LABELS_VI.confidence] ?? record.confidence}</Badge>
              </div>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-6 p-4">
                <Section title="Phân loại">
                  <dl className="flex flex-col gap-2">
                    <Row label="Loại tin" value={LABELS_VI.kind[record.kind as keyof typeof LABELS_VI.kind] ?? record.kind} />
                    <Row label="Loại hình" value={LABELS_VI.property_type[record.propertyType as keyof typeof LABELS_VI.property_type] ?? record.propertyType} />
                    <Row label="Ý định tin (Kev)" value="Chưa vào bảng · PL5" muted />
                  </dl>
                </Section>
                <Separator />
                <Section title="Trường đã đọc">
                  <dl className="flex flex-col gap-2">
                    <Row label="Giá rao" value={record.priceVnd ? fmtMoneyCompact(record.priceVnd, "VND") : "chưa có"} muted={!record.priceVnd} />
                    <Row label="Diện tích" value={record.areaM2 ? `${fmtInt(record.areaM2)} m²` : "chưa có"} muted={!record.areaM2} />
                    <Row label="Phòng ngủ" value={record.bedrooms != null ? fmtInt(record.bedrooms) : "chưa có"} muted={record.bedrooms == null} />
                    <Row label="Phường" value={record.ward ?? "chưa gắn"} muted={!record.ward} />
                    <Row label="Thị trường" value={record.market ?? "chưa gắn"} muted={!record.market} />
                  </dl>
                </Section>
                <Separator />
                <Section title="Làm giàu và căn">
                  <dl className="flex flex-col gap-2">
                    <Row label="Đề xuất làm giàu" value="Chưa có · NT6" muted />
                    <Row label="Căn" value={record.linked ? "Đã gắn (B2)" : "Chưa gắn"} muted={!record.linked} />
                    <Row label="Số bài gộp vào tin" value={fmtInt(record.nPosts)} />
                    <Row label="Lần cuối thấy" value={fmtVnDateTime(record.lastSeen)} />
                  </dl>
                </Section>
                <Separator />
                <Section title="Bài gốc">
                  {record.postText ? (
                    <div className="flex flex-col gap-2">
                      {record.postGroup ? <p className="text-muted-foreground text-xs">Nhóm {record.postGroup}</p> : null}
                      <blockquote className="border-s-2 ps-3 text-sm break-words whitespace-pre-wrap">{record.postText}</blockquote>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {record.source === "S06" ? "S06 chưa lưu khoá nối ngược tin → bài (TV10)." : "Không tìm thấy bài gốc trong bảng nạp."}
                    </p>
                  )}
                </Section>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
