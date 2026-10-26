"use client"

import { useId, useState, type CSSProperties } from "react"
import { Sankey, type SankeyLinkProps, type SankeyNode, type SankeyNodeProps } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { fmtInt } from "@/lib/format"
import { cn } from "@/lib/utils"

import { lineageOf, type ColumnHeader, type FlowLink, type FlowNode } from "./flow-sankey-data"
import { FlowReadout, type Hover } from "./flow-readout"
import { STAGE_COLOR, STAGE_LABEL } from "./stage-face"

/**
 * Sankey đường ống — chuyển thể journey-flow của @reui/chart-49. Giữ nguyên chuyển động CSS của block (quét vào một
 * lần, hạt chảy theo khối lượng, tắt khi giảm chuyển động); đổi nhãn sang tiếng Việt, số qua lib/format, thêm nhánh
 * «gộp trùng» màu trung tính.
 */

const SWEEP_MASK = "linear-gradient(to right, #000 48%, transparent 52%)"

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
.c49-pulses { animation: c49-appear 600ms cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.c49-pulse { offset-rotate: 0deg; animation: c49-pulse var(--c49-dur) linear var(--c49-delay) infinite; }
.c49-pulse[data-leak] { animation-name: c49-leak; }
[data-c49-paused] .c49-pulse { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .c49-sweep, .c49-pulses { animation: none; }
  .c49-pulse { display: none; }
}
`

type LaidOutNode = SankeyNode & FlowNode

const CHART_CONFIG = {
  journey: { label: STAGE_LABEL.journey, color: STAGE_COLOR.journey },
  linked: { label: STAGE_LABEL.linked, color: STAGE_COLOR.linked },
  dropped: { label: STAGE_LABEL.dropped, color: STAGE_COLOR.dropped },
  merged: { label: STAGE_LABEL.merged, color: STAGE_COLOR.merged },
} satisfies ChartConfig

const MARGIN = { top: 64, right: 150, bottom: 8, left: 170 }
const LABEL_GAP = 10
const PULSE_DENSITY = 12
const PULSE_SECONDS = [4.3, 5.1, 3.9, 4.7, 5.6, 4.1]
const LINK_OPACITY = { on: 0.28, rest: 0.12, off: 0.04 }

const colorOf = (node: FlowNode) => (node.stage === "channel" ? "journey" : node.stage)

function emphasisOf(hover: Hover, links: FlowLink[]) {
  if (!hover) return null
  const trace =
    hover.type === "link"
      ? { up: links[hover.index].source, down: links[hover.index].target }
      : { up: hover.index, down: hover.index }
  const { up, down } = lineageOf(links, trace.up, trace.down)
  return {
    node: (index: number) => up.has(index) || down.has(index),
    link: (link: FlowLink) =>
      (up.has(link.source) && up.has(link.target)) ||
      (down.has(link.source) && down.has(link.target)) ||
      (link.source === trace.up && link.target === trace.down),
  }
}

function Header({ header, x, anchor }: { header: ColumnHeader; x: number; anchor: "start" | "end" }) {
  return (
    <text x={x} y={16} textAnchor={anchor} className="pointer-events-none">
      <tspan className="fill-muted-foreground text-xs">{header.title}</tspan>
      <tspan x={x} dy={22} className={cn("font-semibold tabular-nums", header.focal ? (header.weak ? "fill-destructive text-base" : "fill-success text-base") : "fill-foreground text-sm")}>
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

export function FlowJourney({
  nodes,
  links,
  headers,
  paused,
}: {
  nodes: FlowNode[]
  links: FlowLink[]
  headers: Record<string, ColumnHeader>
  paused: boolean
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [hover, setHover] = useState<Hover>(null)
  const emphasis = emphasisOf(hover, links)
  const total = nodes.find((node) => node.id === "received")?.amount ?? 1
  const amountOf = (id: string) => nodes.find((node) => node.id === id)?.amount ?? 0

  const renderNode = ({ x, y, width, height, index, payload }: SankeyNodeProps) => {
    const node = payload as LaidOutNode
    const lit = emphasis ? emphasis.node(index) : true
    const header = headers[node.id]
    const first = node.depth === 0
    const terminal = node.stage === "linked" || node.stage === "dropped" || node.stage === "merged"
    const labelX = first ? x - LABEL_GAP : x + width + LABEL_GAP
    return (
      <g className={cn("transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", !lit && "opacity-30")}>
        {header ? (
          <>
            <Header header={header} x={first ? x + width : x} anchor={first ? "end" : "start"} />
            {first ? null : <line x1={x + width / 2} x2={x + width / 2} y1={50} y2={y - 6} stroke="var(--border)" strokeDasharray="2 3" />}
          </>
        ) : null}
        <rect x={x} y={y} width={width} height={Math.max(height, 2)} rx={2} fill={`var(--color-${colorOf(node)})`} className="cursor-pointer" />
        {first || terminal ? (
          <text
            x={labelX}
            y={y + height / 2 - 7}
            textAnchor={first ? "end" : "start"}
            dominantBaseline="middle"
            stroke="var(--frame-panel-bg, var(--background))"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
            className="pointer-events-none text-xs"
          >
            <tspan className="fill-foreground font-medium">{node.name}</tspan>
            <tspan x={labelX} dy={15} className="fill-muted-foreground tabular-nums">
              {fmtInt(node.amount)}
            </tspan>
          </text>
        ) : null}
      </g>
    )
  }

  const renderLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index }: SankeyLinkProps) => {
    const link = links[index]
    const target = nodes[link.target]
    const tone = colorOf(target)
    const leak = target.stage === "dropped"
    const opacity = !emphasis ? LINK_OPACITY.rest : emphasis.link(link) ? LINK_OPACITY.on : LINK_OPACITY.off
    const d = `M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`
    const seconds = PULSE_SECONDS[index % PULSE_SECONDS.length]
    const count = Math.max(1, Math.round((link.value / total) * PULSE_DENSITY))
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
            const lane = ((((pulse * 37 + index * 11) % 100) / 100) - 0.5) * linkWidth * 0.6
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

  return (
    <div className="c49-sweep" data-c49-paused={paused ? "" : undefined}>
      <style>{MOTION_STYLE}</style>
      <ChartContainer
        id={uid}
        config={CHART_CONFIG}
        className="aspect-auto h-104 w-full min-w-3xl"
        initialDimension={{ width: 960, height: 416 }}
        role="img"
        aria-label={`Đường ống: ${fmtInt(total)} bài nhận, ${fmtInt(amountOf("linked"))} tin gắn căn`}
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
                className="w-60"
                formatter={(_value, _name, _item, index) =>
                  index === 0 ? <FlowReadout hover={hover} nodes={nodes} links={links} total={total} /> : null
                }
              />
            }
          />
        </Sankey>
      </ChartContainer>
    </div>
  )
}
