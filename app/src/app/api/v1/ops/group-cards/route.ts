import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { quyetThe } from "@/lib/the-dia-chi-nhom";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/ops/group-cards — thẻ địa chỉ nhóm S03 (TG1 `the-dia-chi-nhom-s03`): { cardCode, version, card: "nhan" | "sua"
 * | "bac", values?, note? }. Quyền `unit.card_decide` (vai ops, không bearer — một người thật); thẻ, lịch sử thẻ và ops_audit
 * ghi cùng giao dịch ở lib/the-dia-chi-nhom.ts. Bảng chỉ ở máy thu: chưa áp 108 thì hàm trả 404 thẻ.
 */
export async function POST(req: Request) {
  const q = await kiemQuyen(req, "unit.card_decide");
  if (!q.ok) return q.res;
  if (!q.nguoi) return NextResponse.json({ error: "cần một người đăng nhập" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "cần thân JSON" }, { status: 400 });
  const r = await quyetThe(b, q.nguoi);
  return NextResponse.json(r.body, { status: r.status });
}
