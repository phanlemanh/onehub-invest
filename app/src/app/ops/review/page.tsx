import type { Metadata } from "next";

import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { canAccessOps } from "@/lib/ops-access";
import { loadReviewMedia, stripEvidenceImages } from "@/lib/ops/review-media";
import { ReviewCard, type ReviewItem } from "@/components/ops/review-card";
import { Badge } from "@/components/reui/badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review Queue" };

type Row = {
  id: number;
  item_type: string;
  title: string;
  evidence: Record<string, unknown>;
  ai_suggestion: string | null;
  ai_reasoning: string | null;
  ai_confidence: string | null;
  status: string;
};

/**
 * /ops/review — HITL Review Queue (hitl-review-queue.md).
 * Nơi con người phán quyết các đề xuất từ AI/Stage B.
 * Mọi loại phán quyết generic: entity_match, source_decision, agent_output.
 */
export default async function ReviewPage() {
  const user = await getSessionUser();
  if (!canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>;
  }

  const { rows } = await pool.query<Row>(
    `SELECT id, item_type, title, evidence, ai_suggestion, ai_reasoning, ai_confidence::text, status
     FROM review_queue ORDER BY status = 'pending' DESC, id`,
  );

  const items: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    item_type: r.item_type,
    title: r.title,
    // URL ảnh không đi trong evidence — ảnh tới thẻ chỉ qua loadReviewMedia (admin).
    evidence: stripEvidenceImages(r.evidence),
    ai_suggestion: r.ai_suggestion,
    ai_reasoning: r.ai_reasoning,
    ai_confidence: r.ai_confidence ? Number(r.ai_confidence) : null,
    status: r.status,
  }));

  // Ảnh tin (tầng A): {} khi không phải admin; một truy vấn cho cả hàng duyệt.
  const media = await loadReviewMedia(rows, user);

  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");
  const approved = items.filter((i) => i.status === "approved").length;
  const rejected = items.filter((i) => i.status === "rejected").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-medium">Review Queue</h1>
        <p className="text-muted-foreground text-xs">
          Phán quyết con người (HITL) — AI/hệ thống đề xuất, bạn quyết định.
          Mọi quyết định ghi audit.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant={pending.length > 0 ? "warning-light" : "success-light"}>
            {pending.length} chờ review
          </Badge>
          {approved > 0 && <Badge variant="success-light">✓ {approved} đã duyệt</Badge>}
          {rejected > 0 && <Badge variant="outline">✗ {rejected} từ chối</Badge>}
        </div>
      </div>

      {pending.length === 0 && decided.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Queue trống — không có item chờ phán quyết.
        </p>
      ) : (
        <>
          {pending.map((item) => (
            <ReviewCard key={item.id} item={item} media={media[item.id]} />
          ))}
          {decided.length > 0 && (
            <>
              <h2 className="text-muted-foreground mt-4 text-sm">
                Đã quyết ({decided.length})
              </h2>
              {decided.map((item) => (
                <ReviewCard key={item.id} item={item} media={media[item.id]} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
