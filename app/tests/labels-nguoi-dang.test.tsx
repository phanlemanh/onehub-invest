// labels-nguoi-dang.test.tsx — hồ sơ _acceptance/the-gan-nhan-nguoi-dang, ca «TND-AC-n». Lược đồ tạm tnd_<pid> có bảng phiên,
// stg_zalo_posts (khuôn public), source_registry giả và migration 054, 072, 076; cột `ghep` sinh bằng ghepLat thật. Tin đọc qua
// route GET /api/v1/ops/labels thật (Cookie phiên), HTML dựng bằng LabelsView. public không được chạm. Ma trận viết trước; mỗi
// phép đo có bản đột biến đỏ trên cùng fixture.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { ghepLat } from "../../pipeline/label-ghep.mjs"
import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { RawLabels } from "../src/lib/labels-normalize"
import type { TinGan } from "../src/lib/labels-queries"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const S = `tnd_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MIG = ["054_labels.sql", "072_labels_nhom.sql", "076_labels_ghep.sql"].map((f) => join(APP, "../db/migrations", f))
const LAT = "tnd-thu"
const T0 = Date.parse("2026-11-01T08:00:00Z")
const giay = (n: number) => new Date(T0 + n * 1000).toISOString()
const CV = "CVTND"
const ID = { a: "1000000000000000001", b: "1000000000000000002", c: "1000000000000000003", e: "1000000000000000004", g: "1000000000000000005" }

/** Bản đột biến (chép sang thư mục tạm, đổi đúng một chỗ, import tương đối trỏ về src/lib thật) — chiều đỏ trên cùng fixture. */
async function banDot<T>(tep: string, tu: string, thanh: string): Promise<T> {
  const goc = readFileSync(join(APP, "src/lib", tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const dot = goc.replace(tu, thanh).replace(/from "\.\/([\w-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(APP, `src/lib/${ten}.ts`)).href}"`)
  const f = join(mkdtempSync(join(tmpdir(), "tnd-dot-")), tep)
  writeFileSync(f, dot)
  return import(pathToFileURL(f).href) as Promise<T>
}
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

/**
 * Bài giả cùng nhóm CVTND. A gửi chữ P1 lúc 0 s (tên «Anh Tuấn»), rồi ảnh P2 lúc 40 s dưới tên đã đổi «Tuấn Nhà Đất» → P2 ghép
 * về P1; P1 không có dòng trong lát. B gửi ảnh P3 lúc 20 s, sát P1 nhưng khác người → không ghép. C gửi chữ P4, tên mang tên
 * nguồn giả ZZNGUON. E gửi chữ P5 tên rỗng. P6 không tên không ID. G gửi chữ P7 tên «Cô Mai» (tên NULL ở ca riêng).
 * Dòng mẫu theo item_id: 1=P2, 2=P3, 3=P4, 4=P5, 5=P6, 6=P7.
 */
async function datLat(stratum: string | null = null) {
  await sc.query(`TRUNCATE eval_labels, eval_label_reasons, eval_label_items RESTART IDENTITY CASCADE`)
  await sc.query(`TRUNCATE stg_zalo_posts`)
  const bai: [string, string | null, string | null, number, string][] = [
    ["P1", ID.a, "Anh Tuấn", 0, "CHUGOC-TND bán căn hai phòng ngủ"],
    ["P2", ID.a, "Tuấn Nhà Đất", 40, "https://img.example.test/a.jpg"],
    ["P3", ID.b, "Chị Lan", 20, "https://img.example.test/b.jpg"],
    ["P4", ID.c, "Bác Hùng ZZNGUON", 300, "CHUGOC-TND cho thuê studio"],
    ["P5", ID.e, "", 600, "CHUGOC-TND bán đất"],
    ["P6", null, null, 900, "CHUGOC-TND bán nhà"],
    ["P7", ID.g, "Cô Mai", 1200, "CHUGOC-TND bán shophouse"],
  ]
  for (const [id, sid, ten, t, chu] of bai) {
    await sc.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at, sender_id, sender_name, conversation_id)
       VALUES ($1, $2, 'TND nhóm', $3, $4, $5, $6, $7)`,
      [`zalo-tnd-${id}`, `hanoi__zalo__tnd${id}`, chu, giay(t), sid, ten, CV])
  }
  for (const id of ["P2", "P3", "P4", "P5", "P6", "P7"]) {
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'test', false, 'thu', $4)`,
      [LAT, `zalo-tnd-${id}`, `h${id}`, stratum])
  }
  await ghepLat(sc, { lat: LAT })
  await sc.query(`TRUNCATE source_registry`)
  await sc.query(`INSERT INTO source_registry (code, real_name) VALUES ('S99', 'ZZNGUON')`)
}

