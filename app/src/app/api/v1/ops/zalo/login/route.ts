import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { LoiViec, ghiRoiLam } from "@/lib/audit";
import { AccountIdError, cancelZaloLogin, coTienTrinhDangNhap, startZaloLogin, zaloLoginStatus } from "@/lib/zalo-admin";

export const dynamic = "force-dynamic";

/**
 * Luồng QR login tài khoản zalouser từ web:
 *   POST   { accountId }   → spawn `channels login` detached, trả QR base64
 *   GET    ?account=<id>   → poll: QR + process còn sống + connected
 *   DELETE ?account=<id>   → huỷ process login
 * Lưu ý: connected là tín hiệu channel-level (v1) — đủ cho 1-2 tài khoản đầu.
 * Quyền `zalo.admin` (admin, không bearer — TV1); bật và huỷ đăng nhập ghi audit trước khi chạy/dừng tiến trình.
 */

export async function POST(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const body: unknown = await req.json().catch(() => null);
  // Không cắt khoảng trắng: id đệm khoảng trắng là id lạ (bước kiểm trong startZaloLogin trả 400).
  const raw = body && typeof body === "object" ? (body as { accountId?: unknown }).accountId : undefined;
  const accountId = typeof raw === "string" ? raw : "";
  try {
    const r = await ghiRoiLam(q.actor, "zalo.admin", { thao_tac: "login.start", accountId }, () => startZaloLogin(accountId));
    return NextResponse.json(r);
  } catch (e) {
    if (!(e instanceof LoiViec)) return NextResponse.json({ error: "không ghi được nhật ký — không bắt đầu đăng nhập" }, { status: 500 });
    return NextResponse.json(
      { error: e.message || "lỗi bắt đầu login" },
      { status: e.goc instanceof AccountIdError ? 400 : 500 },
    );
  }
}

export async function GET(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const accountId = new URL(req.url).searchParams.get("account");
  if (!accountId) return NextResponse.json({ error: "thiếu account" }, { status: 400 });
  return NextResponse.json(await zaloLoginStatus(accountId));
}

export async function DELETE(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const accountId = new URL(req.url).searchParams.get("account");
  if (!accountId) return NextResponse.json({ error: "thiếu account" }, { status: 400 });
  // Không có tiến trình đăng nhập nào: không có gì để dừng, không dòng audit.
  if (!coTienTrinhDangNhap(accountId)) return NextResponse.json({ ok: true });
  try {
    await ghiRoiLam(q.actor, "zalo.admin", { thao_tac: "login.cancel", accountId }, () => cancelZaloLogin(accountId));
  } catch (e) {
    if (!(e instanceof LoiViec)) return NextResponse.json({ error: "không ghi được nhật ký — không dừng đăng nhập" }, { status: 500 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
