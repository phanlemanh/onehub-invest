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
import { ReviewNhip, ReviewNhipSkeleton } from "@/components/ops/review/review-nhip";
import { loadReviewQueue } from "@/lib/ops/review-nap";
import { hangNhip, loadReviewPace } from "@/lib/ops/review-nhip";
import { loadDauTrang, type DauTrang } from "@/lib/ops/review-dau-trang";
import { actorCua, loadRecentDecisions } from "@/lib/ops/review-gan-day";
import { docCategory } from "@/lib/ops/review-hop-hang-muc";
import { KHONG_DONG_BANG_SQL } from "@/lib/ops/review-dong-bang";
import { PageHeader } from "@/components/page/page-header";

/**
 * Nội dung /ops/review sau bước kiểm quyền ops (page.tsx). review_queue là tầng A, chỉ có ở máy local: vắng bảng
 * (cloud) thì dừng ở thông báo có tên thay vì ném 42P01 (sự cố prod 24/10, audit OPS-1).
 */
export async function ReviewContent({ user, card = null, category = null }: { user: User; card?: string | null; category?: string | null }) {
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
          Hàng duyệt chưa lên máy chủ — duyệt từ xa là hàng TV13. Duyệt ở cổng Ops trên máy thu.
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

  const [{ items, media, context }, pace, dau, ganDay] = await Promise.all([
    loadReviewQueue(user),
    loadReviewPace(),
    loadDauTrang(),
    loadRecentDecisions(actorCua(user.id)),
  ]);
  const pending = items.filter((i) => i.status === "pending");
  // Thẻ chờ cũ nhất: items xếp mới nhất trước, nên thẻ cuối của danh sách chờ.
  const oldestPendingId = pending.length > 0 ? pending[pending.length - 1].id : null;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader crumbs={REVIEW_CRUMBS} title="Hàng duyệt" stats={statsDauTrang(dau)} description={REVIEW_MO_TA} />
      <ReviewNhip rows={hangNhip(pace, pending)} oldestPendingId={oldestPendingId} />
      <ReviewQueue
        items={items}
        media={media}
        context={context}
        moBanDau={docCard(card)}
        pace={pace}
        category={docCategory(category)}
        ganDay={ganDay}
      />
    </div>
  );
}

const REVIEW_CRUMBS = [{ label: "Vận hành", href: "/ops" }, { label: "Hàng duyệt" }];
const REVIEW_MO_TA = "Máy đề xuất, người duyệt quyết — mọi quyết định được ghi nhật ký.";

/** Ba số đầu trang (OD2 · ĐC3) — chữ của badge PageHeader. */
export function statsDauTrang(d: DauTrang | null): string[] {
  if (!d) return [];
  return [`Chờ duyệt ${fmtInt(d.cho)}`, `Quá 3 ngày ${fmtInt(d.quaHan)}`, `Đã quyết hôm nay ${fmtInt(d.homNay)}`];
}

/**
 * Thân trang /ops/review sau bước kiểm quyền (UI1): ReviewContent tải trong RegionError > Suspense — fallback giữ tiêu đề
 * và khung bảng (không loading.tsx: PageSkeleton đã ghi lý do), lỗi tại chỗ có Thử lại, vỏ Ops vẫn đứng. Đồng bộ.
 */
export function ReviewPageBody({ user, card = null, category = null }: { user: User; card?: string | null; category?: string | null }) {
  return (
    <RegionError what="hàng duyệt">
      <Suspense fallback={<ReviewPageSkeleton />}>
        <ReviewContent user={user} card={card} category={category} />
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
        Máy đề xuất, người duyệt quyết — mọi quyết định được ghi nhật ký.
      </p>
    </div>
  );
}

export function ReviewPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <ReviewTitle />
      <ReviewNhipSkeleton />
      <ReviewQueueSkeleton />
    </div>
  );
}

/** Số thẻ chờ theo loại — cùng câu với khối reviewQueue của bản tin cloud (scripts/lib/ops-local.mjs readReviewQueue);
 *  thẻ Ghép căn đang chờ đóng băng (V7), không đếm. */
export const PENDING_COUNTS_SQL = `SELECT item_type AS type, count(*)::int AS n FROM review_queue WHERE status = 'pending'
     AND ${KHONG_DONG_BANG_SQL} GROUP BY item_type ORDER BY item_type`;

async function loadPendingCounts(): Promise<PendingCount> {
  const { rows } = await pool.query<{ type: string; n: number }>(
    PENDING_COUNTS_SQL,
  );
  return { byType: rows, total: rows.reduce((a, r) => a + r.n, 0) };
}

/** `?card=<id>` (OD1 · ĐC7): vắng → null; số nguyên dương → id; chuỗi khác → id null (danh sách báo «Không tìm thấy thẻ»). */
export function docCard(card: string | null | undefined): { id: number | null; raw: string } | null {
  if (card === null || card === undefined || card === "") return null;
  return { id: /^[1-9]\d{0,15}$/.test(card) ? Number(card) : null, raw: card.slice(0, 40) };
}
