import type { ReactNode } from "react"
import { ActivityIcon, BadgePercentIcon, CalculatorIcon, DatabaseIcon, GaugeIcon, GitCompareIcon, HouseIcon, InboxIcon, MapIcon, PaletteIcon, ShieldCheckIcon } from "lucide-react"

/**
 * Cấu hình điều hướng theo cổng (docs/architecture/portals.md).
 * Chỉ khai báo route ĐÃ tồn tại — mục mới thêm vào đây khi trang của nó ship,
 * không hiện tab "sắp có".
 */
export type Portal = "invest" | "ops"

export interface NavSection {
  id: string
  label: string
  href: string
  icon: ReactNode
  /** Mục đang chọn tính theo URL, không giữ state. */
  match: (pathname: string) => boolean
  /** Nhóm trên thanh bên của shell Ops (app-shell-36); Invest không dùng. */
  group?: OpsNavGroup
}

export type OpsNavGroup = "Giám sát" | "Xử lý" | "Quản trị" | "Hệ thống"

const icon = (Icon: typeof MapIcon) => (
  <Icon className="size-4" aria-hidden="true" />
)

// Icon trong nút menu của Sidebar: không gắn size, nút tự định cỡ (ReUI layout).
const glyph = (Icon: typeof MapIcon) => <Icon aria-hidden="true" />

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
    {
      id: "yield",
      label: "Lợi suất",
      href: "/yield",
      icon: icon(CalculatorIcon),
      match: (p) => p.startsWith("/yield"),
    },
    {
      id: "compare",
      label: "So sánh",
      href: "/so-sanh",
      icon: icon(GitCompareIcon),
      match: (p) => p.startsWith("/so-sanh"),
    },
  ],
  ops: [
    {
      id: "overview",
      label: "Tổng quan",
      href: "/ops",
      icon: glyph(GaugeIcon),
      match: (p) => p === "/ops",
      group: "Giám sát",
    },
    {
      id: "collections",
      label: "Thu thập",
      href: "/ops/collections",
      icon: glyph(ActivityIcon),
      match: (p) => p.startsWith("/ops/collections"),
      group: "Giám sát",
    },
    {
      id: "quality",
      label: "Chất lượng dữ liệu",
      href: "/ops/quality",
      icon: glyph(ShieldCheckIcon),
      match: (p) => p.startsWith("/ops/quality"),
      group: "Giám sát",
    },
    {
      id: "review",
      label: "Hàng duyệt",
      href: "/ops/review",
      icon: glyph(InboxIcon),
      match: (p) => p.startsWith("/ops/review"),
      group: "Xử lý",
    },
    {
      // Tín hiệu P1 nội bộ + liên hệ người bán (SPL tầng A) — không thuộc Invest.
      id: "deals",
      label: "Căn giá tốt",
      href: "/ops/deals",
      icon: glyph(BadgePercentIcon),
      match: (p) => p.startsWith("/ops/deals"),
      group: "Xử lý",
    },
    {
      id: "sources",
      label: "Nguồn dữ liệu",
      href: "/ops/sources",
      icon: glyph(DatabaseIcon),
      match: (p) => p.startsWith("/ops/sources"),
      group: "Quản trị",
    },
    {
      id: "design",
      label: "Thư viện thiết kế",
      href: "/ops/design",
      icon: glyph(PaletteIcon),
      match: (p) => p.startsWith("/ops/design"),
      group: "Hệ thống",
    },
  ],
}

export const PORTAL_HOME: Record<Portal, string> = {
  invest: "/",
  ops: "/ops",
}
