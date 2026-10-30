// labels-mau.test.tsx — hồ sơ _acceptance/tap-nhan-mau-ocp1 (PL8) AC-3: nhãn của tập mẫu đi qua bộ ghi nhãn THẬT của PL7
// (`chuanHoaLuot`, src/lib/labels-normalize.ts) và ra đúng giá trị ấy. Không DB. Đối chứng: bản chép bộ sinh ghi diện tích
// dấu phẩy phải bị bắt.
import { test } from "node:test"
import assert from "node:assert/strict"
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { chuanHoaLuot, LABEL_FIELDS, type RawCell, type RawLabels } from "../src/lib/labels-normalize"
import * as boSinh from "../../pipeline/lib/tap-mau.mjs"

type O = { value: string | null; not_stated: boolean }
type Tin = { id: string; nhan: Record<string, O> }
type BoSinh = { sinhTapMau: (o: { lat: string; n: number; seed: string }) => { tin: Tin[] } }

const LIB = resolve(dirname(fileURLToPath(import.meta.url)), "../../pipeline/lib")
const SEEDS = ["a", "pl9", "kiem"]

/** VND nguyên → chữ thập phân dấu phẩy theo đơn vị (10^mu), bỏ số 0 thừa. */
function veDonVi(vnd: string, mu: number): string {
  const s = vnd.padStart(mu + 1, "0")
  const nguyen = s.slice(0, -mu)
  const le = s.slice(-mu).replace(/0+$/, "")
  return le ? `${BigInt(nguyen)},${le}` : BigInt(nguyen).toString()
}
/** Nhãn của tin mẫu → ô thô như người gõ: giá ≥ 1 tỷ gõ theo tỷ, dưới gõ theo triệu. */
function veRaw(nhan: Record<string, O>): RawLabels {
  const raw: RawLabels = {}
  for (const f of LABEL_FIELDS) {
    const o = nhan[f]
    let c: RawCell
    if (o.not_stated) c = { not_stated: true }
    else if (f === "price_min_vnd" || f === "price_max_vnd") {
      c = BigInt(o.value!) >= BigInt(1_000_000_000) ? { value: veDonVi(o.value!, 9), unit: "ty" } : { value: veDonVi(o.value!, 6), unit: "trieu" }
    } else c = { value: o.value! }
    raw[f] = c
  }
  return raw
}

function kiemQuaBoGhi(mod: BoSinh): number {
  let so = 0
  for (const seed of SEEDS) for (const t of mod.sinhTapMau({ lat: "ocp1", n: 200, seed }).tin) {
    const r = chuanHoaLuot(veRaw(t.nhan))
    if (!r.ok) throw new Error(`NHAN KHONG QUA BO GHI THAT: ${t.id} ${JSON.stringify(r.loi)}`)
    for (const row of r.rows) {
      const o = t.nhan[row.field]
      if (row.value !== o.value || row.not_stated !== o.not_stated) {
        throw new Error(`NHAN KHONG QUA BO GHI THAT: ${t.id} ${row.field} nhãn ${o.value} → bộ ghi ${row.value}`)
      }
    }
    assert.equal(r.rows.length, LABEL_FIELDS.length)
    so++
  }
  return so
}

test("TNM-AC-3 nhãn tập mẫu qua chuanHoaLuot thật: ok và trùng từng trường (n = 200 × 3 seed)", () => {
  const so = kiemQuaBoGhi(boSinh as BoSinh)
  assert.equal(so, 600)
  console.log(`TNM-AC-3 xanh: ${so} tin, ${so * LABEL_FIELDS.length} ô qua bộ ghi thật`)
})

test("TNM-AC-3 đối chứng: bộ sinh ghi diện tích «64,5» → NHAN KHONG QUA BO GHI THAT", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tap-mau-app-"))
  try {
    for (const f of ["tap-mau.mjs", "khuon-mau-ocp1.mjs"]) copyFileSync(join(LIB, f), join(dir, f))
    const p = join(dir, "tap-mau.mjs")
    const goc = readFileSync(p, "utf8")
    const moi = goc.replace('const nhanDt = (d) => thapPhan(d, 10, ".");', 'const nhanDt = (d) => thapPhan(d, 10, ",");')
    assert.notEqual(moi, goc, "đối chứng không áp được — chỗ sửa đã đổi")
    writeFileSync(p, moi)
    const mod = (await import(pathToFileURL(p).href)) as BoSinh
    assert.throws(() => kiemQuaBoGhi(mod), /NHAN KHONG QUA BO GHI THAT/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
