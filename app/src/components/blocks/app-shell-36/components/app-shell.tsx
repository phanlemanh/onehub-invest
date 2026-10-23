"use client"

// Observability console shell: the shadcn sidebar (open on desktop, an icon
// rail on tablets, a drawer on phones), one header with breadcrumbs and
// actions, and the same content skeleton under every page.
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react"
import { toast } from "sonner"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import { AppHeader } from "./app-header"
import { AppRail } from "./app-rail"
import { AppSidebar } from "./app-sidebar"
import { ContentSkeleton } from "./content-skeleton"
import { DEFAULT_PAGE, DEFAULT_PINNED, PAGES, WORKSPACES } from "./data"
import { useDemoState } from "./demo-state"
import { TOAST_SUCCESS_ICON } from "./icons"
import { EmptyWorkspace, LoadError } from "./page-states"
import type { AccountAction } from "./user-menu"

/** Host callbacks: the demo keeps its own state, these hand it to your app. */
export type AppShellProps = {
  /** A page was opened from the nav, a pin or a state's action. */
  onNavigate?: (pageId: string) => void
  /** New Workspace in the workspace menu: open your create flow. */
  onCreateWorkspace?: () => void
  /** Account menu items that leave the console (security, roster, help). */
  onAccountAction?: (action: AccountAction) => void
  onSignOut?: () => void
}

const DEMO_STATES = ["empty", "error", "loading"] as const

// Two steps wider than app-shell-24's 208px; the icon rail and drawer keep theirs.
const SHELL_STYLE = { "--sidebar-width": "240px" } as CSSProperties

// The sidebar opens from lg; tablets start on the icon rail.
const DESKTOP_QUERY = "(min-width: 64rem)"
// The md edge where the drawer gives way to the rail.
const TABLET_QUERY = "(min-width: 48rem)"

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  )
}

