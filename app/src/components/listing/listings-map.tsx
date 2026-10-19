"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { LngLatBounds, Map as MLMap, Marker } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import "@/lib/map-worker"

import { fmtCompact } from "@/lib/format"
import type { ListingCardRow } from "@/lib/queries"

// Nhãn giá như AirDNA ("price pills"): DOM marker, class Tailwind tĩnh.
const PILL =
  "cursor-pointer rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] leading-none font-medium text-foreground shadow-xs tabular-nums transition-colors hover:border-primary"
const PILL_ACTIVE = ["bg-primary", "text-primary-foreground", "border-primary", "z-10"]

/**
 * Bản đồ nhãn giá (MapLibre — ReUI không có map). Báo về danh sách id đang
 * nằm trong khung nhìn sau khi NGƯỜI DÙNG kéo/zoom, để danh sách lọc theo vùng
 * bản đồ như AirDNA. Chỉ tính cử chỉ thật (dragstart/zoomstart có
 * originalEvent): resize khung, canh khung đầu và "Bỏ lọc" đều không lọc.
 */
export function ListingsMap({
  listings,
  activeId,
  onHover,
  onViewportChange,
  resetKey,
}: {
  listings: ListingCardRow[]
  activeId: string | null
  onHover: (id: string | null) => void
  onViewportChange: (ids: Set<string>) => void
  /** Đổi giá trị để canh lại khung về toàn bộ listing (nút "Bỏ lọc"). */
  resetKey: number
}) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const markersRef = useRef(new Map<string, HTMLElement>())
  /** true từ lúc người dùng bắt đầu kéo/zoom tới moveend tương ứng. */
  const userMoveRef = useRef(false)
  const callbacks = useRef({ onHover, onViewportChange })
  useEffect(() => {
    callbacks.current = { onHover, onViewportChange }
  })

  const boundsOf = () => {
    const bounds = new LngLatBounds()
    for (const l of listings) bounds.extend([l.lng, l.lat])
    return bounds
  }

  const listingKey = listings.map((l) => l.id).join(",")
  useEffect(() => {
    if (!ref.current) return
    const bounds = boundsOf()
    const map = new MLMap({
      container: ref.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": "#f8fafc" } }],
      },
      bounds: bounds.isEmpty() ? undefined : bounds,
      center: bounds.isEmpty() ? [105.85, 21.03] : undefined,
      zoom: bounds.isEmpty() ? 11 : undefined,
      fitBoundsOptions: { padding: 40, maxZoom: 15 },
      attributionControl: false,
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MobileHelpText": "Dùng hai ngón tay để di chuyển bản đồ",
      },
    })
    mapRef.current = map
    userMoveRef.current = false
    const markers = markersRef.current
    markers.clear()

    for (const l of listings) {
      const el = document.createElement("button")
      el.type = "button"
      el.className = PILL
      el.textContent = l.priceListed ? fmtCompact(l.priceListed) : "•"
      el.setAttribute("aria-label", `${l.name ?? l.id}${l.priceListed ? `, ${fmtCompact(l.priceListed)}` : ""}`)
      el.addEventListener("mouseenter", () => callbacks.current.onHover(l.id))
      el.addEventListener("mouseleave", () => callbacks.current.onHover(null))
      el.addEventListener("click", () => router.push(`/listing/${l.id}`))
      new Marker({ element: el }).setLngLat([l.lng, l.lat]).addTo(map)
      markers.set(l.id, el)
    }

    const markUser = (e: { originalEvent?: unknown }) => {
      if (e.originalEvent) userMoveRef.current = true
    }
    map.on("dragstart", markUser)
    map.on("zoomstart", markUser)
    map.on("moveend", () => {
      if (!userMoveRef.current) return
      userMoveRef.current = false
      const view = map.getBounds()
      callbacks.current.onViewportChange(
        new Set(listings.filter((l) => view.contains([l.lng, l.lat])).map((l) => l.id))
      )
    })

    return () => {
      map.remove()
      mapRef.current = null
      markers.clear()
    }
    // Dựng lại khi tập listing đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingKey])

  // "Bỏ lọc": canh khung lại toàn bộ.
  useEffect(() => {
    if (resetKey === 0) return
    const map = mapRef.current
    const bounds = boundsOf()
    if (!map || bounds.isEmpty()) return
    userMoveRef.current = false
    map.fitBounds(bounds, { padding: 40, maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // Nhãn của thẻ đang rê chuột sáng lên.
  useEffect(() => {
    for (const [id, el] of markersRef.current) {
      for (const cls of PILL_ACTIVE) el.classList.toggle(cls, id === activeId)
    }
  }, [activeId])

  return <div ref={ref} className="size-full min-h-80" />
}
