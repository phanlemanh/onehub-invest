"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SparklesIcon } from "lucide-react"

import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LAT_DO, type LatDo } from "@/lib/do-hang-ngay"
import { type LamGiau as LamGiauData, TEN_DUONG } from "@/lib/ops/quality-lam-giau"

import { BangKiemNguoc, BangLatKiem, BangLatThayDoi, BangThayDoi, type DotBienLamGiau, latKiem, latThayDoi } from "./lam-giau-bang"

/**
 * Khối «Làm giàu» (DO3) trên /ops/quality, dưới «Đo hằng ngày»: mỗi đường làm giàu một hàng — thêm, đổi, máy rút, người sửa,
 * người rút (ngày đo mới nhất + 7 ngày) — và kiểm ngược tuần này so tuần trước (tỉ lệ đúng, cận dưới Wilson, n). Lát dùng
 * chung `?lat-do=` với khối DO1. Số tính sẵn ở pipeline/do-lam-giau.mjs.
 */

const MO_TA = "Giá trị máy thêm vào tin: thay đổi mỗi ngày và độ đúng kiểm ngược mỗi tuần."

export function LamGiauSkeleton() {
  return (
    <Frame variant="default" spacing="sm" className="w-full" data-do3-loading="">
      <FrameHeader><FrameTitle>Làm giàu</FrameTitle></FrameHeader>
      <FramePanel className="flex flex-col gap-2" role="status" aria-label="Đang tải số làm giàu">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </FramePanel>
      <FramePanel className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </FramePanel>
    </Frame>
  )
}

function TrongLamGiau() {
  return (
    <Empty data-do3-empty="">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SparklesIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Chưa có số đo làm giàu</EmptyTitle>
        <EmptyDescription>
          Bước đo chạy sau chạy đêm. Chạy tay ở máy thu: <code className="font-mono text-xs">node pipeline/do-lam-giau.mjs --write</code>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function LamGiau({ data, lat, areaNames = {}, dotBien }: {
  data: LamGiauData | null; lat: LatDo; areaNames?: Record<string, string>; dotBien?: DotBienLamGiau
}) {
  const router = useRouter()
  const path = usePathname()
  const params = useSearchParams()
  const chonLat = (v: string) => {
    const p = new URLSearchParams(params?.toString())
    if (v === "tong") p.delete("lat-do")
    else p.set("lat-do", v)
    router.replace(`${path}${p.size ? `?${p}` : ""}`, { scroll: false })
  }
  const chieu = lat === "tong" ? null : lat
  const nhan = LAT_DO.find((l) => l.value === lat)?.label ?? ""
  const rowsNgay = data && chieu ? latThayDoi(data.duong, chieu) : []
  const rowsKiem = data && chieu ? latKiem(data.duong, chieu) : []
  const chuaChay = data?.duong.filter((d) => d.homNay?.ly_do === "chua-chay").map((d) => TEN_DUONG[d.duong] ?? d.duong) ?? []
  return (
    <Frame variant="default" spacing="sm" className="w-full" data-do3="">
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <FrameTitle>Làm giàu</FrameTitle>
          <FrameDescription className="text-xs">{MO_TA}</FrameDescription>
        </div>
        <Tabs value={lat} onValueChange={(v) => chonLat(String(v))} className="min-w-0 max-w-full">
          <TabsList variant="line" className="no-scrollbar relative max-w-full justify-start gap-5 overflow-x-auto">
            {LAT_DO.map((l) => (
              <TabsTrigger key={l.value} value={l.value} className="flex-none px-1 text-sm">{l.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </FrameHeader>
      {!data ? <FramePanel><TrongLamGiau /></FramePanel> : null}
      {data && !chieu ? (
        <>
          <BangThayDoi duong={data.duong} ngay={data.ngay} dotBien={dotBien} />
          <BangKiemNguoc duong={data.duong} tuan={data.tuanNay} />
        </>
      ) : null}
      {data && chieu && !rowsNgay.length && !rowsKiem.length ? (
        <FramePanel>
          <Empty data-do3-lat-trong="">
            <EmptyHeader>
              <EmptyTitle>Lát này chưa có số</EmptyTitle>
              <EmptyDescription>Bước đo chưa ghi phân rã cho lát này. Chọn «Tổng» hoặc chạy lại bước đo ở máy thu.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </FramePanel>
      ) : null}
      {data && chieu && rowsNgay.length ? <BangLatThayDoi rows={rowsNgay} nhan={nhan} areaNames={areaNames} /> : null}
      {data && chieu && rowsKiem.length ? <BangLatKiem rows={rowsKiem} nhan={nhan} areaNames={areaNames} /> : null}
      {data && chieu && chuaChay.length ? (
        <FramePanel>
          <p className="text-muted-foreground text-sm">{chuaChay.join(", ")}: chưa chạy, không có phân rã.</p>
        </FramePanel>
      ) : null}
    </Frame>
  )
}
