// people-che-so-loader.test.tsx — hồ sơ _acceptance/sd3-lam-chat-do-danh-ba AC-7 (Ngoài-17 của SD3): trên /ops/people, ô
// nào cũng không mang chuỗi 3+ chữ số liên tiếp của số gốc — đo qua loader thật (danhSachNguoi, motNguoi) và quyền xem thật
// (xemNoiDungTin) của ba vai, trong BEGIN…ROLLBACK trên DB THỬ (probes/people.sh dựng). Không chạy trên DB `oneinvest`
// dùng chung: thiếu DATABASE_URL hay trỏ oneinvest thì bỏ qua (bộ test app thường) — 060 chỉ nạp trong giao dịch. Số bịa.
import { test } from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import pg from "pg"

import { hangNguoi } from "../src/components/ops/people/people-rows"
import { danhSachNguoi, hienBiDanh, motNguoi, NHAN_CHE_SDT, type NguoiHang } from "../src/lib/ops/people"
import { xemNoiDungTin } from "../src/lib/ops-access"

const SO = "+84912345678"
const P_SDT = "pty_01HZZZZZZZZZZZZZZZZZZZKD01"
const P_BAM = "pty_01HZZZZZZZZZZZZZZZZZZZKD02"
const VAI = ["viewer", "ops", "admin"] as const

/** Lời từ chối khi DATABASE_URL không phải DB thử (null = được chạy). */
export function chonDb(url: string | undefined): string | null {
  if (!url) return "DB DUNG CHUNG: thiếu DATABASE_URL — chạy qua probes/people.sh"
  const ten = new URL(url).pathname.replace(/^\//, "")
  return ten === "oneinvest" || !ten.startsWith("oneinvest_") ? `DB DUNG CHUNG: «${ten}» không phải DB thử` : null
}

/** Cửa sổ 3 chữ số liên tiếp của số gốc (cả dạng +84 lẫn dạng 0). */
const CUA_SO = new Set(
  [SO.replace(/\D/g, ""), "0" + SO.slice(3)].flatMap((d) => Array.from({ length: d.length - 2 }, (_, i) => d.slice(i, i + 3))),
)
/** Ô lộ số gốc: một dãy chữ số trong ô chứa chuỗi 3 chữ số liên tiếp của số gốc. */
export function loSoGoc(o: unknown, noi: string): void {
  if (typeof o !== "string") return
  for (const run of o.match(/\d{3,}/g) ?? [])
    for (let i = 0; i + 3 <= run.length; i++)
      if (CUA_SO.has(run.slice(i, i + 3))) throw new Error(`LO SO GOC TREN PEOPLE: ${noi}`)
}

type Hien = typeof hienBiDanh
type Q = Parameters<typeof motNguoi>[1]

/** Quét mọi ô của hàng danh sách và mọi bí danh trang một người, ở ba vai; trả số ô che. */
async function quet(q: Q, hien: Hien, hang: (r: NguoiHang, xem: boolean) => ReturnType<typeof hangNguoi>) {
  const tim: NguoiHang[] = []
  for (let page = 1; ; page++) {
    const ds = await danhSachNguoi({ source: "S03", q: "", page }, q)
    tim.push(...ds.rows.filter((r) => r.partyKey === P_SDT || r.partyKey === P_BAM))
    if (page >= ds.pages) break
  }
  assert.equal(tim.length, 2, "loader không ra đủ hai người dựng sẵn")
  const mot = await motNguoi(P_SDT, q)
  assert.ok(mot, "motNguoi không ra người có sdt")
  let che = 0
  for (const vai of VAI) {
    const xem = xemNoiDungTin({ role: vai, email: `${vai}@local.test` } as never)
    for (const r of tim) {
      const h = hang(r, xem)
      for (const [k, v] of Object.entries(h)) if (k !== "partyKey") loSoGoc(v, `hàng ${vai}.${k}`)
      if (xem && r.sdtKind === "sdt" && h.sdtBam === NHAN_CHE_SDT) che++
    }
    for (const a of mot.aliases) {
      const v = hien(a.kind, a.value, [], xem)
      loSoGoc(v, `trang một người ${vai}.${a.kind}`)
      if (xem && a.kind === "sdt" && v === NHAN_CHE_SDT) che++
    }
  }
  return che
}

test("AC-7 chặn DB dùng chung: thiếu DATABASE_URL hay trỏ oneinvest → từ chối", () => {
  assert.match(chonDb(undefined) ?? "", /DB DUNG CHUNG/)
  assert.match(chonDb("postgres://oneinvest:oneinvest@localhost:5433/oneinvest") ?? "", /DB DUNG CHUNG/)
  assert.equal(chonDb("postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p4_ldb_people"), null)
})

test("AC-7 loader thật /ops/people ba vai: không ô nào mang số gốc; đối chứng luật che cũ qua cùng bộ quét", { timeout: 120_000 }, async (t) => {
  const tu = chonDb(process.env.DATABASE_URL)
  if (tu) return t.skip(tu)
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    await c.query("BEGIN")
    await c.query("SELECT pg_advisory_xact_lock(33033)")
    const { napSdtE164 } = await import(pathToFileURL(join(import.meta.dirname, "../../pipeline/lib/nap-060.mjs")).href)
    await napSdtE164(c)
    await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, 'S03'), ($2, 'S03')`, [P_SDT, P_BAM])
    await c.query(
      `INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt', $3, 'S03'), ($1, 'ten', 'Người bán thử', 'S03'),
         ($2, 'sdt_bam', 'abcdef0123456789abcdef0123456789', 'S03')`,
      [P_SDT, P_BAM, SO],
    )
    const q = { query: (s: string, v?: unknown[]) => c.query(s, v) } as never as Q
    const quyen = VAI.map((v) => `${v}=${xemNoiDungTin({ role: v, email: `${v}@local.test` } as never)}`)
    console.log(`# quyền xem theo xemNoiDungTin: ${quyen.join(" ")} (admin và ops cùng quyền xem — nói ra, không gọi là ba quyền khác)`)
    const che = await quet(q, hienBiDanh, (r, xem) => hangNguoi(r, [], xem))
    const soVaiXem = VAI.filter((v) => xemNoiDungTin({ role: v, email: `${v}@local.test` } as never)).length
    assert.equal(che, soVaiXem * 2, `ô che ${che} ≠ ${soVaiXem} vai xem được × (hàng + trang một người)`) // đối chứng dương
    // Đối chứng đỏ: luật che đời trước (sdt đọc như sdt_bam — 8 ký tự đầu) trên CÙNG hàng qua CÙNG bộ quét.
    const luatCu: Hien = (kind, value, entries, xem) => hienBiDanh(kind === "sdt" ? "sdt_bam" : kind, value, entries, xem)
    await assert.rejects(quet(q, luatCu, (r, xem) => hangNguoi({ ...r, sdtKind: "sdt_bam" }, [], xem)), /LO SO GOC TREN PEOPLE/)
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})
