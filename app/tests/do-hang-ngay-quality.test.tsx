// do-hang-ngay-quality.test.tsx — hồ sơ _acceptance/do-hieu-qua-hang-ngay (DO1), ca «DO1-AC-8». Dòng do1-* sinh bằng hàm ghi
// của pipeline (rutMau + doHangNgay trên DB thử, giao dịch ROLLBACK; giuNhap của pipeline cho ca «có ý nghĩa»), đọc lại bằng
// loadDo1 của app, render khối thật. Chiều đỏ trên cùng dữ liệu, thông điệp ghim.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { DoHangNgay } from "../src/components/ops/quality/do-hang-ngay"
import { BangLat } from "../src/components/ops/quality/do-hang-ngay-bang"
import { gomDo1, loadDo1, type Do1, type LatDo } from "../src/lib/do-hang-ngay"
import { dqLatestSql } from "../src/lib/dq-checks"

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const DB = process.env.DATABASE_URL
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" }
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
const ve = (data: Do1 | null, lat: LatDo = "tong") =>
  renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER as never}><DoHangNgay data={data} lat={lat} /></AppRouterContext.Provider>)

async function dung(c: pg.Client) {
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db")
  if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
  await c.query("BEGIN")
  await c.query("SELECT pg_advisory_xact_lock(33033)")
  await c.query(readFileSync(join(GOC, "db/migrations/083_do_hang_ngay.sql"), "utf8"))
  // thang-bac-moi-b0-b5: DO1 đọc data_level_units() của 087 — DB chưa áp thì nạp trong giao dịch.
  const { rows: [m] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co")
  if (!m.co) await c.query(readFileSync(join(GOC, "db/migrations/087_thang_bac_moi.sql"), "utf8"))
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('2025-04-01__s03', 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`)
  for (let i = 0; i < 20; i++) {
    const id = `do1q${String(i).padStart(2, "0")}`
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, captured_at, text) VALUES ($1, '2025-04-01__s03', 'Nhóm DO1', '2025-04-01T03:00:00Z', '2025-04-01T03:00:00Z', $2)`, [id, `bán căn ${i} 62m2 giá 3,4 tỷ`])
    if (i < 15) await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, price_vnd, area_m2, area_id, first_seen, last_seen, post_ids, source)
      VALUES ($1, $2, 'sale', 3400000000, 62, (SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1), now(), now(), ARRAY[$2], 'S03')`, [`offer_${id}`, id])
  }
  const { rutMau } = await import("../../pipeline/mau-soat-cuon-chieu.mjs")
  const kq = await rutMau(c, { ngay: "2025-04-01", goiDocGop: async () => ({ goi: 0, cham_tran: false }), log: () => {} })
  // Soát 6/20 thẻ (dưới 70% → cảnh báo), 3 thẻ (ít mẫu).
  for (const t of kq.the.slice(0, 6)) {
    await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES ($1, 'do1q-nguoi', 'price_min_vnd', '3400000000')", [t.item_id])
    await c.query("INSERT INTO eval_labels (item_id, labeler_id, field, value) VALUES ($1, 'do1q-nguoi', 'listing_intent', 'offer')", [t.item_id])
  }
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, quote, quote_ok,
                   cost_usd, run_id, labeled_at) VALUES ('S03', 'do1q00', 'h', 'gateway:anthropic/claude-haiku-5.5', 'dtb-s03-v1', 'offer', 'sale', true,
                   'bán căn', true, 0, 'r-do1q', '2025-04-01T05:00:00Z')`)
  // Loại hình qua phát biểu + phân xử (năm cột phân loại chỉ ghi qua bộ phân xử) để tin do1q00 đủ trường lõi (B1).
  const { writeAssertions, resolveOffers } = await import("../../pipeline/lib/assert.mjs")
  await writeAssertions(c, [{ subject_key: "S03:do1q00", field: "property_type", value: "apartment", evidence_tier: "observed", method: "e1_rule", method_version: "do1-test", rule_id: "do1" }])
  await resolveOffers(c, ["offer_do1q00"])
  const { doHangNgay } = await import("../../pipeline/do-hang-ngay.mjs")
  await c.query("DELETE FROM data_level_unit")
  // Lập mốc ngày trước (ngày lập mốc giữ suốt cả ngày — do1-giu-dau-doi-thang), lượt đo đổi bậc chạy ngày sau.
  await doHangNgay(c, { ngay: "2025-03-31", write: true })
  // Đổi dữ liệu: tin đủ trường lõi mất giá → lần đo hai có một dòng tụt bậc thật (S03).
  await c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id = 'offer_do1q00'")
  await doHangNgay(c, { ngay: "2025-04-01", write: true })
  const { soSanh } = await import("../../pipeline/so-sanh-cach-doc.mjs")
  const k = "doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3"
  const ss = await soSanh(c, { cu: "bo-doc-luat:x:y".replace("bo-doc-luat:x:y", k), moi: k, ngay: "2025-04-01", goiDocGop: async () => ({ goi: 0, cham_tran: false }), log: () => {} })
  await c.query("INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)", [ss.dong.check_name, ss.dong.entity, ss.dong.status, JSON.stringify(ss.dong.detail)])
}
const BANG = ["giu-nhap", "bo-sot", "tin-hieu", "chuyen-bac", "so-cap"]
function kiemBang(h: string) {
  for (const b of BANG) if (!h.includes(`data-bang="${b}"`)) throw new Error(`THIEU BANG ${b}`)
}

