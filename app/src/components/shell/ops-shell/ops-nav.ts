import { NAV_SECTIONS, type NavSection, type OpsNavGroup } from "../nav"

/** Nhóm thanh bên Ops: Hệ thống nằm ở chân thanh bên (như FOOTER_PAGES của app-shell-36). */
const MAIN_GROUPS: OpsNavGroup[] = ["Giám sát", "Xử lý", "Quản trị"]

export type OpsGroup = { id: string; label: OpsNavGroup; pages: NavSection[] }

export const OPS_GROUPS: OpsGroup[] = MAIN_GROUPS.map((label, i) => ({
  id: `g${i}`,
  label,
  pages: NAV_SECTIONS.ops.filter((p) => p.group === label),
}))

export const OPS_FOOTER: NavSection[] = NAV_SECTIONS.ops.filter((p) => p.group === "Hệ thống")

export const activeOf = (pathname: string) => NAV_SECTIONS.ops.find((p) => p.match(pathname))?.id ?? null

/** Lọc nav theo chữ gõ; nhóm rỗng thì bỏ. */
export function filterGroups(needle: string): OpsGroup[] {
  if (!needle) return OPS_GROUPS
  return OPS_GROUPS.map((g) => ({ ...g, pages: g.pages.filter((p) => p.label.toLowerCase().includes(needle)) })).filter(
    (g) => g.pages.length > 0
  )
}
