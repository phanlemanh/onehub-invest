import { NextResponse } from "next/server"

import { pool } from "@/lib/db"
import { chuanHoaLuot, type RawLabels } from "@/lib/labels-normalize"
import { baiDeGhi, ghiNhan, nhomCuaLat, tienDo, tinKe } from "@/lib/labels-queries"
import { kiemDanhMuc } from "@/lib/labels-s08"
import { kiemQuyen, xemNoiDungTin } from "@/lib/ops-access"

export const dynamic = "force-dynamic"

/**
 * /api/v1/ops/labels — gắn nhãn đánh giá (PL7 `man-gan-nhan-mu`). Quyền `label.write` (vai ops, không bearer).
 * GET ?lat=<lát>[&nhom=<mã>] → tin kế của người gọi + tiến độ + các nhóm (chỉ chữ gốc của tin — mù giá trị máy, AC-4).
 * POST { lat, item_id, values, reason } → chuẩn hoá + ghi trong một giao dịch: 400 nêu trường sai, 409 khi tin đã đủ người
 * gắn, 200 khi ghi xong. Bài có `stratum` đi luật 24 trường (GC0 + GN1), lát đời trước chín trường; ô căn cứ «Danh mục CĐT»
 * phải khớp danh mục S08 (labels-s08.ts).
 * Bảng chỉ ở máy thu: trên cloud (VERCEL=1) trả 503 «Chỉ ở máy thu».
 */
const LAT_RE = /^[a-z0-9-]+$/
const NHOM_RE = /^[A-Za-z0-9_-]+$/

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
  const url = new URL(req.url)
  const lat = url.searchParams.get("lat") ?? ""
  const nhom = url.searchParams.get("nhom")
  if (!LAT_RE.test(lat)) return NextResponse.json({ error: "lat không hợp lệ" }, { status: 400 })
  if (nhom !== null && !NHOM_RE.test(nhom)) return NextResponse.json({ error: "nhom không hợp lệ" }, { status: 400 })
  const id = q.nguoi!.id
  const [tin, tien, nhomLat] = await Promise.all([tinKe(id, lat, pool, nhom), tienDo(id, lat, pool, nhom), nhomCuaLat(id, lat)])
  return NextResponse.json({ tin, tienDo: tien, nhom: nhomLat })
}

export async function POST(req: Request) {
  const q = await kiemQuyen(req, "label.write")
  if (!q.ok) return q.res
  const may = chiMayThu()
  if (may) return may
  const body = (await req.json().catch(() => null)) as { lat?: unknown; item_id?: unknown; values?: unknown; reason?: unknown } | null
  const lat = typeof body?.lat === "string" ? body.lat : ""
  const itemId = Number(body?.item_id)
  if (!LAT_RE.test(lat) || !Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "Thiếu lat hoặc item_id" }, { status: 400 })
  }
  const bai = await baiDeGhi(itemId)
  const chuan = chuanHoaLuot(body?.values as RawLabels, bai?.stratum ? { text: bai.text, reason: body?.reason } : undefined)
  if (!chuan.ok) return NextResponse.json({ error: "Có trường sai", loi: chuan.loi }, { status: 400 })
  // Căn cứ «Danh mục CĐT» chỉ nhận giá trị có trong S08 (truong-nhan-s03-081 AC-4).
  const loiCdt = await kiemDanhMuc(chuan.rows)
  if (Object.keys(loiCdt).length > 0) return NextResponse.json({ error: "Có trường sai", loi: loiCdt }, { status: 400 })
  const c = await pool.connect()
  try {
    const kq = await ghiNhan(c, q.nguoi!.id, lat, itemId, chuan.rows, chuan.reason)
    if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status })
    return NextResponse.json({ ok: true })
  } finally {
    c.release()
  }
}
