import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DealsGrid } from "@/components/ops/deals-grid";
import { DealsSkeleton } from "@/components/ops/deal-skeleton";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { PageHeader } from "@/components/page/page-header";
import { RegionError } from "@/components/states/region-error";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getSessionUser } from "@/lib/auth";
import { dealHang, dealTheoVai, getDeals } from "@/lib/deals";
import { NGAY_TOI_DA, NGUONG_VAO_PCT } from "@/lib/deals-chi-tiet";
import { canAccessOps, xemNoiDungTin } from "@/lib/ops-access";
import { loadPendingUnitMatches } from "@/lib/ops/review-cho-ghep";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Căn giá tốt" };

async function DealsContent({ xemNoiDung, can }: { xemNoiDung: boolean; can: string | null }) {
  const { rows: tho, mayThu } = await getDeals();
  // Căn ngoài danh sách đã tải: trang một căn đã xử lý mã lạ và căn rời danh sách, không dựng thêm trạng thái sheet.
  if (can && !tho.some((d) => d.offerId === can)) redirect(`/ops/deals/${encodeURIComponent(can)}`);
  const rows = tho.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu }));
  // Căn đang là một vế của thẻ Ghép căn còn chờ (OD1 · ĐC7); cloud không có hàng duyệt → rỗng.
  const choGhep = await loadPendingUnitMatches(rows.map((d) => d.offerId));
  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Chưa có căn nào giảm từ {NGUONG_VAO_PCT}% so với thước phường</EmptyTitle>
          <EmptyDescription>Giá công khai đang tích luỹ, quét 05:30 hằng ngày.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" nativeButton={false} render={<Link prefetch={false} href="/ops/quality" />}>Xem chất lượng dữ liệu</Button>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <>
      {!mayThu && (
        <LocalOnlyAlert title="Ảnh, chữ bài chỉ có ở máy thu">
          Máy chủ chưa giữ hai phần này, nên căn không thiếu chúng. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      )}
      <DealsGrid rows={rows} moBanDau={can} xemNoiDung={xemNoiDung} mayThu={mayThu} choGhep={choGhep} />
    </>
  );
}

/**
 * /ops/deals — P4: căn giá tốt từ tín hiệu riêng P1 (S03/S05) đo bằng thước vải công khai P2 (median S06 cùng phường).
 * Nằm ở Ops vì lộ tín hiệu nội bộ. Ảnh, chữ bài, liên hệ, địa chỉ dưới phường từ vai Vận hành trở lên; vai Người xem không
 * nhận trường nào trong đó. Ảnh và chữ bài chỉ có ở máy thu (hồ sơ can-gia-tot-biet-can).
 */
export default async function DealsPage({ searchParams }: { searchParams: Promise<{ can?: string }> }) {
  const user = await getSessionUser();
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>;
  }
  const { can } = await searchParams;
  const xemNoiDung = xemNoiDungTin(user);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Căn giá tốt" }]}
        title="Căn giá tốt"
        stats={[`Giảm từ ${NGUONG_VAO_PCT}%`, `${NGAY_TOI_DA} ngày gần nhất`]}
        description="Tin nội bộ S03, S05 rẻ hơn thước S06 cùng phường."
      />
      <RegionError what="danh sách căn">
        <Suspense fallback={<DealsSkeleton />}>
          <DealsContent xemNoiDung={xemNoiDung} can={can ?? null} />
        </Suspense>
      </RegionError>
    </div>
  );
}
