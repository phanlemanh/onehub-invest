import { useState } from "react"
import { Badge } from "@/components/reui/badge"

import { Button } from "@/components/ui/button"
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  ALERT_CHANNEL,
  AUTH_KINDS,
  ENVIRONMENT_OPTIONS,
  FREQUENCY_OPTIONS,
  INTEGRATIONS,
  MIN_SECRET,
  PERSON_OPTIONS,
  RENEW_DAYS,
  VAULT_NAME,
  type ConnectionDraft,
  type IntegrationId,
} from "./data"
import { UI_ICONS } from "./icons"
import { OwnerFace } from "./value-faces"

export type ConnectionFormValues = ConnectionDraft & { secret: string }
export type FormErrors = Partial<Record<"name" | "endpoint" | "secret", string>>

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/
/** What an OAuth or GitHub App grant leaves in the form. */
export const GRANTED = "granted"

export function validateConnection(
  values: ConnectionFormValues,
  {
    integration,
    takenNames,
    needsSecret,
  }: { integration: IntegrationId; takenNames: string[]; needsSecret: boolean }
): FormErrors {
  const errors: FormErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = "Name the connection."
  else if (!NAME_PATTERN.test(name))
    errors.name = "Use lowercase letters, numbers and hyphens."
  else if (takenNames.includes(name))
    errors.name = "Another connection already uses this name."
  if (!values.endpoint.trim())
    errors.endpoint = `Add the ${INTEGRATIONS[integration].endpointLabel.toLowerCase()}.`
  if (needsSecret) {
    const auth = AUTH_KINDS[INTEGRATIONS[integration].auth]
    if (auth.renewable) {
      if (values.secret !== GRANTED)
        errors.secret = `Authorize ${INTEGRATIONS[integration].label} first.`
    } else if (values.secret.trim().length < MIN_SECRET) {
      errors.secret = `Paste the full ${auth.secret.toLowerCase()}, at least ${MIN_SECRET} characters.`
    }
  }
  return errors
}

/** The fields a save writes; history, datasets and the credential are not in the form. */
export function sameDraft(a: ConnectionDraft, b: ConnectionDraft) {
  return (
    a.name === b.name &&
    a.environment === b.environment &&
    a.endpoint === b.endpoint &&
    a.frequency === b.frequency &&
    a.ownerId === b.ownerId &&
    a.alertOnFailure === b.alertOnFailure
  )
}

type FieldsProps = {
  idPrefix: string
  integration: IntegrationId
  values: ConnectionFormValues
  onChange: (patch: Partial<ConnectionFormValues>) => void
}

function SecretField({
  idPrefix,
  integration,
  values,
  onChange,
  error,
}: FieldsProps & { error?: string }) {
  const config = INTEGRATIONS[integration]
  const auth = AUTH_KINDS[config.auth]
  if (auth.renewable) {
    const granted = values.secret === GRANTED
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldTitle>Authorization</FieldTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange({ secret: granted ? "" : GRANTED })}
          >
            {granted ? UI_ICONS.unlink : UI_ICONS.link}
            {granted ? "Revoke" : "Authorize"}
          </Button>
          {granted ? (
            <Badge variant="success-light">Granted to {config.principal}</Badge>
          ) : null}
        </div>
        {error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>
            Read-only {config.label} scopes; renews every {RENEW_DAYS} days.
          </FieldDescription>
        )}
      </Field>
    )
  }
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={`${idPrefix}-secret`}>{auth.secret}</FieldLabel>
      <Input
        id={`${idPrefix}-secret`}
        type="password"
        value={values.secret}
        onChange={(event) => onChange({ secret: event.target.value })}
        aria-invalid={error ? true : undefined}
        autoComplete="new-password"
        spellCheck={false}
        className="font-mono"
      />
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <FieldDescription>
          Signs in as {config.principal}; stored in the {VAULT_NAME}.
        </FieldDescription>
      )}
    </Field>
  )
}

/** The connection form, shared by the New Connection sheet and the Settings
 *  tab. Create asks for the secret; edit leaves it to Rotate. */
