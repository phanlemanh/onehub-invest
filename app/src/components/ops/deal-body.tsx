import type { ReactNode } from "react"
import { InfoIcon, PhoneIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { ReviewPhotos } from "@/components/ops/review-photos"
import { DealChoGhep } from "@/components/ops/deal-cho-ghep"
import { DealSeenNote } from "@/components/ops/deal-seen-note"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type DealHang, loaiHinh, NGHI_NGO_PCT, NGUONG_LOAI_PCT, NGUONG_VAO_PCT, soPct } from "@/lib/deals-chi-tiet"
import { fmtInt, fmtVnDate } from "@/lib/format"
import { LABELS_VI } from "@/lib/vocab.generated"

export type BeMat = "sheet" | "trang"

const trM2 = (v: number | null) => (v ? `${fmtInt(v / 1e6)} tr/m²` : null)

/** Một dòng nhãn và giá trị: trong sheet mục trống ghi «chưa có» để thấy còn thiếu gì, trên trang thì không có dòng rỗng. */
function Dong({ nhan, value, beMat, children }: { nhan: string; value: string | null; beMat: BeMat; children?: ReactNode }) {
  if (!value && beMat === "trang") return null
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm" data-deal-dong={nhan}>
      <dt className="text-muted-foreground shrink-0">{nhan}</dt>
      <dd className={value ? "text-end tabular-nums wrap-anywhere" : "text-muted-foreground text-end"}>{value ? (children ?? value) : "chưa có"}</dd>
    </div>
  )
}

/** Sheet đã là một bề mặt nên chỉ cần tiêu đề; trên trang mỗi khối một Frame như /ops/people/[partyKey]. */
function Khoi({ tieuDe, beMat, children }: { tieuDe: string; beMat: BeMat; children: ReactNode }) {
  if (beMat === "sheet") {
    return (
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold tracking-tight">{tieuDe}</h3>
        {children}
      </section>
    )
  }
  return (
    <Frame spacing="default" className="w-full min-w-0">
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>{tieuDe}</FrameTitle>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
    </Frame>
  )
}

/**
 * Phần thân một căn, dùng chung cho sheet và trang `/ops/deals/<offerId>`: đủ năm câu căn nào, ở đâu, ảnh gì, vì sao giá
 * tốt, gọi ai. Dữ liệu đến đã áp vai; các điều kiện ở đây chỉ quyết có vẽ khối hay không.
 */
