"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import type { FilterSpecification, GeoJSONSource, MapLayerEventType, SymbolLayerSpecification } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import "@/lib/map-worker"

import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Map as MapCanvas, MapControls, MapPopup, useMap } from "@/components/ui/map"
import { fmtCompact, fmtMoney, fmtPct } from "@/lib/format"
import { LISTING_PIN } from "@/lib/map-colors"
import { MAP_FONT, MAP_OPTIONS, addAttribution, basemapUrl, denseBounds, prepareBasemap } from "@/lib/map-style"
import type { ListingCardRow } from "@/lib/queries"
import { bedroomsVi, roomTypeVi } from "./listing-labels"

/**
 * Màu nhãn theo kiểu Airbnb (MapLibre cần hex): nhãn giá trắng chữ đậm ở cả sáng
 * lẫn tối, nhãn đang chọn đen viền trắng; cụm và chấm đảo màu theo nền. Giá trị ở lib/map-colors.ts.
 */
const INK = LISTING_PIN.ink
const PAPER = LISTING_PIN.paper
const EDGE = LISTING_PIN.edge

const SOURCE = "listings"
const L = {
  clusters: "listings-clusters",
  clusterCount: "listings-cluster-count",
  dots: "listings-dots",
  pills: "listings-pills",
  pillActive: "listings-pill-active",
} as const

const noopSubscribe = () => () => {}

/** Khung nhìn [tây, nam, đông, bắc] — cha dùng để lọc danh sách theo vùng bản đồ. */
export type ViewBounds = [number, number, number, number]

export const inView = (b: ViewBounds, l: Pick<ListingCardRow, "lng" | "lat">) =>
  l.lng >= b[0] && l.lng <= b[2] && l.lat >= b[1] && l.lat <= b[3]

/** Một thao tác chuột/chạm/phím/lăn trong khung bản đồ mở «cửa» này; bản đồ bắt đầu di chuyển trong cửa = người dùng di chuyển. */
const USER_INPUT_WINDOW_MS = 1000

/**
 * Ảnh nền nhãn giá: viên thuốc co giãn (icon-text-fit) để vừa mọi độ dài chữ.
 * Vẽ bằng canvas một lần cho mỗi màu; toạ độ stretch/content tính theo pixel ảnh.
 */
function pillImage(fill: string, stroke: string) {
  const r = 2 // vẽ 2x cho màn hình nét
  const W = 32
  const H = 28
  const box = { x: 2, y: 1, w: 28, h: 24, rad: 11 }
  const canvas = document.createElement("canvas")
  canvas.width = W * r
  canvas.height = H * r
  const ctx = canvas.getContext("2d")!
  ctx.scale(r, r)
  ctx.shadowColor = "rgba(0,0,0,0.18)"
  ctx.shadowBlur = 2
  ctx.shadowOffsetY = 1
  ctx.beginPath()
  ctx.roundRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, box.rad)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.shadowColor = "transparent"
  ctx.lineWidth = 1
  ctx.strokeStyle = stroke
  ctx.stroke()
  const left = box.x + box.rad
  const right = box.x + box.w - box.rad
  const top = box.y + box.rad
  const bottom = box.y + box.h - box.rad
  return {
    data: ctx.getImageData(0, 0, W * r, H * r),
    options: {
      pixelRatio: r,
      stretchX: [[left * r, right * r]] as [number, number][],
      stretchY: [[top * r, bottom * r]] as [number, number][],
      content: [(box.x + 7) * r, (box.y + 5) * r, (box.x + box.w - 7) * r, (box.y + box.h - 5) * r] as [
        number,
        number,
        number,
        number,
      ],
    },
  }
}

function activeFilter(id: string | null) {
  return [
    "all",
    ["!", ["has", "point_count"]],
    ["!=", ["get", "label"], ""],
    ["==", ["get", "id"], id ?? ""],
  ] as FilterSpecification
}

