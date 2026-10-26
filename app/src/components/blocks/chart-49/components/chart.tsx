"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"

import { Button } from "@/components/ui/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  buildJourney,
  DEFAULT_RANGE,
  formatCount,
  JOURNEYS,
  type RangeId,
} from "./data"
import { UI_ICONS } from "./icons"
import { JourneyFlow } from "./journey-flow"
import { StageFace } from "./value-faces"

export function Chart() {
  const [range, setRange] = useState<RangeId>(DEFAULT_RANGE)
  const [run, setRun] = useState(0)
  const [paused, setPaused] = useState(false)
  const [onscreen, setOnscreen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const journey = JOURNEYS.find((item) => item.id === range) ?? JOURNEYS[1]
  const { nodes, links, counts, headers } = buildJourney(journey)

  // Pulses stop while the chart is scrolled out of view.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) =>
      setOnscreen(entry.isIntersecting)
    )
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  return (
    <Frame dense spacing="default" className="@container w-full max-w-5xl">
      <FrameHeader className="min-w-0 flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <FrameTitle className="truncate">Trial Journey</FrameTitle>
            <Badge variant="outline" className="tabular-nums">
              {formatCount(counts.signedUp)} trials
            </Badge>
          </div>
          <FrameDescription className="truncate">
            Where new trials convert or drop off
          </FrameDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            multiple={false}
            value={[range]}
            onValueChange={(value: string[]) => {
              const next = JOURNEYS.find((item) => item.id === value[0])
              if (!next) return
              setRange(next.id)
              setRun((count) => count + 1)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Date range"
          >
            {JOURNEYS.map((item) => (
              <ToggleGroupItem
                key={item.id}
                value={item.id}
                aria-label={`Last ${item.label}`}
                className="text-muted-foreground data-pressed:text-foreground"
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Replay animation"
            className="motion-reduce:hidden"
            onClick={() => setRun((count) => count + 1)}
          >
            {UI_ICONS.replay}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={paused ? "Resume flow" : "Pause flow"}
            aria-pressed={paused}
            className="motion-reduce:hidden"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? UI_ICONS.play : UI_ICONS.pause}
          </Button>
        </div>
      </FrameHeader>

      <FramePanel ref={panelRef}>
        <div className="overflow-x-auto">
          {/* A new key replays the pour-in for a fresh range. */}
          <JourneyFlow
            key={run}
            nodes={nodes}
            links={links}
            headers={headers}
            paused={paused || !onscreen}
          />
        </div>
        <ul className="sr-only">
          {links.map((link) => (
            <li key={`${link.source}-${link.target}`}>
              {nodes[link.source].name} to {nodes[link.target].name}:{" "}
              {formatCount(link.value)} trials
            </li>
          ))}
        </ul>
      </FramePanel>

      <FrameFooter className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <StageFace stage="journey" />
          <StageFace stage="upgraded" />
          <StageFace stage="dropped" />
        </span>
        <span className="text-muted-foreground">
          Pulse density follows trial volume
        </span>
      </FrameFooter>
    </Frame>
  )
}