// do-hang-ngay-labels.test.tsx — hồ sơ _acceptance/do-hieu-qua-hang-ngay (DO1), ca «DO1-AC-2» và «DO1-RT». Nháp không dựng tay:
// rút bằng bộ ghi thật của pipeline/mau-soat-cuon-chieu.mjs trên DB thử của lượt, render biểu mẫu nhóm thật, lưu qua ghiNhan
// (hàm ghi của route POST /api/v1/ops/labels) sau chuanHoaLuot thật, rồi chấm giữ nháp bằng giuO của pipeline.
// Ca ghi thật (ghiNhan tự BEGIN/COMMIT) nên không bọc giao dịch: dữ liệu thử mang tiền tố do1rt và được xoá ở finally.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { LabelFormNhom } from "../src/components/ops/labels/label-form-nhom"
import { nhapVeO } from "../src/components/ops/labels/nhap-may"
import { LAT_CUON_CHIEU, nhapTuDraft, type NhapMay } from "../src/lib/labels-cuon-chieu"
import { chuanHoaLuot, type RawLabels } from "../src/lib/labels-normalize"
import { ghiNhan, type TinGan } from "../src/lib/labels-queries"
import { TAT_CA_O } from "../src/components/ops/labels/nhom-fields"

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const DB = process.env.DATABASE_URL
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua npm test (DB thử của lượt)" }
const NGAY = "2025-03-01"
const KHOA_GOP = "doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3"
const O_GOP = { listing_intent: { v: "offer" }, kind: { v: "sale" }, bedrooms: { v: 2 }, bathrooms: { v: 2 }, area_m2: { v: 62 },
  price_min_vnd: { v: 3400000000 }, price_max_vnd: { v: 3400000000 } }

async function dung(c: pg.Client) {
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db")
  if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
  await c.query("SELECT pg_advisory_lock(33033)")
  try { await c.query(readFileSync(join(GOC, "db/migrations/083_do_hang_ngay.sql"), "utf8")) } finally { await c.query("SELECT pg_advisory_unlock(33033)") }
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('2025-03-01__s03', 'hanoi', 'zalo-agent', '{}') ON CONFLICT DO NOTHING`)
  for (const [id, text] of [["do1rt01", "bán căn 2pn 62m2 giá 3,4 tỷ"], ["do1rt02", "bán căn hộ 62m2 giá 3,4 tỷ chính chủ"]]) {
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, posted_at, captured_at, text) VALUES ($1, '2025-03-01__s03', 'Nhóm DO1', '2025-03-01T03:00:00Z', '2025-03-01T03:00:00Z', $2)`, [id, text])
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, price_vnd, area_m2, first_seen, last_seen, post_ids, source) VALUES ($1, 'sale', 3400000000, 62, now(), now(), ARRAY[$2], 'S03')`, [`offer_${id}`, id])
  }
  const { textHash } = await import("../../pipeline/lib/eval-labels.mjs")
  await c.query(`INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind, json_ok, cost_usd, run_id, probabilities)
                 VALUES ('S03', 'do1rt01', $1, 'gateway:anthropic/claude-haiku-5.5', 'dg3-s03-v3', 'offer', 'sale', true, 0, 'r-do1rt', $2)`,
    [textHash("bán căn 2pn 62m2 giá 3,4 tỷ"), { nguon: "doc-gop", o_duoc_giao: Object.keys(O_GOP), o: O_GOP }])
  const { rutMau } = await import("../../pipeline/mau-soat-cuon-chieu.mjs")
  const kq = await rutMau(c, { ngay: NGAY, goiDocGop: async () => ({ goi: 0, cham_tran: false }), log: () => {} })
  return kq.the as { item_id: number; post_id: string; draft: unknown }[]
}
async function don(c: pg.Client) {
  await c.query("DELETE FROM eval_labels WHERE item_id IN (SELECT item_id FROM eval_label_items WHERE lat = $1 AND ref_id LIKE 'do1rt%')", [LAT_CUON_CHIEU])
  await c.query("DELETE FROM eval_label_items WHERE lat = $1 AND ref_id LIKE 'do1rt%'", [LAT_CUON_CHIEU])
  await c.query("DELETE FROM silver_labels WHERE post_id LIKE 'do1rt%'")
  await c.query("DELETE FROM sale_offer_records WHERE offer_id LIKE 'offer_do1rt%'")
  await c.query("DELETE FROM stg_zalo_posts WHERE post_id LIKE 'do1rt%'")
}

const tinCua = (itemId: number, nhap: NhapMay | null, text: string): TinGan => ({
  itemId, lat: LAT_CUON_CHIEU, doubleLabel: false, soNguoi: 0, text, anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm DO1",
  nguoiDang: null, nguoiDangId: null, postedAt: null, nhap,
})
const html = (tin: TinGan) => renderToStaticMarkup(<LabelFormNhom lat={LAT_CUON_CHIEU} tin={tin} hrefXem="/x" hrefTinKe="/y" />)
const oInput = (h: string, o: string) => new RegExp(`data-o="${o}"[\\s\\S]*?<input[^>]*value="([^"]*)"`).exec(h)?.[1] ?? null

