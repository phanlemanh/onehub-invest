// eval-classify-mien.test.tsx — hồ sơ _acceptance/eval-classify-wilson (PL9) AC-4, E4b: mọi giá trị cách đọc `parser` trả
// (pipeline/lib/eval-classify.mjs) nằm trong miền nhãn của PL7 — đổi thành ô thô như người gõ rồi đưa qua bộ ghi nhãn THẬT
// `chuanHoaLuot` (src/lib/labels-normalize.ts) thì ra đúng chuỗi ấy. Không DB. Đối chứng: bản chép cách đọc trả diện tích
// dấu phẩy phải bị bắt.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { chuanHoaLuot, LABEL_FIELDS, type RawLabels } from "../src/lib/labels-normalize"
import * as that from "../../pipeline/lib/eval-classify.mjs"

type Mod = typeof that
const LIB = resolve(dirname(fileURLToPath(import.meta.url)), "../../pipeline/lib")
const MAU_KIEM = resolve(LIB, "../../_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl")
const CHU_VIET_TRUOC = [
  "Bán căn 2PN 64,5 m2 giá 3,15 tỷ",
  "Căn 64.5m2 2PN giá 4 tỷ 350",
  "Cho thuê căn hộ 12 triệu/tháng 1 phòng ngủ 45m2",
  "Cho thuê 12tr5 căn 1PN",
  "Bán gấp giá 3.150.000.000 đồng",
  "Căn PR2.03 bán 4 tỷ 2PN",
  "Có PR2 và S1 cho thuê 15tr",
  "Tìm căn hộ ở Ocean Park",
]

/** VND nguyên → số triệu dấu phẩy như người gõ («4350», «12,5»). */
function trieu(vnd: string): string {
  const s = vnd.padStart(7, "0")
  const nguyen = s.slice(0, -6)
  const le = s.slice(-6).replace(/0+$/, "")
  return le ? `${BigInt(nguyen)},${le}` : BigInt(nguyen).toString()
}

/** Giá trị cách đọc → ô thô của biểu mẫu PL7; trường cách đọc không trả → «tin không nêu». */
function veRaw(ra: Record<string, string | null>): RawLabels {
  const raw: RawLabels = {}
  for (const f of LABEL_FIELDS) {
    const v = ra[f] ?? null
    if (v == null) raw[f] = { not_stated: true }
    else if (f === "price_min_vnd" || f === "price_max_vnd") raw[f] = { value: trieu(v), unit: "trieu" }
    else if (f === "area_m2") raw[f] = { value: v.replace(".", ",") }
    else raw[f] = { value: v }
  }
  return raw
}

function kiemMien(mod: Mod) {
  const tin = readFileSync(MAU_KIEM, "utf8").split("\n").filter(Boolean).slice(1).map((l) => JSON.parse(l).text as string)
  let soAssert = 0
  for (const text of [...tin, ...CHU_VIET_TRUOC]) {
    const ra = mod.CACH_DOC.parser.doc(text) as Record<string, string | null>
    const kq = chuanHoaLuot(veRaw(ra))
    assert.ok(kq.ok, `chuanHoaLuot từ chối: ${text} → ${JSON.stringify(kq)}`)
    for (const r of kq.rows) {
      const v = ra[r.field] ?? null
      if (r.value !== v) throw new Error(`GIA TRI NGOAI MIEN NHAN ${r.field}: ${JSON.stringify(v)} → ${JSON.stringify(r.value)}`)
    }
    soAssert++
  }
  assert.equal(soAssert, tin.length + CHU_VIET_TRUOC.length)
}

test("E4b mọi giá trị parser qua chuanHoaLuot thật không đổi (40 tin mẫu + 8 chữ viết trước)", () => kiemMien(that))

test("E4b đối chứng đỏ: parser trả diện tích dấu phẩy", async () => {
  const goc = readFileSync(join(LIB, "eval-classify.mjs"), "utf8")
  const moi = goc.replace("String(p.areaM2)", 'String(p.areaM2).replace(".", ",")')
  assert.notEqual(moi, goc)
  const ban = join(LIB, `.ban-${process.pid}-mien-eval-classify.mjs`)
  writeFileSync(ban, moi)
  try {
    const mod = (await import(pathToFileURL(ban).href)) as Mod
    assert.throws(() => kiemMien(mod), /GIA TRI NGOAI MIEN NHAN area_m2/)
  } finally {
    rmSync(ban, { force: true })
  }
})
