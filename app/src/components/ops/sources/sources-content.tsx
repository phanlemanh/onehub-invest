import Link from "next/link";

import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { RegistryTable, type RegistryRow } from "@/components/ops/sources/registry-table";
import { SourceGroups, type GroupRow } from "@/components/ops/sources/source-groups";
import { ZaloAccounts } from "@/components/ops/sources/zalo-accounts";
import { PageHeader } from "@/components/page/page-header";
import { pool } from "@/lib/db";
import { localOnlyTable } from "@/lib/ops-queries";

const crumbs = [{ label: "Vận hành", href: "/ops" }, { label: "Nguồn dữ liệu" }];

/**
 * Nội dung /ops/sources sau bước kiểm admin (page.tsx). Bảng giải mã mã↔tên thật (source_registry) là tầng A, chỉ có
 * ở máy local: vắng bảng (cloud) thì dừng ở thông báo có tên thay vì ném 42P01 (sự cố prod 24/10, audit OPS-2).
 */
export async function SourcesContent() {
  if (await localOnlyTable("source_registry")) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader crumbs={crumbs} title="Nguồn dữ liệu" stats={["Chỉ quản trị ở máy local"]} description="Quản trị nguồn: tài khoản Zalo, nhóm thu — chỉ admin, không sync cloud." />
        <LocalOnlyAlert title="Nguồn dữ liệu chỉ quản trị ở máy local">
          Bảng giải mã mã nguồn và nhóm thu là tầng A nên không lên cloud. Quản trị ở Ops trên máy thu.
        </LocalOnlyAlert>
      </div>
    );
  }

  // cloud không có source_groups/stg (tier A local-only) — render rỗng
  let groupRows: GroupRow[] = [];
  try {
    groupRows = await pool.query<GroupRow>(
      `SELECT g.id, g.source_code, g.group_key, g.name, g.enabled, g.note,
              (SELECT count(*)::int FROM stg_zalo_posts z
                WHERE z.agent_id = 'apify-facebook' AND z.group_name = g.name) AS fb_posts
       FROM source_groups g ORDER BY g.source_code, g.id`,
    ).then((r) => r.rows);
  } catch { /* cloud: bảng vắng — đúng thiết kế PII */ }
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
        description="Quản trị nguồn: tài khoản Zalo, nhóm thu — chỉ admin, không sync cloud."
        actions={
          <Link prefetch={false} href="/ops/collections" className="text-muted-foreground hover:text-foreground text-sm underline transition-colors">
            Xem luồng ở Thu thập
          </Link>
        }
      />
      <RegistryTable rows={rows} />
      <ZaloAccounts isCloud={process.env.VERCEL === "1"} />
      <SourceGroups initial={groupRows} />
    </div>
  );
}
