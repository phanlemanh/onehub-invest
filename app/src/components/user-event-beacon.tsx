"use client";

import { useEffect, useRef } from "react";

/**
 * UserEventBeacon — M2: fire-and-forget ghi user_events từ client.
 * Dedupe: 1 event/kind/30s qua localStorage (tránh spam view_market).
 *
 * Dùng:
 *   <UserEventBeacon kind="view_market" payload={{ areaId }} />
 *   đặt trong page/component — tự gửi 1 lần khi mount.
 *
 * Cho input (G3 calculator): gọi sendUserEvent trực tiếp.
 */

const DEDUPE_MS = 30_000;

export function sendUserEvent(kind: string, payload: Record<string, unknown>) {
  const key = `ue:${kind}`;
  const last = Number(localStorage.getItem(key) ?? 0);
  if (Date.now() - last < DEDUPE_MS) return; // dedupe

  localStorage.setItem(key, String(Date.now()));
  const body = JSON.stringify({ kind, payload });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/v1/user-events", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/v1/user-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function UserEventBeacon({
  kind,
  payload,
}: {
  kind: string;
  payload: Record<string, unknown>;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (!sent.current) {
      sent.current = true;
      sendUserEvent(kind, payload);
    }
  }, []); // 1 lần khi mount
  return null;
}