function kiemForm(h: string, cachDoc: string) {
  if (oInput(h, "bedrooms") !== "2" || oInput(h, "area_m2") !== "62") throw new Error("KHONG DIEN NHAP")
  if (oInput(h, "bathrooms") !== "") throw new Error("DIEN O GIAO NGUOI")
  assert.ok(h.includes(`Nháp máy · ${cachDoc}`))
}

/** Giá trị biểu mẫu sẽ gửi khi người không sửa gì (như hàm luu của LabelFormNhom), bỏ qua ô còn trống. */
function giaTriGui(nhap: NhapMay, sua: Record<string, string> = {}): RawLabels {
  const { cells, donVi } = nhapVeO(nhap)
  const v: RawLabels = {}
  for (const d of TAT_CA_O) {
    const c = cells[d.id]
    if (!c) { v[d.id] = { not_stated: true }; continue }
    if (c.unknown) v[d.id] = { not_stated: true }
    else v[d.id] = { value: sua[d.id] ?? c.value, ...(d.noBasis ? {} : { basis: "kien_thuc_nghe" }), ...(d.kind === "gia" ? { unit: donVi } : {}) }
  }
  if (!v.multi_unit || "not_stated" in v.multi_unit) v.multi_unit = { value: "no" }
  return v
}

test("DO1-AC-2 màn mẫu soát điền sẵn nháp máy của cách đọc hiện, ô giao người trống, lưu không đổi draft", coDb, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  try {
    await don(c)
    const the = await dung(c)
    const coGop = the.find((t) => t.post_id === "do1rt01")!, chiLuat = the.find((t) => t.post_id === "do1rt02")!
    const nGop = nhapTuDraft(coGop.draft)!, nLuat = nhapTuDraft(chiLuat.draft)!
    assert.equal(nGop.cachDoc, KHOA_GOP)
    assert.equal(nLuat.cachDoc, "bo-doc-luat")
    kiemForm(html(tinCua(coGop.item_id, nGop, "bán căn 2pn 62m2 giá 3,4 tỷ")), KHOA_GOP)
    const hLuat = html(tinCua(chiLuat.item_id, nLuat, "bán căn hộ 62m2 giá 3,4 tỷ chính chủ"))
    assert.ok(hLuat.includes("Nháp máy · bo-doc-luat"))
    assert.equal(oInput(hLuat, "area_m2"), "62")
    // Chiều đỏ trên cùng thẻ.
    assert.throws(() => kiemForm(html(tinCua(coGop.item_id, null, "x")), KHOA_GOP), /KHONG DIEN NHAP/)
    assert.throws(() => kiemForm(html(tinCua(coGop.item_id, nhapTuDraft(coGop.draft, { dotBien: "bo-o-nguoi" }), "x")), KHOA_GOP), /DIEN O GIAO NGUOI/)
    assert.throws(() => kiemForm(html(tinCua(coGop.item_id, nhapTuDraft(coGop.draft, { dotBien: "tien-to" }), "x")), KHOA_GOP), /KHONG DIEN NHAP/)
    // Sửa phòng ngủ thành 3 rồi lưu qua bộ ghi của route.
    const chuan = chuanHoaLuot(giaTriGui(nGop, { bedrooms: "3", bathrooms: "2" }), { text: "bán căn 2pn 62m2 giá 3,4 tỷ", reason: "thử DO1" })
    assert.ok(chuan.ok, JSON.stringify(!chuan.ok && chuan.loi))
    const { rows: [truoc] } = await c.query("SELECT draft FROM eval_label_items WHERE item_id = $1", [coGop.item_id])
    const ghi = await ghiNhan(c, "do1rt-nguoi", LAT_CUON_CHIEU, coGop.item_id, chuan.ok ? chuan.rows : [], "thử DO1")
    assert.ok(ghi.ok)
    const { rows: nhan } = await c.query("SELECT field, value FROM eval_labels WHERE item_id = $1", [coGop.item_id])
    const by = Object.fromEntries(nhan.map((r) => [r.field, r.value]))
    assert.deepEqual([by.bedrooms, by.kind], ["3", "sale"])
    const kiemDraft = async () => {
      const { rows: [sau] } = await c.query("SELECT draft FROM eval_label_items WHERE item_id = $1", [coGop.item_id])
      if (JSON.stringify(sau.draft) !== JSON.stringify(truoc.draft)) throw new Error("DRAFT BI DOI")
    }
    await kiemDraft()
    await c.query("UPDATE eval_label_items SET draft = jsonb_set(draft, '{hien}', '\"x\"') WHERE item_id = $1", [coGop.item_id])
    await assert.rejects(kiemDraft, /DRAFT BI DOI/)
  } finally {
    await don(c)
    await c.end()
  }
})

