"use client"

import Link from "next/link"
import { CheckCheckIcon, InfoIcon, TagsIcon } from "lucide-react"

import { LocalOnlyAlert } from "@/components/ops/local-only-alert"
import { PageHeader } from "@/components/page/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { LAT_CUON_CHIEU } from "@/lib/labels-cuon-chieu"
import type { DoiChieu, DongTruongHop } from "@/lib/labels-luot-hai"
import { LABEL_FIELDS_NHOM } from "@/lib/labels-normalize"
import type { DongThuanTruong, NhomCuaLat, TienDo, TinGan } from "@/lib/labels-queries"
import { fmtInt, fmtVnDateTime } from "@/lib/format"

import { AnhBai } from "./anh-bai"
import { AgreementTable } from "./agreement-table"
import { BangTruongHop } from "./bang-truong-hop"
import { ChonNhom } from "./chon-nhom"
import { LabelForm } from "./label-form"
import { LabelFormNhom } from "./label-form-nhom"
import { LuotHai } from "./luot-hai"
import { MaThe } from "./ma-the"
import { NguoiDang } from "./nguoi-dang"

/**
 * /ops/labels «Gắn nhãn» (PL7 `man-gan-nhan-mu`) — khuôn danh sách-chi-tiết như /ops/review: hàng chờ ngầm (tin kế do
 * máy xếp), khung chi tiết = chữ gốc của tin + biểu mẫu chín trường. Không hiện giá trị máy nào (gắn mù, AC-4).
 * GC0: lát có nhóm thêm bộ chọn nhóm, biểu mẫu 17 trường bản D, lượt hai sau khi lưu, bảng trường hợp theo nhóm.
 */

const CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Gắn nhãn" }]
const DESCRIPTION = "Đọc chữ gốc của từng tin của lát và ghi chín trường lõi. Máy không cho thấy nó đã đọc ra gì."
const DESCRIPTION_NHOM = "Gắn theo từng nhóm: ghi điều người trong nhóm hiểu, kèm căn cứ từng ô. Lưu xong mới thấy máy đọc gì."
const DESCRIPTION_CUON_CHIEU = "Mẫu soát mỗi ngày 20 bài: máy đã điền nháp, anh giữ hoặc sửa từng ô rồi lưu. Số giữ nháp hiện ở Chất lượng dữ liệu."
/** Lát mặc định của màn và lệnh lấy mẫu của nó. */
export const LAT_THEO_NHOM = "s03-theo-nhom"

type Props =
  | { mode: "cloud"; lat: string }
  | {
      mode: "local"
      lat: string
      coGhi: boolean
      tienDo: TienDo
      dongThuan: DongThuanTruong[]
      tin: TinGan | null
      nhom?: NhomCuaLat[]
      chon?: string | null
      bang?: DongTruongHop[]
      luotHai?: DoiChieu | null
    }

function thapNhat(rows: DongThuanTruong[]): number | null {
  const co = rows.map((r) => r.tiLe).filter((v): v is number => v != null)
  return co.length ? Math.min(...co) : null
}