export function ConnectionFormFields({
  idPrefix,
  integration,
  values,
  onChange,
  variant,
  takenNames,
}: FieldsProps & { variant: "create" | "edit"; takenNames: string[] }) {
  // Required-field errors wait for the first edit, so a fresh form is calm.
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({})
  const config = INTEGRATIONS[integration]
  const errors = validateConnection(values, {
    integration,
    takenNames,
    needsSecret: variant === "create",
  })
  const shown = (key: keyof FormErrors) =>
    touched[key] ? errors[key] : undefined
  const touch = (key: keyof FormErrors) =>
    setTouched((current) =>
      current[key] ? current : { ...current, [key]: true }
    )
  const shared = { idPrefix, integration, values, onChange }

  return (
    <>
      <FieldSet>
        <FieldLegend variant="label">Connection</FieldLegend>
        <FieldGroup className="gap-3">
          <Field data-invalid={shown("name") ? true : undefined}>
            <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
            <Input
              id={`${idPrefix}-name`}
              value={values.name}
              onChange={(event) => {
                touch("name")
                onChange({ name: event.target.value })
              }}
              onBlur={() => touch("name")}
              aria-invalid={shown("name") ? true : undefined}
              placeholder={`${config.label.toLowerCase().replace(/\s+/g, "-")}-production`}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            {shown("name") ? <FieldError>{shown("name")}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel id={`${idPrefix}-environment-label`}>
              Environment
            </FieldLabel>
            <ToggleGroup
              multiple={false}
              value={[values.environment]}
              onValueChange={(value: string[]) => {
                const match = ENVIRONMENT_OPTIONS.find(
                  (option) => option.value === value[0]
                )
                if (match) onChange({ environment: match.value })
              }}
              variant="outline"
              size="sm"
              spacing={0}
              aria-labelledby={`${idPrefix}-environment-label`}
              className="w-full"
            >
              {ENVIRONMENT_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className="text-muted-foreground data-pressed:text-foreground flex-1"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field data-invalid={shown("endpoint") ? true : undefined}>
            <FieldLabel htmlFor={`${idPrefix}-endpoint`}>
              {config.endpointLabel}
            </FieldLabel>
            <Input
              id={`${idPrefix}-endpoint`}
              value={values.endpoint}
              onChange={(event) => {
                touch("endpoint")
                onChange({ endpoint: event.target.value })
              }}
              onBlur={() => touch("endpoint")}
              aria-invalid={shown("endpoint") ? true : undefined}
              placeholder={config.endpointHint}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            {shown("endpoint") ? (
              <FieldError>{shown("endpoint")}</FieldError>
            ) : null}
          </Field>
          {variant === "create" ? (
            <SecretField
              {...shared}
              error={
                touched.secret || values.secret.length > 0
                  ? errors.secret
                  : undefined
              }
            />
          ) : null}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Sync</FieldLegend>
        <FieldGroup className="gap-3">
          <div className="grid gap-3 min-[360px]:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-frequency`}>
                Frequency
              </FieldLabel>
              <Select
                value={values.frequency}
                items={FREQUENCY_OPTIONS}
                onValueChange={(next) => {
                  const match = FREQUENCY_OPTIONS.find(
                    (option) => option.value === next
                  )
                  if (match) onChange({ frequency: match.value })
                }}
              >
                <SelectTrigger id={`${idPrefix}-frequency`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectGroup>
                    {FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-owner`}>Owner</FieldLabel>
              <Select
                value={values.ownerId}
                items={PERSON_OPTIONS}
                onValueChange={(next) => {
                  const match = PERSON_OPTIONS.find(
                    (option) => option.value === next
                  )
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
          </div>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={`${idPrefix}-alerts`}>
                Alert on failure
              </FieldLabel>
              <FieldDescription>
                Notifies {ALERT_CHANNEL} after three failed runs in a row.
              </FieldDescription>
            </FieldContent>
            <Switch
              id={`${idPrefix}-alerts`}
              size="sm"
              checked={values.alertOnFailure}
              onCheckedChange={(checked) =>
                onChange({ alertOnFailure: checked })
              }
            />
          </Field>
        </FieldGroup>
      </FieldSet>
    </>
  )
}