const DU: RawLabels = {
  listing_intent: { value: "offer" }, kind: { value: "sale" }, property_type: { value: "apartment" },
  project: { value: "Vinhomes Ocean Park" }, building: { value: "LD2" },
  price_min_vnd: { value: "4,35", unit: "ty" }, price_max_vnd: { value: "4,35", unit: "ty" }, area_m2: { value: "64" }, bedrooms: { not_stated: true },
}

/** Đọc mọi tin của lát qua route GET thật: lấy tin kế, ghi nhãn để sang tin sau. Trả cả JSON thô để quét dấu. */
async function quaRoute(): Promise<{ tin: Map<number, TinGan>; json: string }> {
  const { GET } = await import("../src/app/api/v1/ops/labels/route")
  const { ghiNhan } = await import("../src/lib/labels-queries")
  const { chuanHoaLuot } = await import("../src/lib/labels-normalize")
  const ch = chuanHoaLuot(DU)
  assert.ok(ch.ok)
  const u = await taoNguoi(sc, "ops")
  const tin = new Map<number, TinGan>()
  let json = ""
  for (let i = 0; i < 10; i++) {
    const res = await GET(new Request(`http://localhost/api/v1/ops/labels?lat=${LAT}`, { headers: { cookie: u.cookie } }))
    assert.equal(res.status, 200, await res.clone().text())
    const raw = await res.text()
    json += raw
    const t = JSON.parse(raw).tin as TinGan | null
    if (!t) break
    tin.set(t.itemId, t)
    assert.deepEqual(await ghiNhan(sc, u.id, LAT, t.itemId, ch.rows), { ok: true })
  }
  return { tin, json }
}
const nd = (t: TinGan | undefined) => [t?.nguoiDang ?? null, t?.nguoiDangId ?? null]

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S}".source_registry (code text, real_name text, source_ids text[])`)
  await sc.connect()
  for (const f of MIG) await sc.query(readFileSync(f, "utf8"))
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

test("TND-AC-1 route trả tên và ID; dòng đầu thẻ hai màn có «Người đăng: <tên> · ID <id>» giữa nhóm và giờ đăng", async () => {
  await datLat()
  const { tin } = await quaRoute()
  const t = tin.get(6)
  assert.deepEqual(nd(t), ["Cô Mai", ID.g], "THE THIEU NGUOI DANG")
  const { LabelsView } = await import("../src/components/ops/labels/labels-view")
  const T = { tong: 6, cuaToi: 0, conChoToi: 6, trungDu: 0, trungTong: 0 }
  const nhom = { nhom: [{ unitCode: "U-A", ten: "Nhóm A", tong: 6, cuaToi: 0, conChoToi: 6, choNguoiHai: 0 }], chon: "U-A", bang: [] }
  const chin = renderToStaticMarkup(<LabelsView mode="local" lat={LAT} coGhi tienDo={T} dongThuan={[]} tin={t!} />)
  const theoNhom = renderToStaticMarkup(<LabelsView mode="local" lat={LAT} coGhi tienDo={T} dongThuan={[]} tin={t!} {...nhom} />)
  for (const [ten, html] of [["chín trường", chin], ["theo nhóm", theoNhom]] as const) {
    const iNhom = html.indexOf("TND nhóm")
    const iNguoi = html.indexOf("Người đăng: Cô Mai · ID ")
    const iGio = html.indexOf(" · đăng 2026-11-01 15:20 (GMT+7)")
    assert.ok(iNhom >= 0 && iNguoi > iNhom && iGio > iNguoi, `THE THIEU NGUOI DANG ở màn ${ten}: ${iNhom} ${iNguoi} ${iGio}`)
    assert.match(html, new RegExp(`<span class="select-all tabular-nums" data-labels-nguoi-dang-id="">${ID.g}</span>`), `ID không chọn trọn được ở màn ${ten}`)
  }
  // Chiều đỏ: bản tinKe bỏ cột người đăng thì route trả null.
  const dot = await banDot<typeof import("../src/lib/labels-queries")>("labels-queries.ts", ", p.sender_name, p.sender_id\n", "\n")
  const u = await taoNguoi(sc, "ops")
  await sc.query(`TRUNCATE eval_labels`)
  await sc.query(`DELETE FROM eval_label_items WHERE item_id <> 6`)
  assert.notDeepEqual(nd((await dot.tinKe(u.id, LAT, sc)) ?? undefined), ["Cô Mai", ID.g], "đối chứng không đỏ: THE THIEU NGUOI DANG")
})