function Console({
  onNavigate,
  onCreateWorkspace,
  onAccountAction,
  onSignOut,
}: AppShellProps) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar()
  // Bumped by the rail's search glyph, which sits in the other tree.
  const [focusSignal, setFocusSignal] = useState(0)
  // customize: swap for your router and your saved pins.
  const [workspaceId, setWorkspaceId] = useState(WORKSPACES[0].id)
  const [pageId, setPageId] = useState(DEFAULT_PAGE)
  const [pinned, setPinned] = useState(DEFAULT_PINNED)

  const demo = useDemoState(DEMO_STATES)
  const [recovered, setRecovered] = useState(false)
  const loading = demo === "loading"
  const empty = demo === "empty" && !recovered
  const failed = demo === "error" && !recovered

  const workspace =
    WORKSPACES.find((item) => item.id === workspaceId) ?? WORKSPACES[0]
  const page = PAGES[pageId]
  const isPinned = pinned.includes(page.id)

  // The primitive keeps the drawer's open flag across the md edge, so a
  // phone-width window grown past it would reopen the drawer on the way back.
  useEffect(() => {
    const query = window.matchMedia(TABLET_QUERY)
    const closeDrawer = () => {
      if (query.matches) setOpenMobile(false)
    }
    query.addEventListener("change", closeDrawer)
    return () => query.removeEventListener("change", closeDrawer)
  }, [setOpenMobile])

  // Opening a page is the navigation commit, so the drawer closes.
  const navigate = (id: string) => {
    setPageId(id)
    setOpenMobile(false)
    onNavigate?.(id)
  }

  // Undo puts the pin back after the neighbour it had, wherever that is now.
  const restorePin = (id: string, after: string | null) =>
    setPinned((current) => {
      if (current.includes(id)) return current
      const at = after ? current.indexOf(after) + 1 : 0
      return [...current.slice(0, at), id, ...current.slice(at)]
    })

  const unpin = (id: string) => {
    const index = pinned.indexOf(id)
    const after = index > 0 ? pinned[index - 1] : null
    setPinned((current) => current.filter((item) => item !== id))
    toast.success("Page unpinned", {
      description: PAGES[id].label,
      icon: TOAST_SUCCESS_ICON,
      duration: 8000,
      action: { label: "Undo", onClick: () => restorePin(id, after) },
    })
  }

  const togglePin = () => {
    if (isPinned) {
      unpin(page.id)
      return
    }
    const id = page.id
    setPinned((current) => [...current, id])
    toast.success("Page pinned", {
      description: page.label,
      icon: TOAST_SUCCESS_ICON,
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () =>
          setPinned((current) => current.filter((item) => item !== id)),
      },
    })
  }

  // A designed state takes the content skeleton's place; loading keeps it.
  const body = failed ? (
    <LoadError onRetry={() => setRecovered(true)} />
  ) : empty ? (
    <EmptyWorkspace
      onConnect={() => {
        setRecovered(true)
        navigate("sources")
      }}
    />
  ) : (
    <ContentSkeleton />
  )

  const shared = {
    workspace,
    onWorkspaceChange: setWorkspaceId,
    activePage: page.id,
    pinned: pinned.map((id) => PAGES[id]),
    loading,
    onNavigate: navigate,
    onCreateWorkspace,
    onAccountAction,
    onSignOut,
  }
  const sidebar = (
    <AppSidebar
      {...shared}
      onUnpin={unpin}
      focusSignal={focusSignal}
      parked={!isMobile && !open}
    />
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          {/* The column itself at the column's 240px. The portal sits outside the
                provider, so the drawer restates its white sidebar surface. */}
          <SheetContent
            side="left"
            showCloseButton={false}
            className="border-input/50 w-60 p-0 [--sidebar:var(--color-background)]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Console pages and dashboards.</SheetDescription>
            </SheetHeader>
            {sidebar}
          </SheetContent>
        </Sheet>
      ) : (
        // app-shell-29's fold: only the column width animates. Both trees stay
        // mounted; the full one holds its width under the clip as it fades.
        <div
          data-state={open ? "open" : "collapsed"}
          className="group/fold border-input/50 relative h-full shrink-0 overflow-hidden border-e transition-[width] duration-200 ease-linear data-[state=collapsed]:w-(--sidebar-width-icon) data-[state=open]:w-(--sidebar-width) motion-reduce:transition-none"
        >
          <div
            inert={!open}
            className="h-full w-[calc(var(--sidebar-width)-1px)] transition-opacity duration-200 group-data-[state=collapsed]/fold:pointer-events-none group-data-[state=collapsed]/fold:opacity-0 motion-reduce:transition-none"
          >
            {sidebar}
          </div>
          <div
            inert={open}
            className="pointer-events-none absolute inset-y-0 start-0 w-[calc(var(--sidebar-width-icon)-1px)] opacity-0 transition-opacity duration-200 group-data-[state=collapsed]/fold:pointer-events-auto group-data-[state=collapsed]/fold:opacity-100 motion-reduce:transition-none"
          >
            <AppRail
              {...shared}
              parked={open}
              onRevealSearch={() => {
                setOpen(true)
                setFocusSignal((tick) => tick + 1)
              }}
            />
          </div>
        </div>
      )}
      <SidebarInset className="min-h-0 min-w-0">
        <AppHeader
          page={page}
          loading={loading}
          pinned={isPinned}
          onTogglePin={togglePin}
        />
        {/* The body owns the scroll; the header stays put above it. */}
        <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto p-3 lg:p-4">
          {body}
        </div>
      </SidebarInset>
    </>
  )
}

export function AppShell(props: AppShellProps) {
  const isDesktop = useIsDesktop()
  // A toggle holds within its tier; crossing 1024px returns to that tier's
  // default, so a tablet never inherits the desktop's open sidebar.
  const [choice, setChoice] = useState<{
    desktop: boolean
    open: boolean
  } | null>(null)
  const open = choice && choice.desktop === isDesktop ? choice.open : isDesktop

  return (
    // Every tooltip on the icon rail needs this ancestor to open.
    <TooltipProvider>
      {/* The sidebar takes the page fill so its accent hover reads; like any
          shadcn sidebar it claims Cmd+B and writes the sidebar_state cookie. */}
      <SidebarProvider
        open={open}
        onOpenChange={(next) => setChoice({ desktop: isDesktop, open: next })}
        style={SHELL_STYLE}
        className="bg-background text-foreground h-svh min-h-0 overflow-hidden [--sidebar:var(--color-background)]"
      >
        <Console {...props} />
      </SidebarProvider>
    </TooltipProvider>
  )
}