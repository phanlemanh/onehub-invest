import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react"
import { Badge } from "@/components/reui/badge"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  ConnectionFormFields,
  sameDraft,
  validateConnection,
  type ConnectionFormValues,
} from "./connection-form-fields"
import { ConnectionOverviewTab } from "./connection-overview-tab"
import { checksForConnection, ConnectionTest } from "./connection-test"
import {
  AUTH_KINDS,
  draftOf,
  INTEGRATIONS,
  linkedOf,
  statusOf,
  type Connection,
  type ConnectionDraft,
  type Dataset,
  type SheetTab,
} from "./data"
import { DatasetsTab } from "./datasets-tab"
import { TOAST_ERROR_ICON, UI_ICONS } from "./icons"
import { PreviewTab } from "./preview-tab"
import {
  DotSeparator,
  EnvironmentFace,
  IntegrationLogo,
  StatusFace,
} from "./value-faces"

export type SheetState = {
  connectionId: string
  open: boolean
  tab: SheetTab
  /** The dataset the Preview tab shows; null picks the first linked one. */
  datasetId: string | null
}

const SHEET_TABS: { value: SheetTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "datasets", label: "Datasets" },
  { value: "preview", label: "Preview" },
  { value: "settings", label: "Settings" },
]

const FORM_ID = "devops-6-connection-form"

/** The floating inset shell the connection and New Connection sheets share. */
export const SHEET_SHELL =
  "inset-y-4 right-4 left-auto flex h-[calc(100svh-2rem)] w-[min(40rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none"

/** Pinned under the scrolling body; px-5 keeps it on the band's spine. */
export const SHEET_FOOTER =
  "bg-muted flex shrink-0 items-center gap-2 border-t px-5 py-3"

type SheetActions = {
  onTabChange: (tab: SheetTab) => void
  onDatasetChange: (datasetId: string) => void
  onClose: () => void
  onSync: (connection: Connection) => void
  onPausedToggle: (connection: Connection) => void
  onCredential: (connection: Connection, origin: HTMLElement) => void
  onToggleDataset: (
    connection: Connection,
    dataset: Dataset,
    linked: boolean,
    origin: HTMLElement | null
  ) => void
  onAcceptDrift: (connection: Connection, dataset: Dataset) => void
  onRefreshSchema: (connection: Connection) => void
  onDuplicate: (id: string) => void
  onDelete: (connection: Connection) => void
  onSave: (id: string, draft: ConnectionDraft) => void
}

/** Mono id with an inline copy swap; a refused clipboard says so. */
function ConnectionIdChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    }
  }, [])

  function handleCopy() {
    const failed = () =>
      toast.error("Copy failed", {
        icon: TOAST_ERROR_ICON,
        description: "Clipboard access was blocked.",
      })
    // Clipboard access can be refused (an iframe, an insecure origin), so both paths answer.
    if (!navigator.clipboard) {
      failed()
      return
    }
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      // Frozen demo guard: ?demo=frozen pins the demo, so no timer starts.
      if (document.documentElement.dataset.demo === "frozen") return
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000)
    }, failed)
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="text-muted-foreground min-w-0 truncate font-mono text-xs">
        {id}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                copied ? "Connection ID copied" : "Copy connection ID"
              }
              onClick={handleCopy}
            />
          }
        >
          {copied ? UI_ICONS.check : UI_ICONS.copy}
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied" : "Copy ID"}</TooltipContent>
      </Tooltip>
    </div>
  )
}

