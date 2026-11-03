"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, InfoIcon, PhoneIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import Link from "next/link"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { ReviewPhotos } from "@/components/ops/review-photos"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { canCungTieuChi, loaiHinh, NGUONG_LOAI_PCT, NGUONG_VAO_PCT } from "@/lib/deals-chi-tiet"
import { fmtCompact, fmtInt, fmtVnDate } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

import { DealSimilar } from "./deal-similar"
import { DiscountBar, type DealHang } from "./deals-cells"

/**
 * Sheet một căn: khuôn record-sheet / review-detail-sheet của kho (đầu, thân cuộn, chân ghim), khối giá lấy ý
 * @reui/solution-crm-4. Hai tab: đủ thông tin một căn · căn cùng tiêu chí. Đầu sheet ghim giá nên đổi tab vẫn thấy căn đang xem.
 */
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className={value ? "text-end tabular-nums wrap-anywhere" : "text-muted-foreground text-end"}>{value ?? "chưa có"}</dd>
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

const trM2 = (v: number | null) => (v ? `${fmtInt(v / 1e6)} tr/m²` : null)

function ChiTiet({ d, xemNoiDung, mayThu }: { d: DealHang; xemNoiDung: boolean; mayThu: boolean }) {
  const coNoiDung = xemNoiDung && mayThu
  return (
    <div className="flex flex-col gap-6 p-4">
      {d.roiDanhSach && (
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Đã rời danh sách</AlertTitle>
          <AlertDescription>{d.roiDanhSach}</AlertDescription>
        </Alert>
      )}
      {d.thieu.length > 0 && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Còn thiếu</AlertTitle>
          <AlertDescription>{d.thieu.join(" · ")}</AlertDescription>
        </Alert>
      )}
      {!mayThu && (
        <LocalOnlyAlert title="Ảnh, chữ bài chỉ có ở máy thu">
          Máy chủ chưa giữ hai phần này, nên căn không thiếu chúng. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      )}
      {mayThu && !xemNoiDung && (
        <LocalOnlyAlert title="Ảnh, chữ bài, liên hệ dành cho vai Vận hành">
          Vai của bạn chỉ xem được số chứng minh và phường.
        </LocalOnlyAlert>
      )}
      <Section title="Vì sao giá tốt">
        {d.cau && <p className="text-sm text-pretty">{d.cau}</p>}
        <dl className="flex flex-col gap-2">
          <Row label="Giá/m² căn này" value={trM2(d.pricePerm2)} />
          <Row label="Thước phường" value={trM2(d.medianPerm2)} />
          <Row label="Số tin dựng thước" value={d.rulerN ? `${fmtInt(d.rulerN)} tin S06` : null} />
          <Row label="Ngưỡng" value={`Vào từ ${NGUONG_VAO_PCT}%, xác minh trên ${d.xacMinhPct}%, loại trên ${NGUONG_LOAI_PCT}%`} />
        </dl>
      </Section>
      {coNoiDung && (
        <>
          <Separator />
          <Section title="Ảnh">
            {d.images.length > 0 ? <ReviewPhotos label="Căn" images={d.images} lon /> : <p className="text-muted-foreground text-sm">Chưa có ảnh.</p>}
          </Section>
        </>
      )}
      <Separator />
      <Section title="Thông tin căn">
        <dl className="flex flex-col gap-2">
          <Row label="Loại hình" value={loaiHinh(d.propertyType)} />
          <Row label="Diện tích" value={d.areaM2 ? `${fmtInt(d.areaM2)} m²` : null} />
          <Row label="Phòng ngủ" value={d.bedrooms ? fmtInt(d.bedrooms) : null} />
          {xemNoiDung && (
            <>
              <Row label="Toà" value={d.block} />
              <Row label="Tầng" value={d.floor} />
              <Row label="Căn" value={d.unit} />
              <Row label="Đường" value={[d.streetNumber, d.street].filter(Boolean).join(" ") || null} />
            </>
          )}
          <Row label="Phường" value={d.phuong} />
          <Row label="Quận" value={d.district} />
        </dl>
      </Section>
      <Separator />
      <Section title="Tin">
        <dl className="flex flex-col gap-2">
          <Row label="Nguồn" value={d.source} />
          <Row label="Độ tin trích xuất" value={LABELS_VI.confidence[d.confidence as keyof typeof LABELS_VI.confidence] ?? d.confidence} />
          <Row label="Thấy lần đầu" value={fmtVnDate(d.firstSeen)} />
          <Row label="Thấy lần cuối" value={fmtVnDate(d.lastSeen)} />
          <Row label="Số lần đăng" value={fmtInt(d.nReposts)} />
        </dl>
      </Section>
      {xemNoiDung && (
        <>
          <Separator />
          <Section title="Người đăng">
            <dl className="flex flex-col gap-2">
              <Row label="Tên" value={d.sellerName} />
              <Row label="SĐT" value={d.sdt} />
              <Row label="Nhóm" value={d.groupName} />
              <Row label="Số tin của người này" value={d.brokerNAds ? fmtInt(d.brokerNAds) : null} />
            </dl>
          </Section>
        </>
      )}
      {coNoiDung && (
        <>
          <Separator />
          <Section title="Chữ bài">
            {d.postTextFull ? (
              <blockquote className="border-s-2 ps-3 text-sm break-words whitespace-pre-wrap" translate="no">{d.postTextFull}</blockquote>
            ) : (
              <p className="text-muted-foreground text-sm">Chưa có chữ bài.</p>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

export function DealSheet({ d, rows, xemNoiDung, mayThu, viTri, tong, onChuyen, onMoCan, onOpenChange }: {
  d: DealHang | null
  rows: DealHang[]
  xemNoiDung: boolean
  mayThu: boolean
  /** Vị trí trong thứ tự bảng đang thấy; −1 khi căn mở từ danh sách cùng tiêu chí nằm ngoài lọc đang bật. */
  viTri: number
  tong: number
  onChuyen: (buoc: 1 | -1) => void
  onMoCan: (id: string) => void
  onOpenChange: (open: boolean) => void
}) {
  // Giữ tab khi chuyển căn: đang duyệt so sánh thì căn kế vẫn ở tab so sánh.
  const [tab, setTab] = useState<"chi-tiet" | "cung-tieu-chi">("chi-tiet")
  const soCung = d ? canCungTieuChi(d, rows).can.length : 0
  return (
    <Sheet open={d !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        onKeyDown={(e) => {
          if (e.key === "j") onChuyen(1)
          if (e.key === "k") onChuyen(-1)
        }}
      >
        {d && (
          <>
            <SheetHeader className="gap-3 border-b pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <SheetTitle>{d.ten}</SheetTitle>
                  <SheetDescription className="text-xs tabular-nums">
                    {d.source} · thấy {fmtVnDate(d.firstSeen)} · đăng {fmtInt(d.nReposts)} lần
                  </SheetDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {viTri >= 0 && <span className="text-muted-foreground px-1 text-xs tabular-nums">{viTri + 1}/{tong}</span>}
                  <Button variant="ghost" size="icon-sm" aria-label="Căn trước (phím K)" disabled={viTri <= 0} onClick={() => onChuyen(-1)}>
                    <ChevronUpIcon aria-hidden />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Căn kế (phím J)" disabled={viTri < 0 || viTri >= tong - 1} onClick={() => onChuyen(1)}>
                    <ChevronDownIcon aria-hidden />
                  </Button>
                  <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="Đóng" />}>
                    <XIcon aria-hidden />
                  </SheetClose>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">{d.priceVnd === null ? "—" : fmtCompact(d.priceVnd)}</span>
                <span className="text-muted-foreground text-sm tabular-nums">{trM2(d.pricePerm2)}</span>
                {d.suspect && <Badge variant="warning-light">Cần xác minh</Badge>}
              </div>
              <DiscountBar d={d} />
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList variant="line" className="justify-start gap-5">
                  <TabsTrigger value="chi-tiet" className="flex-none px-1 text-sm">Chi tiết</TabsTrigger>
                  <TabsTrigger value="cung-tieu-chi" className="flex-none gap-1.5 px-1 text-sm">
                    Căn cùng tiêu chí
                    <Badge variant="outline" radius="full" className="tabular-nums">{soCung}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </SheetHeader>
            {/* key theo căn: đổi căn thì về đầu thân cuộn và trả lại trạng thái nới tiêu chí. */}
            <ScrollArea key={d.offerId} className="min-h-0 flex-1">
              {tab === "chi-tiet" ? <ChiTiet d={d} xemNoiDung={xemNoiDung} mayThu={mayThu} /> : <DealSimilar d={d} rows={rows} onMo={onMoCan} />}
            </ScrollArea>
            {xemNoiDung && (
              <SheetFooter className="flex-row items-center justify-between gap-3 border-t">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium" translate="no">{d.sellerName ?? "Người đăng chưa có tên"}</span>
                  <span className="text-muted-foreground truncate text-xs tabular-nums">{d.brokerNAds ? `${fmtInt(d.brokerNAds)} tin` : "Chưa rõ số tin"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="Mở trang một căn" nativeButton={false} render={<Link prefetch={false} href={`/ops/deals/${d.offerId}`} />}>
                    <ExternalLinkIcon aria-hidden />
                  </Button>
                  {d.tel && d.sdt ? (
                    <Button className="tabular-nums" nativeButton={false} render={<a href={d.tel} />}>
                      <PhoneIcon aria-hidden="true" />
                      <span translate="no">{d.sdt}</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa có SĐT</span>
                  )}
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
