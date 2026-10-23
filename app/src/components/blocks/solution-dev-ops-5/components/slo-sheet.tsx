import {
  useEffect,
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
  draftOf,
  formatObjective,
  type SheetTab,
  type Slo,
  type SloDraft,
} from "./data"
import { TOAST_ERROR_ICON, UI_ICONS } from "./icons"
import { SloBurnTab } from "./slo-burn-tab"
import { SloEventsTab } from "./slo-events-tab"
import { sameDraft, SloFormFields, validateDraft } from "./slo-form-fields"
import { derive } from "./slo-math"
import { SloOverviewTab } from "./slo-overview-tab"
import { DotSeparator, ServiceFace, SliFace, StatusFace } from "./value-faces"

export type SheetState = { sloId: string; open: boolean; tab: SheetTab }

const SHEET_TABS: { value: SheetTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "burn", label: "Burn Rate" },
  { value: "events", label: "Events" },
  { value: "settings", label: "Settings" },
]

const FORM_ID = "devops-5-slo-form"

/** The floating inset shell the SLO and New SLO sheets share. */
export const SHEET_SHELL =
  "inset-y-4 right-4 left-auto flex h-[calc(100svh-2rem)] w-[min(36rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-xl p-0 outline-none"

/** Pinned under the scrolling body; px-5 keeps it on the band's spine. */
export const SHEET_FOOTER =
  "bg-muted flex shrink-0 items-center gap-2 border-t px-5 py-3"

type SheetActions = {
  onTabChange: (tab: SheetTab) => void
  onClose: () => void
  onAlertingToggle: (slo: Slo) => void
  onExcludeToggle: (sloId: string, eventId: string, excluded: boolean) => void
  onDuplicate: (id: string) => void
  onCopyYaml: (slo: Slo) => void
  onFocus: (id: string) => void
  onDelete: (slo: Slo) => void
  onSave: (id: string, draft: SloDraft) => void
}

/** Mono id with an inline copy swap; a refused clipboard says so. */
function SloIdChip({ id }: { id: string }) {
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
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={copied ? "SLO ID copied" : "Copy SLO ID"}
        onClick={handleCopy}
      >
        {copied ? UI_ICONS.check : UI_ICONS.copy}
      </Button>
    </div>
  )
}