test("DO1-AC-8 khối Đo hằng ngày: bảng, lập mốc, cảnh báo soát, lát có hai ô chưa gắn, trống, bảng chung không lặp do1", coDb, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  try {
    await dung(c)
    const data = await loadDo1(c)
    assert.ok(data, "có dòng do1-*")
    const h = ve(data)
    kiemBang(h)
    assert.throws(() => kiemBang(ve({ ...data, soSanh: [] })), /THIEU BANG so-cap/)
    assert.ok(h.includes("data-do1-ty-le-soat") && h.includes("6/20"), "dòng tỉ lệ soát luôn hiện")
    assert.ok(h.includes("data-do1-canh-bao-soat"), "6/20 thẻ đã soát → cảnh báo")
    assert.ok(h.includes("ít mẫu"), "n < 5 hiện «ít mẫu»")
    for (const l of ["Tổng", "Thị trường", "Phường/xã", "Khu đô thị", "Toà"]) assert.ok(h.includes(l))
    const kiemLat = (html: string) => { if (!html.includes("Không nêu chỗ")) throw new Error("THIEU CHUA GAN TREN MAN") }
    kiemLat(ve(data, "phuong"))
    const lat = data.giuNhap!.lat!.phuong
    const boChua = { ...lat, o: Object.fromEntries(Object.entries(lat.o).filter(([k]) => !k.startsWith("khong") && !k.startsWith("chua"))) }
    assert.throws(() => kiemLat(renderToStaticMarkup(<BangLat title="x" lat={boChua} areaNames={{}} />)), /THIEU CHUA GAN TREN MAN/)
    // Chuyển bậc: bảng theo nguồn có cột Đổi khoá và dòng S03 với đúng số tụt bộ ghi đã đếm.
    const tut = data.chuyenBac!.theo_nguon!.S03?.tut ?? 0
    assert.ok(tut >= 1, "tiền đề: có dòng tụt bậc S03")
    const bac = /<table[^>]*data-bang="chuyen-bac"[\s\S]*?<\/table>/.exec(h)![0]
    assert.ok(bac.includes("Đổi khoá"))
    assert.match(bac.replace(/<[^>]+>/g, "|"), new RegExp(`S03\\|+\\d+\\|+${tut}\\|`), "dòng S03 hiện đúng số tụt ở cột Tụt")
    // Lập mốc: bộ ghi trả skip ở lần đầu → khối nói «đã lập mốc», không có bảng chuyển bậc.
    const moc = ve({ ...data, chuyenBac: { status: "skip", ly_do: "lap-moc", don_vi: 12 } })
    assert.ok(moc.includes("data-do1-lap-moc") && !moc.includes('data-bang="chuyen-bac"'))
    // Bảng chung không lặp dòng do1-*.
    const kiemChung = async (sql: string) => {
      const { rows } = await c.query(sql)
      if (rows.some((r: { check_name: string }) => r.check_name.startsWith("do1-"))) throw new Error("DO1 LAP TRONG BANG CHUNG")
    }
    await kiemChung(dqLatestSql())
    await assert.rejects(kiemChung(dqLatestSql().replace(" AND check_name NOT LIKE 'do1-%'", "")), /DO1 LAP TRONG BANG CHUNG/)
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})

