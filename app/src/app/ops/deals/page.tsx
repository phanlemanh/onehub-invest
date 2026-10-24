import type { Metadata } from "next";

import { DealCard } from "@/components/ops/deal-card";
import { getSessionUser } from "@/lib/auth";
import { getDeals } from "@/lib/deals";
import { isAdmin } from "@/lib/ops-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Căn giá tốt" };

/**
 * /ops/deals — P4: căn giá tốt từ tín hiệu riêng P1 (S03/S05) đo bằng thước
 * vải công khai P2 (median S06 cùng phường). Nằm ở Ops vì lộ tín hiệu nội bộ.
 *
 * PII tầng A (ADR-0007): SĐT/tên người bán, tên nhóm, nội dung + ảnh tin chỉ
 * có ở DB local (sync-cloud loại cột seller_*, cloud không có stg_zalo_posts)
 * → trên prod getDeals tự rơi về bản không liên hệ. Ở local vẫn chỉ hiện cho
 * admin: canAccessOps cho mọi user đăng nhập khi OPS_EMAILS để trống.
 */
export default async function DealsPage() {
  const [rows, user] = await Promise.all([getDeals(30, 5), getSessionUser()]);
  const showContact = isAdmin(user);
  const hasContact = showContact && rows.some((r) => r.sellerPhone);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-medium">Căn giá tốt</h1>
        <p className="text-muted-foreground text-xs">
          Tin nội bộ (S03/S05) rẻ hơn median rao công khai cùng phường
          (thước S06, ≥5 tin/phường, 45 ngày gần nhất). {hasContact
            ? "SĐT người đăng hiện sẵn — gọi xác minh giá thật."
            : "Thông tin người đăng chỉ có ở máy thu (local), cho admin."}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Chưa có căn nào dưới ngưỡng 5% so với thước phường — vải công khai
          đang tích luỹ (quét 05:30 hằng ngày).
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <DealCard key={d.offerId} d={d} showContact={showContact} />
          ))}
        </div>
      )}
    </div>
  );
}
