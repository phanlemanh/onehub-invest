// so-s16.mts — DA67 E1 (AC-1), E4 (AC-3), E5 (AC-4) trên DB máy thu CHỈ ĐỌC. Bản mới (cây đang kiểm) so bản origin/main của
// app/src/lib/ops/thuoc-tinh-can.ts (kiem.sh chép ra DBO_TTC_MAIN). Không ghi gì; chỉ in số đếm và thời gian, không in tên.
// Chạy: bash _acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/kiem.sh may
import assert from "node:assert/strict"
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createRequire } from "node:module"
import type PgT from "pg"

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const APP = join(GOC, "app")
const TEP_MOI = join(APP, "src/lib/ops/thuoc-tinh-can.ts")
const DU_AN = [16, 1, 4, 2, 3]
const LAN = 3

// Kho gốc không có node_modules — mượn pg của app/ (như scripts/).
const pg: typeof PgT = createRequire(join(APP, "package.json"))("pg")
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4, options: "-c default_transaction_read_only=on" })
type Q = { query: (text: string, params?: unknown[]) => Promise<PgT.QueryResult> }
type Lop = typeof import("../../../app/src/lib/ops/thuoc-tinh-can")

/** Nạp một bản lớp đọc từ chuỗi nguồn (đổi đường import db sang tuyệt đối), từ thư mục tạm. */
async function napLop(src: string, ten: string): Promise<Lop> {
  const dir = mkdtempSync(join(tmpdir(), `dbo-${ten}-`))
  const tep = join(dir, "lop.ts")
  writeFileSync(tep, src.replace('from "../db"', `from ${JSON.stringify(pathToFileURL(join(APP, "src/lib/db.ts")).href)}`))
  try { return await import(pathToFileURL(tep).href) } finally { rmSync(dir, { recursive: true, force: true }) }
}
/** Bộ bọc q: đếm câu chạm view thuộc tính (không tính câu kiểm to_regclass) và cộng thời gian DB từng câu. */
function boc(): Q & { soV: number; soG: number; dbMs: number } {
  const o = {
    soV: 0, soG: 0, dbMs: 0,
    async query(text: string, params?: unknown[]) {
      if (!text.includes("to_regclass")) {
        if (text.includes("v_unit_thuoc_tinh")) o.soV++
        if (text.includes("v_s16_gia_cdt")) o.soG++
      }
      const t0 = performance.now()
      try { return await pool.query(text, params) } finally { o.dbMs += performance.now() - t0 }
    },
  }
  return o
}
const trungVi = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const mapJson = (m: Map<string, unknown>) => JSON.stringify([...m.entries()].sort(([a], [b]) => a.localeCompare(b)))

const srcMoi = readFileSync(TEP_MOI, "utf8")
assert.ok(srcMoi.includes("v AS MATERIALIZED (SELECT * FROM v_unit_thuoc_tinh)"), "AC-1 bản mới bỏ MATERIALIZED của v_unit_thuoc_tinh")
const moi = await napLop(srcMoi, "moi")
const cu = await napLop(readFileSync(process.env.DBO_TTC_MAIN!, "utf8"), "main")
const { docDuAn } = await import(pathToFileURL(join(APP, "src/lib/ops/registry/du-an.ts")).href)

const toaCua = new Map<number, string[]>()
for (const id of DU_AN) {
  const d = await docDuAn(id, pool)
  assert.ok(d, `AC-3 dự án ${id} không đọc được`)
  toaCua.set(id, d.toa.map((t: { key: string }) => t.key))
}

// ---- E1 (AC-1): số câu chạm view thuộc tính, bản mới vs bản main (đối chứng đỏ cùng lượt) ----
const qMoi = boc(); await moi.docThuocTinhDuAn(toaCua.get(16)!, qMoi)
const qCu = boc(); await Promise.all([cu.docThuocTinhCan(toaCua.get(16)!, qCu), cu.docPhuThuocTinh(toaCua.get(16)!, qCu)])
console.log(`AC-1 bản mới: ${qMoi.soV} câu v_unit_thuoc_tinh, ${qMoi.soG} câu v_s16_gia_cdt · bản main: ${qCu.soV} câu, ${qCu.soG} câu`)
assert.ok(qCu.soV === 2, `AC-1 bản main: ${qCu.soV} câu — bộ đếm không phân biệt`)
assert.deepEqual([qMoi.soV, qMoi.soG], [1, 1], "AC-1 số câu chạm v_unit_thuoc_tinh ở bản mới khác 1")

