// labels-trung-cum.test.tsx — hồ sơ _acceptance/ghi-nhan-chan-dong-trung-cum, ca «GTC-AC-n». Lược đồ tạm gtc_<pid> có bảng phiên,
// stg_zalo_posts (khuôn public) và migration 054, 072, 076; cột `ghep` sinh bằng ghepLat thật của pipeline/label-ghep.mjs, không
// viết tay. Route /api/v1/ops/labels gọi bằng Request thật. public không được chạm. Ma trận viết trước; mỗi phép đo có bản đột
// biến của labels-queries.ts đỏ trên cùng fixture.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { ghepLat } from "../../pipeline/label-ghep.mjs"
import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { LabelRow, RawLabels } from "../src/lib/labels-normalize"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const S = `gtc_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MIG = ["054_labels.sql", "072_labels_nhom.sql", "076_labels_ghep.sql"].map((f) => join(APP, "../db/migrations", f))
const LAT = "gtc-thu"
const T0 = Date.parse("2026-11-01T08:00:00Z")
const giay = (n: number) => new Date(T0 + n * 1000).toISOString()

/** Bản đột biến của labels-queries.ts (chép sang thư mục tạm, đổi đúng một chỗ) — chiều đỏ của phép đo trên cùng fixture. */
async function banDot(tu: string, thanh: string): Promise<typeof import("../src/lib/labels-queries")> {
  const goc = readFileSync(join(APP, "src/lib/labels-queries.ts"), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const dot = goc.replace(tu, thanh).replace(/from "\.\/([\w-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(APP, `src/lib/${ten}.ts`)).href}"`)
  const f = join(mkdtempSync(join(tmpdir(), "gtc-dot-")), "labels-queries.ts")
  writeFileSync(f, dot)
  return import(pathToFileURL(f).href)
}
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

/**
 * Năm bài giả cùng nhóm cv-gtc. s1 gửi chữ P1 lúc 0 s, ảnh P2 lúc 30 s, ảnh P3 lúc 60 s → một cụm về P1. s2 gửi ảnh P4 một
 * mình → bài ảnh không tin chữ. s3 gửi chữ P5 không ảnh → ghep NULL. Dòng mẫu theo item_id: 1=P5, 2=P2 (đại diện cụm),
 * 3=P3 (trùng cụm), 4=P4, 5=P1 (trùng cụm). `ghep` để NULL: ca nào cần thì chạy ghepLat thật.
 */
async function datLat(stratum: string | null = null) {
  await sc.query(`TRUNCATE eval_labels, eval_label_reasons, eval_label_items RESTART IDENTITY CASCADE`)
  await sc.query(`TRUNCATE stg_zalo_posts`)
  const bai: [string, string, number, string][] = [
    ["P1", "s1", 0, "CHUGOC-GTC bán căn hai phòng ngủ"],
    ["P2", "s1", 30, "https://img.example.test/a.jpg"],
    ["P3", "s1", 60, "https://img.example.test/b.jpg"],
    ["P4", "s2", 0, "https://img.example.test/c.jpg"],
    ["P5", "s3", 0, "CHUGOC-GTC cho thuê studio"],
  ]
  for (const [id, nguoi, t, chu] of bai) {
    await sc.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at, sender_id, conversation_id)
       VALUES ($1, $2, 'GTC nhóm', $3, $4, $5, 'cv-gtc')`,
      [`zalo-gtc-${id}`, `hanoi__zalo__gtc${id}`, chu, giay(t), nguoi])
  }
  for (const id of ["P5", "P2", "P3", "P4", "P1"]) {
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $3, 'test', false, 'thu', $4)`,
      [LAT, `zalo-gtc-${id}`, `h${id}`, stratum])
  }
}
const ghep = async (c: pg.Client = sc) => ghepLat(c, { lat: LAT })

const DU: RawLabels = {
  listing_intent: { value: "offer" },
  kind: { value: "sale" },
  property_type: { value: "apartment" },
  project: { value: "Vinhomes Ocean Park" },
  building: { value: "LD2" },
  price_min_vnd: { value: "4,35", unit: "ty" },
  price_max_vnd: { value: "4,35", unit: "ty" },
  area_m2: { value: "64" },
  bedrooms: { not_stated: true },
}
async function dong(): Promise<LabelRow[]> {
  const { chuanHoaLuot } = await import("../src/lib/labels-normalize")
  const ch = chuanHoaLuot(DU)
  assert.ok(ch.ok)
  return ch.rows
}
const soDong = async (bang: string) => (await sc.query(`SELECT count(*)::int AS n FROM ${bang}`)).rows[0].n as number
const post = (cookie: string, body: unknown) =>
  new Request("http://localhost/api/v1/ops/labels", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(body) })

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
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

