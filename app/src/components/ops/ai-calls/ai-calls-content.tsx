import { getAiCalls } from "@/lib/ai-calls-queries"

import { AiCallsView } from "./ai-calls-view"

/** Nội dung /ops/ai-calls (PL29): một đường cho cả hai nơi — `getAiCalls` nhận nơi chạy theo `VERCEL` (máy thu đọc bảng
 * ai_calls, máy chủ đọc khối `aiCalls` của bản tin). Không có dữ liệu nhạy cảm: chỉ số và tên việc/model. */
export async function AiCallsContent() {
  return <AiCallsView data={await getAiCalls()} />
}
