import { Suspense } from "react"
import type { Metadata } from "next"

import { GroupCardsContent } from "@/components/ops/group-cards/group-cards-content"
import { GroupCardsSkeleton } from "@/components/ops/group-cards/group-cards-skeleton"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Thẻ địa chỉ nhóm" }

/**
 * /ops/group-cards «Thẻ địa chỉ nhóm» (TG1 `the-dia-chi-nhom-s03`): mỗi nhóm S03 có bài một thẻ máy dựng nháp — dự án,
 * phường và tỉnh, phân khu, bán hay thuê — kèm căn cứ; vai ops trở lên nhận, sửa hay bác, viewer chỉ xem. Chỉ ở máy thu.
 */
export default async function GroupCardsPage() {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  return (
    <RegionError what="thẻ địa chỉ nhóm">
      <Suspense fallback={<GroupCardsSkeleton />}>
        <GroupCardsContent user={user} />
      </Suspense>
    </RegionError>
  )
}