test("GTC fixture: ghepLat thật cho đúng bốn loại dòng", async () => {
  await datLat()
  const kq = await ghep()
  assert.equal(kq.trung, 2)
  const { rows } = await sc.query(`SELECT item_id::int, ghep->>'chu_ref' AS chu, ghep->>'trung_voi' AS trung, ghep IS NULL AS rong FROM eval_label_items ORDER BY item_id`)
  assert.deepEqual(rows, [
    { item_id: 1, chu: null, trung: null, rong: true },
    { item_id: 2, chu: "zalo-gtc-P1", trung: null, rong: false },
    { item_id: 3, chu: "zalo-gtc-P1", trung: "zalo-gtc-P2", rong: false },
    { item_id: 4, chu: null, trung: null, rong: false },
    { item_id: 5, chu: "zalo-gtc-P1", trung: "zalo-gtc-P2", rong: false },
  ])
})

test("GTC-AC-1 dòng trùng cụm chưa gắn → route 409 TRUNG_CUM, 0 dòng; tập bị chặn = tập bị bỏ khỏi hàng", async () => {
  await datLat()
  await ghep()
  const { TRUNG_CUM } = await import("../src/lib/labels-normalize")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const a = await taoNguoi(sc, "ops")
  // Ma trận viết trước: hai dòng trùng cụm, chưa ai gắn.
  for (const id of [3, 5]) {
    const res = await POST(post(a.cookie, { lat: LAT, item_id: id, values: DU, reason: "GTC lý do" }))
    assert.equal(res.status, 409, `GHI VAO DONG TRUNG CUM: dòng ${id} trả ${res.status}`)
    assert.equal((await res.json()).error, TRUNG_CUM)
  }
  assert.equal(await soDong("eval_labels"), 0, "GHI VAO DONG TRUNG CUM")
  assert.equal(await soDong("eval_label_reasons"), 0, "GHI VAO DONG TRUNG CUM")

  // Quan hệ: tập ghiNhan trả TRUNG_CUM bằng đúng tập tinKe/tienDo/nhomCuaLat bỏ khỏi hàng.
  await sc.query(`UPDATE eval_label_items SET stratum = 'gtc-nhom'`)
  const { tinKe, tienDo, nhomCuaLat, ghiNhan } = await import("../src/lib/labels-queries")
  const rows = await dong()
  const b = await taoNguoi(sc, "ops")
  const tatCa = [1, 2, 3, 4, 5]
  const chan: number[] = []
  for (const id of tatCa) {
    const kq = await ghiNhan(sc, b.id, LAT, id, rows)
    if (!kq.ok && kq.error === TRUNG_CUM) chan.push(id)
  }
  await sc.query(`TRUNCATE eval_labels, eval_label_reasons`)
  const u = await taoNguoi(sc, "ops")
  const phat: number[] = []
  for (let tin = await tinKe(u.id, LAT, sc); tin; tin = await tinKe(u.id, LAT, sc)) {
    phat.push(tin.itemId)
    assert.deepEqual(await ghiNhan(sc, u.id, LAT, tin.itemId, rows), { ok: true })
  }
  const boKhoiHang = tatCa.filter((id) => !phat.includes(id))
  assert.ok(boKhoiHang.length > 0, "tập bỏ khỏi hàng rỗng: fixture không có dòng trùng cụm")
  assert.deepEqual(chan, boKhoiHang, "GHI VAO DONG TRUNG CUM: tập chặn khác tập bỏ khỏi hàng")
  assert.equal((await tienDo(u.id, LAT, sc)).tong, phat.length)
  assert.equal((await nhomCuaLat(u.id, LAT, sc)).reduce((n, g) => n + g.tong, 0), phat.length)

  // Chiều đỏ trên cùng fixture: bản bỏ điều kiện trung_voi cho ghi vào dòng 3.
  await datLat()
  await ghep()
  const dot = await banDot("if (tin[0].trung_voi) {", "if (false) {")
  assert.deepEqual(await dot.ghiNhan(sc, a.id, LAT, 3, rows), { ok: true }, "đối chứng không đỏ: GHI VAO DONG TRUNG CUM không bắt được bản bỏ điều kiện")
  assert.ok((await soDong("eval_labels")) > 0)
})

