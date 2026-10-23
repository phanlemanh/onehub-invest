"use client"

// chuyển thể từ @reui/app-shell-36 (app-sidebar.tsx): cột nav nhóm của cổng Ops.
// Khác bản gốc: hàng là Link của Next (mục hiện tại suy từ URL), nav lấy từ
// shell/nav.tsx; bỏ nhóm ghim trang, cây nhánh và skeleton tải workspace (nav tĩnh).
import { useState } from "react"
import Link from "next/link"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import type { NavSection } from "../nav"
import { GROUP_LABEL, LABEL, ROW } from "./faces"
import { filterGroups, OPS_FOOTER } from "./ops-nav"
import { PortalSwitcher } from "./portal-switcher"
import { SEARCH_ICON, SidebarSearch } from "./sidebar-search"
import { UserCard, type OpsUser } from "./user-card"

function PageItem({ page, active, compact = false, onNavigate }: { page: NavSection; active: boolean; compact?: boolean; onNavigate: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        size={compact ? "sm" : "default"}
        className={ROW}
        render={<Link href={page.href} aria-current={active ? "page" : undefined} onClick={onNavigate} />}
      >
        {page.icon}
        <span className={LABEL}>{page.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function OpsSidebar({
  user,
  activePage,
  onNavigate,
  focusSignal,
  parked = false,
}: {
  user: OpsUser
  activePage: string | null
  /** Mở một trang là xong điều hướng: ngăn kéo điện thoại đóng lại. */
  onNavigate: () => void
  focusSignal?: number
  parked?: boolean
}) {
  const { state } = useSidebar()
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const groups = filterGroups(needle)

  return (
    <Sidebar collapsible="none" data-state={state} className="w-full">
      <SidebarHeader className="p-4 pb-2">
        <PortalSwitcher interactive={!parked} />
        <SidebarSearch query={query} onQueryChange={setQuery} focusSignal={focusSignal} />
      </SidebarHeader>

      <SidebarContent className="scroll-fade-y scroll-py-10 gap-4 px-4 py-2 [--scroll-fade-reveal:--spacing(8)]">
        {groups.length === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">{SEARCH_ICON}</EmptyMedia>
              <EmptyTitle>Không có trang khớp</EmptyTitle>
              <EmptyDescription>Thử tên trang khác hoặc xoá ô tìm.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          groups.map((group) => (
            <SidebarGroup key={group.id} className="gap-0.5 p-0">
              <SidebarGroupLabel className={GROUP_LABEL}>{group.label}</SidebarGroupLabel>
              <SidebarMenu className="gap-0.5">
                {group.pages.map((page) => (
                  <PageItem key={page.id} page={page} active={activePage === page.id} onNavigate={onNavigate} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        <SidebarMenu className="gap-0.5">
          {OPS_FOOTER.map((page) => (
            <PageItem key={page.id} page={page} active={activePage === page.id} compact onNavigate={onNavigate} />
          ))}
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserCard user={user} interactive={!parked} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
