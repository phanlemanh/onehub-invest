"use client"

// chuyển thể từ @reui/app-shell-36 (app-shell.tsx): shell riêng của cổng Ops —
// shadcn Sidebar mở ở desktop, thanh icon ở máy tính bảng, ngăn kéo ở điện thoại;
// một header, thân trang cuộn bên dưới. Khác bản gốc: thân là trang thật (children)
// thay cho ContentSkeleton, mục hiện tại suy từ URL, bỏ ghim trang và trạng thái demo.
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import { activeOf } from "./ops-nav"
import { OpsHeader } from "./ops-header"
import { OpsRail } from "./ops-rail"
import { OpsSidebar } from "./ops-sidebar"
import type { OpsUser } from "./user-card"

const SHELL_STYLE = { "--sidebar-width": "240px" } as CSSProperties
// Thanh bên mở từ lg; máy tính bảng bắt đầu ở thanh icon.
const DESKTOP_QUERY = "(min-width: 64rem)"
const TABLET_QUERY = "(min-width: 48rem)"

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => true)
}

function Console({ user, children }: { user: OpsUser; children: ReactNode }) {
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const activePage = activeOf(pathname)
  // Nút tìm của thanh icon nằm ở cây kia; tăng số này để focus ô tìm khi cột mở lại.
  const [focusSignal, setFocusSignal] = useState(0)

  // Primitive giữ cờ mở ngăn kéo qua mốc md; đóng nó khi cửa sổ rộng ra.
  useEffect(() => {
    const query = window.matchMedia(TABLET_QUERY)
    const closeDrawer = () => {
      if (query.matches) setOpenMobile(false)
    }
    query.addEventListener("change", closeDrawer)
    return () => query.removeEventListener("change", closeDrawer)
  }, [setOpenMobile])

  const sidebar = (
    <OpsSidebar
      user={user}
      activePage={activePage}
      onNavigate={() => setOpenMobile(false)}
      focusSignal={focusSignal}
      parked={!isMobile && !open}
    />
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent side="left" showCloseButton={false} className="border-input/50 w-60 p-0 [--sidebar:var(--color-background)]">
            <SheetHeader className="sr-only">
              <SheetTitle>Điều hướng</SheetTitle>
              <SheetDescription>Các trang của cổng vận hành.</SheetDescription>
            </SheetHeader>
            {sidebar}
          </SheetContent>
        </Sheet>
      ) : (
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
            <OpsRail
              user={user}
              activePage={activePage}
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
        <OpsHeader />
        {/* Thân trang giữ thanh cuộn; header đứng yên phía trên. */}
        <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </>
  )
}

export function OpsShell({ user, children }: { user: OpsUser; children: ReactNode }) {
  const isDesktop = useIsDesktop()
  // Gập/mở giữ trong cùng một bậc; qua mốc 1024px thì về mặc định của bậc đó.
  const [choice, setChoice] = useState<{ desktop: boolean; open: boolean } | null>(null)
  const open = choice && choice.desktop === isDesktop ? choice.open : isDesktop

  return (
    <TooltipProvider>
      <SidebarProvider
        open={open}
        onOpenChange={(next) => setChoice({ desktop: isDesktop, open: next })}
        style={SHELL_STYLE}
        className="bg-background text-foreground h-svh min-h-0 overflow-hidden [--sidebar:var(--color-background)]"
      >
        <Console user={user}>{children}</Console>
      </SidebarProvider>
    </TooltipProvider>
  )
}