test("TND-AC-2 thẻ ghép: tên, ID, giờ của tin chữ (ngoài lát); bài ảnh khác người không ghép; giờ in tới phút", async () => {
  await datLat()
  const { rows } = await sc.query(`SELECT item_id::int, ghep->>'chu_ref' AS chu FROM eval_label_items WHERE item_id IN (1, 2) ORDER BY item_id`)
  assert.deepEqual(rows, [{ item_id: 1, chu: "zalo-tnd-P1" }, { item_id: 2, chu: null }], "KHONG GHEP KHAC NGUOI")
  const { tin } = await quaRoute()
  // Bảng kỳ vọng viết trước: dòng 1 theo tin chữ P1 (tên cũ, giờ 0 s), dòng 2 của chính bài P3.
  const KY_VONG = { 1: ["Anh Tuấn", ID.a, giay(0)], 2: ["Chị Lan", ID.b, giay(20)] }
  const thay = (m: Map<number, TinGan>) => ({ 1: [...nd(m.get(1)), m.get(1)?.postedAt], 2: [...nd(m.get(2)), m.get(2)?.postedAt] })
  assert.deepEqual(thay(tin), KY_VONG, "NGUOI DANG KHONG THEO TIN CHU")
  const { LabelsView } = await import("../src/components/ops/labels/labels-view")
  const html = renderToStaticMarkup(<LabelsView mode="local" lat={LAT} coGhi tienDo={{ tong: 6, cuaToi: 0, conChoToi: 6, trungDu: 0, trungTong: 0 }} dongThuan={[]} tin={tin.get(1)!} />)
  assert.ok(html.includes("Người đăng: Anh Tuấn · ID ") && html.includes("đăng 2026-11-01 15:00 (GMT+7)") && !html.includes("Tuấn Nhà Đất"), "NGUOI DANG KHONG THEO TIN CHU")
  // Chiều đỏ: bản docThe lấy người đăng của chính dòng thay cho tin chữ.
  const dot = await banDot<typeof import("../src/lib/labels-cum")>("labels-cum.ts", "const cua: NguoiDangBai = g?.chu_ref ? (tinChu ?? {}) : dong", "const cua: NguoiDangBai = dong")
  const r = (await sc.query(`SELECT i.ref_id, i.ghep, p.text, p.media, p.media_files, p.snapshot_id, p.sender_name, p.sender_id, p.posted_at
    FROM eval_label_items i JOIN stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.item_id = 1`)).rows[0]
  const the = await dot.docThe(sc, 1, r, r.ghep)
  assert.notEqual(the.nguoiDang, "Anh Tuấn", "đối chứng không đỏ: NGUOI DANG KHONG THEO TIN CHU")
})

