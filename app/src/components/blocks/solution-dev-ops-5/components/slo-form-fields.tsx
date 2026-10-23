import { useState } from "react"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  ALERT_CHANNEL,
  DEFAULT_THRESHOLD,
  formatCount,
  formatFactor,
  formatObjective,
  formatSpan,
  OBJECTIVE_OPTIONS,
  PERSON_OPTIONS,
  SERVICE_OPTIONS,
  SLI_KINDS,
  SLI_OPTIONS,
  volumeOf,
  WINDOW_OPTIONS,
  type SloDraft,
} from "./data"
import { FAST_RULE, MEDIUM_RULE, SLOW_RULE } from "./slo-math"
import { OwnerFace, ServiceFace, SliFace } from "./value-faces"

export type DraftErrors = Partial<Record<"name" | "threshold", string>>

export function validateDraft(draft: SloDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (!draft.name.trim()) errors.name = "Name the SLO."
  if (SLI_KINDS[draft.sli].unit !== null) {
    if (draft.threshold === null || draft.threshold <= 0)
      errors.threshold = "Set a threshold above zero."
  }
  return errors
}

/** The fields a save writes; history and events are not part of the form. */
export function sameDraft(a: SloDraft, b: SloDraft) {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.service === b.service &&
    a.sli === b.sli &&
    a.threshold === b.threshold &&
    a.objective === b.objective &&
    a.windowDays === b.windowDays &&
    a.ownerId === b.ownerId &&
    a.alerting === b.alerting &&
    a.pageOnFastBurn === b.pageOnFastBurn &&
    a.ticketOnSlowBurn === b.ticketOnSlowBurn
  )
}

type FieldsProps = {
  idPrefix: string
  values: SloDraft
  onChange: (patch: Partial<SloDraft>) => void
}

/** What the objective allows: full-outage minutes and failed events. */
export function budgetLine(values: SloDraft) {
  const allowed = 1 - values.objective
  const minutes = allowed * values.windowDays * 1440
  const events = allowed * volumeOf(values) * values.windowDays
  return {
    downtime: formatSpan(minutes),
    events: `${formatCount(events)} ${SLI_KINDS[values.sli].noun}`,
  }
}

function BudgetPreview({ values }: { values: SloDraft }) {
  const { downtime, events } = budgetLine(values)
  return (
    <p
      aria-live="polite"
      className="text-muted-foreground text-sm leading-relaxed text-pretty"
    >
      Allows{" "}
      <span className="text-foreground font-medium tabular-nums">
        {downtime}
      </span>{" "}
      of full outage, or about{" "}
      <span className="text-foreground font-medium tabular-nums">{events}</span>{" "}
      failing, every {values.windowDays} days.
    </p>
  )
}

