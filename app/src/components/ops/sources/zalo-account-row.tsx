"use client"

// chuyển thể từ @reui/solution-ai-ops-2 (provider-settings.tsx · ProviderRow, ProviderActionsMenu):
// mỗi tài khoản zalouser là một hàng kết nối — biểu tượng, tên + Badge, mô tả, nút
// "Đăng nhập QR" (thay Connect), menu thao tác. Khác bản gốc: không ưu tiên/định tuyến,
// không công tắc tạm dừng (tài khoản không có trạng thái tạm dừng), bỏ bóng đổ tự tô.
import { EllipsisVerticalIcon, EyeIcon, QrCodeIcon, Trash2Icon, UserRoundIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { IconTile } from "@/components/reui/icon-tile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { fmtInt } from "@/lib/format"

export type ZaloAccount = {
  accountId: string
  name: string | null
  profile: string
  explicitGroups: boolean
  enabledGroups: string[]
}

export function ZaloAccountRow({
  account,
  selected,
  onSelect,
  onLogin,
  onRemove,
}: {
  account: ZaloAccount
  selected: boolean
  onSelect: () => void
  onLogin: () => void
  /** Vắng = không gỡ được (tài khoản "default"). */
  onRemove?: () => void
}) {
  return (
    <Item aria-current={selected ? "true" : undefined}>
      <ItemMedia variant="icon">
        <IconTile variant="frame" size="sm" aria-hidden="true">
          <UserRoundIcon aria-hidden="true" />
        </IconTile>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="min-w-0 gap-2">
          <span className="min-w-0 truncate font-mono">{account.accountId}</span>
          {selected ? <Badge variant="info-light">Đang xem nhóm</Badge> : null}
          <Badge variant="outline">{fmtInt(account.enabledGroups.length)} nhóm bật</Badge>
        </ItemTitle>
        <ItemDescription className="min-w-0 truncate">
          {account.name ?? "Chưa có tên hiển thị"} · hồ sơ {account.profile}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full justify-end gap-2 pt-2 sm:basis-auto sm:self-center sm:pt-0">
        <Button size="sm" variant={selected ? "secondary" : "outline"} onClick={onSelect} aria-pressed={selected}>
          <EyeIcon data-icon="inline-start" aria-hidden="true" />
          Xem nhóm
        </Button>
        <Button size="sm" variant="outline" onClick={onLogin}>
          <QrCodeIcon data-icon="inline-start" aria-hidden="true" />
          Đăng nhập QR
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`Thao tác tài khoản ${account.accountId}`} />}>
            <EllipsisVerticalIcon aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onLogin}>
                <QrCodeIcon aria-hidden="true" />
                Đăng nhập lại bằng QR
              </DropdownMenuItem>
              {onRemove ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={onRemove}>
                    <Trash2Icon aria-hidden="true" />
                    Gỡ tài khoản
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  )
}
