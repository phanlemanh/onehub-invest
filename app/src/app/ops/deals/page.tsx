import type { Metadata } from "next";
import Link from "next/link";

import { DealCard } from "@/components/ops/deal-card";
import { cauChungMinh } from "@/components/ops/deal-detail-view";
import { DealsGrid } from "@/components/ops/deals-grid";
import { PageHeader } from "@/components/page/page-header";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getSessionUser } from "@/lib/auth";
import { dealTheoVai, getDeals, NGHI_NGO_PCT } from "@/lib/deals";
import { tenCan, thieuGi } from "@/lib/deals-chi-tiet";
import { PROTO, PROTO_BANG } from "@/lib/deals-proto";
import { fmtPhone, telHref } from "@/lib/ops/people";
import { xemNoiDungTin } from "@/lib/ops-access";

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
export default async function DealsPage({ searchParams }: { searchParams: Promise<{ vai?: string; trong?: string; bo?: string; can?: string; noi?: string }> }) {
  // BẢN MẪU design-pass: dữ liệu mẫu; S3 thay bằng getDeals và vai thật.
  const { vai, trong, bo, can, noi } = await searchParams;
  const mayThu = noi !== "cloud";
  await getSessionUser();
  void getDeals; void xemNoiDungTin;
  const showContact = vai !== "viewer";
  const rows = (trong ? [] : PROTO.filter((d) => !d.roiDanhSach)).map((d) => ({ ...d, ...dealTheoVai(d, { lienHe: showContact, noiDung: showContact }) }));
  const hasContact = showContact && rows.some((r) => r.sellerPhone);

  if (bo !== "the" && !trong) {
    const hang = PROTO_BANG.map((d) => {
      const v = { ...d, ...dealTheoVai(d, { lienHe: showContact, noiDung: showContact }) };
      return {
        ...v, ten: tenCan(v), thieu: thieuGi(v, { xemNoiDung: showContact, mayThu }), cau: cauChungMinh(v), xacMinhPct: NGHI_NGO_PCT, xemAnh: showContact && mayThu,
        sdt: v.sellerPhone ? fmtPhone(v.sellerPhone) : null, tel: v.sellerPhone ? telHref("sdt", v.sellerPhone, showContact) : null,
      };
    });
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Căn giá tốt" }]}
          title="Căn giá tốt"
          stats={[`${hang.length} căn`, "Giảm từ 5%"]}
          description="Tin nội bộ S03, S05 rẻ hơn thước S06 cùng phường, 45 ngày gần nhất."
        />
        <DealsGrid rows={hang} moBanDau={can ?? null} xemNoiDung={showContact} mayThu={mayThu} />
      </div>
    );
  }

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
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Chưa có căn nào giảm từ 5% so với thước phường</EmptyTitle>
            <EmptyDescription>Giá công khai đang tích luỹ, quét 05:30 hằng ngày.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" nativeButton={false} render={<Link prefetch={false} href="/ops/quality" />}>Xem chất lượng dữ liệu</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <DealCard key={d.offerId} d={d} showContact={showContact} ten={tenCan(d)} anhDau={d.images[0]?.src ?? null} soThieu={thieuGi(d, { xemNoiDung: showContact, mayThu: true }).length} />
          ))}
        </div>
      )}
    </div>
  );
}
