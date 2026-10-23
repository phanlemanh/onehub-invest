"use client"

import { useEffect, useRef, useState } from "react"
import { SearchIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"

export const SEARCH_ICON = <SearchIcon aria-hidden="true" />

/** Ô lọc nav, ⌘F — giữ nguyên hành vi của sidebar-search ở app-shell-36. */
export function SidebarSearch({
  query,
  onQueryChange,
  focusSignal = 0,
}: {
  query: string
  onQueryChange: (query: string) => void
  focusSignal?: number
}) {
  const { isMobile, setOpen } = useSidebar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    if (focusTick || focusSignal) inputRef.current?.focus()
  }, [focusTick, focusSignal])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "f" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        if (!isMobile) setOpen(true)
        setFocusTick((tick) => tick + 1)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMobile, setOpen])

  return (
    <InputGroup className="h-8 rounded-lg shadow-none">
      <InputGroupAddon className="pl-2.25">{SEARCH_ICON}</InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Tìm trang"
        aria-label="Tìm trang trong cổng Ops"
        aria-keyshortcuts="Meta+F Control+F"
        className="h-full pt-0.75 pb-1.25 text-sm"
      />
      <InputGroupAddon align="inline-end" aria-hidden="true" className="mr-0 pr-2.25">
        <Kbd className="rounded-md">⌘F</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}
