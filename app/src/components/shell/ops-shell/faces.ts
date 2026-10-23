// chuyển thể từ @reui/app-shell-36 (value-faces.tsx, app-sidebar.tsx): lớp chữ và
// bề mặt dùng chung của shell Ops. Khác bản gốc: meta dùng text-xs (luật chữ
// không nhỏ hơn text-xs); bỏ màu riêng từng workspace.
import { cn } from "@/lib/utils"

export const CAP_BOX = "[text-box:trim-both_cap_alphabetic]"
export const CAP_TRUNCATE = `${CAP_BOX} overflow-x-clip text-ellipsis whitespace-nowrap`

// Nút menu cắt span cuối bằng overflow hidden; chỉ cắt theo chiều ngang.
export const LABEL = cn(CAP_TRUNCATE, "overflow-x-clip! overflow-y-visible!")

// Hàng nav: chữ mờ, hover theo accent, mục hiện tại đậm + viền mảnh bên trong.
export const ROW = cn(
  "text-muted-foreground hover:text-sidebar-accent-foreground text-xs font-medium",
  "[&>svg]:text-ring [&:hover>svg]:text-sidebar-accent-foreground",
  "data-active:text-foreground data-active:[&>svg]:text-foreground",
  "data-active:not-focus-visible:ring-input/50 data-active:not-focus-visible:ring-1 data-active:not-focus-visible:ring-inset"
)
export const RAIL_ROW = cn(ROW, "size-8 justify-center p-2")
export const GROUP_LABEL = "text-ring h-auto pb-1"

export const MENU_TILE = "[--icon-tile-size:--spacing(7)] [--icon-tile-icon-size:--spacing(3.5)]"
export const CARD_TILE = "[--icon-tile-size:--spacing(6)] [--icon-tile-icon-size:--spacing(3.5)]"
export const CARD_TRIGGER =
  "border-input/50 bg-muted/50 h-10 gap-2 rounded-lg border px-2 text-xs [&>svg:last-child]:size-3.5"
export const CARD_TEXT = "grid min-w-0 flex-1 gap-0.5 text-start leading-none"
export const CARD_NAME = "text-sidebar-accent-foreground truncate text-xs leading-none font-medium"
export const CARD_META = "text-muted-foreground truncate text-xs"
export const RAIL_CARD =
  "bg-muted/50 border-input/50 hover:bg-muted size-8 justify-center rounded-lg border bg-clip-border p-0"
export const CARD_BAND = "flex h-10 shrink-0 items-center"