export function DealBody({ d, xemNoiDung, mayThu, beMat, choGhep }: {
  d: DealHang
  xemNoiDung: boolean
  mayThu: boolean
  beMat: BeMat
  /** Thẻ Ghép căn còn chờ có căn này là một vế (OD1 · ĐC7): badge + liên kết tới hàng duyệt. */
  choGhep?: number[]
}) {
  const coNoiDung = xemNoiDung && mayThu
  const trang = beMat === "trang"
  const cach = trang ? null : <Separator />

  const anh = coNoiDung && (
    <Khoi tieuDe="Ảnh" beMat={beMat}>
      {d.images.length > 0 ? <ReviewPhotos label="Căn" images={d.images} lon /> : <p className="text-muted-foreground text-sm">Chưa có ảnh.</p>}
    </Khoi>
  )
  const chuBai = coNoiDung && (
    <Khoi tieuDe="Chữ bài" beMat={beMat}>
      {d.postTextFull ? (
        <blockquote className="border-s-2 ps-3 text-sm wrap-anywhere whitespace-pre-wrap" translate="no" data-deal-chu-bai>{d.postTextFull}</blockquote>
      ) : (
        <p className="text-muted-foreground text-sm">Chưa có chữ bài.</p>
      )}
    </Khoi>
  )
  const viSao = (
    <Khoi tieuDe={d.discountPct !== null && d.discountPct >= NGUONG_VAO_PCT ? "Vì sao giá tốt" : "So với thước phường"} beMat={beMat}>
      <div className="flex flex-col gap-3">
        {d.cau && <p className="text-sm text-pretty" data-deal-chung-minh>{d.cau}</p>}
        <dl className="flex flex-col gap-2">
          <Dong nhan="Giá/m² căn này" value={trM2(d.pricePerm2)} beMat={beMat} />
          <Dong nhan="Thước phường" value={trM2(d.medianPerm2)} beMat={beMat} />
          <Dong nhan="Số tin dựng thước" value={d.rulerN ? `${fmtInt(d.rulerN)} tin S06` : null} beMat={beMat} />
          <Dong nhan="Mức giảm" value={d.discountPct === null ? null : d.discountPct < 0 ? `Đắt hơn ${soPct(d.discountPct)}%` : `${soPct(d.discountPct)}%`} beMat={beMat} />
          <Dong nhan="Ngưỡng" value={`Vào từ ${NGUONG_VAO_PCT}%, xác minh trên ${NGHI_NGO_PCT}%, loại trên ${NGUONG_LOAI_PCT}%`} beMat={beMat} />
        </dl>
      </div>
    </Khoi>
  )
  const goiAi = xemNoiDung && (
    <Khoi tieuDe="Gọi ai" beMat={beMat}>
      <div className="flex flex-col gap-3">
        <dl className="flex flex-col gap-2">
          <Dong nhan="Tên" value={d.sellerName} beMat={beMat} />
          <Dong nhan="SĐT" value={d.sdt} beMat={beMat}>
            {d.tel ? (
              <Button size="xs" variant="outline" className="tabular-nums" nativeButton={false} render={<a href={d.tel} />}>
                <PhoneIcon aria-hidden="true" />
                <span translate="no">{d.sdt}</span>
              </Button>
            ) : d.sdt}
          </Dong>
          <Dong nhan="Nhóm" value={d.groupName} beMat={beMat} />
          <Dong nhan="Số tin của người này" value={d.brokerNAds ? fmtInt(d.brokerNAds) : null} beMat={beMat} />
        </dl>
        {trang && !d.sdt && <p className="text-muted-foreground text-sm">Chưa có SĐT.</p>}
      </div>
    </Khoi>
  )
  const oDau = (
    <Khoi tieuDe="Ở đâu" beMat={beMat}>
      <dl className="flex flex-col gap-2">
        {xemNoiDung && (
          <>
            <Dong nhan="Toà" value={d.block} beMat={beMat} />
            <Dong nhan="Tầng" value={d.floor} beMat={beMat} />
            <Dong nhan="Căn" value={d.unit} beMat={beMat} />
            <Dong nhan="Đường" value={[d.streetNumber, d.street].filter(Boolean).join(" ") || null} beMat={beMat} />
          </>
        )}
        <Dong nhan="Phường" value={d.phuong} beMat={beMat}>
          <Button variant="link" size="xs" className="justify-end px-0" nativeButton={false} render={<Link prefetch={false} href={d.areaPath ?? "/vn"} />}>
            {d.phuong}
          </Button>
        </Dong>
        {xemNoiDung && <Dong nhan="Khu vực theo tin" value={d.district} beMat={beMat} />}
      </dl>
    </Khoi>
  )
  const tin = (
    <Khoi tieuDe="Thông tin tin" beMat={beMat}>
      <div className="flex flex-col gap-3">
        <dl className="flex flex-col gap-2">
          <Dong nhan="Loại hình" value={loaiHinh(d.propertyType)} beMat={beMat} />
          <Dong nhan="Diện tích" value={d.areaM2 ? `${fmtInt(d.areaM2)} m²` : null} beMat={beMat} />
          <Dong nhan="Phòng ngủ" value={d.bedrooms ? fmtInt(d.bedrooms) : null} beMat={beMat} />
          <Dong nhan="Nguồn" value={d.source} beMat={beMat} />
          <Dong nhan="Độ tin trích xuất" value={LABELS_VI.confidence[d.confidence as keyof typeof LABELS_VI.confidence] ?? d.confidence} beMat={beMat} />
          <Dong nhan="Thấy lần đầu" value={fmtVnDate(d.firstSeen)} beMat={beMat} />
          <Dong nhan="Thấy lần cuối" value={fmtVnDate(d.lastSeen)} beMat={beMat} />
          <Dong nhan="Số lần đăng" value={fmtInt(d.nReposts)} beMat={beMat} />
        </dl>
        <DealSeenNote firstSeen={d.firstSeen} nReposts={d.nReposts} />
      </div>
    </Khoi>
  )

  return (
    <div className={trang ? "flex flex-col gap-6" : "flex flex-col gap-6 p-4"}>
      <DealChoGhep ids={choGhep} lienKet />
      {d.roiDanhSach && (
        <Alert variant="info" data-deal-roi>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Đã rời danh sách</AlertTitle>
          <AlertDescription>{d.roiDanhSach}</AlertDescription>
        </Alert>
      )}
      {d.thieu.length > 0 && (
        <Alert variant="warning" data-deal-thieu>
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
      {trang ? (
        // Một cột ở màn hẹp: ảnh, vì sao, gọi ai, ở đâu, tin, chữ bài; nút gọi không bị đẩy xuống dưới chữ bài.
        <div className={coNoiDung ? "grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]" : "grid items-start gap-6 lg:grid-cols-2"}>
          {anh}
          <div className={coNoiDung ? "flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1" : "flex min-w-0 flex-col gap-6"}>
            {viSao}
            {goiAi}
            {oDau}
          </div>
          <div className={coNoiDung ? "flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-2" : "flex min-w-0 flex-col gap-6"}>
            {tin}
            {chuBai}
          </div>
        </div>
      ) : (
        <>
          {viSao}
          {anh && <>{cach}{anh}</>}
          {goiAi && <>{cach}{goiAi}</>}
          {cach}
          {oDau}
          {cach}
          {tin}
          {chuBai && <>{cach}{chuBai}</>}
        </>
      )}
    </div>
  )
}
