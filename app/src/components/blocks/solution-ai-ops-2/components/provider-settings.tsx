"use client"

import * as React from "react"
import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameDescription,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  PRIORITY_OPTIONS,
  PROVIDER_CONNECTIONS,
  PROVIDER_STATUS_META,
  PROVIDER_WIDGET_CARDS,
  ROUTE_OPTIONS,
  type ProviderConnection,
  type ProviderId,
  type ProviderPriority,
  type ProviderStatus,
  type ProviderWidgetCard,
} from "./data"
import { ChevronDownIcon, PlugZapIcon, DownloadIcon, FileDownIcon, EllipsisVerticalIcon, PauseIcon, PlayIcon, ArrowUpDownIcon, RefreshCwIcon, RouteIcon, SaveIcon, Settings2Icon, RotateCcwIcon } from "lucide-react"

type ProviderStatusMap = Record<ProviderId, ProviderStatus>
type ProviderPriorityMap = Record<ProviderId, ProviderPriority>
type RouteOption = (typeof ROUTE_OPTIONS)[number]

type DialogState =
  | { type: "connect"; provider: ProviderConnection }
  | { type: "save"; provider?: undefined }
  | null

type IconName =
  | "chevron"
  | "connect"
  | "download"
  | "export"
  | "menu"
  | "pause"
  | "play"
  | "priority"
  | "refresh"
  | "route"
  | "save"
  | "settings"
  | "test"

type IconPlacement = "inline-start" | "inline-end"

const ICON_SPECS: Record<
  IconName,
  (className?: string, dataIcon?: IconPlacement) => React.ReactNode
