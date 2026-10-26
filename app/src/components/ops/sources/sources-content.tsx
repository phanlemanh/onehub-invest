import Link from "next/link";

import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { RegistryTable, type RegistryRow } from "@/components/ops/sources/registry-table";
import { SoDonVi } from "@/components/ops/sources/so-don-vi";
import { SourceGroups, type GroupRow } from "@/components/ops/sources/source-groups";
import { ZaloAccounts } from "@/components/ops/sources/zalo-accounts";
import { PageHeader } from "@/components/page/page-header";
import { docNhomThu } from "@/lib/che-do-thu";
import { homNayVN } from "@/lib/che-do-thu-luat";
import { pool } from "@/lib/db";
import { localOnlyTable } from "@/lib/ops-queries";
import { docDanhMuc, docSoDonVi, type DanhMuc, type DonViRow } from "@/lib/so-don-vi";

const crumbs = [{ label: "Vận hành", href: "/ops" }, { label: "Nguồn dữ liệu" }];

/**
 * Nội dung /ops/sources sau bước kiểm admin (page.tsx). Bảng giải mã mã↔tên thật (source_registry) là tầng A, chỉ có
 * ở máy local: vắng bảng (cloud) thì dừng ở thông báo có tên thay vì ném 42P01 (sự cố prod 24/10, audit OPS-2).
 */
export async function SourcesContent() {
  if (await localOnlyTable("source_registry")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={crumbs} title="Nguồn dữ liệu" stats={["Chỉ quản trị ở máy thu"]} description="Quản trị nguồn: tài khoản Zalo, nhóm thu — chỉ quyền quản trị, không đồng bộ lên máy chủ." />
        <LocalOnlyAlert title="Nguồn dữ liệu chỉ quản trị ở máy thu">
          Bảng giải mã mã nguồn và nhóm thu là tầng A nên không lên máy chủ. Quản trị ở cổng Ops trên máy thu.
        </LocalOnlyAlert>
      </div>
    );
  }

  // cloud không có source_groups/stg (tier A local-only) — render rỗng
  let groupRows: GroupRow[] = [];
  try {
    groupRows = await docNhomThu();
  } catch { /* cloud: bảng vắng — đúng thiết kế PII */ }
  // PL12 sổ đơn vị thu: chưa áp 048 (hoặc DB lỗi) thì khu sổ hiện vùng lỗi có Thử lại, phần còn lại của trang vẫn đứng.
  let soRows: DonViRow[] = [];
  let danhMuc: DanhMuc = { markets: [], projects: [] };
  let soLoi = false;
  try {
    [soRows, danhMuc] = await Promise.all([docSoDonVi(), docDanhMuc()]);
  } catch {
    soLoi = true;
  }
  const { rows } = await pool.query<RegistryRow>(
    `SELECT code, real_name, label_vi, status, since::text, retired_at::text
     FROM source_registry ORDER BY code`,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={crumbs}
        title="Nguồn dữ liệu"
        stats={[`${rows.length} mã nguồn`, `${groupRows.length} nhóm thu`]}
        description="Quản trị nguồn: tài khoản Zalo, nhóm thu — chỉ quyền quản trị, không đồng bộ lên máy chủ."
        actions={
          <Link prefetch={false} href="/ops/collections" className="text-muted-foreground hover:text-foreground text-sm underline transition-colors">
            Xem luồng ở Thu thập
          </Link>
        }
      />
      <RegistryTable rows={rows} />
      <ZaloAccounts isCloud={process.env.VERCEL === "1"} />
      <SourceGroups initial={groupRows} homNay={homNayVN(new Date())} />
      <SoDonVi rows={soRows} danhMuc={danhMuc} loi={soLoi} />
    </div>
  );
}
