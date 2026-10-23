"use client"

// chuyển thể từ @reui/app-shell-36 (app-rail.tsx): thanh icon khi thanh bên gập
// (máy tính bảng). Khác bản gốc: hàng là Link của Next, bỏ nhóm ghim và nhánh.
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import type { NavSection } from "../nav"
import { CARD_BAND, RAIL_ROW } from "./faces"
import { OPS_FOOTER, OPS_GROUPS } from "./ops-nav"
import { PortalSwitcher } from "./portal-switcher"
import { SEARCH_ICON } from "./sidebar-search"
import { UserCard, type OpsUser } from "./user-card"

// Ô tìm thu gọn giữ viền mảnh bên trong, nhường cho vòng focus.
const RAIL_SEARCH =
  "text-muted-foreground size-8 justify-center rounded-lg p-2 not-focus-visible:ring-1 not-focus-visible:ring-input not-focus-visible:ring-inset"

function RailItem({ page, active }: { page: NavSection; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={page.label}
        className={RAIL_ROW}
        render={<Link href={page.href} aria-label={page.label} aria-current={active ? "page" : undefined} />}
      >
        {page.icon}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function OpsRail({
  user,
  activePage,
  onRevealSearch,
  parked = false,
}: {
  user: OpsUser
  activePage: string | null
  /** Mở lại cột đầy đủ với ô tìm được focus. */
  onRevealSearch: () => void
  parked?: boolean
}) {
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="none" data-state={state} className="w-full">
      <SidebarHeader className="px-2 pt-4 pb-2">
        <div className={CARD_BAND}>
          <PortalSwitcher collapsed interactive={!parked} />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Tìm trang"
              aria-label="Tìm trang trong cổng Ops"
              aria-keyshortcuts="Meta+F Control+F"
              onClick={onRevealSearch}
              className={RAIL_SEARCH}
            >
              {SEARCH_ICON}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="scroll-fade-y scroll-py-10 gap-4 px-2 py-2 [--scroll-fade-reveal:--spacing(8)]">
        {OPS_GROUPS.map((group) => (
          <SidebarGroup key={group.id} aria-label={group.label} className="p-0">
            <SidebarMenu className="gap-0.5">
              {group.pages.map((page) => (
                <RailItem key={page.id} page={page} active={activePage === page.id} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 pt-2 pb-4">
        <SidebarMenu className="gap-0.5">
          {OPS_FOOTER.map((page) => (
            <RailItem key={page.id} page={page} active={activePage === page.id} />
          ))}
        </SidebarMenu>
        <div className={CARD_BAND}>
          <UserCard user={user} collapsed interactive={!parked} />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
