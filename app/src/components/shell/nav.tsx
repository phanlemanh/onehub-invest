import type { ReactNode } from "react"
import { GaugeIcon, HouseIcon, MapIcon, PaletteIcon } from "lucide-react"

/**
 * Cấu hình điều hướng theo cổng (docs/architecture/portals.md).
 * Chỉ khai báo route ĐÃ tồn tại — mục mới (Lợi suất, So sánh) thêm
 * vào đây khi trang của nó ship (P2–P5), không hiện tab "sắp có".
 */
export type Portal = "invest" | "ops"

export interface NavSection {
  id: string
  label: string
  href: string
  icon: ReactNode
  /** Mục đang chọn tính theo URL, không giữ state. */
  match: (pathname: string) => boolean
}

const icon = (Icon: typeof MapIcon) => (
  <Icon className="size-4" aria-hidden="true" />
)

export const NAV_SECTIONS: Record<Portal, NavSection[]> = {
  invest: [
    {
      id: "markets",
      label: "Thị trường",
      href: "/vn",
      icon: icon(MapIcon),
      match: (p) => /^\/(vn|th)(\/|$)/.test(p) && !p.endsWith("/listings"),
    },
    {
      id: "listings",
      label: "Listing",
      // Thị trường nhiều listing nhất; Finder/Insight dẫn tới thị trường khác.
      href: "/vn/hanoi/listings",
      icon: icon(HouseIcon),
      match: (p) => p.endsWith("/listings") || p.startsWith("/listing/"),
    },
  ],
  ops: [
    {
      id: "quality",
      label: "Chất lượng dữ liệu",
      href: "/ops/quality",
      icon: icon(GaugeIcon),
      match: (p) => p.startsWith("/ops/quality"),
    },
    {
      id: "design",
      label: "Thư viện thiết kế",
      href: "/ops/design",
      icon: icon(PaletteIcon),
      match: (p) => p.startsWith("/ops/design"),
    },
  ],
}

export const PORTAL_HOME: Record<Portal, string> = {
  invest: "/",
  ops: "/ops",
}
