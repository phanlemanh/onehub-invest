import { Fragment, useEffect, useState } from "react"
import { cn } from "cn"
import { toast } from "sonner"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import type { Page } from "./data"
import { TOAST_ERROR_ICON } from "./icons"
import { CAP_BOX } from "./value-faces"
import { CheckIcon, LinkIcon, StarIcon } from "lucide-react"

/** Copies the page address; success swaps the glyph, only failure toasts. */
function CopyLinkButton({ size }: { size: "default" | "icon" }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Frozen demo guard: ?demo=frozen pins the demo, so no timer starts.
    if (document.documentElement.dataset.demo === "frozen") return
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => setCopied(true),
      () =>
        toast.error("Copy failed", {
          description: "The browser blocked clipboard access.",
          icon: TOAST_ERROR_ICON,
        })
    )
  }

  return (
    <Button variant="outline" size={size} onClick={copy}>
      {copied ? (
        <CheckIcon data-icon="inline-start" aria-hidden="true" />
      ) : (
        <LinkIcon data-icon="inline-start" aria-hidden="true" />
      )}
      <span className={cn(CAP_BOX, "max-md:sr-only")}>Copy Link</span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </Button>
  )
}

export function AppHeader({
  page,
  loading,
  pinned,
  onTogglePin,
}: {
  page: Page
  loading: boolean
  pinned: boolean
  onTogglePin: () => void
}) {
  // Below md the actions keep their glyphs and drop to square buttons.
  const { isMobile } = useSidebar()
  const crumbs = [page.section, page.parent].filter((crumb): crumb is string =>
    Boolean(crumb)
  )

  return (
    <header className="bg-background border-input/50 flex h-12 shrink-0 items-center gap-2 border-b px-3 lg:px-4">
      {/* The sidebar row's states: ring glyph at rest, its fill and ink on
            hover, its 8px corners. */}
      <SidebarTrigger
        size="icon"
        className="text-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground -ms-1 rounded-md"
      />
      <Separator
        orientation="vertical"
        className="data-vertical:h-4 data-vertical:self-center"
      />
      {loading ? (
        <Skeleton aria-hidden="true" className="h-3.5 w-40" />
      ) : (
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb) => (
              <Fragment key={crumb}>
                <BreadcrumbItem className="max-md:hidden">
                  {crumb}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="max-md:hidden" />
              </Fragment>
            ))}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate">{page.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="ms-auto flex shrink-0 items-center gap-2">
        <Toggle
          variant="outline"
          pressed={pinned}
          onPressedChange={onTogglePin}
          aria-label={isMobile ? "Pin to sidebar" : undefined}
          className="max-md:w-8 max-md:px-0"
        >
          <StarIcon data-icon="inline-start" aria-hidden="true" className={cn(pinned && "fill-current")} />
          <span className={cn(CAP_BOX, "max-md:sr-only")}>Pin</span>
        </Toggle>
        <CopyLinkButton size={isMobile ? "icon" : "default"} />
      </div>
    </header>
  )
}