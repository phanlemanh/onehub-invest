import type { Metadata } from "next";

import { CollectionsContent } from "@/components/ops/collections/collections-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thu thập" };

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/** /ops/collections "Thu Thập" (portals.md) — thân trang ở CollectionsContent (đọc phiên, che theo vai). */
export default async function CollectionsPage() {
  return <CollectionsContent nowMs={requestTime()} />;
}
