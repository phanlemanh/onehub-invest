import { useRef, type ReactNode } from "react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { cn } from "cn"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Item, ItemMedia } from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { BlockIcon } from "./block-icon"
import {
  AGENT_ICON,
  formatSla,
  RISK_BADGE_VARIANT,
  RISK_LABEL,
  STATUS_BADGE_VARIANT,
  STATUS_DOT,
  STATUS_LABEL,
  type IApprovalRequest,
} from "./data"

interface RequestDetailSheetProps {
  request: IApprovalRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (request: IApprovalRequest) => void
  onReject: (request: IApprovalRequest) => void
}

function FactRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground min-w-0">{label}</dt>
      <dd className="text-foreground min-w-0 text-right font-medium break-words tabular-nums">
        {value}
      </dd>
    </div>
  )
}

export function RequestDetailSheet({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: RequestDetailSheetProps) {
  const sheetFocusRef = useRef<HTMLDivElement | null>(null)
  const isPending = request?.status === "pending"
  const breached = isPending && (request?.slaMinutesRemaining ?? 0) < 0
  const sla = request
    ? formatSla(request.slaMinutesRemaining, request.status)
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetFocusRef}
        side="right"
        showCloseButton={false}
        initialFocus={sheetFocusRef}
        tabIndex={-1}
        className="inset-y-4 right-4 left-auto h-[calc(100svh-2rem)] w-[min(26rem,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-xl p-0 outline-none"
      >
        {request ? (
          <>
            <SheetHeader className="shrink-0 gap-3 border-b px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Item className="bg-muted border-background flex size-9 shrink-0 items-center justify-center border-2 p-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border [&_svg]:size-4.5">
                    <ItemMedia variant="icon" className="size-auto">
                      {AGENT_ICON[request.agent]}
                    </ItemMedia>
                  </Item>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-sm">
                      {request.action}
                    </SheetTitle>
                    <SheetDescription className="truncate text-xs">
                      {request.agent} · {request.id}
                    </SheetDescription>
                  </div>
                </div>
                <SheetClose
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close"
                      className="-me-1.5 -mt-1.5"
                    />
                  }
                >
                  <BlockIcon name="clear" />
                </SheetClose>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={RISK_BADGE_VARIANT[request.risk]}>
                  {RISK_LABEL[request.risk]} risk
                </Badge>
                <Badge variant={STATUS_BADGE_VARIANT[request.status]}>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full!",
                      STATUS_DOT[request.status]
                    )}
                  />
                  {STATUS_LABEL[request.status]}
                </Badge>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 px-4 py-4">
                  {breached ? (
                    <Alert variant="destructive">
                      <BlockIcon name="alert" />
                      <AlertTitle>SLA breached</AlertTitle>
                      <AlertDescription>
                        Requested at {request.requestedAt}, now past the 4h
                        review SLA.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {request.policy ? (
                    <Alert variant={request.policy.tone}>
                      {request.policy.tone === "warning" ? (
                        <BlockIcon name="alert" />
                      ) : (
                        <BlockIcon name="info" />
                      )}
                      <AlertTitle>{request.policy.title}</AlertTitle>
                      <AlertDescription>
                        {request.policy.description}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <section
                    className="flex flex-col gap-3"
                    aria-labelledby={`${request.id}-payload`}
                  >
                    <h3
                      id={`${request.id}-payload`}
                      className="text-foreground text-sm font-semibold"
                    >
                      Payload
                    </h3>
                    <dl className="flex flex-col gap-3">
                      {request.facts.map((fact) => (
                        <FactRow
                          key={fact.label}
                          label={fact.label}
                          value={fact.value}
                        />
                      ))}
                      <FactRow
                        label="SLA"
                        value={
                          <span className={sla?.tone}>{sla?.primary}</span>
                        }
                      />
                      <FactRow
                        label="Reviewer"
                        value={
                          <span className="flex items-center justify-end gap-1.5">
                            <Avatar className="size-5">
                              {request.reviewer.avatarUrl ? (
                                <AvatarImage
                                  src={request.reviewer.avatarUrl}
                                  alt=""
                                />
                              ) : null}
                              <AvatarFallback className="text-[9px]">
                                {request.reviewer.initials}
                              </AvatarFallback>
                            </Avatar>
                            {request.reviewer.name}
                          </span>
                        }
                      />
                    </dl>
                  </section>
                </div>
              </ScrollArea>
            </div>

            <SheetFooter className="shrink-0 border-t px-4 py-3">
              {isPending ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onReject(request)}
                  >
                    <BlockIcon name="reject" />
                    Reject
                  </Button>
                  <Button type="button" onClick={() => onApprove(request)}>
                    <BlockIcon name="approve" />
                    Approve
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                  {request.status === "approved" ? (
                    <BlockIcon
                      name="approved"
                      className="text-success size-4 shrink-0"
                    />
                  ) : (
                    <BlockIcon
                      name="reject"
                      className="text-destructive size-4 shrink-0"
                    />
                  )}
                  <span className="truncate">
                    {STATUS_LABEL[request.status]} by {request.reviewer.name}
                    {request.decidedAt ? ` · ${request.decidedAt}` : ""}
                  </span>
                </div>
              )}
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}