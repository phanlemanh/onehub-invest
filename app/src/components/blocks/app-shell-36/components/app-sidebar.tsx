import { useState, type ComponentProps } from "react"
import { Badge } from "@/components/reui/badge"
import { cn } from "cn"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FOOTER_PAGES,
  HOME_PAGE,
  isBranch,
  NAV_GROUPS,
  type NavBranch,
  type Page,
  type Workspace,
} from "./data"
import { NavTree } from "./nav-tree"
import { SEARCH_ICON, SidebarSearch } from "./sidebar-search"
import { UserMenu, type AccountAction } from "./user-menu"
import { CAP_TRUNCATE } from "./value-faces"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { PinOffIcon } from "lucide-react"

// The menu button truncates its last span with overflow hidden, which would
// clip a cap-trimmed label's descenders; clip sideways only.
export const LABEL = cn(CAP_TRUNCATE, "overflow-x-clip! overflow-y-visible!")

// app-shell-24's rows: muted text on ring glyphs, accent ink on hover, full ink
// on an inset hairline when current (the hairline yields to the focus ring).
export const ROW = cn(
  "text-muted-foreground hover:text-sidebar-accent-foreground text-xs font-medium",
  "[&>svg]:text-ring [&:hover>svg]:text-sidebar-accent-foreground",
  "data-active:text-foreground data-active:[&>svg]:text-foreground",
  "data-active:not-focus-visible:ring-input/50 data-active:not-focus-visible:ring-1 data-active:not-focus-visible:ring-inset"
)

// app-shell-24's group label: ring ink on its own 20px, 4px over the rows.
const GROUP_LABEL = "text-ring h-auto pb-1"

export type Navigate = (id: string) => void

const hit = (needle: string, label: string) =>
  label.toLowerCase().includes(needle)

/** The nav as the search leaves it: a branch keeps its matching children, or
 * all of them when its own label matches; empty groups drop out. */
function filterGroups(needle: string) {
  if (!needle) return NAV_GROUPS
  return NAV_GROUPS.map((group) => ({
    ...group,
    entries: group.entries.flatMap<Page | NavBranch>((entry) => {
      if (!isBranch(entry)) return hit(needle, entry.label) ? [entry] : []
      if (hit(needle, entry.label)) return [entry]
      const children = entry.children.filter((page) => hit(needle, page.label))
      return children.length > 0 ? [{ ...entry, children }] : []
    }),
  })).filter((group) => group.entries.length > 0)
}

/** A nav row's anchor: the menu button merges its own props onto it. */
export function PageLink({
  pageId,
  active,
  onNavigate,
  ...props
}: ComponentProps<"a"> & {
  pageId: string
  active: boolean
  onNavigate: Navigate
}) {
  return (
    <a
      href="#"
      aria-current={active ? "page" : undefined}
      {...props}
      onClick={(event) => {
        event.preventDefault()
        onNavigate(pageId)
      }}
    />
  )
}

