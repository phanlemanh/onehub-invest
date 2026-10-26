import { cn } from "cn"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

import { COVERAGE, POLICY, type IPolicyRule } from "./data"

function PolicyRule({ rule }: { rule: IPolicyRule }) {
  return (
    <div className="flex items-start gap-2.5">
      <Item
        className={cn(
          "p-0",
          "border-background flex size-8 shrink-0 items-center justify-center border-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border [&_svg]:size-4 [&_svg]:text-white",
          rule.iconBg
        )}
      >
        <ItemMedia variant="icon" className="size-auto">
          {rule.icon}
        </ItemMedia>
      </Item>
      <div className="min-w-0">
        <a
          href="#"
          className="text-foreground hover:text-primary text-sm leading-tight font-medium underline-offset-4 transition-colors hover:underline"
        >
          {rule.title}
        </a>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
          {rule.description}
        </p>
      </div>
    </div>
  )
}
function PolicyCard({
  title,
  rules,
  className,
}: {
  title: string
  rules: IPolicyRule[]
  className?: string
}) {
  return (
    <Card className={cn("gap-0 p-0", className)}>
      <CardHeader className="gap-1 border-b px-5 py-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 py-4">
        {rules.map((rule) => (
          <PolicyRule key={rule.title} rule={rule} />
        ))}
      </CardContent>
    </Card>
  )
}
export function ApprovalPolicy({ className }: { className?: string }) {
  return (
    <PolicyCard title="Approval Policy" rules={POLICY} className={className} />
  )
}
function CoverageTile({
  rule,
  selected,
  onSelect,
}: {
  rule: IPolicyRule
  selected: boolean
  onSelect: (rule: IPolicyRule) => void
}) {
  return (
    <Item
      render={<button type="button" />}
      variant="outline"
      size="sm"
      aria-label={`Focus ${rule.title} coverage`}
      aria-pressed={selected}
      className={cn(
        "hover:bg-muted/60 flex h-full cursor-pointer flex-col items-stretch justify-between gap-4 p-3 text-left",
        "hover:border-primary/30",
        selected && "border-primary/40 bg-muted"
      )}
      onClick={() => onSelect(rule)}
    >
      <div className="flex items-start justify-between gap-2">
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-muted-foreground max-w-full truncate text-xs font-medium">
            {rule.title}
          </ItemTitle>
          <span className="text-foreground text-sm leading-tight font-medium">
            {rule.value}
          </span>
        </ItemContent>
        <ItemMedia
          variant="icon"
          className="[&_svg]:text-muted-foreground mt-0.5 [&_svg]:size-4"
        >
          {rule.icon}
        </ItemMedia>
      </div>
      <ItemDescription className="text-xs leading-tight">
        {rule.description}
      </ItemDescription>
    </Item>
  )
}
export function ReviewCoverage({
  activeCoverage,
  className,
  onSelectCoverage,
}: {
  activeCoverage: string | null
  className?: string
  onSelectCoverage: (rule: IPolicyRule) => void
}) {
  return (
    <Card className={cn("gap-0 p-0", className)}>
      <CardHeader className="gap-1 border-b px-5 py-4">
        <CardTitle>Review Coverage</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 px-5 py-5">
        {COVERAGE.map((rule) => (
          <CoverageTile
            key={rule.title}
            rule={rule}
            selected={activeCoverage === rule.title}
            onSelect={onSelectCoverage}
          />
        ))}
      </CardContent>
    </Card>
  )
}