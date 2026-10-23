import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { PANEL_CARD } from "./content-skeleton"
import { CAP_BOX } from "./value-faces"
import { InboxIcon, BlocksIcon, TriangleAlertIcon, RefreshCwIcon } from "lucide-react"

function StatePanel({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <Card className={PANEL_CARD}>
      <CardContent>
        <Empty className="min-h-80 border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">{icon}</EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{action}</EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}

export function EmptyWorkspace({ onConnect }: { onConnect: () => void }) {
  return (
    <StatePanel
      icon={
        <InboxIcon aria-hidden="true" />
      }
      title="No Data Yet"
      description="Connect a source to fill this page."
      action={
        <Button size="sm" onClick={onConnect}>
          <BlocksIcon data-icon="inline-start" aria-hidden="true" />
          <span className={CAP_BOX}>Connect Source</span>
        </Button>
      }
    />
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <StatePanel
      icon={
        <TriangleAlertIcon aria-hidden="true" />
      }
      title="Load Failed"
      description="The query timed out before returning rows."
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          <span className={CAP_BOX}>Retry</span>
        </Button>
      }
    />
  )
}