function ConnectionSheetView({
  connection,
  takenNames,
  tab,
  datasetId,
  position,
  onStep,
  actions,
}: {
  connection: Connection
  takenNames: string[]
  tab: SheetTab
  datasetId: string | null
  position: { index: number; total: number } | null
  onStep: (direction: 1 | -1) => void
  actions: SheetActions
}) {
  const source = draftOf(connection)
  const [draft, setDraft] = useState<ConnectionFormValues>({
    ...source,
    secret: "",
  })

  // A save or an Undo changes the record outside the form: a clean draft follows it.
  const [seenSource, setSeenSource] = useState(source)
  if (!sameDraft(seenSource, source)) {
    setSeenSource(source)
    if (sameDraft(draft, seenSource)) setDraft({ ...source, secret: "" })
  }

  const dirty = !sameDraft(draft, source)
  const valid =
    Object.keys(
      validateConnection(draft, {
        integration: connection.integration,
        takenNames,
        needsSecret: false,
      })
    ).length === 0
  const status = statusOf(connection)
  const auth = AUTH_KINDS[connection.credential.kind]
  const checks = useMemo(() => checksForConnection(connection), [connection])

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || !valid) return
    const clean: ConnectionDraft = {
      name: draft.name.trim(),
      environment: draft.environment,
      endpoint: draft.endpoint.trim(),
      frequency: draft.frequency,
      ownerId: draft.ownerId,
      alertOnFailure: draft.alertOnFailure,
    }
    // The form holds the saved values, so it reads pristine once the record updates.
    setDraft({ ...clean, secret: "" })
    actions.onSave(connection.id, clean)
  }

  return (
    <>
      {/* Header band */}
      <div className="flex shrink-0 flex-col border-b px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <ConnectionIdChip id={connection.id} />
          <div className="flex shrink-0 items-center gap-1">
            {position ? (
              <ButtonGroup aria-label="Connections">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Previous connection"
                        disabled={position.index === 0 || dirty}
                        onClick={() => onStep(-1)}
                      />
                    }
                  >
                    {UI_ICONS.previous}
                  </TooltipTrigger>
                  <TooltipContent>Previous connection</TooltipContent>
                </Tooltip>
                <ButtonGroupText className="min-w-16 justify-center text-xs tabular-nums">
                  {position.index + 1} of {position.total}
                </ButtonGroupText>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Next connection"
                        disabled={
                          position.index === position.total - 1 || dirty
                        }
                        onClick={() => onStep(1)}
                      />
                    }
                  >
                    {UI_ICONS.next}
                  </TooltipTrigger>
                  <TooltipContent>Next connection</TooltipContent>
                </Tooltip>
              </ButtonGroup>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More connection actions"
                  />
                }
              >
                {UI_ICONS.more}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="tabular-nums">
                    {connection.id}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={(event) =>
                      actions.onCredential(
                        connection,
                        event.currentTarget instanceof HTMLElement
                          ? event.currentTarget
                          : document.body
                      )
                    }
                  >
                    {UI_ICONS.key}
                    {auth.renewable
                      ? "Renew Authorization"
                      : "Rotate Credential"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => actions.onRefreshSchema(connection)}
                  >
                    {UI_ICONS.scan}
                    Refresh Schema
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => actions.onDuplicate(connection.id)}
                  >
                    {UI_ICONS.copy}
                    Duplicate
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDelete(connection)}
                  >
                    {UI_ICONS.trash}
                    Delete Connection
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={actions.onClose}
            >
              {UI_ICONS.close}
            </Button>
          </div>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-3">
          <IntegrationLogo integration={connection.integration} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <SheetTitle className="min-w-0 truncate">
                {connection.name}
              </SheetTitle>
              <StatusFace status={status} />
            </div>
            <SheetDescription>
              <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span>
                  {INTEGRATIONS[connection.integration].label}{" "}
                  {INTEGRATIONS[connection.integration].engine}
                </span>
                <DotSeparator />
                <EnvironmentFace environment={connection.environment} />
                <DotSeparator />
                <span className="tabular-nums">
                  {linkedOf(connection).length} of {connection.datasets.length}{" "}
                  datasets linked
                </span>
              </span>
            </SheetDescription>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={connection.paused || connection.syncing}
            onClick={() => actions.onSync(connection)}
          >
            {connection.syncing ? (
              <Spinner
                role="presentation"
                aria-label={undefined}
                aria-hidden="true"
              />
            ) : (
              UI_ICONS.sync
            )}
            {connection.syncing ? "Syncing" : "Sync Now"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.onPausedToggle(connection)}
          >
            {connection.paused ? UI_ICONS.resume : UI_ICONS.pause}
            {connection.paused ? "Resume" : "Pause"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.onTabChange("preview")}
          >
            {UI_ICONS.rows}
            Preview
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = SHEET_TABS.find((item) => item.value === value)
          if (next) actions.onTabChange(next.value)
        }}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b px-5">
          <TabsList
            variant="line"
            className="no-scrollbar -mb-px h-10! max-w-full gap-5 overflow-x-auto bg-transparent p-0 max-sm:gap-3"
          >
            {SHEET_TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-full! flex-none gap-1.5 px-0 text-sm font-medium after:-bottom-px!"
              >
                {item.label}
                {item.value === "datasets" ? (
                  <Badge
                    variant="outline"
                    radius="full"
                    className="tabular-nums"
                  >
                    {connection.datasets.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Only the body scrolls; the header band, tabs and footer stay put. */}
        <div className="scroll-fade-y no-scrollbar min-h-0 flex-1 scroll-py-10 overflow-y-auto">
          <div className="flex flex-col gap-4 px-5 py-4">
            <TabsContent value="overview" className="flex flex-col gap-4">
              <ConnectionOverviewTab
                connection={connection}
                onCredential={(origin) =>
                  actions.onCredential(connection, origin)
                }
                onResume={() => actions.onPausedToggle(connection)}
                onShowDatasets={() => actions.onTabChange("datasets")}
              />
            </TabsContent>
            <TabsContent value="datasets" className="flex flex-col gap-3">
              <DatasetsTab
                connection={connection}
                onToggle={(dataset, linked, origin) =>
                  actions.onToggleDataset(connection, dataset, linked, origin)
                }
                onPreview={(dataset) => {
                  actions.onDatasetChange(dataset.id)
                  actions.onTabChange("preview")
                }}
                onAccept={(dataset) =>
                  actions.onAcceptDrift(connection, dataset)
                }
                onRefresh={() => actions.onRefreshSchema(connection)}
              />
            </TabsContent>
            <TabsContent value="preview" className="flex flex-col gap-3">
              <PreviewTab
                connection={connection}
                datasetId={datasetId}
                onDatasetChange={actions.onDatasetChange}
                onLink={(dataset) =>
                  actions.onToggleDataset(connection, dataset, true, null)
                }
                onAccept={(dataset) =>
                  actions.onAcceptDrift(connection, dataset)
                }
                onCredential={(origin) =>
                  actions.onCredential(connection, origin)
                }
              />
            </TabsContent>
            <TabsContent value="settings" className="flex flex-col gap-4">
              <form
                id={FORM_ID}
                noValidate
                onSubmit={handleSave}
                className="flex flex-col gap-4"
              >
                <ConnectionFormFields
                  idPrefix="devops-6-edit"
                  integration={connection.integration}
                  values={draft}
                  onChange={(patch) =>
                    setDraft((current) => ({ ...current, ...patch }))
                  }
                  variant="edit"
                  takenNames={takenNames}
                />
              </form>
              <ConnectionTest
                checks={checks}
                description={`Runs against the saved ${INTEGRATIONS[connection.integration].endpointLabel.toLowerCase()} and credential`}
              />
            </TabsContent>
          </div>
        </div>

        {tab === "settings" ? (
          <div className={SHEET_FOOTER}>
            <Button
              type="button"
              variant="outline"
              className="ms-auto"
              disabled={!dirty}
              onClick={() => setDraft({ ...source, secret: "" })}
            >
              Discard
            </Button>
            <Button type="submit" form={FORM_ID} disabled={!dirty || !valid}>
              Save Changes
            </Button>
          </div>
        ) : null}
      </Tabs>
    </>
  )
}

export function ConnectionSheet({
  connection,
  takenNames,
  open,
  tab,
  datasetId,
  position,
  returnFocusRef,
  onStep,
  ...actions
}: SheetActions & {
  connection: Connection | null
  /** Every other connection's name, for the unique-name check. */
  takenNames: string[]
  open: boolean
  tab: SheetTab
  datasetId: string | null
  position: { index: number; total: number } | null
  returnFocusRef: RefObject<HTMLElement | null>
  onStep: (direction: 1 | -1) => void
}) {
  const popupRef = useRef<HTMLDivElement>(null)
  // Lives outside the keyed view, so a step's announcement survives the remount.
  const [announcement, setAnnouncement] = useState("")

  return (
    // Mounted closed and driven by a boolean: a first render with open true
    // kills the enter transition.
    <Sheet open={open} onOpenChange={(next) => !next && actions.onClose()}>
      <SheetContent
        ref={popupRef}
        side="right"
        showCloseButton={false}
        // Focus the panel itself: a first control would pop its tooltip.
        initialFocus={popupRef}
        finalFocus={() => {
          const node = returnFocusRef.current
          // null: a delete confirm opened as the sheet closed and holds focus.
          if (node === null) return false
          return node.isConnected ? node : true
        }}
        className={SHEET_SHELL}
      >
        {connection ? (
          <ConnectionSheetView
            key={connection.id}
            connection={connection}
            takenNames={takenNames}
            tab={tab}
            datasetId={datasetId}
            position={position}
            onStep={(direction) => {
              if (!position) return
              const index = position.index + direction
              setAnnouncement(`Connection ${index + 1} of ${position.total}`)
              onStep(direction)
            }}
            actions={actions}
          />
        ) : (
          <SheetTitle className="sr-only">Connection</SheetTitle>
        )}
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </SheetContent>
    </Sheet>
  )
}