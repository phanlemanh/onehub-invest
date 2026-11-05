import type { ReactNode } from "react"
import { ActivityIcon, BadgePercentIcon, BotIcon, CalculatorIcon, DatabaseIcon, GaugeIcon, GitCompareIcon, InboxIcon, KeyRoundIcon, MapIcon, PaletteIcon, ShieldCheckIcon, TagIcon, TagsIcon, UsersIcon, WorkflowIcon } from "lucide-react"

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
  /** Đích tính theo trang đang xem, thay cho `href` (giữ thị trường đang xem). */
  hrefFor?: (pathname: string) => string
  /** Dưới `lg` vẫn nằm ngoài menu: dịch vụ chính, không giấu sau hai lần chạm. */
  pinned?: boolean
  /** Nhóm trên thanh bên của shell Ops (app-shell-36); Invest không dùng. */
  group?: OpsNavGroup
}

export type OpsNavGroup = "Giám sát" | "Xử lý" | "Quản trị" | "Hệ thống"

const icon = (Icon: typeof MapIcon) => (
  <Icon className="size-4" aria-hidden="true" />
)

// Icon trong nút menu của Sidebar: không gắn size, nút tự định cỡ (ReUI layout).
const glyph = (Icon: typeof MapIcon) => <Icon aria-hidden="true" />

// Giữ thị trường đang xem; trang không gắn thị trường (Lợi suất, So sánh, chi tiết listing) dùng Hà Nội, nơi nhiều tin nhất.
const listingsHref = (segment: "sale" | "rent") => (pathname: string) => {
  const m = /^\/(vn|th)\/([^/]+)/.exec(pathname)
  return `/${m?.[1] ?? "vn"}/${m?.[2] ?? "hanoi"}/listings/${segment}`
}

export const NAV_SECTIONS: Record<Portal, NavSection[]> = {
  invest: [
    {
      id: "markets",
      label: "Thị trường",
      href: "/vn",
      icon: icon(MapIcon),
      match: (p) => /^\/(vn|th)(\/|$)/.test(p) && !/\/listings(\/|$)/.test(p),
    },
    {
      id: "sale",
      label: "Bán",
      href: "/vn/hanoi/listings/sale",
      hrefFor: listingsHref("sale"),
      pinned: true,
      icon: icon(TagIcon),
      match: (p) => p.endsWith("/listings/sale"),
    },
    {
      id: "rent",
      label: "Cho thuê",
      href: "/vn/hanoi/listings/rent",
      hrefFor: listingsHref("rent"),
      pinned: true,
      icon: icon(KeyRoundIcon),
      // Chi tiết listing thuê ngắn hạn; đường dẫn tin rao không cho biết bán hay thuê nên không tô mục nào.
      match: (p) => p.endsWith("/listings/rent") || (p.startsWith("/listing/") && !p.startsWith("/listing/offer_")),
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
      href: "/compare",
      icon: icon(GitCompareIcon),
      match: (p) => p.startsWith("/compare"),
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
      id: "data-flow",
      label: "Dòng chảy dữ liệu",
      href: "/ops/data-flow",
      icon: glyph(WorkflowIcon),
      match: (p) => p.startsWith("/ops/data-flow"),
      group: "Giám sát",
    },
    {
      id: "ai-calls",
      label: "Cuộc gọi AI",
      href: "/ops/ai-calls",
      icon: glyph(BotIcon),
      match: (p) => p.startsWith("/ops/ai-calls"),
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
      // Gắn nhãn đánh giá mù (PL7) — chỉ ở máy thu; trên cloud trang nói «Chỉ ở máy thu».
      id: "labels",
      label: "Gắn nhãn",
      href: "/ops/labels",
      icon: glyph(TagsIcon),
      match: (p) => p.startsWith("/ops/labels"),
      group: "Xử lý",
    },
    {
      // Danh bạ người (danh-ba-nguoi-tren-ops) — chỉ ở máy thu; trên cloud trang nói «Chỉ ở máy thu».
      id: "people",
      label: "Danh bạ người",
      href: "/ops/people",
      icon: glyph(UsersIcon),
      match: (p) => p.startsWith("/ops/people"),
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
