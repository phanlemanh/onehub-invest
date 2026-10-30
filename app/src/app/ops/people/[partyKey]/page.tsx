import { Suspense } from "react"
import type { Metadata } from "next"

import { PeopleSkeleton } from "@/components/ops/people/people-skeleton"
import { PersonContent } from "@/components/ops/people/person-content"
import { RegionError } from "@/components/states/region-error"
import { getSessionUser } from "@/lib/auth"
import { canAccessOps } from "@/lib/ops-access"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Một người" }

/** /ops/people/[partyKey] «Một người»: bí danh và tin đã đăng của một người trong danh bạ. Chỉ ở máy thu. */
export default async function PersonPage({ params }: { params: Promise<{ partyKey: string }> }) {
  const user = await getSessionUser()
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>
  }
  const { partyKey } = await params
  return (
    <RegionError what="người trong danh bạ">
      <Suspense fallback={<PeopleSkeleton />}>
        <PersonContent user={user} partyKey={partyKey} />
      </Suspense>
    </RegionError>
  )
}
