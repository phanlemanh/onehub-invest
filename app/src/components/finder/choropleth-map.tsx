"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { LngLatBounds, Map as MLMap, Popup } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import "@/lib/map-worker"

import { BIN_COLORS, NO_DATA_COLOR } from "./bins"

export type ChoroplethArea = {
  id: string
  name: string
  href: string
  /** Bậc 0–3, null khi chưa có số. */
  bin: number | null
  /** Giá trị đã định dạng cho popup. */
  label: string
  geometry: unknown
}

/** Mọi toạ độ của một GeoJSON geometry (Polygon/MultiPolygon). */
function* coordsOf(geometry: unknown): Generator<[number, number]> {
  const walk = function* (node: unknown): Generator<[number, number]> {
    if (Array.isArray(node) && typeof node[0] === "number") {
      yield [node[0] as number, node[1] as number]
    } else if (Array.isArray(node)) {
      for (const child of node) yield* walk(child)
    }
  }
  yield* walk((geometry as { coordinates?: unknown })?.coordinates)
}

/**
 * Bản đồ choropleth thuần (MapLibre — ReUI không có map). Chỉ vẽ: màu theo
 * bậc, popup khi rê chuột, bấm để mở Insight. Bộ chọn chỉ số và chú giải nằm
 * ngoài, dựng bằng ReUI. Canh khung theo các khu vực đang xem.
 */
export function ChoroplethMap({ areas }: { areas: ChoroplethArea[] }) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: areas
        .filter((a) => a.geometry)
        .map((a) => ({
          type: "Feature" as const,
          properties: {
            id: a.id,
            name: a.name,
            href: a.href,
            label: a.label,
            color: a.bin === null ? NO_DATA_COLOR : BIN_COLORS[a.bin],
          },
          geometry: a.geometry,
        })),
    }),
    [areas]
  )

  // Khung nhìn: dựng lại bản đồ khi tập khu vực đổi (đổi cấp / đổi thị trường).
  const areaKey = areas.map((a) => a.id).join(",")
  useEffect(() => {
    if (!ref.current) return
    const bounds = new LngLatBounds()
    for (const a of areas) for (const c of coordsOf(a.geometry)) bounds.extend(c)
    const map = new MLMap({
      container: ref.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": "#f8fafc" } }],
      },
      bounds: bounds.isEmpty() ? undefined : bounds,
      center: bounds.isEmpty() ? [105.85, 21.03] : undefined,
      zoom: bounds.isEmpty() ? 9 : undefined,
      fitBoundsOptions: { padding: 24 },
      attributionControl: false,
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MobileHelpText": "Dùng hai ngón tay để di chuyển bản đồ",
      },
    })
    mapRef.current = map

    map.on("load", () => {
      map.addSource("areas", { type: "geojson", data: data as never })
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.85 },
      })
      map.addLayer({
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": "#ffffff", "line-width": 0.8 },
      })
      const popup = new Popup({ closeButton: false, offset: 4 })
      map.on("mousemove", "areas-fill", (e) => {
        const f = e.features?.[0]
        if (!f) return
        map.getCanvas().style.cursor = "pointer"
        const props = f.properties as { name: string; label: string }
        const el = document.createElement("div")
        const name = document.createElement("strong")
        name.textContent = props.name
        el.append(name, document.createElement("br"), props.label)
        popup.setLngLat(e.lngLat).setDOMContent(el).addTo(map)
      })
      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = ""
        popup.remove()
      })
      map.on("click", "areas-fill", (e) => {
        const href = e.features?.[0]?.properties?.href
        if (typeof href === "string") router.push(href)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // Chỉ dựng lại khi tập khu vực đổi; đổi chỉ số chỉ cập nhật dữ liệu bên dưới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaKey])

  // Đổi chỉ số → chỉ đổi màu/nhãn, giữ nguyên khung nhìn.
  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource("areas") as { setData?: (d: unknown) => void } | undefined
    source?.setData?.(data)
  }, [data])

  return <div ref={ref} className="size-full min-h-80" />
}
