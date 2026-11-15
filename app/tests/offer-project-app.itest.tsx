// offer-project-app.itest.tsx — hồ sơ du-an-cua-tin-len-dinh-vi (DV7) E11 · AC-11: bên đọc «định vị» của app đọc cùng nguồn
// offer_project với ô Định vị và bậc B2 — câu bản ghi của trang Dòng chảy (máy thu / lược đồ chưa có view) và câu đếm độc
// lập của bac-roundtrip. Chạy trên DB của riêng lượt (config:executors.test.dv7_app); mỗi ca áp 105 trong giao dịch rồi ROLLBACK.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"

import { sqlDem } from "../scripts/bac-dem-sql"
import { getDataFlow, type FlowRecord } from "../src/lib/data-flow-queries"
import { levelOf } from "../src/lib/data-level"

const GOC = join(import.meta.dirname, "../..")
const SQL_105 = readFileSync(join(GOC, "db/migrations/105_offer_project.sql"), "utf8")

let c: pg.Client
before(async () => {
  if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("offer-project-app.itest: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*")
  }
  c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
})
after(async () => { await c?.end() })

async function trongGiaoDich(fn: () => Promise<void>) {
  await c.query("BEGIN")
  try { await fn() } finally { await c.query("ROLLBACK") }
}

/** Ba tin S03 đủ lõi: một dự án · hai dự án (xung đột) · không dự án; trả mã tin. */
async function fixture() {
  await c.query(SQL_105)
  const T = `dv7app-${process.pid}`
  const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1")
  const nut = async (s: string) => Number((await c.query(
    "INSERT INTO asset_nodes (node_type, name, slug) VALUES ('project', $1, $1) RETURNING id", [`${T}-${s}`])).rows[0].id)
  const A = await nut("a"), B = await nut("b")
  const tin = async (s: string, bai: string[]) => {
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source, post_ids,
        first_seen, last_seen) VALUES ($1, 'sale', 'apartment', 2e9, 60, $2, 'S03', $3, now(), now())`, [`${T}-${s}`, w.id, bai])
    return `${T}-${s}`
  }
  const pb = (bai: string, n: number) => c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method,
      rule_id, observed_at) VALUES ($1, 'project_node_id', $2, 'inferred', 'e1_rule', 'du-an-nhom-mot-du-an', now())`, [`S03:${bai}`, String(n)])
  const mot = await tin("mot", [`${T}-b1`]); await pb(`${T}-b1`, A)
  const xd = await tin("xd", [`${T}-b2`, `${T}-b3`]); await pb(`${T}-b2`, A); await pb(`${T}-b3`, B)
  const khong = await tin("khong", [`${T}-b4`])
  return { T, mot, xd, khong }
}
const q = (text: string, values?: unknown[]) => c.query(text, values as unknown[])
const banGhi = async (T: string, query = q): Promise<FlowRecord[]> =>
  (await getDataFlow("7d", { query, mode: "local" })).records.filter((r) => r.offerId.startsWith(T))

test("DV7-AC-11a câu bản ghi máy thu đánh located đúng tin mot_du_an; lược đồ không view vẫn chạy", async () => {
  await trongGiaoDich(async () => {
    const { T, mot, xd, khong } = await fixture()
    const recs = await banGhi(T)
    const lv = new Map(recs.map((r) => [r.offerId, { located: r.located, level: r.identification.level, bac: levelOf(r) }]))
    assert.deepEqual(lv.get(mot), { located: true, level: "located", bac: "B2" }, "DV7-AC-11a: tin một dự án")
    assert.deepEqual(lv.get(xd), { located: false, level: "none", bac: "B1" }, "DV7-AC-11a: tin xung đột")
    assert.deepEqual(lv.get(khong), { located: false, level: "none", bac: "B1" }, "DV7-AC-11a: tin không dự án")
    assert.deepEqual(recs.filter((r) => levelOf(r) === "B2").map((r) => r.offerId), [mot], "DV7-AC-11a: lọc B2")

    // Đối chứng đỏ: bản sao câu bỏ nhánh offer_project → tin một dự án không còn located.
    const qPha = (text: string, values?: unknown[]) =>
      c.query(text.replace(/WHEN EXISTS \(SELECT 1 FROM offer_project[^\n]*'located'/, ""), values as unknown[])
    const pha = (await banGhi(T, qPha)).find((r) => r.offerId === mot)
    assert.equal(pha?.located, false, "ban-ghi-located: bản phá vẫn located — ca không phân biệt được")

    // Lược đồ không có view (như cloud, hay máy thu trước lời áp): câu bản ghi chạy, không tin nào located.
    await c.query("DROP VIEW offer_project CASCADE")
    const cu = await banGhi(T)
    assert.equal(cu.length, 3, "DV7-AC-11a: thiếu view thì câu bản ghi lỗi hay mất tin")
    assert.deepEqual(cu.filter((r) => r.located), [], "DV7-AC-11a: thiếu view mà vẫn có tin located")
  })
})

test("DV7-AC-11b câu đếm độc lập của bac-roundtrip khớp data_level_units", async () => {
  await trongGiaoDich(async () => {
    const { T, mot, xd, khong } = await fixture()
    // Câu đếm gom theo (thị trường, loại hình, đơn vị, bậc) — so trên chính ba tin fixture bằng cách lọc sale_offers.
    const loc = (coView: boolean) => c.query(
      `WITH sale_offers AS (SELECT * FROM public.sale_offers WHERE offer_id LIKE $1), ${sqlDem(coView).trim().replace(/^WITH /, "")}`,
      [`${T}-%`])
    const dem = (await loc(true)).rows
    const b2Dem = dem.filter((r) => r.data_level === "B2").reduce((n, r) => n + Number(r.n), 0)
    const b1Dem = dem.filter((r) => r.data_level === "B1").reduce((n, r) => n + Number(r.n), 0)
    const bac = new Map((await c.query(`SELECT unit_key, data_level FROM data_level_units() WHERE unit_key = ANY ($1)`,
      [[mot, xd, khong].map((i) => `tin:${i}`)])).rows.map((r) => [r.unit_key.slice(4), r.data_level]))
    assert.deepEqual([bac.get(mot), bac.get(xd), bac.get(khong)], ["B2", "B1", "B1"], "DV7-AC-11b: data_level_units")
    assert.deepEqual([b2Dem, b1Dem], [1, 2], "DV7-AC-11b: câu đếm độc lập lệch data_level_units")
    // DB chưa áp 105: câu đếm không đọc view, không tin nào B2.
    const cu = (await loc(false)).rows
    assert.equal(cu.filter((r) => r.data_level === "B2").length, 0, "DV7-AC-11b: câu không view vẫn ra B2")
  })
})