function PageItem({
  page,
  active,
  onNavigate,
  compact = false,
}: {
  page: Page
  active: boolean
  onNavigate: Navigate
  /** The foot's workspace links take the 28px row. */
  compact?: boolean
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        size={compact ? "sm" : "default"}
        className={ROW}
        render={
          <PageLink pageId={page.id} active={active} onNavigate={onNavigate} />
        }
      >
        {page.icon}
        <span className={LABEL}>{page.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** The rows a group shows while the workspace loads. */
function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <SidebarGroup aria-hidden="true" className="gap-0.5 p-0">
      <SidebarGroupLabel className={GROUP_LABEL}>
        <Skeleton className="h-3 w-16" />
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {Array.from({ length: rows }, (_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function PinnedGroup({
  pinned,
  activePage,
  onNavigate,
  onUnpin,
}: {
  pinned: Page[]
  activePage: string
  onNavigate: Navigate
  onUnpin: (id: string) => void
}) {
  return (
    <SidebarGroup className="gap-0.5 p-0">
      <SidebarGroupLabel className={GROUP_LABEL}>
        Pinned
        {/* -my-0.5 keeps the 20px badge inside the label's 16px line, so the
            Pinned label stays as tall as the others. */}
        <Badge
          variant="outline"
          className="text-muted-foreground -my-0.5 ms-auto tabular-nums"
        >
          {pinned.length}
        </Badge>
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {pinned.length === 0 ? (
          <li className="text-muted-foreground px-2 py-1.5 text-xs">
            Pin a page from its header to keep it here.
          </li>
        ) : (
          pinned.map((page) => {
            const active = page.id === activePage
            return (
              <SidebarMenuItem key={page.id}>
                <SidebarMenuButton
                  isActive={active}
                  className={ROW}
                  render={
                    <PageLink
                      pageId={page.id}
                      active={active}
                      onNavigate={onNavigate}
                    />
                  }
                >
                  {page.icon}
                  <span className={LABEL}>{page.label}</span>
                </SidebarMenuButton>
                {/* Hidden at rest at every width, as on the desktop column. */}
                <SidebarMenuAction
                  type="button"
                  showOnHover
                  aria-label={`Unpin ${page.label}`}
                  className="opacity-0"
                  onClick={() => onUnpin(page.id)}
                >
                  <PinOffIcon aria-hidden="true" />
                </SidebarMenuAction>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar({
  workspace,
  onWorkspaceChange,
  activePage,
  pinned,
  loading,
  onNavigate,
  onUnpin,
  onCreateWorkspace,
  onAccountAction,
  onSignOut,
  focusSignal,
  parked = false,
}: {
  workspace: Workspace
  onWorkspaceChange: (id: string) => void
  activePage: string
  pinned: Page[]
  loading: boolean
  onNavigate: Navigate
  onUnpin: (id: string) => void
  onCreateWorkspace?: () => void
  onAccountAction?: (action: AccountAction) => void
  onSignOut?: () => void
  /** Bumped by the rail's search glyph: focus the field once it is back. */
  focusSignal?: number
  /** Hidden by the fold: its menus stand down while the rail holds them. */
  parked?: boolean
}) {
  const { state } = useSidebar()
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const groups = filterGroups(needle)
  const showHome = !needle || hit(needle, HOME_PAGE.label)
  const shownPins = needle
    ? pinned.filter((page) => hit(needle, page.label))
    : pinned
  const noMatches =
    Boolean(needle) && !showHome && groups.length === 0 && !shownPins.length

  return (
    // The shell drives the fold, so this is always the full column: it keeps
    // its width while the clip slides over it.
    <Sidebar collapsible="none" data-state={state} className="w-full">
      {/* app-shell-24's 16px spine on every edge. */}
      <SidebarHeader className="p-4 pb-2">
        <WorkspaceSwitcher
          interactive={!parked}
          workspace={workspace}
          onWorkspaceChange={onWorkspaceChange}
          onCreateWorkspace={onCreateWorkspace}
        />
        <SidebarSearch
          query={query}
          onQueryChange={setQuery}
          focusSignal={focusSignal}
        />
      </SidebarHeader>

      {/* The style hides the bar, so the edge fade marks overflow;
          scroll-py-10 = its 40px cap, so focused rows stay clear. */}
      <SidebarContent className="scroll-fade-y scroll-py-10 gap-4 px-4 py-2 [--scroll-fade-reveal:--spacing(8)]">
        {loading ? (
          <>
            <GroupSkeleton rows={1} />
            <GroupSkeleton rows={3} />
            <GroupSkeleton rows={4} />
          </>
        ) : noMatches ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">{SEARCH_ICON}</EmptyMedia>
              <EmptyTitle>No Matches</EmptyTitle>
              <EmptyDescription>
                Try another page name or clear the search.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {showHome ? (
              <SidebarGroup className="p-0">
                <SidebarMenu className="gap-0.5">
                  <PageItem
                    page={HOME_PAGE}
                    active={activePage === HOME_PAGE.id}
                    onNavigate={onNavigate}
                  />
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
            {groups.map((group) => (
              <SidebarGroup key={group.id} className="gap-0.5 p-0">
                <SidebarGroupLabel
                  id={`nav-label-${group.id}`}
                  className={GROUP_LABEL}
                >
                  {group.label}
                </SidebarGroupLabel>
                {/* Keyed by the search: a filtered group is a new record set,
                    and the tree only reads its records on mount. */}
                <NavTree
                  key={needle}
                  group={group}
                  labelId={`nav-label-${group.id}`}
                  activePage={activePage}
                  onNavigate={onNavigate}
                  searching={Boolean(needle)}
                />
              </SidebarGroup>
            ))}
            {/* A search shows only the pins it matches, and none when it
                matches none. */}
            {needle && shownPins.length === 0 ? null : (
              <PinnedGroup
                pinned={shownPins}
                activePage={activePage}
                onNavigate={onNavigate}
                onUnpin={onUnpin}
              />
            )}
          </>
        )}
      </SidebarContent>

      {/* Workspace pages and the account stay in reach below the scroll. */}
      <SidebarFooter className="p-4 pt-2">
        <SidebarMenu className="gap-0.5">
          {FOOTER_PAGES.map((page) => (
            <PageItem
              key={page.id}
              page={page}
              active={activePage === page.id}
              onNavigate={onNavigate}
              compact
            />
          ))}
        </SidebarMenu>
        <UserMenu
          interactive={!parked}
          onOpenSettings={() => onNavigate("settings")}
          onAccountAction={onAccountAction}
          onSignOut={onSignOut}
        />
      </SidebarFooter>
    </Sidebar>
  )
}