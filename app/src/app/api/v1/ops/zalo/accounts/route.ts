import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { LoiViec, ghiRoiLam } from "@/lib/audit";
import { createZaloAccount, deleteZaloAccount, listZaloAccounts } from "@/lib/zalo-admin";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/ops/zalo/accounts — danh sách tài khoản zalouser + nhóm đang bật
 * POST { id, name? } — tạo tài khoản mới (groups tường minh rỗng — bất biến 1-1)
 * DELETE { id } — gỡ tài khoản (trừ default)
 * Quyền `zalo.admin` (admin, không bearer — TV1); việc ghi đi sau dòng audit trong cùng transaction (ghiRoiLam).
 */
export async function GET(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  return NextResponse.json({ accounts: await listZaloAccounts() });
}

export async function POST(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const body = (await req.json().catch(() => ({}))) as { id?: string; name?: string };
  const id = (body.id ?? "").trim();
  try {
    const account = await ghiRoiLam(q.actor, "zalo.admin", { thao_tac: "account.create", accountId: id }, () =>
      createZaloAccount(id, body.name?.trim() || undefined),
    );
    return NextResponse.json({ account });
  } catch (e) {
    if (!(e instanceof LoiViec)) return NextResponse.json({ error: "không ghi được nhật ký — không tạo tài khoản" }, { status: 500 });
    return NextResponse.json({ error: e.message || "lỗi tạo tài khoản" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const body: unknown = await req.json().catch(() => null);
  // Không cắt khoảng trắng: id đệm khoảng trắng là id lạ (bước kiểm trong deleteZaloAccount trả 400).
  const raw = body && typeof body === "object" ? (body as { id?: unknown }).id : undefined;
  const id = typeof raw === "string" ? raw : "";
  try {
    await ghiRoiLam(q.actor, "zalo.admin", { thao_tac: "account.delete", accountId: id }, () => deleteZaloAccount(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (!(e instanceof LoiViec)) return NextResponse.json({ error: "không ghi được nhật ký — không xoá tài khoản" }, { status: 500 });
    return NextResponse.json({ error: e.message || "lỗi xoá tài khoản" }, { status: 400 });
  }
}
