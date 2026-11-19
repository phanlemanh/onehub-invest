import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DuAnContent } from "@/components/ops/registry/du-an-content"
import { RegistrySkeleton } from "@/components/ops/registry/registry-skeleton"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"
import { parseNodeId } from "@/lib/ops/registry/du-an"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Dự án — Danh bạ" }

/** /ops/registry/[nodeId] — một dự án của danh bạ: phân khu, toà, căn. Chỉ đọc, chỉ ở máy thu. Mã sai khuôn → 404. */
export default async function RegistryDuAnPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  const id = parseNodeId((await params).nodeId)
  if (id == null) notFound()
  return (
    <RegionError what="dự án">
      <Suspense fallback={<RegistrySkeleton nhan="Đang tải dự án" oPhu />}>
        <DuAnContent id={id} />
      </Suspense>
    </RegionError>
  )
}