type LayerProps = {
  listings: ListingCardRow[]
  activeId: string | null
  dark: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  onViewportChange: (bounds: ViewBounds) => void
  /** Đang lọc theo vùng bản đồ — đổi bộ lọc thuộc tính thì giữ khung nhìn, không canh lại. */
  holdView: boolean
  resetKey: number
}

/**
 * Lớp listing trên Map của mapcn — cụm (thu nhỏ) và nhãn giá (phóng to), chép logic lớp của ListingsMap cũ
 * vào `useMap()`. Không dùng `MapClusterLayer` của mapcn: lớp đó vẽ chữ bằng font «Open Sans» mà máy chủ
 * glyph OpenFreeMap không có (số trong cụm không hiện) và không có nhãn giá. Mỗi lần nạp style (đổi
 * sáng/tối) mapcn đóng `isLoaded` rồi mở lại → effect dựng lại lớp trên nền mới.
 */
function ListingLayers({ listings, activeId, dark, onHover, onSelect, onViewportChange, holdView, resetKey }: LayerProps) {
  const { map, isLoaded } = useMap()
  const live = useRef({ onHover, onSelect, onViewportChange, activeId })
  useEffect(() => {
    live.current = { onHover, onSelect, onViewportChange, activeId }
  })

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: listings.map((l, rank) => ({
        type: "Feature" as const,
        properties: { id: l.id, label: l.priceListed ? fmtCompact(l.priceListed) : "", rank },
        geometry: { type: "Point" as const, coordinates: [l.lng, l.lat] },
      })),
    }),
    [listings]
  )
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  })

  // Ghi nguồn thu gọn + cửa «người dùng di chuyển» — một lần cho mỗi bản đồ.
  const userMoveRef = useRef(false)
  /** Đang chạy một lần canh khung của máy: di chuyển này không bao giờ tính là người dùng (kể cả trong cửa 1 giây). */
  const machineMoveRef = useRef(false)
  useEffect(() => {
    if (!map) return
    // Móc đo cho smoke trình duyệt (scripts/smoke-listings-browse.mjs) — chỉ ở dev, bản build không có.
    if (process.env.NODE_ENV !== "production") (window as { __listingsMap?: unknown }).__listingsMap = map
    // Effect chạy lại (StrictMode, dựng lại cây) không gắn thêm nút ghi nguồn thứ hai.
    if (!map.getContainer().querySelector(".maplibregl-ctrl-attrib")) addAttribution(map)
    let lastInput = 0
    const markInput = () => {
      lastInput = Date.now()
      // Người dùng chạm vào giữa lúc máy canh khung: MapLibre dừng hoạt cảnh, cử chỉ sau đó là của người.
      machineMoveRef.current = false
    }
    const container = map.getContainer()
    const inputs = ["pointerdown", "wheel", "keydown", "touchstart"] as const
    for (const ev of inputs) container.addEventListener(ev, markInput, { capture: true, passive: true })
    const onMoveStart = (e: { originalEvent?: unknown }) => {
      if (machineMoveRef.current) return
      if (e.originalEvent || Date.now() - lastInput < USER_INPUT_WINDOW_MS) userMoveRef.current = true
    }
    const onMoveEnd = () => {
      if (machineMoveRef.current) {
        machineMoveRef.current = false
        return
      }
      if (!userMoveRef.current) return
      userMoveRef.current = false
      const b = map.getBounds()
      live.current.onViewportChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    }
    map.on("movestart", onMoveStart)
    map.on("moveend", onMoveEnd)
    return () => {
      for (const ev of inputs) container.removeEventListener(ev, markInput, { capture: true })
      map.off("movestart", onMoveStart)
      map.off("moveend", onMoveEnd)
    }
  }, [map])

  // Lớp riêng: dựng mỗi khi style nạp xong (lần đầu và mỗi lần đổi sáng/tối).
  useEffect(() => {
    if (!map || !isLoaded) return
    prepareBasemap(map)
    // Cụm và chấm đảo màu theo nền: đen trên nền sáng, trắng trên nền tối.
    const mark = dark ? PAPER : INK
    const markEdge = dark ? INK : PAPER
    const pill = pillImage(PAPER, EDGE)
    const pillActive = pillImage(INK, PAPER)
    if (!map.hasImage("pill")) map.addImage("pill", pill.data, pill.options)
    if (!map.hasImage("pill-active")) map.addImage("pill-active", pillActive.data, pillActive.options)

    map.addSource(SOURCE, {
      type: "geojson",
      data: dataRef.current,
      cluster: true,
      // Từ zoom 12 (cỡ một quận) hết gom cụm: nhãn tự ẩn khi đè nhau, còn chấm.
      clusterRadius: 36,
      clusterMaxZoom: 11,
    })
    map.addLayer({
      id: L.clusters,
      type: "circle",
      source: SOURCE,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": mark,
        "circle-stroke-color": markEdge,
        "circle-stroke-width": 2,
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 18, 50, 23],
      },
    })
    map.addLayer({
      id: L.clusterCount,
      type: "symbol",
      source: SOURCE,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": MAP_FONT.bold,
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: { "text-color": markEdge },
    })
    // Chấm cho mọi listing lẻ: nhãn bị ẩn do đè nhau vẫn còn dấu trên bản đồ.
    map.addLayer({
      id: L.dots,
      type: "circle",
      source: SOURCE,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": mark,
        "circle-radius": 4,
        "circle-stroke-color": markEdge,
        "circle-stroke-width": 1.5,
      },
    })
    const pillLayout = {
      "icon-text-fit": "both",
      "icon-text-fit-padding": [1, 2, 1, 2],
      "text-field": ["get", "label"],
      "text-font": MAP_FONT.bold,
      "text-size": 12,
    } satisfies SymbolLayerSpecification["layout"]
    map.addLayer({
      id: L.pills,
      type: "symbol",
      source: SOURCE,
      filter: ["all", ["!", ["has", "point_count"]], ["!=", ["get", "label"], ""]],
      layout: {
        ...pillLayout,
        "icon-image": "pill",
        "symbol-sort-key": ["get", "rank"],
        "symbol-z-order": "source",
        "icon-padding": 1,
      },
      paint: { "text-color": INK },
    })
    map.addLayer({
      id: L.pillActive,
      type: "symbol",
      source: SOURCE,
      filter: activeFilter(live.current.activeId),
      layout: {
        ...pillLayout,
        "icon-image": "pill-active",
        "icon-allow-overlap": true,
        "text-allow-overlap": true,
        "icon-ignore-placement": true,
        "text-ignore-placement": true,
      },
      paint: { "text-color": PAPER },
    })

    // Rê chuột / bấm: nhãn hoặc chấm của listing lẻ. Bấm mở popup (khuôn store-locator), không nhảy trang.
    const offs: (() => void)[] = []
    const on = (type: keyof MapLayerEventType, layer: string | string[], fn: (e: never) => void) => {
      const ids = typeof layer === "string" ? [layer] : layer
      map.on(type as "click", ids, fn as never)
      offs.push(() => map.off(type as "click", ids, fn as never))
    }
    // Một bộ nghe cho cả ba lớp (thứ tự vẽ: trên cùng trước) — nhãn và chấm của hai listing chồng nhau thì lấy
    // phần tử trên cùng, không để lớp dưới ghi đè lựa chọn.
    const POINT_LAYERS = [L.pillActive, L.pills, L.dots]
    const topId = (e: { features?: { properties?: { id?: unknown } }[] }) => {
      const id = e.features?.[0]?.properties?.id
      return typeof id === "string" ? id : null
    }
    on("mousemove", POINT_LAYERS, (e: { features?: { properties?: { id?: unknown } }[] }) => {
      const id = topId(e)
      if (!id) return
      map.getCanvas().style.cursor = "pointer"
      live.current.onHover(id)
    })
    on("mouseleave", POINT_LAYERS, () => {
      map.getCanvas().style.cursor = ""
      live.current.onHover(null)
    })
    on("click", POINT_LAYERS, (e: { features?: { properties?: { id?: unknown } }[] }) => {
      const id = topId(e)
      if (id) live.current.onSelect(id)
    })
    // Bấm cụm: phóng tới mức tách cụm — tính là người dùng di chuyển (lọc danh sách).
    on("click", L.clusters, async (e: { features?: { properties: { cluster_id: number }; geometry: GeoJSON.Geometry }[] }) => {
      const f = e.features?.[0]
      if (!f) return
      const source = map.getSource(SOURCE) as GeoJSONSource
      const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id)
      userMoveRef.current = true
      map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
    })
    on("mouseenter", L.clusters, () => (map.getCanvas().style.cursor = "pointer"))
    on("mouseleave", L.clusters, () => (map.getCanvas().style.cursor = ""))

    return () => {
      for (const off of offs) off()
      try {
        for (const id of Object.values(L).reverse()) if (map.getLayer(id)) map.removeLayer(id)
        if (map.getSource(SOURCE)) map.removeSource(SOURCE)
      } catch {
        // style đã bị thay (đổi sáng/tối) — lớp đi cùng style cũ
      }
    }
  }, [map, isLoaded, dark])

  /** Canh khung của máy: chặn cửa «người dùng» cho đúng lần di chuyển này; không di chuyển thì mở chặn ngay. */
  const machineFit = (m: NonNullable<typeof map>, bounds: ReturnType<typeof denseBounds>, duration?: number) => {
    userMoveRef.current = false
    machineMoveRef.current = true
    m.fitBounds(bounds, { padding: 40, maxZoom: 15, ...(duration === undefined ? {} : { duration }) })
    if (!m.isMoving()) machineMoveRef.current = false
  }

  // Tập listing đổi (bộ lọc thuộc tính): thay dữ liệu, không dựng lại lớp. Không đang lọc theo vùng
  // thì canh khung theo tập mới — di chuyển của máy, không lọc danh sách.
  const firstData = useRef(true)
  useEffect(() => {
    if (!map || !isLoaded) return
    ;(map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(data)
    if (firstData.current) {
      firstData.current = false
      return
    }
    if (holdView || listings.length === 0) return
    const bounds = denseBounds(listings.map((l) => [l.lng, l.lat]))
    machineFit(map, bounds, 300)
    // holdView đọc theo lúc dữ liệu đổi; đổi holdView một mình không canh khung.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi tập listing đổi
  }, [map, isLoaded, data])

  // "Bỏ lọc": canh khung lại toàn bộ.
  useEffect(() => {
    if (!map || resetKey === 0 || listings.length === 0) return
    machineFit(map, denseBounds(listings.map((l) => [l.lng, l.lat])))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi bấm «Bỏ lọc»
  }, [resetKey])

  // Nhãn của thẻ đang rê chuột đổi sang đen, luôn nổi trên cùng.
  useEffect(() => {
    if (map && isLoaded && map.getLayer(L.pillActive)) map.setFilter(L.pillActive, activeFilter(activeId))
  }, [map, isLoaded, activeId])

  return null
}

