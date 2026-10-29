"use client"

import { CheckIcon, MinusIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ReviewPhotos } from "@/components/ops/review-photos"
import type { FlowRecord } from "@/lib/data-flow-queries"
import type { ReviewImage } from "@/lib/ops/review-media"
import { coreFields, levelLabel, levelOf } from "@/lib/data-level"
import { fmtInt, fmtMoneyCompact, fmtVnDateTime } from "@/lib/format"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"
import { DATA_LEVEL, LABELS_VI } from "@/lib/vocab.generated"

import { LEVEL_VARIANT } from "./records-filter"

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

/** Điều kiện lên bậc kế (bản DF0: năm trường lõi cho B1, gắn căn cho B2; loại thiếu tin/hệ thống ở DF2). */
function LevelGate({ record }: { record: FlowRecord }) {
  const fields = coreFields(record)
  const missing = fields.filter((f) => !f.ok)
  const level = levelOf(record)
  const next =
    level === DATA_LEVEL.B0
      ? `Lên B1 cần đủ năm trường lõi — còn thiếu ${missing.map((f) => f.label.toLowerCase()).join(", ")}.`
      : level === DATA_LEVEL.B1
        ? "Lên B2 cần gắn được tin về một căn."
        : "Lên B3 cần số đo trên nhãn cho các trường lõi (PL7, PL9)."
  return (
    <Section title={`Trường lõi ${fields.length - missing.length}/5`}>
      <ul className="flex flex-wrap gap-1.5">
        {fields.map((f) => (
          <li key={f.key}>
            <Badge variant={f.ok ? "success-light" : "outline"}>
              {f.ok ? <CheckIcon aria-hidden="true" /> : <MinusIcon aria-hidden="true" />}
              {f.label}
              <span className="sr-only">{f.ok ? "có" : "thiếu"}</span>
            </Badge>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm text-pretty">{next}</p>
    </Section>
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

export function RecordSheet({
  record,
  roles,
  media,
  xemBaiGoc,
  cloud = false,
  onOpenChange,
}: {
  record: FlowRecord | null
  roles: SourceRoles
  /** Ảnh tin theo offer_id (chỉ admin); vắng → không hiện dải ảnh. */
  media?: Record<string, ReviewImage[]>
  /** Vai ops trở lên (xemNoiDungTin) — không thì bài gốc đã bị xoá ở máy chủ. */
  xemBaiGoc: boolean
  /** Máy chủ: bài gốc và ảnh tin chưa lên cloud (TV9) — nói rõ thay vì «không tìm thấy». */
  cloud?: boolean
  onOpenChange: (open: boolean) => void
}) {
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
                <Badge variant={LEVEL_VARIANT[levelOf(record)]}>{levelLabel(levelOf(record))}</Badge>
                <Badge variant="outline">Độ tin trích xuất {LABELS_VI.confidence[record.confidence as keyof typeof LABELS_VI.confidence] ?? record.confidence}</Badge>
              </div>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex flex-col gap-6 p-4">
                <LevelGate record={record} />
                <Separator />
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
                    <Row label="Căn" value={record.linked ? "Đã gắn" : "Chưa gắn"} muted={!record.linked} />
                    <Row label="Số bài gộp vào tin" value={fmtInt(record.nPosts)} />
                    <Row label="Lần cuối thấy" value={fmtVnDateTime(record.lastSeen)} />
                  </dl>
                </Section>
                <Separator />
                <Section title="Ảnh tin">
                  {record.source === "S06" ? (
                    <p className="text-muted-foreground text-sm">Chưa gắn được ảnh: S06 chưa lưu khoá nối ngược tin → quảng cáo (TV10).</p>
                  ) : cloud ? (
                    <p className="text-muted-foreground text-sm">Ảnh tin chỉ xem ở máy thu.</p>
                  ) : media ? (
                    <ReviewPhotos label="Tin" images={media[record.offerId] ?? []} />
                  ) : (
                    <p className="text-muted-foreground text-sm">Ảnh tin chỉ hiện cho quản trị viên.</p>
                  )}
                </Section>
                <Separator />
                <Section title="Bài gốc">
                  {cloud ? (
                    <p className="text-muted-foreground text-sm">Bài gốc chỉ xem ở máy thu.</p>
                  ) : !xemBaiGoc ? (
                    <p className="text-muted-foreground text-sm">Bài gốc chỉ hiện cho vai Vận hành trở lên.</p>
                  ) : record.postText ? (
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