test("GTC-AC-2 ba loại dòng không trùng × ba trạng thái: như trước vòng", async () => {
  const { DA_GAN_CUA_TOI } = await import("../src/lib/labels-normalize")
  const rows = await dong()
  // Bảng kỳ vọng viết trước: [dòng, trạng thái] → kết quả.
  const KY_VONG: Record<string, string> = {
    "1|chua": "200", "1|khac": "409:Tin này vừa có người gắn", "1|toi": `409:${DA_GAN_CUA_TOI}`,
    "2|chua": "200", "2|khac": "409:Tin này vừa có người gắn", "2|toi": `409:${DA_GAN_CUA_TOI}`,
    "4|chua": "200", "4|khac": "409:Tin này vừa có người gắn", "4|toi": `409:${DA_GAN_CUA_TOI}`,
  }
  const doBang = async (q: typeof import("../src/lib/labels-queries")) => {
    const thay: Record<string, string> = {}
    for (const id of [1, 2, 4]) {
      await datLat()
      await ghep()
      const [a, b] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
      const kq = (k: Awaited<ReturnType<typeof q.ghiNhan>>) => (k.ok ? "200" : `${k.status}:${k.error}`)
      const dau = await q.ghiNhan(sc, a.id, LAT, id, rows)
      thay[`${id}|chua`] = kq(dau)
      if (dau.ok) assert.equal(await soDong("eval_labels"), rows.length, `dòng ${id} thiếu nhãn`)
      thay[`${id}|khac`] = kq(await q.ghiNhan(sc, b.id, LAT, id, rows))
      thay[`${id}|toi`] = kq(await q.ghiNhan(sc, a.id, LAT, id, rows))
    }
    return thay
  }
  assert.deepEqual(await doBang(await import("../src/lib/labels-queries")), KY_VONG, "CHAN NHAM DONG KHONG TRUNG")
  // Chiều đỏ: bản coi mọi ghep khác NULL là trùng cụm chặn đại diện cụm và bài ảnh không chữ.
  const dot = await banDot("ghep->>'trung_voi' AS trung_voi", "ghep::text AS trung_voi")
  assert.notDeepEqual(await doBang(dot), KY_VONG, "đối chứng không đỏ: CHAN NHAM DONG KHONG TRUNG không bắt được bản chặn mọi ghep")
})

test("GTC-AC-3 đã gắn trước khi thành trùng cụm: gửi lại → DA_GAN_CUA_TOI, người khác → TRUNG_CUM, nhãn cũ nguyên", async () => {
  const { DA_GAN_CUA_TOI, TRUNG_CUM } = await import("../src/lib/labels-normalize")
  const rows = await dong()
  const chay = async (q: typeof import("../src/lib/labels-queries")) => {
    await datLat()
    const [a, b] = [await taoNguoi(sc, "ops"), await taoNguoi(sc, "ops")]
    assert.deepEqual(await q.ghiNhan(sc, a.id, LAT, 3, rows), { ok: true })
    const truoc = (await sc.query(`SELECT field, value, not_stated FROM eval_labels WHERE item_id = 3 ORDER BY field`)).rows
    await ghep() // lệnh ghép chạy sau khi đã gắn: dòng 3 thành trùng cụm
    assert.ok((await sc.query(`SELECT ghep->>'trung_voi' AS t FROM eval_label_items WHERE item_id = 3`)).rows[0].t)
    const lai = await q.ghiNhan(sc, a.id, LAT, 3, rows)
    const khac = await q.ghiNhan(sc, b.id, LAT, 3, rows)
    const sau = (await sc.query(`SELECT field, value, not_stated FROM eval_labels WHERE item_id = 3 ORDER BY field`)).rows
    assert.deepEqual(sau, truoc, "nhãn cũ trên dòng trùng cụm bị đổi")
    return [lai.ok ? "200" : lai.error, khac.ok ? "200" : khac.error]
  }
  assert.deepEqual(await chay(await import("../src/lib/labels-queries")), [DA_GAN_CUA_TOI, TRUNG_CUM], "LUOT GUI LAI KHONG CON LA DA LUU")
  const dot = await banDot("if (da[0].cua_toi) {", "if (da[0].cua_toi && !tin[0].trung_voi) {")
  assert.deepEqual(await chay(dot), [TRUNG_CUM, TRUNG_CUM], "đối chứng không đỏ: LUOT GUI LAI KHONG CON LA DA LUU không bắt được bản xét trùng cụm trước")
})

