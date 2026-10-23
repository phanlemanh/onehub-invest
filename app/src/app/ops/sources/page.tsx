import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegistryTable, type RegistryRow } from "@/components/ops/sources/registry-table";
import { SourceGroups, type GroupRow } from "@/components/ops/sources/source-groups";
import { ZaloAccounts } from "@/components/ops/sources/zalo-accounts";
import { PageHeader } from "@/components/page/page-header";
import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/ops-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nguồn dữ liệu" };

/**
 * /ops/sources — SPL: bảng giải mã mã↔tên thật (tầng A). Clearance law
 * (portals.md + ADR-0007): CHỈ role=admin. Trang này là nơi duy nhất tên
 * nguồn thật xuất hiện trên UI. Khung: registry (InsightGrid) · tài khoản Zalo
 * (@reui/solution-ai-ops-2) · nhóm thu theo nguồn (@reui/solution-dev-ops-6).
 */
export default async function OpsSourcesPage() {
  const user = await getSessionUser();
  if (!isAdmin(user)) notFound();

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
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Nguồn dữ liệu" }]}
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
