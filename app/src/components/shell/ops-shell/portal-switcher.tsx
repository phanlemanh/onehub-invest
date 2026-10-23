"use client"

import Link from "next/link"
import { ChevronsUpDownIcon, MapIcon, WrenchIcon } from "lucide-react"

import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { CARD_META, CARD_NAME, CARD_TEXT, CARD_TILE, CARD_TRIGGER, MENU_TILE, RAIL_CARD } from "./faces"

// Bộ chuyển workspace của app-shell-36 thành bộ chuyển cổng: Ops (đang ở) ↔ Invest.
const PORTALS = [
  { id: "ops", name: "Vận hành", meta: "Cổng nội bộ", href: "/ops", icon: <WrenchIcon aria-hidden="true" /> },
  { id: "invest", name: "Đầu tư", meta: "Cổng công khai", href: "/vn", icon: <MapIcon aria-hidden="true" /> },
] as const

function Tile({ icon, className }: { icon: React.ReactNode; className?: string }) {
  return (
    <IconTile variant="solid" size="sm" aria-hidden="true" className={className}>
      {icon}
    </IconTile>
  )
}

export function PortalSwitcher({ collapsed = false, interactive = true }: { collapsed?: boolean; interactive?: boolean }) {
  const current = PORTALS[0]
  const label = collapsed ? `Đổi cổng, đang ở ${current.name}` : undefined
  const face = collapsed ? (
    <Tile icon={current.icon} className={CARD_TILE} />
  ) : (
    <>
      <Tile icon={current.icon} className={CARD_TILE} />
      <span className={CARD_TEXT}>
        <span className="sr-only">Đổi cổng, đang ở</span>
        <span className={CARD_NAME}>{current.name}</span>
        <span className={CARD_META}>{current.meta}</span>
      </span>
      <ChevronsUpDownIcon aria-hidden="true" className="text-muted-foreground" />
    </>
  )

  if (!interactive) {
    return collapsed ? (
      <Button type="button" variant="ghost" tabIndex={-1} aria-label={label} className={RAIL_CARD}>
        {face}
      </Button>
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tabIndex={-1} className={CARD_TRIGGER}>
            {face}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const menu = (
    <DropdownMenu>
      {collapsed ? (
        <DropdownMenuTrigger render={<Button type="button" variant="ghost" aria-label={label} className={RAIL_CARD} />}>
          {face}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className={CARD_TRIGGER} />}>{face}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side={collapsed ? "right" : "bottom"} align="start" sideOffset={collapsed ? 8 : 6} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">Cổng</DropdownMenuLabel>
          {PORTALS.map((p) => (
            <DropdownMenuItem key={p.id} className="gap-2.5" render={<Link href={p.href} />}>
              <Tile icon={p.icon} className={cn(MENU_TILE)} />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="text-muted-foreground truncate text-xs">{p.meta}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return collapsed ? (
    menu
  ) : (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  )
}
