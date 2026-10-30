import { NextResponse } from "next/server"

import { pool } from "@/lib/db"
import { chuanHoaLuot, type RawLabels } from "@/lib/labels-normalize"
import { ghiNhan, tienDo, tinKe } from "@/lib/labels-queries"
import { kiemQuyen, xemNoiDungTin } from "@/lib/ops-access"

export const dynamic = "force-dynamic"

/**
 * /api/v1/ops/labels — gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`). Quyền `label.write` (vai ops, không bearer).
 * GET ?lat=<lát> → tin kế của người gọi + tiến độ (chỉ chữ gốc của tin — mù giá trị máy, AC-4).
 * POST { lat, item_id, values } → chuẩn hoá + ghi chín trường trong một giao dịch: 400 nêu trường sai, 409 khi tin đã đủ
 * người gắn, 200 khi ghi xong. Bảng chỉ ở máy thu: trên cloud (VERCEL=1) trả 503 «Chỉ ở máy thu».
 */
const LAT_RE = /^[a-z0-9-]+$/

function chiMayThu() {
  return process.env.VERCEL === "1"
    ? NextResponse.json({ error: "Chỉ ở máy thu — nhãn không rời máy thu" }, { status: 503 })
    : null
}

export async function GET(req: Request) {
  const q = await kiemQuyen(req, "label.write")
  if (!q.ok) return q.res
  const may = chiMayThu()
  if (may) return may
  // Tin kế mang chữ gốc của tin (nội dung tin) — chốt cùng luật với /ops/review.
  if (!xemNoiDungTin(q.nguoi)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const lat = new URL(req.url).searchParams.get("lat") ?? ""
  if (!LAT_RE.test(lat)) return NextResponse.json({ error: "lat không hợp lệ" }, { status: 400 })
  const id = q.nguoi!.id
  const [tin, tien] = await Promise.all([tinKe(id, lat), tienDo(id, lat)])
  return NextResponse.json({ tin, tienDo: tien })
}

export async function POST(req: Request) {
  const q = await kiemQuyen(req, "label.write")
  if (!q.ok) return q.res
  const may = chiMayThu()
  if (may) return may
  const body = (await req.json().catch(() => null)) as { lat?: unknown; item_id?: unknown; values?: unknown } | null
  const lat = typeof body?.lat === "string" ? body.lat : ""
  const itemId = Number(body?.item_id)
  if (!LAT_RE.test(lat) || !Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Thiếu lat hoặc item_id" }, { status: 400 })
  }
  const chuan = chuanHoaLuot(body?.values as RawLabels)
  if (!chuan.ok) return NextResponse.json({ error: "Có trường sai", loi: chuan.loi }, { status: 400 })
  const c = await pool.connect()
  try {
    const kq = await ghiNhan(c, q.nguoi!.id, lat, itemId, chuan.rows)
    if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status })
    return NextResponse.json({ ok: true })
  } finally {
    c.release()
  }
}