function ObjectiveFields({ idPrefix, values, onChange }: FieldsProps) {
  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel id={`${idPrefix}-objective-label`}>Objective</FieldLabel>
        <ToggleGroup
          multiple={false}
          value={[String(values.objective)]}
          onValueChange={(value: string[]) => {
            const next = Number(value[0])
            if (OBJECTIVE_OPTIONS.includes(next)) onChange({ objective: next })
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-labelledby={`${idPrefix}-objective-label`}
          className="w-full"
        >
          {OBJECTIVE_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option}
              value={String(option)}
              className="text-muted-foreground data-pressed:text-foreground flex-1 tabular-nums"
            >
              {formatObjective(option)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <FieldLabel id={`${idPrefix}-window-label`}>Rolling Window</FieldLabel>
        <ToggleGroup
          multiple={false}
          value={[String(values.windowDays)]}
          onValueChange={(value: string[]) => {
            const match = WINDOW_OPTIONS.find(
              (option) => String(option.value) === value[0]
            )
            if (match) onChange({ windowDays: match.value })
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-labelledby={`${idPrefix}-window-label`}
          className="w-full"
        >
          {WINDOW_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={String(option.value)}
              className="text-muted-foreground data-pressed:text-foreground flex-1"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <BudgetPreview values={values} />
    </FieldGroup>
  )
}

function ThresholdField({
  idPrefix,
  values,
  onChange,
  error,
}: FieldsProps & { error?: string }) {
  const unit = SLI_KINDS[values.sli].unit
  if (unit === null) return null
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={`${idPrefix}-threshold`}>
        Threshold ({unit === "ms" ? "ms" : "seconds"})
      </FieldLabel>
      <NumberField
        id={`${idPrefix}-threshold`}
        value={values.threshold}
        min={1}
        step={unit === "ms" ? 10 : 30}
        onValueChange={(next: number | null) => onChange({ threshold: next })}
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput className="tabular-nums" />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <FieldDescription>
          {unit === "ms"
            ? "A request slower than this counts as bad."
            : "Data older than this counts as a bad minute."}
        </FieldDescription>
      )}
    </Field>
  )
}

function ServiceSelect({ idPrefix, values, onChange }: FieldsProps) {
  return (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}-service`}>Service</FieldLabel>
      <Select
        value={values.service}
        items={SERVICE_OPTIONS}
        onValueChange={(next) => {
          const match = SERVICE_OPTIONS.find((item) => item.value === next)
          if (match) onChange({ service: match.value })
        }}
      >
        <SelectTrigger id={`${idPrefix}-service`} className="w-full">
          <SelectValue>
            <ServiceFace service={values.service} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {SERVICE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <ServiceFace service={option.value} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function OwnerSelect({ idPrefix, values, onChange }: FieldsProps) {
  return (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}-owner`}>Owner</FieldLabel>
      <Select
        value={values.ownerId}
        items={PERSON_OPTIONS}
        onValueChange={(next) => {
          const match = PERSON_OPTIONS.find((item) => item.value === next)
          if (match) onChange({ ownerId: match.value })
        }}
      >
        <SelectTrigger id={`${idPrefix}-owner`} className="w-full">
          <SelectValue>
            <OwnerFace ownerId={values.ownerId} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {PERSON_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <OwnerFace ownerId={option.value} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function SliSelect({ idPrefix, values, onChange }: FieldsProps) {
  return (
    <Field>
      <FieldLabel htmlFor={`${idPrefix}-sli`}>Indicator</FieldLabel>
      <Select
        value={values.sli}
        items={SLI_OPTIONS}
        onValueChange={(next) => {
          const match = SLI_OPTIONS.find((item) => item.value === next)
          if (match)
            onChange({
              sli: match.value,
              threshold: DEFAULT_THRESHOLD[match.value],
            })
        }}
      >
        <SelectTrigger id={`${idPrefix}-sli`} className="w-full">
          <SelectValue>
            <SliFace sli={values.sli} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectGroup>
            {SLI_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <SliFace sli={option.value} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )
}

function AlertFields({ idPrefix, values, onChange }: FieldsProps) {
  return (
    <FieldGroup className="gap-4">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={`${idPrefix}-alerting`}>Burn alerts</FieldLabel>
          <FieldDescription>Notifies {ALERT_CHANNEL}.</FieldDescription>
        </FieldContent>
        <Switch
          id={`${idPrefix}-alerting`}
          size="sm"
          checked={values.alerting}
          onCheckedChange={(checked) => onChange({ alerting: checked })}
        />
      </Field>
      <Field
        orientation="horizontal"
        data-disabled={!values.alerting || undefined}
      >
        <FieldContent>
          <FieldLabel htmlFor={`${idPrefix}-page`}>
            Page on fast burn
          </FieldLabel>
          <FieldDescription>
            Over {formatFactor(FAST_RULE.factor)} for {FAST_RULE.longLabel} or{" "}
            {formatFactor(MEDIUM_RULE.factor)} for {MEDIUM_RULE.longLabel}.
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${idPrefix}-page`}
          size="sm"
          disabled={!values.alerting}
          checked={values.pageOnFastBurn}
          onCheckedChange={(checked) => onChange({ pageOnFastBurn: checked })}
        />
      </Field>
      <Field
        orientation="horizontal"
        data-disabled={!values.alerting || undefined}
      >
        <FieldContent>
          <FieldLabel htmlFor={`${idPrefix}-ticket`}>
            Ticket on slow burn
          </FieldLabel>
          <FieldDescription>
            Over {formatFactor(SLOW_RULE.factor)} for {SLOW_RULE.longLabel}.
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${idPrefix}-ticket`}
          size="sm"
          disabled={!values.alerting}
          checked={values.ticketOnSlowBurn}
          onCheckedChange={(checked) => onChange({ ticketOnSlowBurn: checked })}
        />
      </Field>
    </FieldGroup>
  )
}

/** The SLO form, shared by the New SLO sheet and the SLO sheet's Settings tab.
 *  The indicator is fixed once data is recorded, so edit shows it read-only. */
export function SloFormFields({
  idPrefix,
  values,
  onChange,
  variant,
}: FieldsProps & { variant: "create" | "edit" }) {
  // Required-field errors wait for the first edit, so a fresh form is calm.
  const [touched, setTouched] = useState(false)
  const errors = validateDraft(values)
  const nameError = touched ? errors.name : undefined
  const shared = { idPrefix, values, onChange }

  return (
    <>
      <FieldSet>
        <FieldLegend variant="label">Definition</FieldLegend>
        <FieldGroup className="gap-4">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
            <Input
              id={`${idPrefix}-name`}
              value={values.name}
              onChange={(event) => {
                setTouched(true)
                onChange({ name: event.target.value })
              }}
              onBlur={() => setTouched(true)}
              aria-invalid={!!nameError || undefined}
              placeholder="Checkout API availability"
            />
            {nameError ? <FieldError>{nameError}</FieldError> : null}
          </Field>
          <div className="grid gap-4 min-[360px]:grid-cols-2">
            <ServiceSelect {...shared} />
            {variant === "create" ? (
              <SliSelect {...shared} />
            ) : (
              <Field>
                <FieldTitle>Indicator</FieldTitle>
                <div className="flex h-8 items-center text-sm">
                  <SliFace sli={values.sli} />
                </div>
              </Field>
            )}
          </div>
          <ThresholdField {...shared} error={errors.threshold} />
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-description`}>
              Good Event
            </FieldLabel>
            <Textarea
              id={`${idPrefix}-description`}
              value={values.description}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
              placeholder={SLI_KINDS[values.sli].template}
              className="min-h-16"
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Target</FieldLegend>
        <ObjectiveFields {...shared} />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Alerting</FieldLegend>
        <AlertFields {...shared} />
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Ownership</FieldLegend>
        <OwnerSelect {...shared} />
      </FieldSet>
    </>
  )
}