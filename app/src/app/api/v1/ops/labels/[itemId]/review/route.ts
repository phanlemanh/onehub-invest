import { NextResponse } from "next/server"

import { doiChieu, ghiTruongHop, type GhiTruongHop } from "@/lib/labels-luot-hai"
import { pool } from "@/lib/db"
import { kiemQuyen, xemNoiDungTin } from "@/lib/ops-access"

export const dynamic = "force-dynamic"

/**
 * /api/v1/ops/labels/<itemId>/review — lượt hai của màn gắn nhãn (GC0). Quyền `label.write`.
 * GET → bảng so của người gọi; 403 khi họ chưa lưu bài này, để lượt một vẫn mù.
 * POST { case_kind, note, the_nhom_dung } → thêm một dòng trường hợp, không đụng nhãn đã lưu.
 * Bảng chỉ ở máy thu: trên cloud (VERCEL=1) trả 503 «Chỉ ở máy thu» trước mọi truy vấn.
 */
type Ctx = { params: Promise<{ itemId: string }> }

function chiMayThu() {
  return process.env.VERCEL === "1"
    ? NextResponse.json({ error: "Chỉ ở máy thu — nhãn không rời máy thu" }, { status: 503 })
    : null
}

async function docMa(ctx: Ctx) {
  const id = Number((await ctx.params).itemId)
  return Number.isInteger(id) && id > 0 ? id : null
}

export async function GET(req: Request, ctx: Ctx) {
  const q = await kiemQuyen(req, "label.write")
  if (!q.ok) return q.res
  const may = chiMayThu()
  if (may) return may
  if (!xemNoiDungTin(q.nguoi)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const itemId = await docMa(ctx)
  if (!itemId) return NextResponse.json({ error: "Mã tin không hợp lệ" }, { status: 400 })
  const kq = await doiChieu(q.nguoi!.id, itemId)
  if (!kq) return NextResponse.json({ error: "Chỉ xem được sau khi đã lưu nhãn bài này" }, { status: 403 })
  return NextResponse.json(kq)
}

export async function POST(req: Request, ctx: Ctx) {
  const q = await kiemQuyen(req, "label.write")
  if (!q.ok) return q.res
  const may = chiMayThu()
  if (may) return may
  const itemId = await docMa(ctx)
  if (!itemId) return NextResponse.json({ error: "Mã tin không hợp lệ" }, { status: 400 })
  const body = ((await req.json().catch(() => null)) ?? {}) as GhiTruongHop
  const kq = await ghiTruongHop(pool, q.nguoi!.id, itemId, body)
  if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status })
  return NextResponse.json({ ok: true })
}
