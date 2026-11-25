import { Suspense } from "react"
import type { Metadata } from "next"

import { RegistryContent } from "@/components/ops/registry/registry-content"
import { RegistrySkeleton } from "@/components/ops/registry/registry-skeleton"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Danh bạ" }

/**
 * /ops/registry «Danh bạ» (`trang-danh-ba-chi-doc`): cây dự án → phân khu → toà → căn, chỉ đọc, chỉ ở máy thu. Lọc và
 * tìm chạy phía khách trên toàn bộ dự án (vài trăm nút).
 */
export default async function RegistryPage() {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  return (
    <RegionError what="danh bạ">
      <Suspense fallback={<RegistrySkeleton />}>
        <RegistryContent />
      </Suspense>
    </RegionError>
  )
}