test("GTC-AC-4 lệnh ghép giữ khoá: lượt ghi chờ, ghép commit xong thì 409 TRUNG_CUM, 0 dòng", async () => {
  const { TRUNG_CUM } = await import("../src/lib/labels-normalize")
  const rows = await dong()
  const chay = async (q: typeof import("../src/lib/labels-queries")) => {
    await datLat()
    const a = await taoNguoi(sc, "ops")
    const c1 = new pg.Client({ connectionString: schemaUrl(S) })
    const c2 = new pg.Client({ connectionString: schemaUrl(S) })
    await c1.connect()
    await c2.connect()
    try {
      await c1.query("BEGIN")
      await ghep(c1) // ghi trung_voi, giữ khoá dòng tới COMMIT
      let xong = false
      const ghi = q.ghiNhan(c2, a.id, LAT, 3, rows).finally(() => { xong = true })
      await new Promise((r) => setTimeout(r, 300))
      const choKhoa = !xong
      await c1.query("COMMIT")
      const kq = await ghi
      return { choKhoa, kq: kq.ok ? "200" : kq.error, n: await soDong("eval_labels") }
    } finally {
      await c1.query("ROLLBACK").catch(() => {})
      await c1.end()
      await c2.end()
    }
  }
  assert.deepEqual(await chay(await import("../src/lib/labels-queries")), { choKhoa: true, kq: TRUNG_CUM, n: 0 }, "GHI LOT SAU KHI GHEP COMMIT")
  // Chiều đỏ: bản đọc trung_voi bằng câu con không khoá (ảnh chụp đầu câu) để lọt lượt ghi sau khi ghép commit.
  const dot = await banDot("ghep->>'trung_voi' AS trung_voi", "(SELECT x.ghep->>'trung_voi' FROM eval_label_items x WHERE x.item_id = $1) AS trung_voi")
  const d = await chay(dot)
  assert.notEqual(d.kq, TRUNG_CUM, "đối chứng không đỏ: GHI LOT SAU KHI GHEP COMMIT không bắt được bản đọc không khoá")
  assert.equal(d.n, rows.length)
})

test("GTC-AC-5 guiNhan trên phản hồi thật của route: TRUNG_CUM → «đã có người», báo rồi chuyển tin kế", async () => {
  await datLat()
  await ghep()
  const { TRUNG_CUM, DA_GAN_CUA_TOI } = await import("../src/lib/labels-normalize")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const luu = await import("../src/components/ops/labels/luu-nhan")
  const a = await taoNguoi(sc, "ops")
  const qua = (doi?: (b: { error?: string }) => { error?: string }) =>
    (async (_u: unknown, init?: RequestInit) => {
      const res = await POST(post(a.cookie, JSON.parse(String(init?.body))))
      if (!doi) return res
      return new Response(JSON.stringify(doi(await res.json())), { status: res.status, headers: { "content-type": "application/json" } })
    }) as typeof fetch
  const body = { lat: LAT, item_id: 3, values: DU }
  const kq = await luu.guiNhan(qua(), body)
  assert.deepEqual(kq, { kind: "da-co-nguoi", error: TRUNG_CUM }, "MAN COI TRUNG CUM LA DA LUU")
  assert.equal(luu.cauTinKe(TRUNG_CUM), `${TRUNG_CUM} — chuyển tin kế`)
  // Chiều đỏ: cùng phản hồi nhưng câu là DA_GAN_CUA_TOI thì màn coi là đã lưu — phép so phân biệt được hai kết cục.
  const dot = await luu.guiNhan(qua(() => ({ error: DA_GAN_CUA_TOI })), body)
  assert.notDeepEqual(dot, kq, "đối chứng không đỏ: MAN COI TRUNG CUM LA DA LUU")
  assert.equal(dot.kind, "da-luu")
})
