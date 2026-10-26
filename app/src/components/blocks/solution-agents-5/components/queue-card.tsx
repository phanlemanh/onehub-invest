import { type ReactNode } from "react"
import { cn } from "cn"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface QueueCardProps {
  title: string
  description: ReactNode
  children: ReactNode
  headerAction?: ReactNode
  footer?: ReactNode
  className?: string
}

export function QueueCard({
  title,
  description,
  children,
  headerAction,
  footer,
  className,
}: QueueCardProps) {
  return (
    <Card className={cn("w-full gap-0 p-0", className)}>
      <CardHeader className="gap-1 border-b px-5 py-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
        {headerAction ? (
          <CardAction className="self-center">{headerAction}</CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="p-0">{children}</CardContent>

      {footer ? (
        <CardFooter className="border-t px-5 py-3">{footer}</CardFooter>
      ) : null}
    </Card>
  )
}