// ---- E4 (AC-3): lưới và ô phủ bằng nhau từng giá trị trên 5 dự án; đối chứng dương bằng bản phá co_gia ----
const TU = "(count(*) FILTER (WHERE co_g))::int AS co_gia"
assert.ok(srcMoi.split(TU).length === 2, "AC-3 chỗ phá không còn trong lớp đọc")
const pha = await napLop(srcMoi.replace(TU, "(count(*) FILTER (WHERE co_v))::int AS co_gia"), "pha")
let lechPha = 0
for (const id of DU_AN) {
  const keys = toaCua.get(id)!
  const m = await moi.docThuocTinhDuAn(keys, pool)
  const [tc, pc] = await Promise.all([cu.docThuocTinhCan(keys, pool), cu.docPhuThuocTinh(keys, pool)])
  assert.ok(m.thuocTinh.ok && m.phu.ok && tc.ok && pc.ok, `AC-3 lệch ở dự án ${id}: có bản đọc lỗi`)
  assert.equal(mapJson(m.thuocTinh.data), mapJson(tc.data), `AC-3 lệch ở dự án ${id}: lưới thuộc tính`)
  assert.deepEqual(m.phu.data, pc.data, `AC-3 lệch ở dự án ${id}: ô phủ`)
  const p = m.phu.data
  console.log(`AC-3 dự án ${id}: ${keys.length} toà · ${m.thuocTinh.data.size} căn có thuộc tính/giá · ô phủ ${p.trangThai === "co" ? `${p.coThuocTinh}/${p.trongDanhBa}, giá ${p.coGia}, chưa vào ${p.chuaVaoDanhBa}` : p.trangThai} — khớp bản main`)
  if (id === 16) assert.ok(p.trangThai === "co" && p.trongDanhBa > 0, "AC-3 dự án 16 ô phủ không có số")
  const x = await pha.docThuocTinhDuAn(keys, pool)
  if (x.phu.ok && JSON.stringify(x.phu.data) !== JSON.stringify(pc.data)) lechPha++
}
assert.ok(lechPha > 0, "AC-3 đối chứng: bản phá co_gia vẫn khớp bản main ở mọi dự án — phép so không phân biệt")
console.log(`AC-3 đối chứng: bản phá co_gia lệch ở ${lechPha}/${DU_AN.length} dự án`)

// ---- E5 (AC-4): dự án 16, xen kẽ main/mới, trung vị 3 lần — tổng DB và thời gian tường ----
const db = { moi: [] as number[], cu: [] as number[] }, tuong = { moi: [] as number[], cu: [] as number[] }
for (let i = 0; i < LAN; i++) {
  const a = boc(); let t0 = performance.now()
  await Promise.all([cu.docThuocTinhCan(toaCua.get(16)!, a), cu.docPhuThuocTinh(toaCua.get(16)!, a)])
  tuong.cu.push(performance.now() - t0); db.cu.push(a.dbMs)
  const b = boc(); t0 = performance.now()
  await moi.docThuocTinhDuAn(toaCua.get(16)!, b)
  tuong.moi.push(performance.now() - t0); db.moi.push(b.dbMs)
}
const tlDb = trungVi(db.moi) / trungVi(db.cu), tlTuong = trungVi(tuong.moi) / trungVi(tuong.cu)
console.log(`AC-4 dự án 16 (trung vị ${LAN} lần): DB main ${trungVi(db.cu).toFixed(0)} ms · mới ${trungVi(db.moi).toFixed(0)} ms · tỉ lệ ${tlDb.toFixed(2)}`)
console.log(`AC-4 thời gian tường: main ${trungVi(tuong.cu).toFixed(0)} ms · mới ${trungVi(tuong.moi).toFixed(0)} ms · tỉ lệ ${tlTuong.toFixed(2)}`)
assert.ok(tlDb <= 0.6, `AC-4 tỉ lệ DB ${tlDb.toFixed(2)} > 0,6`)
assert.ok(tlTuong <= 1.1, `AC-4 tỉ lệ tường ${tlTuong.toFixed(2)} > 1,1`)
await pool.end()
await (await import(pathToFileURL(join(APP, "src/lib/db.ts")).href)).pool.end().catch(() => {})
console.log("so-s16: ĐẠT")
