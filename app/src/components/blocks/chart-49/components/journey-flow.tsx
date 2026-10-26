"use client"

import { useId, useState, type CSSProperties } from "react"
import { cn } from "cn"
import {
  Sankey,
  type SankeyLinkProps,
  type SankeyNode,
  type SankeyNodeProps,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  formatCount,
  formatRate,
  lineageOf,
  PREVIOUS_STAGE,
  type ColumnHeader,
  type FlowLink,
  type FlowNode,
  type NodeId,
} from "./data"
import { UI_ICONS } from "./icons"
import { STAGE_COLOR, STAGE_LABEL, StageFace } from "./value-faces"

/** A 12% feathered edge on a mask three times the chart's width, so it always
 * covers the left edge and the labels there never blink at the end. */
const SWEEP_MASK = "linear-gradient(to right, #000 48%, transparent 52%)"

// CSS-only motion: one keyframe-only feathered mask sweeps the flow in on a
// single curve, while pulses ride each link at a density set by volume.
const MOTION_STYLE = `
@keyframes c49-sweep {
  from { mask-image: ${SWEEP_MASK}; mask-size: 300% 100%; mask-repeat: no-repeat; mask-position: 78% 0; }
  to { mask-image: ${SWEEP_MASK}; mask-size: 300% 100%; mask-repeat: no-repeat; mask-position: 22% 0; }
}
@keyframes c49-appear { from { opacity: 0; } }
@keyframes c49-pulse {
  0% { offset-distance: 0%; opacity: 0; }
  12%, 88% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes c49-leak {
  0% { offset-distance: 0%; opacity: 0; }
  14% { opacity: 1; }
  100% { offset-distance: 64%; opacity: 0; }
}
.c49-sweep { animation: c49-sweep 1400ms cubic-bezier(0.3, 0, 0.2, 1) backwards; }
.c49-pulses { animation: c49-appear 600ms ease-out backwards; }
.c49-pulse { offset-rotate: 0deg; animation: c49-pulse var(--c49-dur) linear var(--c49-delay) infinite; }
.c49-pulse[data-leak] { animation-name: c49-leak; }
[data-c49-paused] .c49-pulse { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .c49-sweep, .c49-pulses { animation: none; }
  .c49-pulse { display: none; }
}
html[data-demo="frozen"] :is(.c49-sweep, .c49-pulses) { animation: none; }
html[data-demo="frozen"] .c49-pulse { display: none; }
`

type Hover = { type: "node" | "link"; index: number } | null

type LaidOutNode = SankeyNode & FlowNode

const CHART_CONFIG = {
  journey: { label: STAGE_LABEL.journey, color: STAGE_COLOR.journey },
  upgraded: { label: STAGE_LABEL.upgraded, color: STAGE_COLOR.upgraded },
  dropped: { label: STAGE_LABEL.dropped, color: STAGE_COLOR.dropped },
} satisfies ChartConfig

const MARGIN = { top: 64, right: 132, bottom: 8, left: 108 }
const LABEL_GAP = 10
/** Pulses per link at full volume; a link's share sets its own count. */
const PULSE_DENSITY = 12
/** Detuned loop lengths in seconds, so pulses never march in step. */
const PULSE_SECONDS = [4.3, 5.1, 3.9, 4.7, 5.6, 4.1]

/** Link opacity by emphasis: traced, resting, pushed back. */
const LINK_OPACITY = { on: 0.28, rest: 0.12, off: 0.04 }

function colorOf(node: FlowNode) {
  return node.stage === "channel" ? "journey" : node.stage
}

function emphasisOf(hover: Hover, links: FlowLink[]) {
  if (!hover) return null
  const trace =
    hover.type === "link"
      ? { up: links[hover.index].source, down: links[hover.index].target }
      : { up: hover.index, down: hover.index }
  const { up, down } = lineageOf(trace.up, trace.down)
  return {
    node: (index: number) => up.has(index) || down.has(index),
    link: (link: FlowLink) =>
      (up.has(link.source) && up.has(link.target)) ||
      (down.has(link.source) && down.has(link.target)) ||
      (link.source === trace.up && link.target === trace.down),
  }
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground flex items-center justify-between gap-4">
      {label}
      <span className="text-foreground font-mono font-medium tabular-nums">
        {value}
      </span>
    </span>
  )
}

