import { NextResponse } from "next/server";

import { kiemQuyen } from "@/lib/ops-access";
import { LoiViec, ghiRoiLam } from "@/lib/audit";
import { listZaloAccounts, listZaloGroupDirectory, setZaloGroupEnabled } from "@/lib/zalo-admin";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/ops/zalo/groups?account=<id> — membership thật (directory) +
 * trạng thái bật + account nào đang sở hữu nhóm (cho bất biến 1-1).
 * POST { accountId, groupId, enabled } — bật/tắt; 409 kèm owner nếu xung đột.
 * Quyền `zalo.admin` (admin, không bearer — TV1); ghi cấu hình đi sau dòng audit trong cùng transaction.
 */

/** Xung đột 1 nhóm – 1 tài khoản: không ghi gì, dòng audit cuộn lại. */
class XungDot extends Error {
  constructor(public readonly owner: string) {
    super(owner);
  }
}

export async function GET(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const accountId = new URL(req.url).searchParams.get("account") ?? "default";
  const force = new URL(req.url).searchParams.get("refresh") === "1";
  try {
    const [directory, accounts] = await Promise.all([
      listZaloGroupDirectory(accountId, force),
      listZaloAccounts(),
    ]);
    const owner = new Map<string, string>();
    for (const a of accounts) for (const g of a.enabledGroups) owner.set(g, a.accountId);
    const me = accounts.find((a) => a.accountId === accountId);
    return NextResponse.json({
      accountId,
      groups: directory.map((g) => ({
        ...g,
        enabled: me?.enabledGroups.includes(g.groupId) ?? false,
        ownedBy: owner.get(g.groupId) ?? null, // ≠ accountId = vi phạm nếu bật
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "lỗi đọc directory" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const q = await kiemQuyen(req, "zalo.admin");
  if (!q.ok) return q.res;
  const body = (await req.json().catch(() => ({}))) as {
    accountId?: string;
    groupId?: string;
    enabled?: boolean;
  };
  if (!body.accountId || !body.groupId || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "thiếu accountId/groupId/enabled" }, { status: 400 });
  }
  const { accountId, groupId, enabled } = body;
  try {
    await ghiRoiLam(q.actor, "zalo.admin", { thao_tac: "group.toggle", accountId, groupId, enabled, to: enabled }, async () => {
      const { conflictWith } = await setZaloGroupEnabled(accountId, groupId, enabled);
      if (conflictWith) throw new XungDot(conflictWith);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (!(e instanceof LoiViec)) return NextResponse.json({ error: "không ghi được nhật ký — cấu hình không đổi" }, { status: 500 });
    if (e.goc instanceof XungDot) {
      const conflictWith = e.goc.owner;
      return NextResponse.json(
        { error: `Nhóm đã bật ở tài khoản "${conflictWith}" (nguyên tắc 1 nhóm – 1 tài khoản)`, conflictWith },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: e.message || "lỗi ghi config" }, { status: 400 });
  }
}