function LabelsEmpty({ lat }: { lat: string }) {
  if (lat === LAT_CUON_CHIEU) {
    return (
      <Empty data-labels-empty="">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TagsIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Chưa rút mẫu soát hôm nay</EmptyTitle>
          <EmptyDescription>
            Chạy lệnh rút mẫu ở máy thu rồi tải lại trang:{" "}
            <code className="font-mono text-xs">node pipeline/mau-soat-cuon-chieu.mjs</code>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <Empty data-labels-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TagsIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa có tin nào của lát để gắn</EmptyTitle>
        <EmptyDescription>
          Chạy lệnh lấy mẫu ở máy thu rồi tải lại trang:{" "}
          <code className="font-mono text-xs">
            {lat === LAT_THEO_NHOM
              ? `node pipeline/label-sample.mjs --lat ${lat} --seed <chuỗi> --theo-nhom --moi-nhom-lon 30 --moi-nhom-nho 5 --so-nhom-lon 10`
              : `node pipeline/label-sample.mjs --lat ${lat} --n 200 --seed <chuỗi>`}
          </code>
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

/** Nhóm chọn không còn bài cho người này: đã gắn hết, hoặc phần còn lại chờ người thứ hai. */
function NhomHet({ g }: { g: NhomCuaLat }) {
  return (
    <Empty data-labels-nhom-het="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckCheckIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Đã gắn hết nhóm này</EmptyTitle>
        <EmptyDescription>
          {g.choNguoiHai > 0
            ? `Anh đã gắn hết phần của mình; ${fmtInt(g.choNguoiHai)} bài chờ người thứ hai. Chọn nhóm khác ở trên.`
            : "Chọn nhóm khác ở trên, hoặc xem bảng trường hợp bên dưới."}
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
          <MaThe itemId={tin.itemId} /> · S03 · {tin.groupName ?? "nhóm không rõ"}
          <NguoiDang ten={tin.nguoiDang} id={tin.nguoiDangId} />
          {tin.postedAt ? ` · đăng ${fmtVnDateTime(tin.postedAt)}` : ""}
          {tin.doubleLabel ? " · tin gắn trùng (hai người)" : ""}
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="flex min-w-0 flex-col gap-2">
          <AnhBai anh={tin.anh} soLinkKhac={tin.soLinkKhac} coChu={Boolean(tin.text)} ghep={tin.ghep} />
          {tin.text ? (
            <p className="text-sm whitespace-pre-line wrap-anywhere" data-labels-chu-goc="">
              {tin.text}
            </p>
          ) : null}
        </div>
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
  const { lat, coGhi, tienDo: t, dongThuan, tin, nhom = [], chon = null, bang = [], luotHai = null } = props
  const theoNhom = nhom.length > 0
  const g = nhom.find((n) => n.unitCode === chon) ?? null
  const hrefNhom = (ma: string) => `/ops/labels?lat=${encodeURIComponent(lat)}&nhom=${encodeURIComponent(ma)}`
  const cuonChieu = lat === LAT_CUON_CHIEU
  const hrefLat = `/ops/labels?lat=${encodeURIComponent(lat)}`
  const min = thapNhat(dongThuan)
  const stats =
    t.tong > 0
      ? [
          `Tôi đã gắn ${fmtInt(t.cuaToi)}/${fmtInt(t.tong)} tin${theoNhom ? " của nhóm" : ""}`,
          `Cặp gắn trùng đủ hai người ${fmtInt(t.trungDu)}/${fmtInt(t.trungTong)}`,
          min == null ? "Đồng thuận: chưa đủ cặp" : `Đồng thuận thấp nhất ${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(min)}`,
        ]
      : []
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={CRUMBS}
        title="Gắn nhãn"
        stats={stats}
        description={cuonChieu ? DESCRIPTION_CUON_CHIEU : theoNhom || lat === LAT_THEO_NHOM ? DESCRIPTION_NHOM : DESCRIPTION}
        actions={theoNhom && chon ? <ChonNhom nhom={nhom} chon={chon} hrefNhom={hrefNhom} /> : undefined}
      />
      {t.tong === 0 ? <LabelsEmpty lat={lat} /> : null}
      {t.tong > 0 && !coGhi ? (
        <Alert variant="info" data-labels-viewer="">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Cần vai ops để gắn nhãn</AlertTitle>
          <AlertDescription>Vai của anh chỉ xem được số tiến độ và đồng thuận.</AlertDescription>
        </Alert>
      ) : null}
      {luotHai ? <LuotHai d={luotHai} hrefTinKe={chon ? hrefNhom(chon) : hrefLat} /> : null}
      {!luotHai && t.tong > 0 && coGhi && !tin ? g ? <NhomHet g={g} /> : <LabelsDone /> : null}
      {!luotHai && t.tong > 0 && coGhi && tin && chon ? (
        <LabelFormNhom key={tin.itemId} lat={lat} tin={tin} hrefXem={`${hrefNhom(chon)}&xem=${tin.itemId}`} hrefTinKe={hrefNhom(chon)} />
      ) : null}
      {!luotHai && t.tong > 0 && coGhi && tin && cuonChieu ? (
        <LabelFormNhom key={tin.itemId} lat={lat} tin={tin} hrefXem={`${hrefLat}&xem=${tin.itemId}`} hrefTinKe={hrefLat} />
      ) : null}
      {!luotHai && t.tong > 0 && coGhi && tin && !chon && !cuonChieu ? (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <TinFrame tin={tin} />
          <LabelForm key={tin.itemId} lat={lat} itemId={tin.itemId} />
        </div>
      ) : null}
      {theoNhom ? <BangTruongHop rows={bang} /> : null}
      {t.tong > 0 ? <AgreementTable rows={dongThuan} fields={theoNhom || cuonChieu ? LABEL_FIELDS_NHOM : undefined} /> : null}
    </div>
  )
}
