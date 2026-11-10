// labels-truong-moi-route.test.tsx — hồ sơ _acceptance/truong-nhan-s03-081 E4 (AC-4): căn cứ «Danh mục CĐT» qua route ghi thật.
// Lược đồ tạm dựng bằng chính các tệp migration nhãn tới 081; danh mục S08 là dòng giả (mã ZZ9-…, không mã căn thật).
// Ma trận viết trước 9 dòng; hai bản đột biến của labels-s08.ts là chiều đỏ.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"
import { chuanHoaLuot, LABEL_FIELDS_NHOM, type RawCell, type RawLabels } from "../src/lib/labels-normalize"

const S = `tn081_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LAT = "tn081-thu"
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
const MIG = ["054_labels.sql", "072_labels_nhom.sql", "073_labels_nhom_sua.sql", "075_labels_can_cu_anh.sql", "076_labels_ghep.sql", "081_labels_truong_moi.sql"]

// Câu hợp đồng, ghim nguyên văn ở đây: không nhập hằng từ chính code đang kiểm.
const LECH = "Giá trị khác danh mục CĐT"
const KHONG_TRUONG = "Danh mục CĐT không có trường này"
const CHUA_CO_MA = "Mã căn chưa có trong danh mục CĐT"
const KHONG_DOC = "Không đọc được danh mục CĐT ở máy này"
const CHU = "Cho thuê căn 2PN, liên hệ"

async function taoS08() {
  await admin.query(`DROP TABLE IF EXISTS "${S}".stg_s08_inventory`)
  await admin.query(`CREATE TABLE "${S}".stg_s08_inventory (LIKE public.stg_s08_inventory INCLUDING DEFAULTS)`)
  // Mã trùng giữa hai dự án: khớp một dòng là đủ.
  await sc.query(
    `INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, product_code, subdivision_name, base_direction_name,
       construction_area, land_area, number_of_room, number_of_wc, state, payload, fetched_at, captured_at)
     VALUES ('s1','snap','du-an-a','ZZ9-01','Phân khu Giả','ĐÔNG NAM',70,NULL,2,2,'notSold','{}',now(),now()),
            ('s2','snap','du-an-b','ZZ9-01','Phân khu Khác','TÂY',55,NULL,1,1,'notSold','{}',now(),now())`)
}

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await dungBangPhien(admin, S)
  await admin.query(`CREATE TABLE "${S}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await sc.connect()
  for (const m of MIG) await sc.query(readFileSync(join(APP, "../db/migrations", m), "utf8"))
  for (let i = 1; i <= 9; i++) {
    await sc.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, text, posted_at) VALUES ($1, 'hcm__zalo__tn', 'Nhóm thử', $2, now())`, [`tn-${i}`, CHU])
    await sc.query(
      `INSERT INTO eval_label_items (lat, source_code, ref_id, text_hash, split, double_label, seed, stratum) VALUES ($1, 'S03', $2, $2, 'dev', false, 'thu', 'U-A')`,
      [LAT, `tn-${i}`])
  }
  await taoS08()
})

after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})

/** Lượt đủ 24 ô: mọi ô «Không suy ra được» trừ ba ô bắt buộc chọn, rồi đè các ô của dòng ma trận. */
function luot(o: Partial<Record<string, RawCell>>): RawLabels {
  const v: Record<string, RawCell> = {}
  for (const f of LABEL_FIELDS_NHOM) v[f] = { not_stated: true }
  v.listing_intent = { value: "offer", basis: "chu_bai" }
  v.kind = { value: "rent_lt", basis: "chu_bai" }
  v.multi_unit = { value: "no" }
  return { ...v, ...o } as RawLabels
}
const cdt = (value: string): RawCell => ({ value, basis: "danh_muc_cdt" })

type Dong = { ten: string; o: Partial<Record<string, RawCell>>; mong: 200 | [string, string]; bangVang?: true }
const MA_TRAN: Dong[] = [
  { ten: "mã căn có trong danh mục", o: { unit_number: cdt("ZZ9-01") }, mong: 200 },
  { ten: "hướng khớp dòng thứ nhất", o: { unit_number: cdt("ZZ9-01"), direction_faces: cdt("southeast") }, mong: 200 },
  { ten: "diện tích khớp", o: { unit_number: cdt("ZZ9-01"), area_m2: cdt("70") }, mong: 200 },
  { ten: "diện tích lệch", o: { unit_number: cdt("ZZ9-01"), area_m2: cdt("71") }, mong: ["area_m2", LECH] },
  { ten: "trường danh mục không có", o: { unit_number: cdt("ZZ9-01"), furnished: cdt("furnished") }, mong: ["furnished", KHONG_TRUONG] },
  { ten: "mã căn không có", o: { unit_number: cdt("ZZ9-99") }, mong: ["unit_number", CHUA_CO_MA] },
  { ten: "mã căn bị che", o: { unit_number: cdt("ZZ9-xx") }, mong: ["unit_number", CHUA_CO_MA] },
  { ten: "chữ thường vẫn khớp", o: { unit_number: cdt("zz9-01"), bedrooms: cdt("2") }, mong: 200 },
  { ten: "bảng danh mục vắng", o: { unit_number: cdt("ZZ9-01") }, mong: ["unit_number", KHONG_DOC], bangVang: true },
]

let soBanDot = 0
/** Bản chép labels-s08.ts đổi đúng một chỗ; import trỏ về tệp thật. */
async function banDot(tu: string, thanh: string): Promise<typeof import("../src/lib/labels-s08")> {
  const tep = "src/lib/labels-s08.ts"
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const giai = (ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return ten
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    const f = [".ts", ".tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return pathToFileURL(f ?? g).href
  }
  const f = join(APP, "tests", `.tn081-s08-${process.pid}-${++soBanDot}.ts`)
  writeFileSync(f, goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${giai(ten)}"`))
  try {
    return (await import(pathToFileURL(f).href)) as typeof import("../src/lib/labels-s08")
  } finally {
    rmSync(f, { force: true })
  }
}

