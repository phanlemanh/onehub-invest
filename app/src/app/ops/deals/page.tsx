import type { Metadata } from "next";

import { DealCard } from "@/components/ops/deal-card";
import { getSessionUser } from "@/lib/auth";
import { dealTheoVai, getDeals } from "@/lib/deals";
import { isAdmin, xemNoiDungTin } from "@/lib/ops-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Căn giá tốt" };

/**
 * /ops/deals — P4: căn giá tốt từ tín hiệu riêng P1 (S03/S05) đo bằng thước
 * vải công khai P2 (median S06 cùng phường). Nằm ở Ops vì lộ tín hiệu nội bộ.
 *
 * Người bán trên tin rao là tầng C (ADR-0007 mục 9), số gốc ở lại máy thu (ROADMAP §3
 * mục 24): sync-cloud loại cột seller_*, cloud không có stg_zalo_posts → trên prod
 * getDeals tự rơi về bản không liên hệ. Ở máy thu: khối liên hệ cho vai Vận hành trở
 * lên (Hỏi-B), ảnh và chữ bài cho admin; vai Người xem không nhận trường nào trong đó.
 */
export default async function DealsPage() {
  const [tho, user] = await Promise.all([getDeals(30, 5), getSessionUser()]);
  const showContact = xemNoiDungTin(user);
  const rows = tho.map((d) => dealTheoVai(d, { lienHe: showContact, noiDung: isAdmin(user) }));
  const hasContact = showContact && rows.some((r) => r.sellerPhone);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-medium">Căn giá tốt</h1>
        <p className="text-muted-foreground text-xs">
          Tin nội bộ (S03/S05) rẻ hơn trung vị giá công khai cùng phường
          (thước S06, ≥5 tin/phường, 45 ngày gần nhất). {hasContact
            ? "SĐT người đăng hiện sẵn — gọi xác minh giá giao dịch."
            : "Thông tin người đăng chỉ có ở máy thu, cho vai Vận hành trở lên."}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Chưa có căn nào dưới ngưỡng 5% so với thước phường — giá công khai
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
