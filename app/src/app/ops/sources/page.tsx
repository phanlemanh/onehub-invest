import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SourcesContent } from "@/components/ops/sources/sources-content";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/ops-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nguồn dữ liệu" };

/**
 * /ops/sources — SPL: bảng giải mã mã↔tên thật (tầng A). Clearance law
 * (portals.md + ADR-0007): CHỈ role=admin. Trang này là nơi duy nhất tên
 * nguồn thật xuất hiện trên UI. Khung: registry (InsightGrid) · tài khoản Zalo
 * (@reui/solution-ai-ops-2) · nhóm thu theo nguồn (@reui/solution-dev-ops-6).
 * Trang chỉ kiểm quyền; nội dung (kể cả dừng sớm khi source_registry vắng trên cloud) ở SourcesContent.
 */
export default async function OpsSourcesPage() {
  const user = await getSessionUser();
  if (!isAdmin(user)) notFound();
  return <SourcesContent />;
}
