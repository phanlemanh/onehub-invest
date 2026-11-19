import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DealsGrid } from "@/components/ops/deals-grid";
import { DealsBoLocKhiLoi, DealsGridTrang } from "@/components/ops/deals-grid";
import { DealsSkeleton } from "@/components/ops/deal-skeleton";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { PageHeader } from "@/components/page/page-header";
import { RegionError } from "@/components/states/region-error";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getSessionUser } from "@/lib/auth";
import { dealHang, dealTheoVai, getDeals } from "@/lib/deals";
// Tách dòng: hai ca test nguồn (SHS-AC-6, OD1-AC-9) chép trang và thay nguyên văn dòng import trên.
import { getDuAn, getXacMinh, parseProject } from "@/lib/deals";
import { NGAY_TOI_DA, NGUONG_VAO_PCT } from "@/lib/deals-chi-tiet";
import { docThamSoDeal, type ThamSoDeal } from "@/lib/deals-chi-tiet";
import { canAccessOps, xemNoiDungTin } from "@/lib/ops-access";
import { loadPendingUnitMatches } from "@/lib/ops/review-cho-ghep";

import { layCanCungTieuChi } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Căn giá tốt" };

async function DealsContent({ xemNoiDung, can }: { xemNoiDung: boolean; can: string | null }) {
  const { rows: tho, mayThu } = await getDeals();
  // Căn ngoài danh sách đã tải: trang một căn đã xử lý mã lạ và căn rời danh sách, không dựng thêm trạng thái sheet.
  if (can && !tho.some((d) => d.offerId === can)) redirect(`/ops/deals/${encodeURIComponent(can)}`);
  const rows = tho.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu }));
  // Tab «Cần xác minh» trên toàn tập (CG10 Hỏi-3); null khi chưa có bảng hạng → tab đếm trong danh sách như cũ.
  const xm = await getXacMinh();
  const xacMinh = xm && { tong: xm.tong, rows: xm.rows.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })) };
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
      <DealsGrid rows={rows} moBanDau={can} xemNoiDung={xemNoiDung} mayThu={mayThu} choGhep={choGhep} xacMinh={xacMinh ?? undefined} />
    </>
  );
}

/** Nút bỏ lọc dự án — dùng ở đầu trang và trong hai trạng thái trống. */
function BoLocDuAn() {
  return <Button variant="outline" nativeButton={false} render={<Link prefetch={false} href="/ops/deals" />}>Bỏ lọc dự án</Button>;
}

/**
 * /ops/deals?project=<id> (CG10): căn giá tốt cấp dự án của một dự án — mỗi căn một dòng, không cắt 30. Dự án có thật mà chưa
 * nhóm nào đủ căn → «Dự án chưa đủ căn để xếp hạng»; id lạ → «Không tìm thấy dự án».
 */
async function DealsDuAnContent({ xemNoiDung, project }: { xemNoiDung: boolean; project: string }) {
  const duAn = await getDuAn(project);
  if (!duAn) {
    return (
      <Empty className="border" data-deals-du-an-la>
        <EmptyHeader>
          <EmptyTitle>Không tìm thấy dự án</EmptyTitle>
          <EmptyDescription>Mã dự án trên đường dẫn không có trong danh bạ.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><BoLocDuAn /></EmptyContent>
      </Empty>
    );
  }
  const { rows: tho, mayThu } = await getDeals(undefined, NGUONG_VAO_PCT, { project: duAn.id });
  if (tho.length === 0) {
    return (
      <Empty className="border" data-deals-du-an-trong>
        <EmptyHeader>
          <EmptyTitle>Dự án chưa đủ căn để xếp hạng</EmptyTitle>
          <EmptyDescription>{duAn.ten} chưa có nhóm căn nào đủ 10 căn cùng loại để gắn nhãn «Giá tốt».</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><BoLocDuAn /></EmptyContent>
      </Empty>
    );
  }
  const rows = tho.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu }));
  const xm = await getXacMinh({ project: duAn.id });
  const xacMinh = xm && { tong: xm.tong, rows: xm.rows.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })) };
  const choGhep = await loadPendingUnitMatches(rows.map((d) => d.offerId));
  return <DealsGrid rows={rows} xemNoiDung={xemNoiDung} mayThu={mayThu} choGhep={choGhep} xacMinh={xacMinh ?? undefined} />;
}