function SloSheetView({
  slo,
  tab,
  position,
  onStep,
  actions,
}: {
  slo: Slo
  tab: SheetTab
  position: { index: number; total: number } | null
  onStep: (direction: 1 | -1) => void
  actions: SheetActions
}) {
  const source = draftOf(slo)
  const [draft, setDraft] = useState<SloDraft>(source)

  // A save or an Undo changes the record outside the form: a clean draft follows it.
  const [seenSource, setSeenSource] = useState(source)
  if (!sameDraft(seenSource, source)) {
    setSeenSource(source)
    if (sameDraft(draft, seenSource)) setDraft(source)
  }

  const dirty = !sameDraft(draft, source)
  const valid = Object.keys(validateDraft(draft)).length === 0
  const { status } = derive(slo)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || !valid) return
    const clean = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
    }
    // The form holds the saved values, so it reads pristine once the record updates.
    setDraft(clean)
    actions.onSave(slo.id, clean)
  }

  return (
    <>
      {/* Header band */}
      <div className="flex shrink-0 flex-col border-b px-5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <SloIdChip id={slo.id} />
          <div className="flex shrink-0 items-center gap-1">
            {position ? (
              <ButtonGroup aria-label="SLOs">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Previous SLO"
                        disabled={position.index === 0 || dirty}
                        onClick={() => onStep(-1)}
                      />
                    }
                  >
                    {UI_ICONS.previous}
                  </TooltipTrigger>
                  <TooltipContent>Previous SLO</TooltipContent>
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
                        aria-label="Next SLO"
                        disabled={
                          position.index === position.total - 1 || dirty
                        }
                        onClick={() => onStep(1)}
                      />
                    }
                  >
                    {UI_ICONS.next}
                  </TooltipTrigger>
                  <TooltipContent>Next SLO</TooltipContent>
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
                    aria-label="More SLO actions"
                  />
                }
              >
                {UI_ICONS.more}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="tabular-nums">
                    {slo.id}
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => actions.onFocus(slo.id)}>
                    {UI_ICONS.budget}
                    Show in Chart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onCopyYaml(slo)}>
                    {UI_ICONS.yaml}
                    Copy as OpenSLO
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onDuplicate(slo.id)}>
                    {UI_ICONS.copy}
                    Duplicate SLO
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDelete(slo)}
                  >
                    {UI_ICONS.trash}
                    Delete SLO
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
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <SheetTitle className="min-w-0 text-lg">{slo.name}</SheetTitle>
          <StatusFace status={status} />
        </div>
        <SheetDescription className="mt-1">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <SliFace sli={slo.sli} compact />
            <DotSeparator />
            <span className="tabular-nums">
              {formatObjective(slo.objective)} over {slo.windowDays} days
            </span>
            <DotSeparator />
            <ServiceFace service={slo.service} compact />
          </span>
        </SheetDescription>
        <div className="mt-2.5 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.onAlertingToggle(slo)}
          >
            {slo.alerting ? UI_ICONS.mute : UI_ICONS.bell}
            {slo.alerting ? "Mute Alerts" : "Unmute Alerts"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => actions.onTabChange("settings")}
          >
            {UI_ICONS.edit}
            Edit
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
            className="no-scrollbar -mb-px h-10! gap-5 overflow-x-auto bg-transparent p-0"
          >
            {SHEET_TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-full! flex-none gap-1.5 px-0 text-sm font-medium after:-bottom-px!"
              >
                {item.label}
                {item.value === "events" ? (
                  <Badge
                    variant="outline"
                    radius="full"
                    className="tabular-nums"
                  >
                    {slo.events.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Only the body scrolls; the header band, tabs and footer stay put. */}
        <div className="scroll-fade-y no-scrollbar min-h-0 flex-1 scroll-py-10 overflow-y-auto">
          <div className="flex flex-col gap-5 px-5 py-5">
            <TabsContent value="overview" className="flex flex-col gap-5">
              <SloOverviewTab
                slo={slo}
                onShowBurn={() => actions.onTabChange("burn")}
                onShowEvents={() => actions.onTabChange("events")}
              />
            </TabsContent>
            <TabsContent value="burn" className="flex flex-col gap-5">
              <SloBurnTab slo={slo} />
            </TabsContent>
            <TabsContent value="events">
              <SloEventsTab
                slo={slo}
                onExcludeToggle={actions.onExcludeToggle}
              />
            </TabsContent>
            <TabsContent value="settings">
              <form
                id={FORM_ID}
                noValidate
                onSubmit={handleSave}
                className="flex flex-col gap-6"
              >
                <SloFormFields
                  idPrefix="devops-5-edit"
                  values={draft}
                  onChange={(patch) =>
                    setDraft((current) => ({ ...current, ...patch }))
                  }
                  variant="edit"
                />
              </form>
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
              onClick={() => setDraft(source)}
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

export function SloSheet({
  slo,
  open,
  tab,
  position,
  returnFocusRef,
  onStep,
  ...actions
}: SheetActions & {
  slo: Slo | null
  open: boolean
  tab: SheetTab
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
        {slo ? (
          <SloSheetView
            key={slo.id}
            slo={slo}
            tab={tab}
            position={position}
            onStep={(direction) => {
              if (!position) return
              const index = position.index + direction
              setAnnouncement(`SLO ${index + 1} of ${position.total}`)
              onStep(direction)
            }}
            actions={actions}
          />
        ) : (
          <SheetTitle className="sr-only">SLO</SheetTitle>
        )}
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </SheetContent>
    </Sheet>
  )
}