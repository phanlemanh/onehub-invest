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
 */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ lat?: string }> }) {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  const { lat } = await searchParams
  return (
    <RegionError what="tin để gắn nhãn">
      <Suspense fallback={<LabelsSkeleton />}>
        <LabelsContent user={user} lat={lat && /^[a-z0-9-]+$/.test(lat) ? lat : "ocp1"} />
      </Suspense>
    </RegionError>
  )
}
