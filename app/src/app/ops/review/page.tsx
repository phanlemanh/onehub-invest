import type { Metadata } from "next";

import { ReviewContent } from "@/components/ops/review-content";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review Queue" };

/**
 * /ops/review — HITL Review Queue (hitl-review-queue.md).
 * Nơi con người phán quyết các đề xuất từ AI/Stage B.
 * Mọi loại phán quyết generic: entity_match, source_decision, agent_output.
 * Trang chỉ kiểm quyền; nội dung (kể cả dừng sớm khi review_queue vắng trên cloud) ở ReviewContent.
 */
export default async function ReviewPage() {
  const user = await getSessionUser();
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>;
  }
  return <ReviewContent user={user} />;
}
