import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { DealBody } from "@/components/ops/deal-body";
import { DealPageSkeleton } from "@/components/ops/deal-skeleton";
import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/reui/badge";
import { RegionError } from "@/components/states/region-error";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getSessionUser } from "@/lib/auth";
import { dealHang, dealTheoVai, dealTrongDanhSach, getDeal } from "@/lib/deals";
import { chuGiam } from "@/lib/deals-chi-tiet";
import { fmtCompact } from "@/lib/format";
import { canAccessOps, xemNoiDungTin } from "@/lib/ops-access";
import { loadPendingUnitMatches } from "@/lib/ops/review-cho-ghep";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Một căn" };

async function DealContent({ offerId, xemNoiDung }: { offerId: string; xemNoiDung: boolean }) {
  const { deal, mayThu } = await getDeal(offerId);
  if (!deal) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Không tìm thấy căn này</EmptyTitle>
          <EmptyDescription>Mã căn không có trong dữ liệu tin bán.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link prefetch={false} href="/ops/deals" />}>Về Căn giá tốt</Button>
        </EmptyContent>
      </Empty>
    );
  }
  const d = dealHang(dealTheoVai(deal, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu });
  // `?can=` của căn ngoài danh sách đã tải chuyển ngược về đây, nên crumb chỉ mở sheet khi căn có trong danh sách.
  const choGhep = await loadPendingUnitMatches([d.offerId]);
  const veDanhSach = !d.roiDanhSach && (await dealTrongDanhSach(d.offerId)) ? `/ops/deals?can=${encodeURIComponent(d.offerId)}` : "/ops/deals";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Căn giá tốt", href: veDanhSach }, { label: "Một căn" }]}
        title={d.ten}
        stats={[d.priceVnd === null ? "—" : fmtCompact(d.priceVnd), d.discountPct === null ? "Chưa tính được mức giảm" : chuGiam(d.discountPct), d.source]}
        description="Đủ để quyết có gọi người bán không. Chỉ đọc."
        actions={d.suspect ? <Badge variant="warning-light">Cần xác minh</Badge> : undefined}
      />
      <DealBody d={d} xemNoiDung={xemNoiDung} mayThu={mayThu} beMat="trang" choGhep={choGhep[d.offerId]} />
    </div>
  );
}

/** /ops/deals/[offerId] «Một căn»: cùng phần thân với sheet, có đường dẫn riêng. Căn rời danh sách vẫn mở, kèm lý do (Hỏi-1). */
export default async function DealPage({ params }: { params: Promise<{ offerId: string }> }) {
  const user = await getSessionUser();
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>;
  }
  const { offerId } = await params;
  return (
    <RegionError what="căn này">
      <Suspense fallback={<DealPageSkeleton />}>
        <DealContent offerId={decodeURIComponent(offerId)} xemNoiDung={xemNoiDungTin(user)} />
      </Suspense>
    </RegionError>
  );
}
