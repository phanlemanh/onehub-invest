import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react"
import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  ConnectionFormFields,
  validateConnection,
  type ConnectionFormValues,
} from "./connection-form-fields"
import { SHEET_FOOTER, SHEET_SHELL } from "./connection-sheet"
import { checksFor, ConnectionTest } from "./connection-test"
import {
  bytesOf,
  CATEGORIES,
  CATEGORY_ORDER,
  DATASET_KINDS,
  formatBytes,
  formatCompact,
  INTEGRATION_IDS,
  INTEGRATIONS,
  newConnectionDraft,
  plural,
  type IntegrationId,
  type NewConnectionInput,
} from "./data"
import { UI_ICONS } from "./icons"
import { IntegrationLogo } from "./value-faces"

type Step = 1 | 2 | 3

const STEPS: { step: Step; title: string; description: string }[] = [
  { step: 1, title: "Source", description: "Pick what to connect." },
  { step: 2, title: "Configure", description: "Point it at your account." },
  { step: 3, title: "Datasets", description: "Choose what to sync." },
]

const ID_PREFIX = "devops-6-new"

function StepNav({
  step,
  reached,
  onStep,
}: {
  step: Step
  reached: Step
  onStep: (step: Step) => void
}) {
  return (
    <Stepper
      value={step}
      onValueChange={(next) => {
        const match = STEPS.find((item) => item.step === next)
        if (match && match.step <= reached) onStep(match.step)
      }}
      aria-label="New connection steps"
      indicators={{ completed: UI_ICONS.check }}
    >
      <StepperNav className="flex items-center">
        {STEPS.map((item, index) => (
          <StepperItem
            key={item.step}
            step={item.step}
            disabled={item.step > reached}
            className="min-w-0"
          >
            <StepperTrigger className="min-w-0 gap-1.5">
              <StepperIndicator className="[&_svg:not([class*=size-])]:size-3.5">
                {item.step}
              </StepperIndicator>
              <StepperTitle className="truncate">{item.title}</StepperTitle>
            </StepperTrigger>
            {index < STEPS.length - 1 ? (
              <StepperSeparator className="mx-2.5" />
            ) : null}
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  )
}

/** Step 1: the catalog as one dense grid, ordered by kind so related
 *  sources sit together; a tile selects its integration. */
function SourceStep({
  integration,
  onPick,
}: {
  integration: IntegrationId | null
  onPick: (id: IntegrationId) => void
}) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()
  const matches = CATEGORY_ORDER.flatMap((category) =>
    INTEGRATION_IDS.filter((id) => INTEGRATIONS[id].category === category)
  ).filter((id) => {
    const config = INTEGRATIONS[id]
    return (
      !query ||
      config.label.toLowerCase().includes(query) ||
      config.engine.toLowerCase().includes(query)
    )
  })

  return (
    <>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          {UI_ICONS.search}
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search integrations..."
          aria-label="Search integrations"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </InputGroup>
      {matches.length === 0 ? (
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyTitle>No Integration Found</EmptyTitle>
            <EmptyDescription>Try a product or engine name.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-2 min-[460px]:grid-cols-2 sm:grid-cols-3">
          {matches.map((id) => {
            const config = INTEGRATIONS[id]
            const picked = integration === id
            return (
              <Item
                key={id}
                variant="outline"
                size="xs"
                render={
                  <button
                    type="button"
                    aria-pressed={picked}
                    onClick={() => onPick(id)}
                  />
                }
                className={cn(
                  "hover:bg-muted/50 cursor-pointer flex-nowrap px-2 text-start",
                  picked && "border-primary"
                )}
              >
                <ItemMedia className="translate-y-0">
                  <IntegrationLogo integration={id} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="max-w-full min-w-0">
                    <span className="truncate">{config.label}</span>
                  </ItemTitle>
                  <ItemDescription className="truncate">
                    {config.engine}
                  </ItemDescription>
                </ItemContent>
                {picked ? (
                  <ItemActions className="text-primary [&_svg:not([class*=size-])]:size-4">
                    {UI_ICONS.check}
                  </ItemActions>
                ) : null}
              </Item>
            )
          })}
        </div>
      )}
    </>
  )
}

/** Step 3: what the test discovered, each with its size and sensitivity. */
function DatasetsStep({
  integration,
  linked,
  onChange,
}: {
  integration: IntegrationId
  linked: string[]
  onChange: (next: string[]) => void
}) {
  const starter = INTEGRATIONS[integration].starter
  const all = starter.length > 0 && linked.length === starter.length
  const some = linked.length > 0 && !all

  return (
    <Frame spacing="default" className="min-w-0">
      {/* px-2.5 lines the Select all box up with each row's box. */}
      <div className="flex items-center justify-between gap-3 px-2.5 py-(--frame-panel-header-py)">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <Checkbox
            checked={all}
            indeterminate={some}
            onCheckedChange={(checked) =>
              onChange(checked ? starter.map((seed) => seed.name) : [])
            }
          />
          Select all
        </label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {linked.length} of {plural(starter.length, "dataset")}
        </span>
      </div>
      <FramePanel className="p-0">
        <ItemGroup className="gap-0">
          {starter.map((seed, index) => {
            const checked = linked.includes(seed.name)
            const pii = seed.columns.some((column) => column.pii)
            return (
              <div key={seed.name} role="listitem" className="contents">
                {index > 0 ? <ItemSeparator className="my-0" /> : null}
                <Item
                  size="xs"
                  render={<label />}
                  className="cursor-pointer px-2"
                >
                  <ItemMedia className="translate-y-0 self-center">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        onChange(
                          next
                            ? [...linked, seed.name]
                            : linked.filter((name) => name !== seed.name)
                        )
                      }
                    />
                  </ItemMedia>
                  <ItemMedia className="translate-y-0">
                    <IconTile variant="outline" aria-hidden="true">
                      {DATASET_KINDS[seed.kind].icon}
                    </IconTile>
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-0.5">
                    <ItemTitle className="max-w-full min-w-0">
                      <span className="truncate font-mono">{seed.name}</span>
                      {pii ? (
                        <Badge variant="outline" className="shrink-0">
                          {UI_ICONS.lock}
                          PII
                        </Badge>
                      ) : null}
                    </ItemTitle>
                    <ItemDescription className="truncate text-xs tabular-nums">
                      {DATASET_KINDS[seed.kind].label}, about{" "}
                      {formatCompact(seed.rows)} rows,{" "}
                      {formatBytes(bytesOf(seed))}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            )
          })}
        </ItemGroup>
      </FramePanel>
    </Frame>
  )
}

/** Mounted by SheetContent on every open, so each open starts at step 1. */
function NewConnectionFlow({
  takenNames,
  counts,
  onCreate,
  onDone,
}: {
  takenNames: string[]
  counts: Map<IntegrationId, number>
  onCreate: (input: NewConnectionInput) => void
  onDone: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [integration, setIntegration] = useState<IntegrationId | null>(null)
  const [values, setValues] = useState<ConnectionFormValues | null>(null)
  const [linked, setLinked] = useState<string[]>([])
  const [testPassed, setTestPassed] = useState(false)

  const config = integration ? INTEGRATIONS[integration] : null
  const errors =
    integration && values
      ? validateConnection(values, {
          integration,
          takenNames,
          needsSecret: true,
        })
      : null
  const formValid = errors !== null && Object.keys(errors).length === 0
  const reached: Step = !integration ? 1 : formValid && testPassed ? 3 : 2

  // Editing what the test checks resets it.
  const testKey = `${integration}|${values?.endpoint ?? ""}|${values?.secret ?? ""}`
  const [seenTestKey, setSeenTestKey] = useState(testKey)
  if (seenTestKey !== testKey) {
    setSeenTestKey(testKey)
    setTestPassed(false)
  }

  const checks = useMemo(
    () =>
      integration
        ? checksFor({
            integration,
            endpoint: values?.endpoint ?? "",
            principal: INTEGRATIONS[integration].principal,
            datasets: INTEGRATIONS[integration].starter.length,
          })
        : [],
    [integration, values?.endpoint]
  )

  function pick(id: IntegrationId) {
    if (id !== integration) {
      setIntegration(id)
      setValues({ ...newConnectionDraft(id), secret: "" })
      setLinked(INTEGRATIONS[id].starter.map((seed) => seed.name))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step === 1) {
      if (integration) setStep(2)
      return
    }
    if (step === 2) {
      if (formValid && testPassed) setStep(3)
      return
    }
    if (!integration || !values || !formValid) return
    onCreate({
      ...values,
      name: values.name.trim(),
      endpoint: values.endpoint.trim(),
      integration,
      linked,
    })
    onDone()
  }

  const connected = integration ? (counts.get(integration) ?? 0) : 0
  const footerNote =
    step === 1
      ? config
        ? connected > 0
          ? `${config.label} selected, ${connected} already connected`
          : `${config.label} selected`
        : "Pick an integration to continue"
      : step === 2
        ? !formValid
          ? "Fill in the connection to test it"
          : testPassed
            ? "Test passed"
            : "Run the connection test to continue"
        : `${plural(linked.length, "dataset")} will sync`

  return (
    <>
      {/* Header band */}
      <div className="flex shrink-0 flex-col gap-2.5 border-b px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle className="min-w-0">New Connection</SheetTitle>
            <SheetDescription>{STEPS[step - 1].description}</SheetDescription>
          </div>
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
              />
            }
          >
            {UI_ICONS.close}
          </SheetClose>
        </div>
        <StepNav step={step} reached={reached} onStep={setStep} />
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Only the body scrolls; the header band and footer stay put. */}
        <div className="scroll-fade-y no-scrollbar min-h-0 flex-1 scroll-py-10 overflow-y-auto">
          <div className="flex flex-col gap-4 px-5 py-4">
            {step === 1 ? (
              <SourceStep integration={integration} onPick={pick} />
            ) : null}
            {step === 2 && integration && values ? (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <IntegrationLogo integration={integration} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {INTEGRATIONS[integration].label}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {INTEGRATIONS[integration].engine},{" "}
                      {CATEGORIES[INTEGRATIONS[integration].category].label}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ms-auto"
                    onClick={() => setStep(1)}
                  >
                    Change
                  </Button>
                </div>
                <ConnectionFormFields
                  idPrefix={ID_PREFIX}
                  integration={integration}
                  values={values}
                  onChange={(patch) =>
                    setValues((current) =>
                      current ? { ...current, ...patch } : current
                    )
                  }
                  variant="create"
                  takenNames={takenNames}
                />
                <ConnectionTest
                  key={testKey}
                  checks={checks}
                  disabled={!formValid}
                  onResult={setTestPassed}
                />
              </>
            ) : null}
            {step === 3 && integration ? (
              <DatasetsStep
                integration={integration}
                linked={linked}
                onChange={setLinked}
              />
            ) : null}
          </div>
        </div>

        <div className={SHEET_FOOTER}>
          <p
            aria-live="polite"
            className="text-muted-foreground me-auto min-w-0 truncate text-xs"
          >
            {footerNote}
          </p>
          {step === 1 ? (
            <SheetClose render={<Button type="button" variant="outline" />}>
              Cancel
            </SheetClose>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step === 3 ? 2 : 1)}
            >
              {UI_ICONS.back}
              Back
            </Button>
          )}
          {step === 3 ? (
            <Button type="submit">
              {UI_ICONS.plus}
              Create Connection
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={step === 1 ? !integration : reached < 3}
            >
              Continue
              {UI_ICONS.forward}
            </Button>
          )}
        </div>
      </form>
    </>
  )
}

export function NewConnectionSheet({
  open,
  onOpenChange,
  takenNames,
  counts,
  onCreate,
  returnFocusRef,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  takenNames: string[]
  /** Connections per integration, named once one is picked. */
  counts: Map<IntegrationId, number>
  onCreate: (input: NewConnectionInput) => void
  returnFocusRef: RefObject<HTMLElement | null>
}) {
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    // Mounted closed and driven by a boolean, so the first open animates.
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={popupRef}
        side="right"
        showCloseButton={false}
        initialFocus={() =>
          popupRef.current?.querySelector<HTMLElement>(
            'input[aria-label="Search integrations"]'
          ) ?? true
        }
        finalFocus={() => {
          const node = returnFocusRef.current
          return node?.isConnected ? node : true
        }}
        className={SHEET_SHELL}
      >
        <NewConnectionFlow
          takenNames={takenNames}
          counts={counts}
          onCreate={onCreate}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}