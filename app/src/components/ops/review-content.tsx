import { Suspense } from "react";
import { InfoIcon } from "lucide-react";

import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { ReviewQueue } from "@/components/ops/review/review-queue";
import { ReviewQueueSkeleton } from "@/components/ops/review/review-queue-skeleton";
import { Alert, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { RegionError } from "@/components/states/region-error";
import type { User } from "@/lib/auth";
import { pool } from "@/lib/db";
import { fmtInt } from "@/lib/format";
import { getCloudOpsView, type PendingCount } from "@/lib/ops-cloud";
import { xemNoiDungTin } from "@/lib/ops-access";
import { localOnlyTable } from "@/lib/ops-queries";
import { cn } from "@/lib/utils";
import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status";
import { loadReviewContext } from "@/lib/ops/review-context";
import { loadReviewMedia, stripEvidenceImages } from "@/lib/ops/review-media";
import { toReviewItem, type ReviewQueueRow } from "@/lib/ops/review-queue";

/**
 * Nội dung /ops/review sau bước kiểm quyền ops (page.tsx). review_queue là tầng A, chỉ có ở máy local: vắng bảng
 * (cloud) thì dừng ở thông báo có tên thay vì ném 42P01 (sự cố prod 24/10, audit OPS-1).
 */
export async function ReviewContent({ user }: { user: User }) {
  if (await localOnlyTable("review_queue")) {
    // Cloud: chỉ số đếm thẻ chờ từ bản tin máy local (ON3, ADR-0014 — nội dung thẻ là tầng A, không lên cloud).
    const cloud = await getCloudOpsView();
    const pending = cloud.pending;
    // Số cũ quá 45′ (ADR-0014 hàng «Cũ»): số đếm hiện mờ — là lần đo cuối, không phải bây giờ.
    const stale = cloud.state === "stale";
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-medium">Hàng duyệt</h1>
          <PendingCounts pending={pending} stale={stale} />
          <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} />
        </div>
        <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} />
        <LocalOnlyAlert title="Hàng duyệt chỉ có ở máy thu">
          Hàng duyệt giữ bằng chứng thô của nguồn (tầng A) nên không lên máy chủ. Duyệt ở cổng Ops trên máy thu.
        </LocalOnlyAlert>
      </div>
    );
  }

  // Vai dưới Vận hành (viewer): chỉ số thẻ chờ theo loại — không truy vấn cột nội dung nào (AGENTS.md luật 6).
  if (!xemNoiDungTin(user)) {
    const pending = await loadPendingCounts();
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-medium">Hàng duyệt</h1>
          <PendingCounts pending={pending} stale={false} />
        </div>
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.</AlertTitle>
        </Alert>
      </div>
    );
  }

  const { items, media, context } = await loadReviewQueue(user);
  return (
    <div className="flex flex-col gap-4">
      <ReviewTitle />
      <ReviewQueue items={items} media={media} context={context} />
    </div>
  );
}

/**
 * Thân trang /ops/review sau bước kiểm quyền (UI1): ReviewContent tải trong RegionError > Suspense — fallback giữ tiêu đề
 * và khung bảng (không loading.tsx: PageSkeleton đã ghi lý do), lỗi tại chỗ có Thử lại, vỏ Ops vẫn đứng. Đồng bộ.
 */
export function ReviewPageBody({ user }: { user: User }) {
  return (
    <RegionError what="hàng duyệt">
      <Suspense fallback={<ReviewPageSkeleton />}>
        <ReviewContent user={user} />
      </Suspense>
    </RegionError>
  );
}

/** Số thẻ chờ (tổng + theo loại) — chung cho nhánh cloud (bản tin máy local) và nhánh viewer ở máy thu. */
function PendingCounts({ pending, stale }: { pending: PendingCount | null; stale: boolean }) {
  return (
    <>
      <p className="text-sm tabular-nums" data-pending-total={pending?.total ?? ""}>
        <span className={cn("font-semibold", stale && "text-muted-foreground")}>{pending ? fmtInt(pending.total) : "—"}</span> thẻ đang chờ
      </p>
      {pending && pending.byType.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {pending.byType.map((t) => (
            <Badge key={t.type} variant="outline" className={cn(stale && "text-muted-foreground")} data-pending-type={t.type}>
              {t.type}: {fmtInt(t.n)}
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );
}

function ReviewTitle() {
  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="text-xl font-medium">Hàng duyệt</h1>
      <p className="text-muted-foreground text-xs">
        Máy đề xuất, bạn quyết định — mọi quyết định được ghi nhật ký.
      </p>
    </div>
  );
}

export function ReviewPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <ReviewTitle />
      <ReviewQueueSkeleton />
    </div>
  );
}

/** Số thẻ chờ theo loại — cùng câu với khối reviewQueue của bản tin cloud (scripts/lib/ops-local.mjs readReviewQueue). */
async function loadPendingCounts(): Promise<PendingCount> {
  const { rows } = await pool.query<{ type: string; n: number }>(
    `SELECT item_type AS type, count(*)::int AS n FROM review_queue WHERE status = 'pending'
     GROUP BY item_type ORDER BY item_type`,
  );
  return { byType: rows, total: rows.reduce((a, r) => a + r.n, 0) };
}

/** Đọc review_queue (tầng A, chỉ local). Không chọn ai_confidence — Q9: số không tới trình duyệt. */
async function loadReviewQueue(user: User) {
  const { rows } = await pool.query<ReviewQueueRow>(
    `SELECT id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, decision_note, created_at
     FROM review_queue ORDER BY created_at DESC, id DESC`,
  );
  // URL ảnh không đi trong evidence — ảnh tới thẻ chỉ qua loadReviewMedia (admin).
  const items = rows.map((r) => toReviewItem(r, stripEvidenceImages(r.evidence)));
  // Ảnh tin: ảnh đã tải cho vai Vận hành, URL gốc chỉ admin (PL3); một truy vấn cho cả hàng duyệt.
  // Toàn văn + căn cứ từng trường (PL3): một truy vấn; nhánh viewer và cloud đã dừng ở trên nên không tới đây.
  const [media, context] = await Promise.all([loadReviewMedia(rows, user), loadReviewContext(rows)]);
  return { items, media, context };
}
