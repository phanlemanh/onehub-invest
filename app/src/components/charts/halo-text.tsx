import { type SVGProps } from "react"

/** SVG text with a panel-coloured halo, so a figure stays legible over a line or fill. */
export function HaloText(props: SVGProps<SVGTextElement>) {
  return (
    <text
      {...props}
      stroke="var(--card)"
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
    />
  )
}