test("DO1-RT rút → điền sẵn → lưu qua bộ ghi của route → đọc lại bằng bộ đọc của do-hang-ngay → giữ nháp 100%; sửa một ô thì đúng ô đó", coDb, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  try {
    await don(c)
    const the = await dung(c)
    const { docThe } = await import("../../pipeline/do-hang-ngay.mjs")
    const { giuNhap } = await import("../../pipeline/lib/do-hang-ngay.mjs")
    const luu = async (postId: string, text: string, sua: Record<string, string>) => {
      const t = the.find((x) => x.post_id === postId)!
      const chuan = chuanHoaLuot(giaTriGui(nhapTuDraft(t.draft)!, sua), { text, reason: "thử DO1" })
      assert.ok(chuan.ok, JSON.stringify(!chuan.ok && chuan.loi))
      assert.ok((await ghiNhan(c, `do1rt-${postId}`, LAT_CUON_CHIEU, t.item_id, chuan.ok ? chuan.rows : [], "thử DO1")).ok)
      return t.item_id
    }
    const idGop = await luu("do1rt01", "bán căn 2pn 62m2 giá 3,4 tỷ", {})
    const idLuat = await luu("do1rt02", "bán căn hộ 62m2 giá 3,4 tỷ chính chủ", { area_m2: "70" })
    // Đọc lại đúng như bước đo: docThe (nhãn mới nhất mỗi ô) rồi giuNhap trên nháp đã chụp.
    const doc = await docThe(c, NGAY)
    const tinh = (id: number, dotBien?: string) => {
      const t = doc.find((x: { item_id: number }) => x.item_id === id)
      const kq = giuNhap([t], NGAY, { dotBien })
      return kq.dong.filter((d: { cach_doc: string; o: string }) => d.cach_doc === t.draft.hien && !(t.draft.o_nguoi ?? []).includes(d.o))
    }
    const kiem = (dong: { o: string; tuan_nay: { n: number; giu: number } }[], sai: string[]) => {
      if (!dong.length) throw new Error("KHOA CACH DOC LECH KHUON: không ô nào của cách đọc hiện được đo")
      for (const d of dong) {
        const giu = d.tuan_nay.giu === d.tuan_nay.n
        if (giu === sai.includes(d.o)) throw new Error(`CHUAN HOA LECH: ${d.o} ${d.tuan_nay.giu}/${d.tuan_nay.n}`)
      }
    }
    kiem(tinh(idGop), [])
    assert.ok(tinh(idGop).length >= 5)
    kiem(tinh(idLuat), ["area_m2"])
    // Chiều đỏ: bỏ dung sai/chuẩn hoá ô số khiến giá «3400000000» so với nhãn lệch khuôn → báo lệch.
    await c.query("UPDATE eval_labels SET value = '3,4' WHERE item_id = $1 AND field = 'price_min_vnd'", [idGop])
    const doc2 = await docThe(c, NGAY)
    const t2 = doc2.find((x: { item_id: number }) => x.item_id === idGop)
    assert.throws(() => kiem(giuNhap([t2], NGAY).dong.filter((d: { cach_doc: string; o: string }) => d.cach_doc === t2.draft.hien && !(t2.draft.o_nguoi ?? []).includes(d.o)), []), /CHUAN HOA LECH/)
  } finally {
    await don(c)
    await c.end()
  }
})
