import { Suspense } from "react"
import type { Metadata } from "next"

import { PeopleContent } from "@/components/ops/people/people-content"
import { PeopleSkeleton } from "@/components/ops/people/people-skeleton"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"
import { parsePage, parseSource } from "@/lib/ops/people"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Danh bạ người" }

/**
 * /ops/people «Danh bạ người» (`danh-ba-nguoi-tren-ops`): người đăng tin theo nguồn S0x, số tin, bí danh; 100 người mỗi
 * trang (`?source=`, `?q=`, `?page=`). Chỉ ở máy thu; vai Người xem không thấy giá trị bí danh.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; q?: string; page?: string }>
}) {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  const { source, q, page } = await searchParams
  const loc = { source: parseSource(source), q: (q ?? "").slice(0, 100), page: parsePage(page) }
  return (
    <RegionError what="danh bạ người">
      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleContent user={user} loc={loc} />
      </Suspense>
    </RegionError>
  )
}
