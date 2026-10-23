import { useEffect, useRef, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import { SearchIcon } from "lucide-react"

export const SEARCH_ICON = (
  <SearchIcon aria-hidden="true" />
)

export function SidebarSearch({
  query,
  onQueryChange,
  focusSignal = 0,
}: {
  query: string
  onQueryChange: (query: string) => void
  /** Bumped by the rail's search glyph, which lives in the other tree. */
  focusSignal?: number
}) {
  const { isMobile, setOpen } = useSidebar()
  const inputRef = useRef<HTMLInputElement>(null)
  // Bumped by the shortcut; focus lands after the sidebar has reopened and
  // its tree is no longer inert.
  const [focusTick, setFocusTick] = useState(0)

  useEffect(() => {
    if (focusTick || focusSignal) inputRef.current?.focus()
  }, [focusTick, focusSignal])

  // On mobile the field mounts with the drawer, so the shortcut runs only
  // while the drawer is open; the closed drawer leaves the browser its find.
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
      {/* 9px beside the 1px border: the design's 10px inset. */}
      <InputGroupAddon className="pl-2.25">{SEARCH_ICON}</InputGroupAddon>
      {/* 14px on phones too, as on the column (owner's call over iOS focus
            zoom); padding split 3/5 as Chromium seats the editor a pixel low. */}
      <InputGroupInput
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search"
        aria-label="Search navigation"
        aria-keyshortcuts="Meta+F Control+F"
        className="h-full pt-0.75 pb-1.25 text-sm"
      />
      {/* Hidden from the reader because it labels the shortcut above. */}
      <InputGroupAddon
        align="inline-end"
        aria-hidden="true"
        className="mr-0 pr-2.25"
      >
        <Kbd className="rounded-md">⌘F</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}