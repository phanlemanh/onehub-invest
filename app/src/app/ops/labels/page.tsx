import { Suspense } from "react"
import type { Metadata } from "next"

import { LabelsContent } from "@/components/ops/labels/labels-content"
import { LabelsSkeleton } from "@/components/ops/labels/labels-skeleton"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Gắn nhãn" }

/**
 * /ops/labels «Gắn nhãn» (PL7 `man-gan-nhan-mu`): người gắn đọc chữ gốc của từng tin của lát và ghi chín trường lõi,
 * KHÔNG thấy giá trị máy đã đọc ra (gắn mù); 20% tin hai người gắn để đo đồng thuận. Nhãn chỉ ở máy thu.
 * GC0 `gan-nhan-theo-nhom-s03`: lát mặc định là `s03-theo-nhom`, `?lat=` mở lát đời trước; `?nhom=` chọn nhóm; `?xem=` lượt hai.
 */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ lat?: string; nhom?: string; xem?: string }> }) {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  const { lat, nhom, xem } = await searchParams
  return (
    <RegionError what="tin để gắn nhãn">
      <Suspense fallback={<LabelsSkeleton />}>
        <LabelsContent
          user={user}
          lat={lat && /^[a-z0-9-]+$/.test(lat) ? lat : "s03-theo-nhom"}
          nhom={nhom && /^[A-Za-z0-9_-]+$/.test(nhom) ? nhom : undefined}
          xem={xem && /^\d{1,15}$/.test(xem) ? Number(xem) : undefined}
        />
      </Suspense>
    </RegionError>
  )
}
