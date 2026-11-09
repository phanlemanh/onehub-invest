// Bậc tin tính bằng SQL phải trùng `levelOf` của app — thang FRAMING §3.4 viết lại 08/11 (thang-bac-moi-b0-b5, 087).
// PL16 AC-1 (E1): `offer_data_level` trên ma trận 2⁵ tổ hợp có/thiếu của năm trường lõi × định vị, cộng năm ô biên × định
// vị = 74 ô (bậc và chỗ kẹt). thang-bac AC-2 (E2): tập đơn vị `data_level_units()` trên 64 tin thật trong giao dịch — bốn
// trường lõi (loại tin NOT NULL + CHECK ở bảng bản ghi nên luôn có; mặt thiếu loại tin nằm ở ma trận hàm) × định vị × nằm
// trong cụm properties — trùng levelOf; cụm không đổi bậc ở ô nào. Mọi ca BEGIN … ROLLBACK, 087
// nạp trong giao dịch khi DB chưa áp. Chạy qua config:executors.test.tb_app_db (DB của riêng lượt); tên .itest để `npm test`
// không chạy nó khi không có DB.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"
import { levelOf, type LevelInput } from "../src/lib/data-level"

// `ky`: bậc viết trước theo luật FRAMING §3.4 (thiếu một trường lõi hoặc trường ở ô biên → B0; đủ → B1; đủ + định vị → B2),
// không suy từ levelOf — hai bản cài đặt (SQL, levelOf) cùng so với nó (lượt chấm 1, Ngoài t10).
type O = { ten: string; r: LevelInput; ky: string }
const kyVong = (thieu: boolean, located: boolean) => (thieu ? "B0" : located ? "B2" : "B1")

const SQL_087 = readFileSync(path.join(import.meta.dirname, "../../db/migrations/087_thang_bac_moi.sql"), "utf8")
const DU: Omit<LevelInput, "located"> = { kind: "sale", propertyType: "house", priceVnd: 2e9, areaM2: 60, ward: "vn-hanoi-x" }
const KHOA = ["kind", "propertyType", "priceVnd", "areaM2", "ward"] as const
const KE: Record<string, string> = { B0: "truong-loi", B1: "dinh-vi", B2: "gan-can" }

function maTran(): O[] {
  const o: O[] = []
  for (const located of [false, true]) {
    for (let m = 0; m < 32; m++) {
      const r: LevelInput = { ...DU, located }
      KHOA.forEach((k, i) => {
        if (m & (1 << i)) (r as Record<string, unknown>)[k] = null
      })
      o.push({ ten: `thiếu ${KHOA.filter((_, i) => m & (1 << i)).join("+") || "không"}${located ? " · định vị" : ""}`, r, ky: kyVong(m !== 0, located) })
    }
    const bien: [string, Partial<LevelInput>][] = [
      ["giá 0", { priceVnd: 0 }],
      ["diện tích 0", { areaM2: 0 }],
      ["loại hình unknown", { propertyType: "unknown" }],
      ["loại hình rỗng", { propertyType: "" }],
      ["loại tin rỗng", { kind: "" }],
    ]
    // Luật trường lõi của 056 (vòng này không đổi): loại hình chỉ thiếu khi NULL hoặc 'unknown' — chuỗi rỗng tính là có.
    for (const [ten, d] of bien) {
      const ky = ten === "loại hình rỗng" ? kyVong(false, located) : "B0"
      o.push({ ten: `${ten}${located ? " · định vị" : ""}`, r: { ...DU, ...d, located }, ky })
    }
  }
  return o
}

let c: pg.Client
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua config:executors.test.tb_app_db (DB của riêng lượt)")
  c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regproc('offer_data_level')::text AS f")
  if (!r.f) throw new Error("DB chưa có offer_data_level (056) — dùng DB thử chép từ máy thu")
  if (r.db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
})
after(async () => {
  await c?.end()
})