test("TND-AC-3 ma trận tên: thường, tên nguồn → mã, rỗng, NULL, không tên không ID, bảng nguồn rỗng, bảng nguồn vắng", async () => {
  await datLat()
  await sc.query(`UPDATE stg_zalo_posts SET sender_name = NULL WHERE post_id = 'zalo-tnd-P7'`)
  const { LabelsView } = await import("../src/components/ops/labels/labels-view")
  const T = { tong: 6, cuaToi: 0, conChoToi: 6, trungDu: 0, trungTong: 0 }
  const html = (t: TinGan) => renderToStaticMarkup(<LabelsView mode="local" lat={LAT} coGhi tienDo={T} dongThuan={[]} tin={t} />)
  const { tin, json } = await quaRoute()
  // Bảng kỳ vọng viết trước theo item_id.
  assert.deepEqual(nd(tin.get(2)), ["Chị Lan", ID.b])
  assert.deepEqual(nd(tin.get(3)), ["Bác Hùng S99", ID.c], "LO TEN NGUON")
  assert.ok(!json.includes("ZZNGUON"), "LO TEN NGUON")
  assert.deepEqual(nd(tin.get(4)), [null, ID.e])
  assert.match(html(tin.get(4)!), new RegExp(`Người đăng: ID <span[^>]*>${ID.e}</span>`))
  assert.deepEqual(nd(tin.get(5)), [null, null])
  assert.doesNotMatch(html(tin.get(5)!), /Người đăng/)
  assert.deepEqual(nd(tin.get(6)), [null, ID.g])
  // Bảng nguồn rỗng: bộ che đóng chặt, không hiện tên; bảng vắng: route vẫn 200.
  for (const ca of ["rỗng", "vắng"] as const) {
    await datLat()
    if (ca === "rỗng") await sc.query(`TRUNCATE source_registry`)
    else await sc.query(`ALTER TABLE source_registry RENAME TO source_registry_tam`)
    try {
      const { tin: m } = await quaRoute()
      assert.deepEqual(nd(m.get(6)), [null, ID.g], `bảng nguồn ${ca}: LO TEN KHI KHONG CHE`)
      assert.doesNotMatch(html(m.get(6)!), /Cô Mai/, `bảng nguồn ${ca}: LO TEN KHI KHONG CHE`)
    } finally {
      if (ca === "vắng") await sc.query(`ALTER TABLE source_registry_tam RENAME TO source_registry`)
    }
  }
  // Chiều đỏ: bản bỏ bộ che lộ tên nguồn; bản rơi về tên gốc khi bộ che trả null lộ tên lúc bảng rỗng.
  type Q = typeof import("../src/lib/labels-queries")
  const u = await taoNguoi(sc, "ops")
  await datLat()
  const boChe = await banDot<Q>("labels-queries.ts", "maskSourceNames(the.nguoiDang, await getSourceNameEntries())", "the.nguoiDang")
  await sc.query(`DELETE FROM eval_label_items WHERE item_id <> 3`)
  assert.equal((await boChe.tinKe(u.id, LAT, sc))?.nguoiDang, "Bác Hùng ZZNGUON", "đối chứng không đỏ: LO TEN NGUON")
  await datLat()
  await sc.query(`TRUNCATE source_registry`)
  const roiVe = await banDot<Q>("labels-queries.ts", "maskSourceNames(the.nguoiDang, await getSourceNameEntries())", "(maskSourceNames(the.nguoiDang, await getSourceNameEntries()) ?? the.nguoiDang)")
  await sc.query(`DELETE FROM eval_label_items WHERE item_id <> 6`)
  assert.equal((await roiVe.tinKe(u.id, LAT, sc))?.nguoiDang, "Cô Mai", "đối chứng không đỏ: LO TEN KHI KHONG CHE")
})

test("TND-AC-4 HTML và JSON không mang mã nhóm; có tên và ID (đối chứng dương)", async () => {
  await datLat()
  const { tin, json } = await quaRoute()
  const { LabelsView } = await import("../src/components/ops/labels/labels-view")
  const T = { tong: 6, cuaToi: 0, conChoToi: 6, trungDu: 0, trungTong: 0 }
  const html = [...tin.values()].map((t) => renderToStaticMarkup(<LabelsView mode="local" lat={LAT} coGhi tienDo={T} dongThuan={[]} tin={t} />)).join("\n")
  assert.ok(json.includes("Cô Mai") && json.includes(ID.g) && html.includes("Cô Mai") && html.includes(ID.g), "đối chứng dương: không thấy tên và ID")
  assert.ok(!json.includes(CV) && !html.includes(CV), "LO MA NHOM")
  // Chiều đỏ: bản trả mã nhóm làm ID người đăng thì phép quét bắt.
  const dot = await banDot<typeof import("../src/lib/labels-cum")>("labels-cum.ts", "nguoiDangId: cua.sender_id?.trim() || null", "nguoiDangId: CV_DOT")
  const r = (await sc.query(`SELECT i.ref_id, i.ghep, p.text, p.media, p.media_files, p.snapshot_id, p.sender_name, p.sender_id, p.posted_at, p.conversation_id
    FROM eval_label_items i JOIN stg_zalo_posts p ON p.post_id = i.ref_id WHERE i.item_id = 6`)).rows[0]
  ;(globalThis as Record<string, unknown>).CV_DOT = r.conversation_id
  const the = await dot.docThe(sc, 6, r, r.ghep)
  assert.ok(JSON.stringify(the).includes(CV), "đối chứng không đỏ: LO MA NHOM")
})