/**
 * Danh sách đọc theo trang ở máy chủ (CG3): vị trí, loại hình, bán hay thuê, tab, trang nằm trên URL. Chưa có bảng hạng thì lùi về
 * danh sách cũ. Căn ngoài trang đang xem mở bằng trang một căn.
 */
async function DealsTrangContent({ xemNoiDung, can, thamSo }: { xemNoiDung: boolean; can: string | null; thamSo: ThamSoDeal }) {
  const { rows: tho, mayThu, trang } = await getDeals(undefined, NGUONG_VAO_PCT, { thamSo });
  if (!trang) return <DealsContent xemNoiDung={xemNoiDung} can={can} />;
  if (can && !tho.some((d) => d.offerId === can)) redirect(`/ops/deals/${encodeURIComponent(can)}`);
  const rows = tho.map((d) => dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu }));
  const choGhep = await loadPendingUnitMatches(rows.map((d) => d.offerId));
  return (
    <>
      {!mayThu && (
        <LocalOnlyAlert title="Ảnh, chữ bài chỉ có ở máy thu">
          Máy chủ chưa giữ hai phần này, nên căn không thiếu chúng. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      )}
      <DealsGridTrang rows={rows} moBanDau={can} xemNoiDung={xemNoiDung} mayThu={mayThu} choGhep={choGhep} trang={trang} taiCung={layCanCungTieuChi} />
    </>
  );
}

/**
 * /ops/deals — P4: căn giá tốt từ tín hiệu riêng P1 (S03/S05) đo bằng thước vải công khai P2 (median S06 cùng phường).
 * Nằm ở Ops vì lộ tín hiệu nội bộ. Ảnh, chữ bài, liên hệ, địa chỉ dưới phường từ vai Vận hành trở lên; vai Người xem không
 * nhận trường nào trong đó. Ảnh và chữ bài chỉ có ở máy thu (hồ sơ can-gia-tot-biet-can).
 */
export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getSessionUser();
  if (!user || !canAccessOps(user)) {
    return <p className="text-muted-foreground p-8 text-sm">Cần đăng nhập ops.</p>;
  }
  const sp = await searchParams;
  const can = typeof sp.can === "string" ? sp.can : undefined;
  const xemNoiDung = xemNoiDungTin(user);
  const project = parseProject(sp.project);
  const tenDuAn = project ? (await getDuAn(project))?.ten ?? null : null;
  const thamSo = docThamSoDeal(sp);
  const duAnLa = Boolean(project && !tenDuAn);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Căn giá tốt" }]}
        title={tenDuAn ? `Căn giá tốt · ${tenDuAn}` : "Căn giá tốt"}
        stats={[`Giảm từ ${NGUONG_VAO_PCT}%`, `${NGAY_TOI_DA} ngày gần nhất`]}
        description={project ? "Căn rẻ trong chính dự án: so với căn cùng dự án, cùng loại (và cùng số phòng ngủ khi đủ căn)." : "Căn rẻ hơn trung vị của nhóm so sánh, căn cấp dự án đứng đầu."}
      />
      <RegionError what="danh sách căn" leading={duAnLa ? undefined : <DealsBoLocKhiLoi thamSo={thamSo} />}>
        <Suspense fallback={<DealsSkeleton />}>
          {project && !tenDuAn
            ? <DealsDuAnContent xemNoiDung={xemNoiDung} project={project} />
            : <DealsTrangContent xemNoiDung={xemNoiDung} can={can ?? null} thamSo={thamSo} />}
        </Suspense>
      </RegionError>
    </div>
  );
}
