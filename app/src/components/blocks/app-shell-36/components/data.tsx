import type { ReactNode } from "react"
import { ActivityIcon, GlobeIcon, ZapIcon, DatabaseIcon, HouseIcon, RouteIcon, CpuIcon, NetworkIcon, ScanSearchIcon, AlignLeftIcon, FileTextIcon, MonitorIcon, BlocksIcon, SettingsIcon, TimerIcon, DatabaseZapIcon, ListOrderedIcon, ChartColumnIcon, SunIcon, MoonIcon } from "lucide-react"

/* ── Workspaces ── */

export type Workspace = {
  id: string
  name: string
  environment: string
  /** The tile's fill and glyph colour, one hue per workspace. */
  color: string
  icon: ReactNode
}

export const WORKSPACES: Workspace[] = [
  {
    id: "core",
    name: "Nimbus Core",
    environment: "Production · EU West",
    color: "bg-teal-600 text-white",
    icon: (
      <ActivityIcon aria-hidden="true" />
    ),
  },
  {
    id: "edge",
    name: "Nimbus Edge",
    environment: "Staging · US East",
    color: "bg-blue-600 text-white",
    icon: (
      <GlobeIcon aria-hidden="true" />
    ),
  },
  {
    id: "labs",
    name: "Nimbus Labs",
    environment: "Sandbox · EU West",
    color: "bg-fuchsia-600 text-white",
    icon: (
      <ZapIcon aria-hidden="true" />
    ),
  },
  {
    id: "data",
    name: "Nimbus Data",
    environment: "Analytics · EU Central",
    color: "bg-amber-600 text-white",
    icon: (
      <DatabaseIcon aria-hidden="true" />
    ),
  },
]

/* ── Pages ── */

export type Page = {
  id: string
  label: string
  icon: ReactNode
  section: string
  /** The branch a page sits under in the nav, shown in the breadcrumb. */
  parent?: string
}

/** A nav row that only folds its child pages open; it is not a page itself. */
export type NavBranch = {
  id: string
  label: string
  icon: ReactNode
  children: Page[]
}

type NavEntry = Page | NavBranch

export type NavGroup = { id: string; label: string; entries: NavEntry[] }

export function isBranch(entry: NavEntry): entry is NavBranch {
  return "children" in entry
}

/** A group's pages in nav order, with each branch's children in its place. */
function pagesOf(group: NavGroup): Page[] {
  return group.entries.flatMap((entry) =>
    isBranch(entry) ? entry.children : [entry]
  )
}

export const HOME_PAGE: Page = {
  id: "home",
  label: "Home",
  section: "Workspace",
  icon: (
    <HouseIcon aria-hidden="true" />
  ),
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "observe",
    label: "Observe",
    entries: [
      {
        id: "endpoints",
        label: "Endpoints",
        section: "Observe",
        icon: (
          <RouteIcon aria-hidden="true" />
        ),
      },
      {
        id: "hosts",
        label: "Hosts",
        section: "Observe",
        icon: (
          <CpuIcon aria-hidden="true" />
        ),
      },
      {
        id: "topology",
        label: "Topology",
        section: "Observe",
        icon: (
          <NetworkIcon aria-hidden="true" />
        ),
      },
    ],
  },
  {
    id: "investigate",
    label: "Investigate",
    entries: [
      {
        id: "explorer",
        label: "Explorer",
        icon: (
          <ScanSearchIcon aria-hidden="true" />
        ),
        children: [
          {
            id: "traces",
            label: "Traces",
            section: "Investigate",
            parent: "Explorer",
            icon: (
              <AlignLeftIcon aria-hidden="true" />
            ),
          },
          {
            id: "logs",
            label: "Logs",
            section: "Investigate",
            parent: "Explorer",
            icon: (
              <FileTextIcon aria-hidden="true" />
            ),
          },
          {
            id: "sessions",
            label: "Sessions",
            section: "Investigate",
            parent: "Explorer",
            icon: (
              <MonitorIcon aria-hidden="true" />
            ),
          },
        ],
      },
      {
        id: "queries",
        label: "Queries",
        section: "Investigate",
        icon: (
          <DatabaseIcon aria-hidden="true" />
        ),
      },
    ],
  },
]

/** Workspace-level pages that sit at the foot of the sidebar. */
export const FOOTER_PAGES: Page[] = [
  {
    id: "sources",
    label: "Sources",
    section: "Workspace",
    icon: (
      <BlocksIcon aria-hidden="true" />
    ),
  },
  {
    id: "settings",
    label: "Settings",
    section: "Workspace",
    icon: (
      <SettingsIcon aria-hidden="true" />
    ),
  },
]

function dashboard(id: string, label: string, icon: ReactNode): Page {
  return {
    id,
    label,
    section: "Dashboards",
    icon,
  }
}

export const DASHBOARDS: Page[] = [
  dashboard(
    "checkout-latency",
    "Checkout Latency",
    <TimerIcon aria-hidden="true" />
  ),
  dashboard(
    "cache-hit-ratio",
    "Cache Hit Ratio",
    <DatabaseZapIcon aria-hidden="true" />
  ),
  dashboard(
    "queue-backlog",
    "Queue Backlog",
    <ListOrderedIcon aria-hidden="true" />
  ),
  dashboard(
    "billing-workers",
    "Billing Workers",
    <ChartColumnIcon aria-hidden="true" />
  ),
]

/** Every page by id: the nav, the dashboards and the footer pages. */
export const PAGES: Record<string, Page> = Object.fromEntries(
  [
    HOME_PAGE,
    ...NAV_GROUPS.flatMap(pagesOf),
    ...FOOTER_PAGES,
    ...DASHBOARDS,
  ].map((page) => [page.id, page])
)

export const DEFAULT_PAGE = "home"
export const DEFAULT_PINNED = DASHBOARDS.map((page) => page.id)

/* ── Account ── */

export const USER = {
  name: "Shadcn",
  role: "Author of Shadcn/ui",
  email: "m@example.com",
  initials: "CN",
  avatar: "https://reui.io/assets/avatar-shadcn.jpg",
}

/* ── Theme ── */

export const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    icon: (
      <SunIcon aria-hidden="true" />
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <MoonIcon aria-hidden="true" />
    ),
  },
  {
    value: "system",
    label: "System",
    icon: (
      <MonitorIcon aria-hidden="true" />
    ),
  },
]