test("DO1-AC-8 trống, ý nghĩa từ hàm ghi, lỗi tại chỗ", async () => {
  const h = ve(gomDo1([]))
  assert.ok(h.includes("Chưa có số đo hằng ngày") && h.includes("do-hang-ngay.mjs --write"))
  const { giuNhap } = await import("../../pipeline/lib/do-hang-ngay.mjs")
  const the = (ngay: string, giu: number) => Array.from({ length: 20 }, (_, i) => ({
    ngay, nhan: { area_m2: { value: "62", not_stated: false } },
    draft: { hien: "bo-doc-luat", cach_doc: { "bo-doc-luat": { trang_thai: "co", o: { area_m2: i < giu ? "62" : "90" } } } },
  }))
  const dong = (dotBien?: string) => {
    const g = giuNhap([...the("2026-11-07", 19), ...the("2026-10-31", 5)], "2026-11-07", { dotBien })
    return gomDo1([{ check_name: "do1-giu-nhap", entity: "S03", status: "pass", checked_at: "2026-11-07", detail: JSON.stringify(g) }])
  }
  const kiemYNghia = (d: Do1 | null, ky: boolean) => { if (ve(d).includes("data-co-y-nghia") !== ky) throw new Error("Y NGHIA SAI TREN MAN") }
  kiemYNghia(dong(), true)
  const chong = () => {
    const g = giuNhap([...the("2026-11-07", 16), ...the("2026-10-31", 14)], "2026-11-07", { dotBien: "y-nghia-bo-chong" })
    return gomDo1([{ check_name: "do1-giu-nhap", entity: "S03", status: "pass", checked_at: "2026-11-07", detail: JSON.stringify(g) }])
  }
  const chongThat = () => {
    const g = giuNhap([...the("2026-11-07", 16), ...the("2026-10-31", 14)], "2026-11-07")
    return gomDo1([{ check_name: "do1-giu-nhap", entity: "S03", status: "pass", checked_at: "2026-11-07", detail: JSON.stringify(g) }])
  }
  kiemYNghia(chongThat(), false)
  assert.throws(() => kiemYNghia(chong(), false), /Y NGHIA SAI TREN MAN/)
  // Lỗi truy vấn: loadDo1 ném lên; trang bọc khối trong RegionError — render thật vùng lỗi trong jsdom: Alert + «Thử lại».
  await assert.rejects(loadDo1({ query: async () => { throw new Error("db hỏng") } }), /db hỏng/)
  const trang = readFileSync(join(GOC, "app/src/app/ops/quality/page.tsx"), "utf8")
  assert.match(trang, /<RegionError what="số đo hằng ngày">/)
  const html = await veLoi()
  assert.ok(html.includes("Không tải được số đo hằng ngày") && html.includes("Thử lại"), html.slice(0, 400))
})

/** Render vùng lỗi thật (RegionError + khối ném lỗi) trong jsdom, trả HTML. */
async function veLoi(): Promise<string> {
  const { JSDOM } = await import("jsdom")
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/ops/quality", pretendToBeVisual: true })
  const g = globalThis as Record<string, unknown>
  const cu = { window: g.window, document: g.document, navigator: g.navigator }
  Object.assign(g, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, IS_REACT_ACT_ENVIRONMENT: true })
  Object.defineProperty(g, "navigator", { value: dom.window.navigator, configurable: true })
  try {
    const React = await import("react")
    const { createRoot } = await import("react-dom/client")
    const { RegionError } = await import("../src/components/states/region-error")
    function Hong(): never { throw new Error("db hỏng") }
    const root = createRoot(dom.window.document.getElementById("root")!, { onCaughtError() {}, onUncaughtError() {} })
    await React.act(async () => root.render(
      <AppRouterContext.Provider value={ROUTER as never}><RegionError what="số đo hằng ngày"><Hong /></RegionError></AppRouterContext.Provider>))
    const out = dom.window.document.getElementById("root")!.innerHTML
    await React.act(async () => root.unmount())
    return out
  } finally {
    Object.assign(g, { window: cu.window, document: cu.document })
    Object.defineProperty(g, "navigator", { value: cu.navigator, configurable: true })
  }
}
