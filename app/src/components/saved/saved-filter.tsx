"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { GitCompareIcon } from "lucide-react"

import { COMPARE_MAX } from "@/components/compare/compare-types"
import { Button } from "@/components/ui/button"

export type SavedFilter = "all" | "market" | "submarket"
export type SavedRef = { id: string; regionType: "market" | "submarket" }

const FilterContext = createContext<{ filter: SavedFilter; setFilter: (f: SavedFilter) => void } | null>(null)

/**
 * Tab lọc của Đã lưu dùng chung giữa nút So sánh trên PageHeader và lưới thẻ: header đứng
 * ngoài vùng tải số liệu (Suspense) nên hai bên không chung một component.
 */
export function SavedFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<SavedFilter>("all")
  return <FilterContext.Provider value={{ filter, setFilter }}>{children}</FilterContext.Provider>
}

export function useSavedFilter() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error("useSavedFilter cần SavedFilterProvider")
  return ctx
}

/** "So sánh N khu vực" — tối đa COMPARE_MAX khu vực đầu của tab đang chọn; ẩn khi < 2. */
export function SavedCompareButton({ areas }: { areas: SavedRef[] }) {
  const { filter } = useSavedFilter()
  const ids = areas
    .filter((a) => filter === "all" || a.regionType === filter)
    .slice(0, COMPARE_MAX)
    .map((a) => a.id)
  if (ids.length < 2) return null
  return (
    <Button nativeButton={false} render={<Link href={`/compare?areas=${ids.join(",")}`} />}>
      <GitCompareIcon data-icon="inline-start" aria-hidden="true" />
      So sánh {ids.length} khu vực
    </Button>
  )
}
