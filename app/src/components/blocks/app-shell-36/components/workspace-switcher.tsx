import { IconTile } from "@/components/reui/icon-tile"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { WORKSPACES, type Workspace } from "./data"
import {
  CARD_CHEVRON,
  CARD_META,
  CARD_NAME,
  CARD_TEXT,
  CARD_TILE,
  CARD_TRIGGER,
  MENU_TILE,
  RAIL_CARD,
  WorkspaceTile,
} from "./value-faces"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

export function WorkspaceSwitcher({
  workspace,
  onWorkspaceChange,
  onCreateWorkspace,
  collapsed = false,
  interactive = true,
}: {
  workspace: Workspace
  onWorkspaceChange: (id: string) => void
  onCreateWorkspace?: () => void
  /** The folded rail keeps only the tile, on app-shell-29's folded card. */
  collapsed?: boolean
  /** The tree the fold has hidden draws the same card without its menu, so
   * the shell never holds two triggers for one workspace. */
  interactive?: boolean
}) {
  const label = collapsed
    ? `Switch workspace, current ${workspace.name}`
    : undefined
  // The account card's face: a 24px mark, name over meta; the rail keeps the mark.
  const face = collapsed ? (
    <WorkspaceTile workspace={workspace} className={CARD_TILE} />
  ) : (
    <>
      <WorkspaceTile workspace={workspace} className={CARD_TILE} />
      {/* The printed name names the button, so speech matches what shows. */}
      <span className={CARD_TEXT}>
        <span className="sr-only">Switch workspace, current</span>
        <span className={CARD_NAME}>{workspace.name}</span>
        <span className={CARD_META}>{workspace.environment}</span>
      </span>
      <ChevronsUpDownIcon aria-hidden="true" className={CARD_CHEVRON} />
    </>
  )

  if (!interactive) {
    return collapsed ? (
      <Button
        type="button"
        variant="ghost"
        tabIndex={-1}
        aria-label={label}
        className={RAIL_CARD}
      >
        {face}
      </Button>
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tabIndex={-1} className={CARD_TRIGGER}>
            {face}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const menu = (
    <DropdownMenu>
      {collapsed ? (
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              aria-label={label}
              className={RAIL_CARD}
            />
          }
        >
          {face}
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={<SidebarMenuButton size="lg" className={CARD_TRIGGER} />}
        >
          {face}
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        side={collapsed ? "right" : "bottom"}
        align="start"
        sideOffset={collapsed ? 8 : 6}
        className="w-60"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            Workspaces
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={workspace.id}
            onValueChange={(id) => onWorkspaceChange(String(id))}
          >
            {WORKSPACES.map((item) => (
              <DropdownMenuRadioItem
                key={item.id}
                value={item.id}
                closeOnClick
                // The check sits 10px from the menu edge in the primary ink.
                className="[&_[data-slot=dropdown-menu-radio-item-indicator]]:text-primary gap-2.5 [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-1.5"
              >
                <WorkspaceTile workspace={item} className={MENU_TILE} />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {item.environment}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateWorkspace} className="gap-2.5">
          <IconTile
            variant="outline"
            size="sm"
            aria-hidden="true"
            className={`text-muted-foreground border-dashed ${MENU_TILE}`}
          >
            <PlusIcon aria-hidden="true" />
          </IconTile>
          <span className="grid min-w-0 flex-1">
            <span className="text-sm font-medium">New Workspace</span>
            <span className="text-muted-foreground truncate text-xs">
              Collaborate with others.
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return collapsed ? (
    menu
  ) : (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  )
}