function Header({
  header,
  x,
  anchor,
}: {
  header: ColumnHeader
  x: number
  anchor: "start" | "end"
}) {
  return (
    <text x={x} y={16} textAnchor={anchor} className="pointer-events-none">
      <tspan className="fill-muted-foreground text-xs">{header.title}</tspan>
      <tspan
        x={x}
        dy={22}
        className={cn(
          "font-semibold tabular-nums",
          header.focal ? "fill-success text-base" : "fill-foreground text-sm"
        )}
      >
        {header.value}
      </tspan>
      {header.note ? (
        <tspan dx={6} className="fill-muted-foreground text-xs tabular-nums">
          {header.note}
        </tspan>
      ) : null}
    </text>
  )
}

export function JourneyFlow({
  nodes,
  links,
  headers,
  paused,
}: {
  nodes: FlowNode[]
  links: FlowLink[]
  headers: Partial<Record<NodeId, ColumnHeader>>
  paused: boolean
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [hover, setHover] = useState<Hover>(null)
  const emphasis = emphasisOf(hover, links)
  const signedUp = nodes.find((node) => node.id === "signedUp")?.amount ?? 1
  const amountOf = (id: NodeId) =>
    nodes.find((node) => node.id === id)?.amount ?? 0

  const renderNode = ({
    x,
    y,
    width,
    height,
    index,
    payload,
  }: SankeyNodeProps) => {
    const node = payload as LaidOutNode
    const lit = emphasis ? emphasis.node(index) : true
    const header = headers[node.id]
    const first = node.depth === 0
    const terminal = node.stage === "upgraded" || node.stage === "dropped"
    const previous = PREVIOUS_STAGE[node.id]
    const labelX = first ? x - LABEL_GAP : x + width + LABEL_GAP
    return (
      <g
        className={cn(
          "transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          !lit && "opacity-30"
        )}
      >
        {header ? (
          <>
            <Header
              header={header}
              x={first ? x + width : x}
              anchor={first ? "end" : "start"}
            />
            {first ? null : (
              // A dashed stem pins the caption to its column.
              <line
                x1={x + width / 2}
                x2={x + width / 2}
                y1={50}
                y2={y - 6}
                stroke="var(--border)"
                strokeDasharray="2 3"
              />
            )}
          </>
        ) : null}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.max(height, 2)}
          rx={2}
          fill={`var(--color-${colorOf(node)})`}
          className="cursor-pointer"
        />
        {first || terminal ? (
          <text
            x={labelX}
            y={y + height / 2 - 7}
            textAnchor={first ? "end" : "start"}
            dominantBaseline="middle"
            // A panel-coloured halo keeps labels legible over the flows.
            stroke="var(--frame-panel-bg, var(--background))"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            className="pointer-events-none text-xs"
          >
            <tspan className="fill-foreground font-medium">{node.name}</tspan>
            <tspan x={labelX} dy={15} className="tabular-nums">
              <tspan className="fill-muted-foreground">
                {formatCount(node.amount)}
              </tspan>
              {terminal && previous ? (
                <tspan dx={5} className="fill-muted-foreground">
                  {formatRate(node.amount / amountOf(previous))}
                </tspan>
              ) : null}
            </tspan>
          </text>
        ) : null}
      </g>
    )
  }

  const renderLink = ({
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
  }: SankeyLinkProps) => {
    const link = links[index]
    const target = nodes[link.target]
    const tone = colorOf(target)
    const leak = target.stage === "dropped"
    const opacity = !emphasis
      ? LINK_OPACITY.rest
      : emphasis.link(link)
        ? LINK_OPACITY.on
        : LINK_OPACITY.off
    const d = `M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`
    const seconds = PULSE_SECONDS[index % PULSE_SECONDS.length]
    const count = Math.max(
      1,
      Math.round((link.value / signedUp) * PULSE_DENSITY)
    )
    return (
      <g>
        <path
          d={d}
          fill="none"
          stroke={`var(--color-${tone})`}
          strokeWidth={Math.max(linkWidth, 1)}
          opacity={opacity}
          className="cursor-pointer transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
        <g
          aria-hidden="true"
          className="c49-pulses pointer-events-none transition-opacity duration-200 motion-reduce:transition-none"
          opacity={emphasis && !emphasis.link(link) ? 0.15 : 1}
        >
          {Array.from({ length: count }, (_, pulse) => {
            // Spread pulses across the band and along the loop, deterministically.
            const lane =
              (((pulse * 37 + index * 11) % 100) / 100 - 0.5) * linkWidth * 0.6
            return (
              <circle
                key={pulse}
                cx={0}
                cy={lane}
                r={1.75}
                fill={`var(--color-${tone})`}
                fillOpacity={tone === "journey" ? 0.55 : 0.9}
                data-leak={leak ? "" : undefined}
                className="c49-pulse"
                style={
                  {
                    offsetPath: `path("${d}")`,
                    "--c49-dur": `${seconds}s`,
                    "--c49-delay": `${-((seconds * pulse) / count + index * 0.41)}s`,
                  } as CSSProperties
                }
              />
            )
          })}
        </g>
      </g>
    )
  }

  const readout =
    hover?.type === "node"
      ? (() => {
          const node = nodes[hover.index]
          const previous = PREVIOUS_STAGE[node.id]
          return (
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{node.name}</span>
                <span className="text-muted-foreground">
                  <StageFace stage={node.stage} />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Readout label="Trials" value={formatCount(node.amount)} />
                <Readout
                  label="Of signups"
                  value={formatRate(node.amount / signedUp)}
                />
                {previous ? (
                  <Readout
                    label="Step rate"
                    value={formatRate(node.amount / amountOf(previous))}
                  />
                ) : null}
              </div>
            </div>
          )
        })()
      : hover?.type === "link"
        ? (() => {
            const link = links[hover.index]
            const source = nodes[link.source]
            const target = nodes[link.target]
            return (
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-1.5 font-medium [&_svg:not([class*=size-])]:size-3.5">
                  {source.name}
                  <span className="text-muted-foreground">
                    {UI_ICONS.arrow}
                  </span>
                  {target.name}
                </span>
                <div className="flex flex-col gap-1">
                  <Readout label="Trials" value={formatCount(link.value)} />
                  <Readout
                    label={`Of ${source.name}`}
                    value={formatRate(link.value / source.amount)}
                  />
                </div>
              </div>
            )
          })()
        : null

  return (
    <div className="c49-sweep" data-c49-paused={paused ? "" : undefined}>
      <style>{MOTION_STYLE}</style>
      <ChartContainer
        id={uid}
        config={CHART_CONFIG}
        className="aspect-auto h-104 w-full min-w-3xl"
        initialDimension={{ width: 960, height: 416 }}
        role="img"
        aria-label={`Trial journey: ${formatCount(signedUp)} signups, ${formatCount(amountOf("upgraded"))} upgraded`}
      >
        <Sankey
          data={{ nodes, links }}
          nameKey="name"
          margin={MARGIN}
          nodeWidth={4}
          nodePadding={26}
          linkCurvature={0.5}
          sort={false}
          verticalAlign="top"
          align="left"
          node={renderNode}
          link={renderLink}
          onMouseEnter={(item, type) => setHover({ type, index: item.index })}
          onMouseLeave={() => setHover(null)}
        >
          <ChartTooltip
            cursor={false}
            isAnimationActive={false}
            content={
              <ChartTooltipContent
                hideLabel
                hideIndicator
                className="w-52"
                formatter={(_value, _name, _item, index) =>
                  // One readout per hover, written under the first entry.
                  index === 0 ? readout : null
                }
              />
            }
          />
        </Sankey>
      </ChartContainer>
    </div>
  )
}