async function trongGiaoDich(fn: () => Promise<void>) {
  await c.query("BEGIN")
  try {
    await c.query("SELECT pg_advisory_xact_lock(56056)")
    const { rows: [r] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co")
    if (!r.co) await c.query(SQL_087)
    await fn()
  } finally {
    await c.query("ROLLBACK")
  }
}

/** Đối chiếu từng ô (bậc + chỗ kẹt); ô đầu tiên lệch ném lỗi mang tên ô. */
async function doiChieu(fn: string, o: O[]): Promise<number> {
  let khop = 0
  for (const { ten, r, ky } of o) {
    const { rows: [s] } = await c.query(`SELECT data_level, ke_thieu FROM ${fn}($1, $2, $3, $4, $5, $6)`,
      [r.kind, r.propertyType, r.priceVnd, r.areaM2, r.ward, r.located])
    assert.equal(levelOf(r), ky, `levelOf lệch kỳ vọng viết trước: ${ten}`)
    assert.deepEqual([s.data_level, s.ke_thieu], [ky, KE[ky]], `ô lệch: ${ten}`)
    khop++
  }
  return khop
}

test("AC-1 offer_data_level (087) khớp levelOf trên ma trận (74 ô, bậc và chỗ kẹt)", async () => {
  await trongGiaoDich(async () => {
    const o = maTran()
    assert.equal(o.length, 74, "ma trận viết trước phải đủ 74 ô")
    const khop = await doiChieu("offer_data_level", o)
    console.log(`# AC-1: ${khop}/74 ô khớp`)
    assert.equal(khop, 74)
  })
})

test("AC-1 chiều đỏ: vị từ giá viết `IS NOT NULL` lệch ở ô giá 0", async () => {
  await trongGiaoDich(async () => {
    const def = async (sig: string) =>
      (await c.query("SELECT pg_get_functiondef($1::regprocedure) AS d", [sig])).rows[0].d as string
    const loi = await def("offer_core_complete(text,text,numeric,numeric,text)")
    assert.ok(loi.includes("coalesce(p_price_vnd > 0, false)"), "bản lệch: thân offer_core_complete đã đổi — sửa ca đỏ")
    await c.query(loi.replace("public.offer_core_complete(", "pg_temp.offer_core_complete_lech(")
      .replace("coalesce(p_price_vnd > 0, false)", "p_price_vnd IS NOT NULL"))
    const bac = await def("offer_data_level(text,text,numeric,numeric,text,boolean)")
    await c.query(bac.replace("public.offer_data_level(", "pg_temp.offer_data_level_lech(")
      .replace("offer_core_complete(p_kind", "pg_temp.offer_core_complete_lech(p_kind"))
    await assert.rejects(doiChieu("pg_temp.offer_data_level_lech", maTran()), /ô lệch: giá 0/)
  })
})

// ---- thang-bac-moi-b0-b5 AC-2 (E2): 64 tin thật — bốn trường lõi × định vị × trong cụm — qua data_level_units() ----
type Tin = { ten: string; r: LevelInput; cum: boolean; id: string; ky: string }
async function dungTin(): Promise<Tin[]> {
  const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1")
  await c.query("CREATE TEMP TABLE tb2_dinh_vi (offer_id text PRIMARY KEY) ON COMMIT DROP")
  await c.query(`CREATE OR REPLACE FUNCTION offer_located(p_offer_id text) RETURNS boolean LANGUAGE sql STABLE AS
    $f$ SELECT EXISTS (SELECT 1 FROM pg_temp.tb2_dinh_vi WHERE offer_id = p_offer_id) $f$`)
  const ds: Tin[] = []
  let n = 0
  for (const cum of [false, true]) for (const located of [false, true]) for (let m = 0; m < 32; m += 2) {
    const thieu = (i: number) => Boolean(m & (1 << i))   // bit 0 (loại tin) luôn có: bảng bản ghi bắt kind ∈ {sale, rent}
    const r: LevelInput = {
      kind: "sale", propertyType: thieu(1) ? null : "house", priceVnd: thieu(2) ? null : 2e9,
      areaM2: thieu(3) ? null : 60, ward: thieu(4) ? null : w.id, located,
    }
    const id = `tb2-${process.pid}-${++n}`
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
        originating_system_key, first_seen, last_seen) VALUES ($1, $2, $3, $4, $5, $6, 'S06', $1, now(), now())`,
    [id, r.kind, r.propertyType, r.priceVnd, r.areaM2, r.ward])
    if (located) await c.query("INSERT INTO pg_temp.tb2_dinh_vi VALUES ($1)", [id])
    if (cum) {
      const { rows: [p] } = await c.query(
        "INSERT INTO properties (area_id, property_type, verification) VALUES ($1, 'house', 'pending') RETURNING id", [w.id])
      await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [p.id, id])
    }
    ds.push({ ten: `thiếu ${KHOA.filter((_, i) => thieu(i)).join("+") || "không"}${located ? " · định vị" : ""}${cum ? " · cụm" : ""}`, r, cum, id, ky: kyVong(m !== 0, located) })
  }
  return ds
}
async function doiChieuDonVi(fn: string, ds: Tin[]): Promise<number> {
  const { rows } = await c.query(`SELECT unit_key, data_level FROM ${fn}() WHERE unit_key = ANY ($1)`, [ds.map((t) => `tin:${t.id}`)])
  const bac = new Map(rows.map((x) => [x.unit_key as string, x.data_level as string]))
  let khop = 0
  for (const t of ds) {
    assert.equal(levelOf(t.r), t.ky, `levelOf lệch kỳ vọng viết trước: ${t.ten}`)
    assert.equal(bac.get(`tin:${t.id}`), t.ky, `TB-AC-2 ô lệch: ${t.ten}`)
    khop++
  }
  return khop
}
test("TB-AC-2 data_level_units ≡ levelOf trên 64 tin; nằm trong cụm không đổi bậc (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const ds = await dungTin()
    assert.equal(ds.length, 64, "ma trận viết trước phải đủ 64 ô")
    assert.equal(await doiChieuDonVi("data_level_units", ds), 64)
    // chiều đỏ: bản đột biến truyền cờ «trong cụm» vào chỗ định vị (luật 056) → tin trong cụm lên B2
    const { rows: [f] } = await c.query("SELECT pg_get_functiondef('data_level_units()'::regprocedure) AS d")
    const cu = "offer_located(o.offer_id)"
    assert.ok(f.d.includes(cu), "bản lệch: data_level_units không còn gọi offer_located — sửa ca đỏ")
    await c.query(f.d.replace("public.data_level_units(", "pg_temp.data_level_units_lech(")
      .replace(cu, `(${cu} OR EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id))`))
    await assert.rejects(doiChieuDonVi("pg_temp.data_level_units_lech", ds), /TB-AC-2 ô lệch: .* · cụm/)
    console.log("# TB-AC-2: 64/64 ô khớp; đột biến «cụm cho B2» bị bắt")
  })
})
