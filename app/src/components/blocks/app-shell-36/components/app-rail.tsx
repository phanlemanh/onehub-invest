import { cn } from "cn"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

import { PageLink, ROW, type Navigate } from "./app-sidebar"
import {
  FOOTER_PAGES,
  HOME_PAGE,
  isBranch,
  NAV_GROUPS,
  type NavBranch,
  type Page,
  type Workspace,
} from "./data"
import { SEARCH_ICON } from "./sidebar-search"
import { UserMenu, type AccountAction } from "./user-menu"
import { WorkspaceSwitcher } from "./workspace-switcher"

// Glyph-only rows: the column's ink on a 32px square, named by their tooltip.
const RAIL_ROW = cn(ROW, "size-8 justify-center p-2")

// The field's stand-in keeps its inset hairline, yielding to the focus ring.
const RAIL_SEARCH =
  "text-muted-foreground size-8 justify-center rounded-lg p-2 not-focus-visible:ring-1 not-focus-visible:ring-input not-focus-visible:ring-inset"

// app-shell-29 keeps the card's 40px band, so the tile and the portrait hold
// their line as the column narrows.
const CARD_BAND = "flex h-10 shrink-0 items-center"

function RailItem({
  page,
  active,
  onNavigate,
}: {
  page: Page
  active: boolean
  onNavigate: Navigate
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={page.label}
        className={RAIL_ROW}
        render={
          <PageLink
            pageId={page.id}
            active={active}
            onNavigate={onNavigate}
            aria-label={page.label}
          />
        }
      >
        {page.icon}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** A branch on the rail: its pages open in a side menu. */
function RailBranch({
  branch,
  activePage,
  onNavigate,
  interactive,
}: {
  branch: NavBranch
  activePage: string
  onNavigate: Navigate
  interactive: boolean
}) {
  const holdsActive = branch.children.some((page) => page.id === activePage)

  if (!interactive) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={holdsActive}
          tabIndex={-1}
          aria-label={branch.label}
          className={RAIL_ROW}
        >
          {branch.icon}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              isActive={holdsActive}
              tooltip={branch.label}
              aria-label={branch.label}
              className={RAIL_ROW}
            />
          }
        >
          {branch.icon}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="min-w-44"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>{branch.label}</DropdownMenuLabel>
            {branch.children.map((page) => (
              <DropdownMenuItem
                key={page.id}
                onClick={() => onNavigate(page.id)}
              >
                {page.icon}
                {page.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function AppRail({
  workspace,
  onWorkspaceChange,
  activePage,
  pinned,
  loading,
  onNavigate,
  onRevealSearch,
  onCreateWorkspace,
  onAccountAction,
  onSignOut,
  parked = false,
}: {
  workspace: Workspace
  onWorkspaceChange: (id: string) => void
  activePage: string
  pinned: Page[]
  loading: boolean
  onNavigate: Navigate
  /** Reopens the column with its search field focused. */
  onRevealSearch: () => void
  onCreateWorkspace?: () => void
  onAccountAction?: (action: AccountAction) => void
  onSignOut?: () => void
  /** Hidden while the column is open: its menus stand down. */
  parked?: boolean
}) {
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="none" data-state={state} className="w-full">
      {/* The column's 16px top and bottom; 8px sides seat 32px squares. */}
      <SidebarHeader className="px-2 pt-4 pb-2">
        <div className={CARD_BAND}>
          <WorkspaceSwitcher
            collapsed
            interactive={!parked}
            workspace={workspace}
            onWorkspaceChange={onWorkspaceChange}
            onCreateWorkspace={onCreateWorkspace}
          />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search"
              aria-label="Search navigation"
              aria-keyshortcuts="Meta+F Control+F"
              onClick={onRevealSearch}
              className={RAIL_SEARCH}
            >
              {SEARCH_ICON}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Same edge fade as the column; scroll-py-10 = its 40px cap. */}
      <SidebarContent className="scroll-fade-y scroll-py-10 gap-4 px-2 py-2 [--scroll-fade-reveal:--spacing(8)]">
        {loading ? (
          <div aria-hidden="true" className="flex flex-col gap-0.5">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="flex size-8 items-center justify-center"
              >
                <Skeleton className="size-4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <SidebarGroup className="p-0">
              <SidebarMenu className="gap-0.5">
                <RailItem
                  page={HOME_PAGE}
                  active={activePage === HOME_PAGE.id}
                  onNavigate={onNavigate}
                />
              </SidebarMenu>
            </SidebarGroup>
            {NAV_GROUPS.map((group) => (
              <SidebarGroup
                key={group.id}
                aria-label={group.label}
                className="p-0"
              >
                <SidebarMenu className="gap-0.5">
                  {group.entries.map((entry) =>
                    isBranch(entry) ? (
                      <RailBranch
                        key={entry.id}
                        interactive={!parked}
                        branch={entry}
                        activePage={activePage}
                        onNavigate={onNavigate}
                      />
                    ) : (
                      <RailItem
                        key={entry.id}
                        page={entry}
                        active={activePage === entry.id}
                        onNavigate={onNavigate}
                      />
                    )
                  )}
                </SidebarMenu>
              </SidebarGroup>
            ))}
            {pinned.length > 0 ? (
              <SidebarGroup aria-label="Pinned" className="p-0">
                <SidebarMenu className="gap-0.5">
                  {pinned.map((page) => (
                    <RailItem
                      key={page.id}
                      page={page}
                      active={activePage === page.id}
                      onNavigate={onNavigate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
          </>
        )}
      </SidebarContent>

      {/* pt-2 meets the scroll body's 8px; pb-4 is the column's 16px foot. */}
      <SidebarFooter className="px-2 pt-2 pb-4">
        <SidebarMenu className="gap-0.5">
          {FOOTER_PAGES.map((page) => (
            <RailItem
              key={page.id}
              page={page}
              active={activePage === page.id}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
        <div className={CARD_BAND}>
          <UserMenu
            collapsed
            interactive={!parked}
            onOpenSettings={() => onNavigate("settings")}
            onAccountAction={onAccountAction}
            onSignOut={onSignOut}
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}