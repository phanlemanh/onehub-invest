"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Map as MLMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/lib/map-worker";
import type { ChoroplethFeature } from "@/lib/queries";

/** p30/p60/p90 — mirror primitive `metric_percentiles` của AirDNA (legend động theo phân bố). */
export function percentilesOf(values: number[], p: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return p.map((q) => {
    const idx = (sorted.length - 1) * q;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  });
}

type MetricKey = "revenue" | "adr" | "occupancy" | "revpar" | "listings";

const METRICS: { key: MetricKey; label: string; kind: "money" | "pct" | "int" }[] = [
  { key: "revenue", label: "Revenue", kind: "money" },
  { key: "adr", label: "ADR", kind: "money" },
  { key: "occupancy", label: "Occupancy", kind: "pct" },
  { key: "revpar", label: "RevPAR", kind: "money" },
  { key: "listings", label: "Listings", kind: "int" },
];

// Thang màu choropleth: nhạt → đậm (4 band theo p30/p60/p90)
const RAMP = ["#eff6ff", "#bfdbfe", "#60a5fa", "#1d4ed8", "#1e3a8a"];

export function FinderMap({
  features,
  centerLat,
  centerLng,
  currency,
  basePath,
}: {
  features: ChoroplethFeature[];
  centerLat: number;
  centerLng: number;
  currency: string;
  basePath: string; // vd "/th/bangkok" — click polygon đẩy tới `${basePath}/${slug}`
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [metric, setMetric] = useState<MetricKey>("revenue");

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: features.map((f) => ({
        type: "Feature" as const,
        properties: {
          id: f.id,
          name: f.name,
          slug: f.slug,
          ...f.metrics,
        },
        geometry: f.geometry,
      })),
    }),
    [features],
  );

  // Ngưỡng legend tính từ phân bố metric đang chọn (AirDNA: legend = percentile của tập lọc)
  const cuts = useMemo(() => {
    const vals = features.map((f) => f.metrics[metric]).filter((v): v is number => v !== null);
    return vals.length > 0 ? percentilesOf(vals, [0.3, 0.6, 0.9]) : [0, 0, 0];
  }, [features, metric]);

  const meta = METRICS.find((m) => m.key === metric)!;
  const fmt = (v: number | null) => {
    if (v === null) return "—";
    if (meta.kind === "pct") return `${(v * 100).toFixed(1)}%`;
    if (meta.kind === "int") return new Intl.NumberFormat("en-US").format(v);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  };

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new MLMap({
      container: ref.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#f8fafc" } },
        ],
      },
      center: [centerLng, centerLat],
      zoom: 11,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("areas", { type: "geojson", data: geojson as never });
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        paint: { "fill-color": "#93c5fd", "fill-opacity": 0.75 },
      });
      map.addLayer({
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": "#ffffff", "line-width": 0.8 },
      });
      const popup = new Popup({ closeButton: false, offset: 4 });
      map.on("mousemove", "areas-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f) {
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<strong>${f.properties?.name}</strong><br>${meta.label}: ${fmt(
                (f.properties as Record<string, number>)[metric] ?? null,
              )}`,
            )
            .addTo(map);
        }
      });
      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
      map.on("click", "areas-fill", (e) => {
        const slug = e.features?.[0]?.properties?.slug;
        console.log("[finder] LAYERED click, slug:", slug, "features:", e.features?.length);
        if (slug) router.push(`${basePath}/${slug}`);
      });
      map.on("click", (e) => console.log("[finder] map click", e.point));
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features]);

  // Đổi metric → đổi fill-color (data-driven interpolate theo percentile cuts)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("areas-fill")) return;
    const vals = features
      .map((f) => f.metrics[metric])
      .filter((v): v is number => v !== null);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const [p30, p60, p90] = cuts;
    map.setPaintProperty("areas-fill", "fill-color", [
      "interpolate",
      ["linear"],
      ["get", metric],
      min,
      RAMP[0],
      p30,
      RAMP[1],
      p60,
      RAMP[2],
      p90,
      RAMP[3],
      max,
      RAMP[4],
    ]);
  }, [metric, cuts, features]);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      {/* Metric selector */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 p-3">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              metric === m.key
                ? "bg-blue-700 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div ref={ref} className="h-[28rem] w-full" />
      {/* Legend percentile động — mirror AirDNA "<59 | 59–76 | 76–94 | >94" */}
      <div className="flex flex-wrap items-center gap-3 border-t border-neutral-200 p-3 text-xs text-neutral-600">
        <span className="font-medium text-neutral-800">{meta.label}</span>
        {[
          { color: RAMP[1], label: `< ${fmt(cuts[0])}` },
          { color: RAMP[2], label: `${fmt(cuts[0])} – ${fmt(cuts[1])}` },
          { color: RAMP[3], label: `${fmt(cuts[1])} – ${fmt(cuts[2])}` },
          { color: RAMP[4], label: `> ${fmt(cuts[2])}` },
        ].map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-5 rounded-sm"
              style={{ backgroundColor: b.color }}
            />
            {b.label}
          </span>
        ))}
        <span className="ml-auto text-neutral-400">
          {features.length} submarkets · click a district for insights
        </span>
      </div>
    </div>
  );
}
