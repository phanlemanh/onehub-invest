import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { ReviewCard, type ReviewItem } from "@/components/ops/review-card";
import { Badge } from "@/components/reui/badge";
import type { User } from "@/lib/auth";
import { pool } from "@/lib/db";
import { fmtInt } from "@/lib/format";
import { getCloudOpsView } from "@/lib/ops-cloud";
import { localOnlyTable } from "@/lib/ops-queries";
import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status";
import { loadReviewMedia, stripEvidenceImages } from "@/lib/ops/review-media";

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
 * Nội dung /ops/review sau bước kiểm quyền ops (page.tsx). review_queue là tầng A, chỉ có ở máy local: vắng bảng
 * (cloud) thì dừng ở thông báo có tên thay vì ném 42P01 (sự cố prod 24/10, audit OPS-1).
 */
export async function ReviewContent({ user }: { user: User }) {
  if (await localOnlyTable("review_queue")) {
    // Cloud: chỉ số đếm thẻ chờ từ bản tin máy local (ON3, ADR-0014 — nội dung thẻ là tầng A, không lên cloud).
    const cloud = await getCloudOpsView();
    const pending = cloud.pending;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-medium">Review Queue</h1>
          <p className="text-sm tabular-nums" data-pending-total={pending?.total ?? ""}>
            <span className="font-semibold">{pending ? fmtInt(pending.total) : "—"}</span> thẻ đang chờ
          </p>
          {pending && pending.byType.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {pending.byType.map((t) => (
                <Badge key={t.type} variant="outline" data-pending-type={t.type}>
                  {t.type}: {fmtInt(t.n)}
                </Badge>
              ))}
            </div>
          ) : null}
          <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} />
        </div>
        <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} />
        <LocalOnlyAlert title="Hàng chờ duyệt chỉ có ở máy local">
          Hàng chờ duyệt giữ bằng chứng thô của nguồn (tầng A) nên không lên cloud. Duyệt ở Ops trên máy thu.
        </LocalOnlyAlert>
      </div>
    );
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
