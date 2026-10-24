"use client"

import { usePathname, useRouter } from "next/navigation"

import type { SearchEntry } from "@/lib/queries"
import { AddAreaCommand } from "./add-area-command"
import { COMPARE_MAX } from "./compare-types"

/** Nút "Thêm khu vực" của PageHeader — thêm một cột bằng cách ghi lại `?areas=` trên URL. */
export function CompareAddArea({ entries, ids }: { entries: SearchEntry[]; ids: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <AddAreaCommand
      entries={entries}
      exclude={ids}
      disabled={ids.length >= COMPARE_MAX}
      onAdd={(id) => router.replace(`${pathname}?areas=${[...ids, id].join(",")}`, { scroll: false })}
    />
  )
}