/**
 * Bản đồ Duyệt listing — chuyển thể LocatorMap của @mapcn/store-locator trên `Map` của @mapcn/map: nền
 * OpenFreeMap có màu (`lib/map-style.ts`, không dùng nền Carto mặc định của mapcn), nút phóng to/thu nhỏ,
 * bấm listing mở popup (tên, giá, công suất, «Xem listing») thay cho nhảy trang ngay. Khác bản gốc: không
 * dùng Sidebar/MapMarker DOM (tới 300 listing, gom cụm) — danh sách là lưới thẻ của trang; lớp cụm + nhãn
 * giá ở `ListingLayers`.
 *
 * Báo khung nhìn sau khi NGƯỜI DÙNG kéo/zoom (kể cả bấm cụm hay nút phóng to), để danh sách lọc theo vùng
 * bản đồ như AirDNA. Canh khung đầu, canh theo bộ lọc mới, resize, đổi sáng/tối và «Bỏ lọc» đều không lọc.
 */
export function ListingsMap({
  listings,
  currency,
  activeId,
  onHover,
  onViewportChange,
  holdView,
  resetKey,
}: {
  listings: ListingCardRow[]
  currency: string
  activeId: string | null
  onHover: (id: string | null) => void
  onViewportChange: (bounds: ViewBounds) => void
  holdView: boolean
  /** Đổi giá trị để canh lại khung về toàn bộ listing (nút "Bỏ lọc"). */
  resetKey: number
}) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = listings.find((l) => l.id === selectedId) ?? null

  // Khung đầu tính một lần khi dựng bản đồ (MapOptions chỉ đọc lúc tạo).
  const [initial] = useState(() => {
    const b = denseBounds(listings.map((l) => [l.lng, l.lat]))
    return b.isEmpty()
      ? { center: [105.85, 21.03] as [number, number], zoom: 11 }
      : { bounds: b, fitBoundsOptions: { padding: 40, maxZoom: 15 } }
  })

  // Server không biết sáng/tối: cùng một khung ở cả hai phía, bản đồ chỉ gắn sau hydrate khi đã biết
  // giao diện — nạp đúng nền ngay lần đầu, khỏi nháy, khỏi lệch hydrate.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)

  return (
    <div data-mapcn="" className="size-full min-h-80">
      {hydrated && resolvedTheme !== undefined && (
        <MapCanvas
          {...MAP_OPTIONS}
          {...initial}
          theme={dark ? "dark" : "light"}
          styles={{ light: basemapUrl("colored", false), dark: basemapUrl("colored", true) }}
        >
          <MapControls position="bottom-right" />
          <ListingLayers
            listings={listings}
            activeId={activeId}
            dark={dark}
            onHover={onHover}
            onSelect={setSelectedId}
            onViewportChange={onViewportChange}
            holdView={holdView}
            resetKey={resetKey}
          />
          {selected && (
            <MapPopup
              key={selected.id}
              longitude={selected.lng}
              latitude={selected.lat}
              offset={18}
              closeButton
              closeOnClick={false}
              onClose={() => setSelectedId(null)}
              className="min-w-56"
              focusAfterOpen={false}
            >
              <div className="flex flex-col gap-2 pr-5">
                <p className="text-popover-foreground text-sm font-medium">{selected.name ?? selected.id}</p>
                <div className="flex flex-wrap gap-1">
                  {[roomTypeVi(selected.roomType), bedroomsVi(selected.bedrooms)]
                    .filter((b): b is string => Boolean(b))
                    .map((b) => (
                      <Badge key={b} variant="outline" size="sm">
                        {b}
                      </Badge>
                    ))}
                </div>
                <dl className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <dt>Giá/đêm</dt>
                    <dd className="text-popover-foreground font-semibold tabular-nums">{fmtMoney(selected.priceListed, currency)}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt>Công suất</dt>
                    <dd className="text-popover-foreground font-semibold tabular-nums">{fmtPct(selected.occupancy)}</dd>
                  </div>
                </dl>
                <Button
                  variant="outline"
                  size="xs"
                  className="w-fit"
                  nativeButton={false}
                  render={<Link prefetch={false} href={`/listing/${selected.id}`} />}
                >
                  Xem listing
                </Button>
              </div>
            </MapPopup>
          )}
        </MapCanvas>
      )}
    </div>
  )
}