> = {
  chevron: (className, dataIcon) => (
    <ChevronDownIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  connect: (className, dataIcon) => (
    <PlugZapIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  download: (className, dataIcon) => (
    <DownloadIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  export: (className, dataIcon) => (
    <FileDownIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  menu: (className, dataIcon) => (
    <EllipsisVerticalIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  pause: (className, dataIcon) => (
    <PauseIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  play: (className, dataIcon) => (
    <PlayIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  priority: (className, dataIcon) => (
    <ArrowUpDownIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  refresh: (className, dataIcon) => (
    <RefreshCwIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  route: (className, dataIcon) => (
    <RouteIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  save: (className, dataIcon) => (
    <SaveIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  settings: (className, dataIcon) => (
    <Settings2Icon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
  test: (className, dataIcon) => (
    <RotateCcwIcon className={className} data-icon={dataIcon} aria-hidden="true" />
  ),
}

function ProviderIconGlyph({
  className,
  icon,
  name,
}: {
  className?: string
  icon?: IconPlacement
  name: IconName
}) {
  return ICON_SPECS[name](className ?? "size-4", icon)
}

function createInitialStatuses(): ProviderStatusMap {
  return PROVIDER_CONNECTIONS.reduce((map, provider) => {
    map[provider.id] = provider.status
    return map
  }, {} as ProviderStatusMap)
}

function createInitialPriorities(): ProviderPriorityMap {
  return PROVIDER_CONNECTIONS.reduce((map, provider) => {
    map[provider.id] = provider.priority
    return map
  }, {} as ProviderPriorityMap)
}

function StatusBadge({ status }: { status: ProviderStatus }) {
  const meta = PROVIDER_STATUS_META[status]

  return (
    <Badge size="sm" variant={meta.variant}>
      {meta.label}
    </Badge>
  )
}

function ProviderLogo({ children }: { children: React.ReactNode }) {
  return (
    <Item className="bg-muted/60 border-background flex size-10 shrink-0 content-center items-center justify-center border-2 p-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border">
      <ItemMedia variant="icon" className="size-auto">
        {children}
      </ItemMedia>
    </Item>
  )
}

function PriorityMenu({
  onChange,
  priority,
}: {
  onChange: (priority: ProviderPriority) => void
  priority: ProviderPriority
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`Priority ${priority}`}
            size="sm"
            type="button"
            variant="outline"
          >
            <ProviderIconGlyph name="priority" icon="inline-start" />P{priority}
            <ProviderIconGlyph name="chevron" icon="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        <DropdownMenuGroup>
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuItem key={option} onClick={() => onChange(option)}>
              <ProviderIconGlyph name="priority" />
              Priority {option}
              {priority === option ? (
                <span className="text-muted-foreground ml-auto text-xs">
                  Active
                </span>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProviderActionsMenu({
  onConnect,
  onPauseToggle,
  onTestProvider,
  provider,
}: {
  onConnect: (provider: ProviderConnection) => void
  onPauseToggle: (provider: ProviderConnection, enabled: boolean) => void
  onTestProvider: (provider: ProviderConnection) => void
  provider: ProviderConnection
}) {
  const isPaused = provider.status === "paused"
  const needsKey = provider.status === "missing_key"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`${provider.name} actions`}
            size="icon-xs"
            type="button"
            variant="outline"
          >
            <ProviderIconGlyph name="menu" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onTestProvider(provider)}>
          <ProviderIconGlyph name="test" />
          Test endpoint
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.success(`${provider.name} credentials rotated`)}
        >
          <ProviderIconGlyph name="settings" />
          Rotate credential
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.success(`${provider.name} fallback rebuilt`)}
        >
          <ProviderIconGlyph name="refresh" />
          Rebuild fallback
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {needsKey ? (
          <DropdownMenuItem onClick={() => onConnect(provider)}>
            <ProviderIconGlyph name="connect" />
            Connect key
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onPauseToggle(provider, isPaused)}>
            <ProviderIconGlyph name={isPaused ? "play" : "pause"} />
            {isPaused ? "Resume provider" : "Pause provider"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProviderRow({
  onConnect,
  onPauseToggle,
  onPriorityChange,
  onTestProvider,
  provider,
}: {
  onConnect: (provider: ProviderConnection) => void
  onPauseToggle: (provider: ProviderConnection, enabled: boolean) => void
  onPriorityChange: (providerId: ProviderId, priority: ProviderPriority) => void
  onTestProvider: (provider: ProviderConnection) => void
  provider: ProviderConnection
}) {
  const isPaused = provider.status === "paused"
  const needsKey = provider.status === "missing_key"
  const isConnected =
    provider.status !== "paused" && provider.status !== "missing_key"

  return (
    <Item>
      <ItemMedia variant="icon">
        <ProviderLogo>{provider.icon}</ProviderLogo>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-1">
        <ItemTitle className="min-w-0 gap-2">
          <span className="min-w-0 truncate">{provider.name}</span>
          <StatusBadge status={provider.status} />
          <Badge className="hidden sm:inline-flex" size="sm" variant="outline">
            {provider.latency}
          </Badge>
        </ItemTitle>
        <ItemDescription className="min-w-0">
          <span className="block max-w-full truncate">
            <span className="font-mono text-[13px]">{provider.id}</span>
            <span aria-hidden="true"> / </span>
            <span>{provider.routeId}</span>
            <span aria-hidden="true"> / </span>
            <span>{provider.fallbackRole}</span>
          </span>
        </ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full justify-end gap-2 pt-2 sm:basis-auto sm:self-center sm:pt-0">
        <Button
          className="hidden md:inline-flex"
          onClick={() => onTestProvider(provider)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ProviderIconGlyph name="test" icon="inline-start" />
          Test
        </Button>
        <PriorityMenu
          priority={provider.priority}
          onChange={(priority) => onPriorityChange(provider.id, priority)}
        />
        {needsKey ? (
          <Button
            onClick={() => onConnect(provider)}
            size="sm"
            type="button"
            variant="outline"
          >
            <ProviderIconGlyph name="connect" icon="inline-start" />
            Connect
          </Button>
        ) : (
          <Switch
            aria-label={`${isPaused ? "Resume" : "Pause"} ${provider.name}`}
            checked={isConnected}
            onCheckedChange={(enabled: boolean) =>
              onPauseToggle(provider, enabled)
            }
          />
        )}
        <ProviderActionsMenu
          provider={provider}
          onConnect={onConnect}
          onPauseToggle={onPauseToggle}
          onTestProvider={onTestProvider}
        />
      </ItemActions>
    </Item>
  )
}

function ProviderWidgetCard({ card }: { card: ProviderWidgetCard }) {
  return (
    <Frame>
      <FramePanel className="flex flex-col gap-3 p-3.5!">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Item
              className={`bg-secondary flex size-9 items-center justify-center ${card.iconColor} p-0`}
            >
              <ItemMedia variant="icon" className="size-auto">
                {card.icon}
              </ItemMedia>
            </Item>
            <div className="min-w-0 space-y-0.5">
              <div className="text-foreground truncate text-sm font-medium">
                {card.title}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {card.dateRange}
              </div>
            </div>
          </div>
          <Badge variant={card.badge.color}>
            {card.badge.icon}
            {card.badge.text}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="text-foreground text-2xl font-semibold tracking-tight">
            {card.value}
          </div>
          <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-right text-xs">
            <span>{card.detailLabel}</span>
            <span className="text-foreground font-medium">
              {card.detailValue}
            </span>
          </div>
        </div>
      </FramePanel>
    </Frame>
  )
}

function ProviderWidgetGrid() {
  return (
    <div className="@container grid w-full grow grid-cols-1 gap-3 @2xl:grid-cols-2">
      {PROVIDER_WIDGET_CARDS.map((card) => (
        <ProviderWidgetCard key={card.title} card={card} />
      ))}
    </div>
  )
}

function SettingsDialog({
  dialog,
  onConnect,
  onOpenChange,
  onSave,
}: {
  dialog: DialogState
  onConnect: (provider: ProviderConnection) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}) {
  const isConnectDialog = dialog?.type === "connect"
  const title = isConnectDialog
    ? `Connect ${dialog.provider.name}`
    : "Save provider changes"
  const description = isConnectDialog
    ? "Attach the missing credential before this provider can receive traffic."
    : "Save the current provider priority, fallback, and endpoint state."

  return (
    <Dialog open={dialog !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {isConnectDialog ? (
          <Item className="items-center px-3.5! py-2! sm:px-4!">
            <ItemMedia variant="icon">
              <ProviderLogo>{dialog.provider.icon}</ProviderLogo>
            </ItemMedia>
            <ItemContent className="min-w-0 gap-1">
              <ItemTitle className="min-w-0 gap-2">
                <span className="min-w-0 truncate">{dialog.provider.name}</span>
                <StatusBadge status={dialog.provider.status} />
              </ItemTitle>
              <ItemDescription className="min-w-0">
                <span className="truncate font-mono text-[13px]">
                  {dialog.provider.credential}
                </span>
              </ItemDescription>
            </ItemContent>
          </Item>
        ) : (
          <p className="text-muted-foreground text-sm">
            The active route will use the updated ordering immediately after
            save. Degraded and paused providers remain visible for audit review.
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            onClick={() => {
              if (isConnectDialog) {
                onConnect(dialog.provider)
                return
              }

              onSave()
            }}
            type="button"
          >
            {isConnectDialog ? "Connect provider" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProviderSettings() {
  const [activeRoute, setActiveRoute] = React.useState<RouteOption>(
    ROUTE_OPTIONS[0]
  )
  const [statuses, setStatuses] = React.useState<ProviderStatusMap>(
    createInitialStatuses
  )
  const [priorities, setPriorities] = React.useState<ProviderPriorityMap>(
    createInitialPriorities
  )
  const [isDirty, setIsDirty] = React.useState(false)
  const [dialog, setDialog] = React.useState<DialogState>(null)

  const providerRows = React.useMemo(
    () =>
      PROVIDER_CONNECTIONS.map((provider) => ({
        ...provider,
        priority: priorities[provider.id],
        status: statuses[provider.id],
      })).sort((a, b) => a.priority - b.priority),
    [priorities, statuses]
  )

  const routeLabel = activeRoute

  const handlePriorityChange = React.useCallback(
    (providerId: ProviderId, nextPriority: ProviderPriority) => {
      setPriorities((current) => {
        const previousPriority = current[providerId]
        const conflictProvider = Object.entries(current).find(
          ([id, priority]) => id !== providerId && priority === nextPriority
        )?.[0] as ProviderId | undefined

        const next = {
          ...current,
          [providerId]: nextPriority,
        }

        if (conflictProvider) {
          next[conflictProvider] = previousPriority
        }

        return next
      })
      setIsDirty(true)
    },
    []
  )

  const handlePauseToggle = React.useCallback(
    (provider: ProviderConnection, enabled: boolean) => {
      setStatuses((current) => ({
        ...current,
        [provider.id]: enabled
          ? provider.status === "missing_key"
            ? "missing_key"
            : "connected"
          : "paused",
      }))
      setIsDirty(true)
      toast.info(
        enabled ? `${provider.name} resumed` : `${provider.name} paused`
      )
    },
    []
  )

  const handleTestProvider = React.useCallback(
    (provider: ProviderConnection) => {
      if (provider.status === "missing_key") {
        toast.error(`${provider.name} needs a credential before testing`)
        return
      }

      toast.success(`${provider.name} endpoint test queued`)
    },
    []
  )

  const handleTestAll = React.useCallback(() => {
    toast.success("Endpoint tests queued for connected providers")
  }, [])

  const handleConfirmConnect = React.useCallback(
    (provider: ProviderConnection) => {
      setStatuses((current) => ({
        ...current,
        [provider.id]: "connected",
      }))
      setDialog(null)
      setIsDirty(true)
      toast.success(`${provider.name} connected`)
    },
    []
  )

  const handleSave = React.useCallback(() => {
    setDialog(null)
    setIsDirty(false)
    toast.success("Provider connection changes saved")
  }, [])

  const handleExport = React.useCallback(() => {
    toast.success("Provider routing export prepared")
  }, [])

  return (
    <>
      <div className="flex w-full max-w-4xl flex-col gap-3">
        <Frame className="text-foreground w-full">
          <FramePanel className="flex flex-col items-start gap-3 p-3.5! sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-px">
              <FrameTitle>Provider Settings</FrameTitle>
              <FrameDescription>
                {routeLabel} priority, fallback, and endpoint health
              </FrameDescription>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <ButtonGroup>
                <Select
                  value={activeRoute}
                  onValueChange={(value) => {
                    if (value) {
                      setActiveRoute(value)
                    }
                  }}
                >
                  <SelectTrigger
                    aria-label="Route"
                    className="w-[11rem]"
                    size="sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTE_OPTIONS.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleTestAll}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ProviderIconGlyph name="test" icon="inline-start" />
                  Test All
                </Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button
                  onClick={handleExport}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ProviderIconGlyph name="export" icon="inline-start" />
                  Export
                </Button>
                <Button
                  aria-label={isDirty ? "Save connection changes" : "Save"}
                  onClick={() => setDialog({ type: "save" })}
                  size="sm"
                  type="button"
                >
                  <ProviderIconGlyph name="save" icon="inline-start" />
                  Save
                </Button>
              </ButtonGroup>
            </div>
          </FramePanel>
        </Frame>

        <ProviderWidgetGrid />

        <Frame stacked className="text-foreground w-full">
          {providerRows.map((provider) => (
            <FramePanel key={provider.id} className="p-0!">
              <ProviderRow
                provider={provider}
                onConnect={(nextProvider) =>
                  setDialog({ type: "connect", provider: nextProvider })
                }
                onPauseToggle={handlePauseToggle}
                onPriorityChange={handlePriorityChange}
                onTestProvider={handleTestProvider}
              />
            </FramePanel>
          ))}
        </Frame>
      </div>

      <SettingsDialog
        dialog={dialog}
        onConnect={handleConfirmConnect}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null)
          }
        }}
        onSave={handleSave}
      />
    </>
  )
}