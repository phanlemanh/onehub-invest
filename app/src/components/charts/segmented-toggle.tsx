import { type ReactNode } from "react"
import { cn } from "cn"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

/** The header's one-of-N switch (khoảng thời gian, gộp theo): an outline toggle group. */
export function SegmentedToggle<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  size,
  itemClassName,
  renderLabel = (label) => label,
}: {
  items: readonly { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
  ariaLabel: string
  size?: "sm"
  itemClassName?: string
  renderLabel?: (label: string) => ReactNode
}) {
  return (
    // Re-clicking the pressed item sends an empty array; the guard keeps a
    // choice selected.
    <ToggleGroup
      multiple={false}
      value={[value]}
      onValueChange={(next) => {
        const item = items.find((candidate) => candidate.value === next[0])
        if (item) onChange(item.value)
      }}
      variant="outline"
      size={size}
      spacing={0}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          // Pressed lifts to the card surface: the stock muted fill is the
          // header band's own tone and would vanish on it.
          className={cn(
            "text-muted-foreground data-pressed:bg-card dark:data-pressed:bg-muted data-pressed:text-foreground",
            itemClassName
          )}
        >
          {renderLabel(item.label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
