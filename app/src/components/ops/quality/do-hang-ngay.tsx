"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ActivityIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Do1, LAT_DO, type LatDo } from "@/lib/do-hang-ngay"
import { fmtInt, fmtPct } from "@/lib/format"

import { BangBoSot, BangChuyenBac, BangGiu, BangLat, BangSoCap, BangTinHieu } from "./do-hang-ngay-bang"

/**
 * Khối «Đo hằng ngày» (DO1) trên /ops/quality: giữ nháp tuần này so tuần trước, bỏ sót, tín hiệu không cần nhãn, dòng
 * chuyển bậc, so cặp trước/sau; chọn lát Tổng · Thị trường · Phường/xã · Dự án · Toà (`?lat-do=`). Số tính sẵn ở pipeline.
 */

const MO_TA = "Số có neo theo nháp: chỉ so tuần với tuần và so các cách đọc với nhau, không phải độ đúng."
/** Chiều của từng nhóm số ứng với một lát (mẫu soát lát dự án theo chữ bài). */
const CHIEU: Record<Exclude<LatDo, "tong">, { giu: string; tin: string; bac: string }> = {
  thi_truong: { giu: "thi_truong", tin: "thi_truong", bac: "thi_truong" },
  phuong: { giu: "phuong", tin: "phuong", bac: "phuong" },
  du_an: { giu: "du_an_theo_chu", tin: "du_an", bac: "du_an" },
  toa: { giu: "toa", tin: "toa", bac: "toa" },
}

export function DoHangNgaySkeleton() {
  return (
    <Frame variant="default" spacing="sm" className="w-full" data-do1-loading="">
      <FrameHeader><FrameTitle>Đo hằng ngày</FrameTitle></FrameHeader>
      <FramePanel className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </FramePanel>
    </Frame>
  )
}

function TrongDo1() {
  return (
    <Empty data-do1-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon"><ActivityIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Chưa có số đo hằng ngày</EmptyTitle>
        <EmptyDescription>
          Bước đo chạy sau chạy đêm. Chạy tay ở máy thu: <code className="font-mono text-xs">node pipeline/do-hang-ngay.mjs --write</code>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function DoHangNgay({ data, lat, areaNames = {} }: { data: Do1 | null; lat: LatDo; areaNames?: Record<string, string> }) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const chonLat = (v: string) => {
    const p = new URLSearchParams(params?.toString())
    if (v === "tong") p.delete("lat-do")
    else p.set("lat-do", v)
    router.replace(`${path}${p.size ? `?${p}` : ""}`, { scroll: false })
  }
  const soat = data?.giuNhap?.ty_le_soat?.tuan_nay
  const bac = data?.chuyenBac
  const c = lat === "tong" ? null : CHIEU[lat]
  return (
    <Frame variant="default" spacing="sm" className="w-full" data-do1="">
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <FrameTitle>Đo hằng ngày</FrameTitle>
          <FrameDescription className="text-xs">{MO_TA}</FrameDescription>
        </div>
        <Tabs value={lat} onValueChange={(v) => chonLat(String(v))}>
          <TabsList variant="line" className="no-scrollbar max-w-full justify-start gap-5 overflow-x-auto">
            {LAT_DO.map((l) => (
              <TabsTrigger key={l.value} value={l.value} className="flex-none px-1 text-sm">{l.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </FrameHeader>
      {!data ? <FramePanel><TrongDo1 /></FramePanel> : null}
      {data?.giuNhap?.canh_bao_soat ? (
        <FramePanel>
          <Alert variant="warning" data-do1-canh-bao-soat="">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Mới soát {fmtInt(soat?.soat ?? 0)}/{fmtInt(soat?.rut ?? 0)} thẻ tuần này ({fmtPct(soat?.ty_le ?? null)})</AlertTitle>
            <AlertDescription>Dưới 70% thì số giữ nháp có thể đẹp giả vì thẻ khó bị bỏ lại.</AlertDescription>
          </Alert>
        </FramePanel>
      ) : null}
      {data && !c ? (
        <>
          {data.giuNhap?.dong?.length ? <BangGiu dong={data.giuNhap.dong} /> : null}
          {data.boSot?.cach_doc?.length ? <BangBoSot dong={data.boSot.cach_doc} /> : null}
          {data.tinHieu?.cach_doc?.length ? <BangTinHieu dong={data.tinHieu.cach_doc} ngay={data.tinHieu.ngay} /> : null}
          {bac?.status === "skip" ? (
            <FramePanel><p className="text-muted-foreground text-sm" data-do1-lap-moc="">Dòng chuyển bậc: lần đầu — đã lập mốc {fmtInt(bac.don_vi ?? 0)} đơn vị, số chuyển có từ lần chạy sau.</p></FramePanel>
          ) : bac?.theo_nguon ? <BangChuyenBac theoNguon={bac.theo_nguon} /> : null}
          {data.soSanh.map((s) => (s.o ? <BangSoCap key={s.entity} entity={s.entity} cu={s.cu} o={s.o} /> : (
            <FramePanel key={s.entity}><p className="text-muted-foreground text-sm">So cặp {s.entity}: chưa so trên cùng bài.</p></FramePanel>
          )))}
        </>
      ) : null}
      {data && c ? (
        <>
          {data.giuNhap?.lat?.[c.giu] ? <BangLat title="Thẻ mẫu soát đã soát" lat={data.giuNhap.lat[c.giu]} areaNames={areaNames} /> : null}
          {data.boSot?.lat?.[c.giu] ? <BangLat title="Thẻ tin rao (mẫu bỏ sót)" lat={data.boSot.lat[c.giu]} areaNames={areaNames} /> : null}
          {data.tinHieu?.lat?.[c.tin] ? <BangLat title="Lời đọc trong ngày" lat={data.tinHieu.lat[c.tin]} areaNames={areaNames} /> : null}
          {bac?.lat?.[c.bac] ? <BangLat title="Đơn vị đổi bậc hôm nay" lat={bac.lat[c.bac]} areaNames={areaNames} /> : null}
        </>
      ) : null}
    </Frame>
  )
}
