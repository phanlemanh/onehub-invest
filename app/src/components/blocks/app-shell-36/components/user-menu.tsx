import { cn } from "cn"
import { useTheme } from "next-themes"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { THEME_OPTIONS, USER } from "./data"
import {
  CARD_CHEVRON,
  CARD_META,
  CARD_NAME,
  CARD_TEXT,
  CARD_TRIGGER,
  RAIL_CARD,
} from "./value-faces"
import { ChevronsUpDownIcon, UserIcon, KeyRoundIcon, InboxIcon, CalendarClockIcon, SettingsIcon, BookOpenIcon, LifeBuoyIcon, PaletteIcon, LogOutIcon } from "lucide-react"

/** Account items the host app opens: its security, accounts, roster and help pages. */
export type AccountAction =
  "security" | "accounts" | "roster" | "runbooks" | "support"

function ThemeSegmentedToggle() {
  const { theme, setTheme } = useTheme()
  // The menu mounts on open, long after the theme resolves: no hydration gate.
  const currentTheme = theme ?? "system"

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="bg-muted/60 inline-flex items-center gap-0.5 rounded-full p-0.5"
    >
      {THEME_OPTIONS.map(({ value, label, icon }) => {
        const isActive = currentTheme === value
        return (
          <Button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            variant="ghost"
            size="icon-xs"
            onClick={() => setTheme(value)}
            className={cn(
              "rounded-full [&_svg]:size-3.5",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {icon}
          </Button>
        )
      })}
    </div>
  )
}

export function UserMenu({
  onOpenSettings,
  onAccountAction,
  onSignOut,
  collapsed = false,
  interactive = true,
}: {
  onOpenSettings: () => void
  onAccountAction?: (action: AccountAction) => void
  onSignOut?: () => void
  /** The folded rail keeps only the portrait, on app-shell-29's folded card. */
  collapsed?: boolean
  /** The tree the fold has hidden draws the same card without its menu, so
   * the shell never holds two triggers for one account. */
  interactive?: boolean
}) {
  const { isMobile } = useSidebar()
  const label = collapsed ? `Open account menu for ${USER.name}` : undefined
  // The printed name and role name the card; the photo repeats them.
  const portrait = (
    <Avatar
      size="sm"
      aria-hidden="true"
      className="size-6 rounded-md after:rounded-md"
    >
      <AvatarImage src={USER.avatar} alt="" className="rounded-md" />
      <AvatarFallback className="rounded-md text-[10px]">
        {USER.initials}
      </AvatarFallback>
    </Avatar>
  )
  const face = collapsed ? (
    portrait
  ) : (
    <>
      {portrait}
      <span className={CARD_TEXT}>
        <span className={CARD_NAME}>{USER.name}</span>
        <span className={CARD_META}>{USER.role}</span>
      </span>
      <ChevronsUpDownIcon className={CARD_CHEVRON} aria-hidden="true" />
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

      {/* align start on mobile: the rail is narrower than the menu, and an
              end-aligned popup clamps to the screen edge on radix. */}
      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "start" : "end"}
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
            <Avatar className="size-8 rounded-md after:rounded-md">
              <AvatarImage
                src={USER.avatar}
                alt={USER.name}
                className="rounded-md"
              />
              <AvatarFallback className="rounded-md text-xs">
                {USER.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-semibold">
                {USER.name}
              </span>
              <span className="text-muted-foreground truncate text-xs font-normal">
                {USER.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Who you are and how you get in. */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onOpenSettings}>
            <UserIcon aria-hidden="true" />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccountAction?.("security")}>
            <KeyRoundIcon aria-hidden="true" />
            Sign-In Security
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccountAction?.("accounts")}>
            <InboxIcon aria-hidden="true" />
            Manage Accounts
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* How this engineer works the on-call rotation. */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAccountAction?.("roster")}>
            <CalendarClockIcon aria-hidden="true" />
            Shift Roster
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenSettings}>
            <SettingsIcon aria-hidden="true" />
            Preferences
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Where an engineer looks things up. */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAccountAction?.("runbooks")}>
            <BookOpenIcon aria-hidden="true" />
            Runbooks
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccountAction?.("support")}>
            <LifeBuoyIcon aria-hidden="true" />
            Help & Support
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* The swatches set a value in place, so the menu outlives the click. */}
          <DropdownMenuItem
            closeOnClick={false}
            className="cursor-default focus:bg-transparent!"
          >
            <PaletteIcon aria-hidden="true" />
            Theme
            <div className="ml-auto">
              <ThemeSegmentedToggle />
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onSignOut}>
          <LogOutIcon aria-hidden="true" />
          Sign Out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
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