"use client";

import { useEffect, useRef } from "react";
import { LngLatBounds, Map as MLMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/lib/map-worker";

export function MiniMap({
  features,
  lat,
  lng,
}: {
  features: { type: "Feature"; properties: { name: string; active: boolean }; geometry: unknown }[];
  lat: number;
  lng: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new MLMap({
      container: ref.current,
      // Blank style: chỉ polygon từ DB — không phụ thuộc tile service ngoài
      // (divergence: AirDNA dùng Google Maps basemap).
      style: {
        version: 8,
        sources: {},
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#f1f5f9" } },
        ],
      },
      center: [lng, lat],
      zoom: 10,
      attributionControl: false,
      // Bản đồ nằm giữa trang dài: lăn chuột để cuộn trang, giữ ⌘/Ctrl mới zoom.
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Giữ Ctrl và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MacHelpText": "Giữ ⌘ và lăn chuột để phóng to bản đồ",
        "CooperativeGesturesHandler.MobileHelpText": "Dùng hai ngón tay để di chuyển bản đồ",
      },
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("areas", {
        type: "geojson",
        data: { type: "FeatureCollection", features } as never,
      });
      map.addLayer({
        id: "areas-fill",
        type: "fill",
        source: "areas",
        paint: {
          "fill-color": [
            "case",
            ["get", "active"],
            "#2563eb",
            "#93c5fd",
          ],
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "areas-line",
        type: "line",
        source: "areas",
        paint: { "line-color": "#1e3a8a", "line-width": 1 },
      });
      const popup = new Popup({ closeButton: false, offset: 4 });
      map.on("mousemove", "areas-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (f) {
          popup
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${f.properties?.name}</strong>`)
            .addTo(map);
        }
      });
      map.on("mouseleave", "areas-fill", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
      const bounds = new LngLatBounds();
      for (const f of features) {
        const g = f.geometry as { type: string; coordinates: unknown };
        const flat: [number, number][] = [];
        const walk = (x: unknown) => {
          if (!Array.isArray(x)) return;
          if (typeof x[0] === "number" && typeof x[1] === "number") {
            flat.push([x[0] as number, x[1] as number]);
            return;
          }
          for (const y of x) walk(y);
        };
        walk(g.coordinates);
        for (const c of flat) bounds.extend([c[0], c[1]]);
      }
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 24, duration: 0 });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [features, lat, lng]);

  return <div ref={ref} className="h-72 w-full" />;
}
