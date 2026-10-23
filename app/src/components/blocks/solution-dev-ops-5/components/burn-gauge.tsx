import { cn } from "cn"

import { formatBurn } from "./data"
import { HLollipop } from "./lollipop"
import { FAST_RULE, MEDIUM_RULE, SLOW_RULE, type BurnWindow } from "./slo-math"
import { WARNING_TEXT } from "./value-faces"

const LOG_MIN = Math.log10(0.1)
const LOG_MAX = Math.log10(100)

/** 0 at 0.1×, 1/3 at 1×, 2/3 at 10×, 1 at 100×. */
const burnPosition = (burn: number) =>
  Math.min(
    1,
    Math.max(
      0,
      (Math.log10(Math.max(burn, 0.1)) - LOG_MIN) / (LOG_MAX - LOG_MIN)
    )
  )

/** The factor that pages on this window; 3d only ever tickets. */
function pageLineOf(window: BurnWindow): number | null {
  if (window === "5m" || window === "1h") return FAST_RULE.factor
  if (window === "30m" || window === "6h") return MEDIUM_RULE.factor
  return null
}

/** Red at the window's page line, amber from 1×, neutral under pace. */
export function burnTone(
  burn: number,
  window: BurnWindow = "1h"
): { text: string; stroke: string } {
  const page = pageLineOf(window)
  if (page !== null && burn >= page)
    return {
      text: "text-destructive",
      stroke: "var(--destructive)",
    }
  if (burn >= SLOW_RULE.factor)
    return {
      text: WARNING_TEXT,
      stroke: "var(--warning)",
    }
  return {
    text: "text-foreground",
    stroke: "var(--muted-foreground)",
  }
}

// Even pace: burning exactly the budget over the window.
const PACE = 1

/** How a rate stands against 1× and the page line, in words. */
const relationOf = (burn: number, page: number | null) =>
  page !== null && burn >= page
    ? "over the page line"
    : burn >= PACE
      ? "over 1×"
      : "under 1×"

/** The head sits on the burn; a stem grows from 1× only when it burns faster. */
export function BurnTrack({
  burn,
  prior = null,
  window = "1h",
  label,
  className,
}: {
  /** The head: 1h in the list, the window's own rate in the sheet. */
  burn: number
  /** Hollow ghost ring, the 6h rate in the list. */
  prior?: number | null
  /** Picks the page guide and the head tone. */
  window?: BurnWindow
  /** Text alternative, the rate and its relation appended; omitted = aria-hidden. */
  label?: string
  className?: string
}) {
  const page = pageLineOf(window)
  const pace = burnPosition(PACE)
  const guides = [
    {
      at: pace,
      color: "var(--muted-foreground)",
      opacity: 0.45,
      dashed: true,
    },
  ]
  if (page !== null)
    guides.push({
      at: burnPosition(page),
      color: "var(--destructive)",
      opacity: 0.6,
      dashed: true,
    })

  return (
    <HLollipop
      position={burnPosition(burn)}
      base={burn >= PACE ? pace : null}
      color={burnTone(burn, window).stroke}
      ghost={prior === null ? null : burnPosition(prior)}
      guides={guides}
      rail
      label={
        label
          ? `${label}: ${formatBurn(burn)}, ${relationOf(burn, page)}`
          : undefined
      }
      className={cn("h-3.5", className)}
    />
  )
}