import { Suspense } from "react";
import type { Metadata } from "next";

import { AiCallsContent } from "@/components/ops/ai-calls/ai-calls-content";
import { AiCallsSkeleton } from "@/components/ops/ai-calls/ai-calls-skeleton";
import { RegionError } from "@/components/states/region-error";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cuộc gọi AI" };

/**
 * /ops/ai-calls «Cuộc gọi AI» (PL29 `so-cuoc-goi-ai`): token, độ trễ, chi phí mọi cuộc gọi agent runtime theo ngày ×
 * việc × model, 30 ngày. Chạy ở cả máy thu (bảng ai_calls) lẫn máy chủ (khối `aiCalls` của bản tin).
 */
export default function AiCallsPage() {
  return (
    <RegionError what="cuộc gọi AI">
      <Suspense fallback={<AiCallsSkeleton />}>
        <AiCallsContent />
      </Suspense>
    </RegionError>
  );
}
