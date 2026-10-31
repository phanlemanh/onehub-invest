// people.tsx — hồ sơ sdt-luu-goc-e164 (SD3) E8 (AC-8, cross-layer): trên DB thử sau 060 + một lượt dựng danh bạ, loader
// thật của /ops/people (danhSachNguoi, motNguoi) + bước dựng hàng (hangNguoi, hienBiDanh) ở ba vai: không ô nào mang chữ
// số của số gốc; số người có ô che = số người có bí danh sdt (đối chứng dương). DB_URL do people.sh truyền.
import assert from "node:assert/strict"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import { hangNguoi } from "../../../app/src/components/ops/people/people-rows"
import { danhSachNguoi, hienBiDanh, motNguoi, NHAN_CHE_SDT } from "../../../app/src/lib/ops/people"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg") as typeof import("pg")

async function main() {
  const c = new pg.Client({ connectionString: process.env.DB_URL })
  await c.connect()
  try {
    const q = { query: (t: string, v?: unknown[]) => c.query(t, v) } as never
    const { rows: [d] } = await c.query(`SELECT count(DISTINCT object_key)::int n FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL`)
    let soO = 0
    let soChe = 0
    for (let page = 1; ; page++) {
      const ds = await danhSachNguoi({ source: null, q: "", page }, q)
      for (const r of ds.rows) {
        for (const [vai, xem] of [["viewer", false], ["ops", true], ["admin", true]] as const) {
          const h = hangNguoi(r, [], xem)
          for (const v of Object.values(h)) if (typeof v === "string" && /\+84\d|\d{4,}/.test(v) && v !== r.partyKey) throw new Error(`LO SO GOC TREN PEOPLE: vai ${vai}`)
          if (vai === "ops" && r.sdtKind === "sdt") { assert.equal(h.sdtBam, NHAN_CHE_SDT); soChe++ }
          soO++
        }
      }
      if (page >= ds.pages) break
    }
    if (soChe !== d.n) throw new Error(`LO SO GOC TREN PEOPLE: ô che ${soChe} ≠ người có sdt ${d.n}`)
    const { rows: mot } = await c.query(`SELECT object_key FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL LIMIT 20`)
    for (const { object_key } of mot) {
      const n = await motNguoi(object_key, q)
      assert.ok(n, "motNguoi không ra người có sdt")
      for (const a of n.aliases) {
        const v = hienBiDanh(a.kind, a.value, [], true)
        if (a.kind === "sdt" && v !== NHAN_CHE_SDT) throw new Error("LO SO GOC TREN PEOPLE: trang một người")
      }
    }
    const luatCu = (k: string, v: string) => hienBiDanh(k === "sdt" ? "sdt_bam" : k, v, [], true)
    assert.throws(() => { if (/\d{3,}/.test(luatCu("sdt", "+84912345678") ?? "")) throw new Error("LO SO GOC TREN PEOPLE: luật cũ") }, /LO SO GOC TREN PEOPLE/)
    console.log(`ok ${soO} ô hàng (ba vai) không mang số gốc; ${soChe} ô che = ${d.n} người có sdt; ${mot.length} trang một người che; đối chứng luật cũ bắt 'LO SO GOC TREN PEOPLE'`)
    console.log("PEOPLE OK")
  } finally {
    await c.end()
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
