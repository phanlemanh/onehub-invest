// the-duyet-phuong-that.test.tsx — ca TPL-AC-6 của hồ sơ the-duyet-phuong-lech-gia, dời khỏi suite chung app (hồ sơ
// l2-bao-thu-doi-probe-that): hàng Phường của bảng so ghép căn trên areas và thẻ ghép căn thật của DB máy thu (chỉ SELECT).
// Chạy ở: executors.test.the_duyet_phuong (eval đã ký) và scripts/probe-du-lieu-that.sh (/ops-check mục B5).
// Chiều đỏ: bản chép tạm của review-can-cu.ts (probes/.tpl-that-*) đổi đúng một chỗ; không chạy khi PROBE_TRONG_SCRIPT=1.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const NGUON = "src/lib/ops/review-can-cu.ts"
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
})
type CanCuMod = typeof import("../src/lib/ops/review-can-cu")
function chepTep(rel: string, doi: (s: string) => string): string {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "probes", `.tpl-that-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, tuyet)
  CHEP.push(f)
  return f
}
const banChep = async (doi: (s: string) => string) => (await import(chepTep(NGUON, doi))) as CanCuMod
const BO_TIEN_TO = (s: string) => s.replace('.replace(/^(?:(?:phường|xã|thị trấn)(?:\\s+|$)|p\\.\\s*)/u, "")', "")
const TIEN_TO_SAU_DAU = (s: string) =>
  BO_TIEN_TO(s).replace('.replace(/^-+|-+$/g, "");\n}', '.replace(/^-+|-+$/g, "").replace(/^(?:phuong|xa|thi-tran|p)-/, "");\n}')
let canCu: CanCuMod
before(async () => {
  canCu = (await import("../src/lib/ops/review-can-cu")) as CanCuMod
})
const soPhuong = (mod: CanCuMod, a: string | null, b: string | null) =>
  mod.soTruongGhepCan({ phuong: a }, { phuong: b }).find((h) => h.key === "phuong")!

// ---------- TPL-AC-6 probe (DB máy thu, chỉ SELECT) ----------
type Area = { id: string; parent_id: string; name: string }
type The = { id: number; a: string | null; b: string | null }
async function docDb(): Promise<{ areas: Area[]; the: The[] }> {
  const c = new pg.Client({ connectionString: localDbUrl() })
  await c.connect()
  try {
    // Tập phường của AC-6 là tập trước khi nạp danh bạ PX1: xã chèn từ danh bạ (`meta.source = 'dvhc'`) mang mã đuôi
    // `-<mã xã>` khi trùng slug trong tỉnh, nên đuôi mã không còn là tên phường — ngoài phạm vi phép đo này.
    const areas = (
      await c.query<Area>(
        "SELECT id, parent_id, name FROM areas WHERE region_type = 'submarket' AND parent_id IS NOT NULL AND meta->>'source' IS DISTINCT FROM 'dvhc'",
      )
    ).rows
    const the = (
      await c.query<The>(
        "SELECT id, evidence->'offer_a'->>'phuong' AS a, evidence->'offer_b'->>'phuong' AS b FROM review_queue WHERE item_type = 'entity_match' ORDER BY id",
      )
    ).rows
    return { areas, the }
  } finally {
    await c.end()
  }
}
const duoi = (a: Area) => a.id.slice(a.parent_id.length + 1)
const nfc = (s: string) => s.normalize("NFC").trim().toLowerCase()

function kiemAc6(mod: CanCuMod, areas: Area[], the: The[]) {
  // Nhánh cùng phường: đuôi mã ↔ «Phường » + tên, đuôi mã ↔ tên trần.
  let cung = 0
  for (const a of areas) {
    for (const ten of [`Phường ${a.name}`, a.name]) {
      const so = soPhuong(mod, duoi(a), ten).so
      assert.equal(so, "khop", `TPL-AC-6 probe: ${duoi(a)} ↔ ${ten} cùng phường mà báo ${so}`)
      cung++
    }
  }
  assert.ok(cung >= 1, "TPL-AC-6 probe: không area nào — nhánh cùng phường xanh suông")
  // Nhánh khác phường: mọi cặp hai area khác nhau cùng thị trường.
  let khac = 0
  const theoTT = new Map<string, Area[]>()
  for (const a of areas) theoTT.set(a.parent_id, [...(theoTT.get(a.parent_id) ?? []), a])
  for (const ds of theoTT.values()) {
    for (const x of ds) {
      for (const y of ds) {
        if (x.id === y.id) continue
        const so = soPhuong(mod, duoi(x), `Phường ${y.name}`).so
        assert.equal(so, "lech", `TPL-AC-6 probe: ${duoi(x)} ↔ Phường ${y.name} khác phường mà báo Khớp`)
        khac++
      }
    }
  }
  assert.ok(khac >= 1, "TPL-AC-6 probe: không cặp area nào — nhánh khác phường xanh suông")
  // Thẻ thật: bên slug = đuôi mã; bên tên = area có «Phường » + name hoặc name bằng nguyên chuỗi (NFC, chữ thường).
  const giai = (v: string | null): string | null => {
    if (v === null) return null
    const hit = areas.filter((a) => duoi(a) === v || nfc(`Phường ${a.name}`) === nfc(v) || nfc(a.name) === nfc(v))
    const ids = new Set(hit.map(duoi))
    return ids.size === 1 ? [...ids][0] : null
  }
  let giaiDuoc = 0
  for (const t of the) {
    const ga = giai(t.a)
    const gb = giai(t.b)
    if (ga === null || gb === null || ga !== gb) continue
    giaiDuoc++
    const so = soPhuong(mod, t.a, t.b).so
    assert.equal(so, "khop", `TPL-AC-6 probe: thẻ #${t.id} ${t.a} ↔ ${t.b} cùng area ${ga} mà báo ${so}`)
  }
  assert.ok(giaiDuoc >= 1, "TPL-AC-6 probe: không thẻ nào giải được phường — phép đo xanh suông")
  return { cung, khac, giaiDuoc }
}
test("TPL-AC-6 probe DB máy thu: mọi phường OSM tự khớp hai cách ghi, mọi cặp khác phường Lệch, thẻ thật cùng phường Khớp", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có bảng areas và thẻ ghép căn thật — CI chỉ có lược đồ")
  if (process.env.PROBE_GIA_DO === "the-duyet-phuong-that") assert.fail("PROBE_GIA_DO: the-duyet-phuong-that ra đỏ có chủ đích")
  const { areas, the } = await docDb()
  const dem = kiemAc6(canCu, areas, the)
  t.diagnostic(`TPL-AC-6: ${areas.length} phường · ${dem.cung} cặp cùng phường · ${dem.khac} cặp khác phường · ${dem.giaiDuoc}/${the.length} thẻ giải được`)
  if (process.env.PROBE_TRONG_SCRIPT === "1") return
  const sai = await banChep(TIEN_TO_SAU_DAU)
  // Ghim theo lớp thông điệp, không theo giá trị đứng đầu: dữ liệu mới đổi thứ tự phường (sự cố 15/11: «phuong-duc» thay «phuong-liet»).
  assert.throws(() => kiemAc6(sai, areas, the), /TPL-AC-6 probe: \S+ ↔ .* cùng phường mà báo lech/)
})
