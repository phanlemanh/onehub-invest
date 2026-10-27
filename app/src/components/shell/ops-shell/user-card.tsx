"use client"

import { useTransition } from "react"
import { ChevronsUpDownIcon, LogOutIcon, PaletteIcon } from "lucide-react"

import { logout } from "@/app/actions"
import type { Vai } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

import { initialsOf, ThemeSwatches } from "../account-menu"
import { CARD_META, CARD_NAME, CARD_TEXT, CARD_TRIGGER, RAIL_CARD } from "./faces"

export type OpsUser = { email: string; role: Vai }

const ROLE_VI: Record<OpsUser["role"], string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị",
  ops: "Vận hành",
  viewer: "Người xem",
  user: "Người dùng",
}

/** Thẻ tài khoản ở chân thanh bên (user-menu của app-shell-36): chỉ giữ việc thật —
 * giao diện sáng/tối và đăng xuất. Bỏ các mục mẫu (bảo mật, danh bạ, trợ giúp). */
export function UserCard({ user, collapsed = false, interactive = true }: { user: OpsUser; collapsed?: boolean; interactive?: boolean }) {
  const [pending, startTransition] = useTransition()
  const avatar = (
    <Avatar className="size-6">
      <AvatarFallback className="text-xs" translate="no">{initialsOf(user.email)}</AvatarFallback>
    </Avatar>
  )
  const face = collapsed ? (
    avatar
  ) : (
    <>
      {avatar}
      <span className={CARD_TEXT}>
        <span className={CARD_NAME} translate="no">{user.email}</span>
        <span className={CARD_META}>{ROLE_VI[user.role]}</span>
      </span>
      <ChevronsUpDownIcon aria-hidden="true" className="text-muted-foreground" />
    </>
  )
  const label = "Tài khoản đang đăng nhập"

  if (!interactive) {
    return collapsed ? (
      <Button type="button" variant="ghost" tabIndex={-1} aria-label={label} className={RAIL_CARD}>
        {face}
      </Button>
    ) : (
      <SidebarMenuButton size="lg" tabIndex={-1} className={CARD_TRIGGER}>
        {face}
      </SidebarMenuButton>
    )
  }

  return (
    <DropdownMenu>
      {collapsed ? (
        <DropdownMenuTrigger render={<Button type="button" variant="ghost" aria-label={label} className={RAIL_CARD} />}>
          {face}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label={label} className={CARD_TRIGGER} />}>
          {face}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" sideOffset={collapsed ? 8 : 6} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
            <span className="text-foreground truncate text-sm font-medium" translate="no">{user.email}</span>
            <span className="text-muted-foreground text-xs">{ROLE_VI[user.role]}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem closeOnClick={false} className="cursor-default focus:bg-transparent!">
            <PaletteIcon aria-hidden="true" />
            Giao diện
            <span className="ml-auto">
              <ThemeSwatches />
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={pending} onClick={() => startTransition(() => logout())}>
            <LogOutIcon aria-hidden="true" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