test("TN081-AC-4 căn cứ Danh mục CĐT chỉ nhận giá trị có trong S08, qua route ghi thật", async () => {
  assert.equal(MA_TRAN.length, 9)
  const a = await taoNguoi(sc, "ops")
  const { POST } = await import("../src/app/api/v1/ops/labels/route")
  const dem = async (i: number) => (await sc.query(`SELECT count(*)::int AS n FROM eval_labels WHERE item_id = $1`, [i])).rows[0].n
  for (const [k, d] of MA_TRAN.entries()) {
    const item = k + 1
    if (d.bangVang) await admin.query(`DROP TABLE "${S}".stg_s08_inventory`)
    const res = await POST(new Request("http://localhost/api/v1/ops/labels", {
      method: "POST", headers: { "content-type": "application/json", cookie: a.cookie },
      body: JSON.stringify({ lat: LAT, item_id: item, values: luot(d.o) }),
    }))
    if (d.bangVang) await taoS08()
    const than = await res.text()
    if (d.mong === 200) {
      assert.equal(res.status, 200, `${d.ten}: ${than}`)
      const { rows } = await sc.query(`SELECT field, basis FROM eval_labels WHERE item_id = $1`, [item])
      assert.equal(rows.length, LABEL_FIELDS_NHOM.length, d.ten)
      const can = Object.fromEntries(rows.map((r) => [r.field, r.basis]))
      for (const f of Object.keys(d.o)) assert.equal(can[f], "danh_muc_cdt", `${d.ten}: ${f}`)
      assert.equal(can.listing_intent, "chu_bai", `${d.ten}: ô khác giữ căn cứ gửi lên`)
    } else {
      assert.equal(res.status, 400, `${d.ten}: ${than}`)
      const [o, msg] = d.mong
      assert.equal((JSON.parse(than) as { loi: Record<string, string> }).loi[o], msg, d.ten)
      assert.equal(await dem(item), 0, `${d.ten}: không ghi dòng nào`)
    }
  }

  // Chiều đỏ 1: bỏ phép so giá trị với danh mục — dòng «diện tích lệch» lọt.
  const chuan = chuanHoaLuot(luot(MA_TRAN[3].o), { text: CHU })
  assert.ok(chuan.ok)
  const khongSo = await banDot("if (!dong.some((d) => soVoiDong(r.field, r.value!, d))) loi[r.field] = MSG_CDT_LECH", "")
  assert.deepEqual(await khongSo.kiemDanhMuc(chuan.rows), {}, "CDT KHONG SO DANH MUC")
  // Chiều đỏ 2: bảng vắng thành lỗi ném (route trả 500).
  await admin.query(`DROP TABLE "${S}".stg_s08_inventory`)
  try {
    const nem = await banDot('if ((e as { code?: string }).code === "42P01") {', "if (false) {")
    await assert.rejects(nem.kiemDanhMuc(chuan.rows), "BANG VANG KHONG BAO O")
  } finally {
    await taoS08()
  }
})
