#!/usr/bin/env node
// da3-do/do.mjs — đo nền DA3 bang-noi-ma-du-an (CHỈ ĐỌC). Không ghi DB, không sửa kho.
//   node do.mjs [> ket-qua.json]   — in JSON kết quả ra stdout; bang-phu.md dựng từ JSON này.
import { createRequire } from "node:module";
const W = new URL("../../../../", import.meta.url).pathname.replace(/\/$/, "");
const require = createRequire(`${W}/app/package.json`);
const pg = require("pg");
const { chuanTen, chuanKhop } = await import(`${W}/pipeline/lib/noi-du-an-s06-lop.mjs`);

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  options: "-c default_transaction_read_only=on",
});
await c.connect();
const q = async (s, p) => (await c.query(s, p)).rows;
const ro = (await q("show default_transaction_read_only"))[0].default_transaction_read_only;
if (ro !== "on") throw new Error("phiên không ở chế độ chỉ đọc");

// ---------- Vùng ----------
const markets = await q("SELECT id, name, admin_code FROM areas WHERE region_type='market'");
const subs = await q("SELECT id, name, parent_id, admin_code, geom IS NOT NULL AS co_hinh FROM areas WHERE region_type='submarket'");
const subById = new Map(subs.map((s) => [s.id, s]));
const subByCode = new Map(subs.filter((s) => s.admin_code).map((s) => [s.admin_code, s]));
const mktByCode = new Map(markets.map((m) => [m.admin_code, m.id]));
const boTienTo = (s) => String(s ?? "").replace(/\(c[uũ]\)/giu, "").replace(/^\s*(thành phố|tỉnh|tp\.?|t\.)\s*/iu, "").replace(/[.\s]+$/u, "").trim();
const mktByName = new Map(markets.map((m) => [chuanTen(boTienTo(m.name)), m.id]));
// Bảng tỉnh cũ → mới (sáp nhập 2025) — TỰ GHI ở script này, không lấy từ kho; chỉ dùng cho bản ghi có tên tỉnh cũ.
const CU_MOI = {
  "ha giang": "vn-tuyen-quang", "yen bai": "vn-lao-cai", "bac kan": "vn-thai-nguyen", "vinh phuc": "vn-phu-tho", "hoa binh": "vn-phu-tho",
  "bac giang": "vn-bac-ninh", "thai binh": "vn-hung-yen", "hai duong": "vn-hai-phong", "ha nam": "vn-ninh-binh", "nam dinh": "vn-ninh-binh",
  "quang binh": "vn-quang-tri", "quang nam": "vn-da-nang", "kon tum": "vn-quang-ngai", "binh dinh": "vn-gia-lai", "ninh thuan": "vn-khanh-hoa",
  "dak nong": "vn-lam-dong", "binh thuan": "vn-lam-dong", "phu yen": "vn-dak-lak", "binh duong": "vn-hcmc", "ba ria vung tau": "vn-hcmc",
  "vung tau": "vn-hcmc", "binh phuoc": "vn-dong-nai", "long an": "vn-tay-ninh", "soc trang": "vn-can-tho", "hau giang": "vn-can-tho",
  "ben tre": "vn-vinh-long", "tra vinh": "vn-vinh-long", "tien giang": "vn-dong-thap", "bac lieu": "vn-ca-mau", "kien giang": "vn-an-giang",
  "ho chi minh": "vn-hcmc", "tp ho chi minh": "vn-hcmc", "sai gon": "vn-hcmc", "thua thien hue": "vn-hue", "hn": "vn-hanoi", "hcm": "vn-hcmc", "tphcm": "vn-hcmc", "tp hcm": "vn-hcmc",
};
function tinhTuTen(s) {
  const k = chuanTen(boTienTo(s));
  if (!k) return { id: null };
  if (mktByName.has(k)) return { id: mktByName.get(k), cu: false };
  if (CU_MOI[k]) return { id: CU_MOI[k], cu: true };
  return { id: null };
}
// Xã theo tên trong một tỉnh (tên mới, sau sáp nhập): bỏ tiền tố Phường/Xã/Đặc khu/P./X.
const boTienToXa = (s) => String(s ?? "").replace(/^\s*(phường|xã|đặc khu|thị trấn|p\.|x\.|tt\.)\s*/iu, "").trim();
const subByTinhTen = new Map();
for (const s of subs) {
  const k = `${s.parent_id}|${chuanTen(s.name)}`;
  subByTinhTen.set(k, subByTinhTen.has(k) ? "NHIEU" : s.id);
}
const xaTuTen = (tinh, ten) => {
  if (!tinh || !ten) return null;
  const v = subByTinhTen.get(`${tinh}|${chuanTen(boTienToXa(ten))}`);
  return v && v !== "NHIEU" ? v : null;
};
// Mã tỉnh cũ → mới từ area_aliases (dữ liệu kho).
const tinhCuMoi = new Map((await q("SELECT DISTINCT old_province_code o, province_code n FROM area_aliases")).map((r) => [r.o, r.n]));
// Phường cũ (tên + quận cũ + mã tỉnh cũ) → phường mới qua area_aliases (chỉ khi một đích).
const aa = await q("SELECT name, old_district, old_province_code, targets FROM area_aliases");
const phuongCu = new Map();
for (const r of aa) {
  const k = `${r.old_province_code}|${chuanTen(String(r.old_district).replace(/^(quận|huyện|thị xã|thành phố)\s*/iu, ""))}|${chuanTen(r.name)}`;
  phuongCu.set(k, phuongCu.has(k) ? null : r.targets);
}

// ---------- Bản ghi nguồn ----------
// Hàm SQL dùng chung: tỉnh, xã phủ điểm (cách DA55 SQL_DU_AN: ST_Covers trên areas có hình).
const PHU = (lng, lat) => `
  (SELECT a.id FROM areas a WHERE ${lng} IS NOT NULL AND a.region_type='market' AND a.geom IS NOT NULL
     AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float),4326)) ORDER BY a.id LIMIT 1) AS tinh_diem,
  (SELECT a.id FROM areas a WHERE ${lng} IS NOT NULL AND a.region_type<>'market' AND a.geom IS NOT NULL
     AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float),4326)) ORDER BY a.id LIMIT 1) AS xa_diem`;

const S07 = await q(`
  WITH cd AS (SELECT DISTINCT ON (pj_id) * FROM stg_s07_project_card ORDER BY pj_id, captured_at DESC),
       dt AS (SELECT DISTINCT ON (pj_id) * FROM stg_s07_project ORDER BY pj_id, captured_at DESC)
  SELECT coalesce(dt.pj_id, cd.pj_id)::text ma, coalesce(dt.project_name, cd.project_name) ten,
         coalesce(dt.unparsed_address, cd.unparsed_address) dia_chi, coalesce(dt.builder_name_raw, cd.builder_name_raw) cdt,
         coalesce(dt.project_type_slug, cd.project_type_slug) loai, dt.child_pj_ids, dt.pj_id IS NOT NULL co_chi_tiet,
         dt.longitude lng, dt.latitude lat, dt.breadcrumb, coalesce(dt.captured_at, cd.captured_at) luc,
         ${PHU("dt.longitude", "dt.latitude")}
    FROM cd FULL JOIN dt ON dt.pj_id = cd.pj_id`);
const S08 = await q(`
  WITH p AS (SELECT DISTINCT ON (project_id) * FROM stg_s08_project ORDER BY project_id, fetched_at DESC NULLS LAST)
  SELECT project_id ma, coalesce(project_name, catalog_payload->>'project_name') ten, project_address dia_chi,
         coalesce(investor, catalog_payload->>'investor') cdt, project_type loai, point_lng::float lng, point_lat::float lat, fetched_at luc,
         ${PHU("point_lng", "point_lat")} FROM p`);
const S09 = await q(`
  WITH d AS (SELECT DISTINCT ON (project_id) project_id, data, fetched_at FROM v_s09_du_an_moi ORDER BY project_id, fetched_at DESC)
  SELECT project_id ma, data->>'name' ten, data->>'address' dia_chi, data->>'developer_name' cdt, data->>'insight_type' loai,
         data->>'province' tinh_ten, data->>'province_code' tinh_ma, data->>'district' quan, data->>'ward' phuong,
         (data->>'long_cdnt')::float lng, (data->>'lat_cdnt')::float lat, fetched_at luc,
         ${PHU("(data->>'long_cdnt')", "(data->>'lat_cdnt')")} FROM d`);
const S10 = await q(`
  SELECT DISTINCT ON (project_id) project_id ma, project_label ten, du_an cha_ten, phan_khu, captured_at luc
    FROM stg_s10_project ORDER BY project_id, captured_at DESC`);
const S16 = await q(`
  WITH pg AS (SELECT DISTINCT ON (payload->'html'->>'slug') payload->'html'->>'slug' slug, payload->'html'->'project' p, fetched_at
                FROM stg_s16_item WHERE kind='du-an' AND jsonb_typeof(payload->'html'->'project')='object'
               ORDER BY payload->'html'->>'slug', fetched_at DESC),
       kh AS (SELECT du_an slug, max(du_an_ten) ten FROM stg_s16_khu GROUP BY 1),
       u AS (SELECT coalesce(pg.slug, kh.slug) slug, pg.p, kh.ten kten, pg.fetched_at, pg.slug IS NOT NULL co_trang, kh.slug IS NOT NULL co_khu
               FROM pg FULL JOIN kh ON kh.slug = pg.slug)
  SELECT slug ma, coalesce(p->>'name', kten) ten, p->'address'->>'full' dia_chi, p->'address'->>'city' tinh_ten, p->'address'->>'ward' phuong,
         p->'address'->>'district' quan, (p->'address'->'geolocation'->>'lon')::float lng, (p->'address'->'geolocation'->>'lat')::float lat,
         co_trang, co_khu, fetched_at luc, ${PHU("(p->'address'->'geolocation'->>'lon')", "(p->'address'->'geolocation'->>'lat')")} FROM u`);

// Chuẩn về khuôn chung §1.1.
const R = [];
const tachDiaChi = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
for (const r of S07) {
  const seg = tachDiaChi(r.dia_chi);
  const tt = tinhTuTen(seg.at(-1));
  const tinhTen = tt.id;
  const xaSeg = seg.find((x) => /^(phường|xã|đặc khu)\s/iu.test(x));
  R.push({ src: "S07", ma: r.ma, ten: r.ten, dia_chi: r.dia_chi, cdt: r.cdt, mst: null, loai: r.loai,
    cha: (r.child_pj_ids ?? []).length ? "co-con" : null, lng: r.lng, lat: r.lat, tinh_diem: r.tinh_diem, xa_diem: r.xa_diem,
    tinh_ten: tinhTen, tinh_cu: !!tt.cu, xa_ten: xaTuTen(r.tinh_diem ?? tinhTen, xaSeg), co_chi_tiet: r.co_chi_tiet, luc: r.luc });
}
const tenGocS08 = (t) => String(t ?? "").trim().replace(/(?:_|\s)TT$/i, "").replace(/^TMDV\s+/i, "").trim();
const HAU_TO_KHU = /\((?:OCP|OP|GP|VOP|VGP)\s*\d*\)|\bOCP\s?\d\b/i;
for (const r of S08) {
  const seg = tachDiaChi(r.dia_chi);
  const tt = tinhTuTen(seg.at(-1));
  const xaSeg = seg.map((x) => x.match(/(?:phường|xã|đặc khu)\s+(.+)$/iu)?.[1]).find(Boolean);
  R.push({ src: "S08", ma: r.ma, ten: r.ten, ten_khop: tenGocS08(r.ten), dia_chi: r.dia_chi, cdt: r.cdt, mst: null, loai: r.loai,
    cha: HAU_TO_KHU.test(r.ten ?? "") ? "hau-to-khu" : null, lng: r.lng, lat: r.lat, tinh_diem: r.tinh_diem, xa_diem: r.xa_diem,
    tinh_ten: tt.id, tinh_cu: !!tt.cu, xa_ten: xaTuTen(r.tinh_diem ?? tt.id, xaSeg), luc: r.luc });
}
for (const r of S09) {
  const moi = tinhCuMoi.get(r.tinh_ma);
  const tinhMa = moi ? mktByCode.get(moi) : null;
  const k = `${r.tinh_ma}|${chuanTen(String(r.quan ?? "").replace(/^(q\.|h\.|tx\.|tp\.)\s*/iu, ""))}|${chuanTen(boTienToXa(r.phuong))}`;
  const tg = phuongCu.get(k);
  const xaMa = tg && tg.length === 1 ? subByCode.get(tg[0])?.id ?? null : null;
  R.push({ src: "S09", ma: r.ma, ten: r.ten, dia_chi: r.dia_chi, cdt: r.cdt, mst: null, loai: r.loai, cha: null,
    lng: r.lng, lat: r.lat, tinh_diem: r.tinh_diem, xa_diem: r.xa_diem, tinh_ten: tinhMa ?? tinhTuTen(r.tinh_ten).id, tinh_cu: false,
    xa_ten: xaMa, xa_ten_nhieu_dich: !!(tg && tg.length > 1), luc: r.luc });
}
for (const r of S10) R.push({ src: "S10", ma: r.ma, ten: r.ten, dia_chi: null, cdt: null, mst: null, loai: null, cha: r.cha_ten,
  lng: null, lat: null, tinh_diem: null, xa_diem: null, tinh_ten: null, xa_ten: null, luc: r.luc });
for (const r of S16) {
  const tt = tinhTuTen(r.tinh_ten);
  const tinh = r.tinh_diem ?? tt.id;
  R.push({ src: "S16", ma: r.ma, ten: r.ten, dia_chi: r.dia_chi, cdt: null, mst: null, loai: null, cha: null,
    lng: r.lng, lat: r.lat, tinh_diem: r.tinh_diem, xa_diem: r.xa_diem, tinh_ten: tt.id, tinh_cu: !!tt.cu,
    xa_ten: xaTuTen(tinh, r.phuong), co_trang: r.co_trang, co_khu: r.co_khu, luc: r.luc });
}
for (const r of R) {
  r.tinh = r.tinh_diem ?? r.tinh_ten ?? null; // điểm trước (cách DA55), rồi tên
  r.xa = r.xa_diem ?? r.xa_ten ?? null;
  r.tinh_lech = !!(r.tinh_diem && r.tinh_ten && r.tinh_diem !== r.tinh_ten);
  if (r.xa && subById.get(r.xa)?.parent_id !== r.tinh) r.xa_lech_tinh = true;
}

// ---------- Phủ trường + rỗng giả ----------
const RONG = ["", "dang cap nhat", "chua cap nhat", "", "-", "0", "n a", "na", "lien he", "khac", "null", "updating", "khong co", "chua co", "other"];
const RONG_SET = new Set(RONG);
const laRong = (v) => v == null || RONG_SET.has(chuanTen(v));
const NGUON = ["S07", "S08", "S09", "S10", "S16"];
const phu = {}, rongGia = {}, topCdt = {}, topTen = {};
for (const s of NGUON) {
  const ds = R.filter((r) => r.src === s);
  const dem = (f) => ds.filter(f).length;
  phu[s] = {
    ban_ghi: ds.length,
    ten: dem((r) => !laRong(r.ten)),
    tinh_co_san_ten: dem((r) => r.tinh_ten), tinh_ten_cu: dem((r) => r.tinh_cu),
    tinh_tu_diem: dem((r) => r.tinh_diem), tinh_cuoi: dem((r) => r.tinh), tinh_diem_lech_ten: dem((r) => r.tinh_lech),
    xa_tu_ten: dem((r) => r.xa_ten), xa_tu_diem: dem((r) => r.xa_diem), xa_cuoi: dem((r) => r.xa),
    diem: dem((r) => r.lng != null && r.lat != null), dia_chi: dem((r) => !laRong(r.dia_chi)),
    cdt: dem((r) => !laRong(r.cdt)), mst: dem((r) => r.mst), loai: dem((r) => !laRong(r.loai)), cha: dem((r) => r.cha),
    luc_min: ds.reduce((a, r) => (!a || (r.luc && r.luc < a) ? r.luc : a), null), luc_max: ds.reduce((a, r) => (!a || (r.luc && r.luc > a) ? r.luc : a), null),
  };
  rongGia[s] = {};
  for (const f of ["ten", "dia_chi", "cdt", "loai"]) {
    const m = {};
    for (const r of ds) { const v = r[f]; if (v != null && RONG_SET.has(chuanTen(v))) m[String(v)] = (m[String(v)] ?? 0) + 1; }
    rongGia[s][f] = m;
  }
  const top = (f) => Object.entries(ds.reduce((m, r) => { if (r[f] != null) m[r[f]] = (m[r[f]] ?? 0) + 1; return m; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 8);
  topCdt[s] = top("cdt");
  topTen[s] = Object.entries(ds.reduce((m, r) => { const k = chuanKhop(r.ten); m[k] = (m[k] ?? 0) + 1; return m; }, {}))
    .filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

// ---------- Nút ----------
const nut = await q(`
  SELECT n.id::int id, n.name, n.slug, n.aliases, n.area_ids, n.catalog_tier, n.meta, a.region_type rt,
         CASE WHEN a.region_type='market' THEN a.id ELSE a.parent_id END tinh
    FROM asset_nodes n LEFT JOIN areas a ON a.id = n.area_ids[1] WHERE n.node_type='project'`);
for (const n of nut) {
  n.xa = new Set((n.area_ids ?? []).filter((x) => subById.has(x)));
  n.khoa = new Set([n.name, ...(n.aliases ?? [])].map(chuanKhop).filter(Boolean));
  n.khoaT = new Set([n.name, ...(n.aliases ?? [])].map(chuanTen).filter(Boolean));
  n.diem = n.meta?.diem ?? null;
}
const phuNut = {
  tong: nut.length,
  theo_tier: Object.fromEntries(Object.entries(nut.reduce((m, n) => { m[n.catalog_tier] = (m[n.catalog_tier] ?? 0) + 1; return m; }, {}))),
  co_tinh: nut.filter((n) => n.tinh).length, co_xa: nut.filter((n) => n.xa.size).length,
  vung_dau_la_tinh: nut.filter((n) => n.rt === "market").length, nhieu_vung: nut.filter((n) => (n.area_ids ?? []).length > 1).length,
  co_diem: nut.filter((n) => n.diem).length, co_bi_danh: nut.filter((n) => (n.aliases ?? []).length).length,
  meta_city_lech_tinh: nut.filter((n) => n.meta?.city && `vn-${n.meta.city}` !== n.tinh).map((n) => `${n.name} (meta.city=${n.meta.city}, tỉnh vùng=${n.tinh})`),
  theo_tinh: Object.entries(nut.reduce((m, n) => { m[n.tinh] = (m[n.tinh] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]),
};

// ---------- Chạy bóng ----------
const tu = (s) => new Set(chuanKhop(s).split(" ").filter(Boolean));
const tiLeTu = (a, b) => { const A = tu(a), B = tu(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return n / Math.max(A.size, B.size); };
const km = (a, b) => { const R0 = 6371, r = Math.PI / 180; const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2; return 2 * R0 * Math.asin(Math.sqrt(h)); };
const NGA = ["khong_tinh", "ten_rong", "K1", "K2", "K3", "T", "K4", "nhieu_nut", "khong_khop"];
function xep(r) {
  if (laRong(r.ten)) return { nga: "ten_rong" };
  if (!r.tinh) return { nga: "khong_tinh" };
  const k = chuanKhop(r.ten_khop ?? r.ten);
  const cung = nut.filter((n) => n.tinh === r.tinh);
  const trung = cung.filter((n) => n.khoa.has(k));
  const ket = (nga, ds, can) => (ds.length === 1 ? { nga, nut: ds[0], can } : { nga: "nhieu_nut", tai: nga, ung_vien: ds });
  // K1: cùng MST + tên trùng — không phía nào có MST.
  if (r.mst) { const ds = trung.filter((n) => n.meta?.mst === r.mst); if (ds.length) return ket("K1", ds); }
  // K2: điểm ≤ 300 m + tên trùng — nút cần điểm.
  if (r.lat != null) { const ds = trung.filter((n) => n.diem && km(r, n.diem) <= 0.3); if (ds.length) return ket("K2", ds); }
  // K3: cùng xã + tên trùng.
  if (r.xa) { const ds = trung.filter((n) => n.xa.has(r.xa)); if (ds.length) return ket("K3", ds); }
  // T: tên trùng hẳn đúng một nút cùng tỉnh (luật DA55).
  if (trung.length) return ket("T", trung);
  // K4: điểm ≤ 1 km + tên trùng một phần ≥ 50% từ — nút cần điểm.
  if (r.lat != null) { const ds = cung.filter((n) => n.diem && km(r, n.diem) <= 1 && tiLeTu(r.ten, n.name) >= 0.5); if (ds.length) return ket("K4", ds); }
  return { nga: "khong_khop" };
}
const bong = {}, mau = {};
const goiY = {}; // bóng phụ: ca «tên trùng một phần ≥50% cùng tỉnh» trong ngả không khớp (K4 thiếu điểm nút)
const tenTLeChi = {}; // độ nhạy: trùng theo chuanTen (bỏ dấu) mà chuanKhop không trùng
for (const s of NGUON) { bong[s] = Object.fromEntries(NGA.map((k) => [k, 0])); mau[s] = {}; goiY[s] = { mot_phan_cung_tinh: 0, mot_phan_cung_xa: 0, mau: [] }; tenTLeChi[s] = 0; }
const nutTier = {}; // ngả × tier nút trúng
for (const r of R) {
  const kq = xep(r);
  r.kq = kq;
  bong[r.src][kq.nga]++;
  if (kq.nut) { const k = `${r.src}|${kq.nga}|${kq.nut.catalog_tier}`; nutTier[k] = (nutTier[k] ?? 0) + 1; }
  if (kq.nga === "nhieu_nut") for (const n of kq.ung_vien) { const k = `${r.src}|nhieu_nut|${n.catalog_tier}`; nutTier[k] = (nutTier[k] ?? 0) + 1; }
  const m = (mau[r.src][kq.nga] ??= []);
  if (m.length < 5 && !["khong_tinh", "ten_rong"].includes(kq.nga)) {
    const n = kq.nut ?? kq.ung_vien?.[0];
    m.push({ ten: r.ten, nut: n ? (kq.ung_vien ? kq.ung_vien.map((x) => x.name).join(" / ") : n.name) : null, tier: n?.catalog_tier ?? null,
      tinh: r.tinh, xa: r.xa, kc: "nút không có điểm", tai: kq.tai ?? null });
  }
  if (["khong_tinh", "ten_rong"].includes(kq.nga) && m.length < 5) m.push({ ten: r.ten, dia_chi: r.dia_chi ? String(r.dia_chi).slice(0, 60) : null });
  if (kq.nga === "khong_khop") {
    const cung = nut.filter((n) => n.tinh === r.tinh);
    const mp = cung.filter((n) => [n.name, ...(n.aliases ?? [])].some((t) => tiLeTu(r.ten, t) >= 0.5));
    if (mp.length) {
      goiY[r.src].mot_phan_cung_tinh++;
      if (r.xa && mp.some((n) => n.xa.has(r.xa))) goiY[r.src].mot_phan_cung_xa++;
      if (goiY[r.src].mau.length < 5) goiY[r.src].mau.push({ ten: r.ten, nut: mp.slice(0, 3).map((n) => n.name).join(" / "), so_ung_vien: mp.length, tinh: r.tinh });
    }
    const kt = chuanTen(r.ten_khop ?? r.ten);
    if (cung.some((n) => n.khoaT.has(kt))) tenTLeChi[r.src]++;
  }
}

// ---------- Đo 7 ----------
// (a) ngả có nút trúng theo tier — ở nutTier. (b) trùng giữa nguồn: cùng chuanKhop + cùng tỉnh, ≥2 nguồn.
const nhom = new Map();
for (const r of R) {
  if (!r.tinh || laRong(r.ten)) continue;
  const k = `${chuanKhop(r.ten_khop ?? r.ten)}|${r.tinh}`;
  if (!nhom.has(k)) nhom.set(k, []);
  nhom.get(k).push(r);
}
const nhomDa = [...nhom.entries()].filter(([, ds]) => new Set(ds.map((r) => r.src)).size >= 2);
const coNut = (ds) => ds.some((r) => r.kq?.nut || r.kq?.nga === "nhieu_nut");
const capNguon = {};
for (const [, ds] of nhomDa) { const k = [...new Set(ds.map((r) => r.src))].sort().join("+"); capNguon[k] = (capNguon[k] ?? 0) + 1; }
const trungNguon = {
  nhom_nhieu_nguon: nhomDa.length,
  ban_ghi: nhomDa.reduce((a, [, ds]) => a + ds.length, 0),
  nhom_chua_co_nut: nhomDa.filter(([, ds]) => !coNut(ds)).length,
  ban_ghi_chua_co_nut: nhomDa.filter(([, ds]) => !coNut(ds)).reduce((a, [, ds]) => a + ds.length, 0),
  theo_cap_nguon: capNguon,
  mau_chua_co_nut: nhomDa.filter(([, ds]) => !coNut(ds)).slice(0, 8).map(([k, ds]) => ({ khoa: k, nguon: ds.map((r) => r.src).join(",") })),
};
// Phụ: trùng giữa nguồn theo điểm ≤300 m + tên trùng (căn cứ K2 giữa nguồn với nhau, không có nút).
const coDiem = R.filter((r) => r.lat != null && !laRong(r.ten));
let k2NguonNguon = 0;
for (let i = 0; i < coDiem.length; i++) for (let j = i + 1; j < coDiem.length; j++) {
  const a = coDiem[i], b = coDiem[j];
  if (a.src === b.src) continue;
  if (chuanKhop(a.ten_khop ?? a.ten) !== chuanKhop(b.ten_khop ?? b.ten)) continue;
  if (km(a, b) <= 0.3) k2NguonNguon++;
}

// ---------- Hiện trạng nối ----------
const hienTrang = {
  project_links: await q("SELECT source, status, can_cu, ly_do, count(*)::int n FROM project_links GROUP BY 1,2,3,4 ORDER BY 1,2"),
  project_link_rules: await q("SELECT id::int, source, can_cu, so_ma, decided_at, dao_at FROM project_link_rules ORDER BY id"),
  s08_project_links: await q("SELECT status, count(*)::int n, count(asset_node_id)::int co_nut FROM s08_project_links GROUP BY 1"),
  s10_project_links: await q("SELECT count(*)::int n FROM s10_project_links"),
  ma_nguon_tren_nut: await q(`SELECT r.source, count(*)::int n FROM registry_aliases r JOIN asset_nodes n ON r.object_key='node:'||n.id AND n.node_type='project'
                              WHERE r.kind='ma_nguon' AND r.retired_at IS NULL GROUP BY 1`),
  o_man: await q(`SELECT 'S06' AS source, count(*)::int AS da_nap, (count(*) FILTER (WHERE status = 'noi'))::int AS da_noi FROM project_links WHERE source = 'S06'
     UNION ALL SELECT 'S08', count(*)::int, (count(*) FILTER (WHERE l.status = 'noi'))::int
     FROM (SELECT DISTINCT project_id FROM stg_s08_project) p LEFT JOIN s08_project_links l USING (project_id)
     UNION ALL SELECT 'S09', count(*)::int, 0 FROM v_s09_du_an_moi`),
};

// ---------- Đối chiếu bóng với nối đang có (S08 bảng tay, S09/S16 chép cứng) ----------
const { NOI_KHU_S09 } = await import(`${W}/pipeline/lib/s09-du-an.mjs`);
const { NOI_DU_AN_S16, duoiDuAn } = await import(`${W}/pipeline/lib/s16-danh-muc.mjs`);
const slugNut = new Map(nut.map((n) => [n.slug, n]));
const idNut = new Map(nut.map((n) => [n.id, n]));
const tay08 = await q("SELECT project_id, asset_node_id::int nid FROM s08_project_links WHERE status='noi'");
const dc = [];
const so = (src, ma, n) => { const r = R.find((x) => x.src === src && x.ma === ma);
  dc.push({ src, ten: r?.ten ?? "(không có bản ghi)", nut_noi: n?.name ?? null, nga_bong: r?.kq?.nga ?? null,
    nut_bong: r?.kq?.nut?.name ?? (r?.kq?.ung_vien ?? []).map((x) => x.name).join(" / ") ?? null,
    khop: !!(r?.kq?.nut && n && r.kq.nut.id === n.id) }); };
for (const t of tay08) so("S08", t.project_id, idNut.get(t.nid));
for (const [ma, slug] of Object.entries(NOI_KHU_S09)) so("S09", ma, slugNut.get(slug));
for (const r of R.filter((x) => x.src === "S16")) { const slug = NOI_DU_AN_S16[duoiDuAn(r.ma)]; if (slug) so("S16", r.ma, slugNut.get(slug)); }
const doiChieu = { dong: dc, khop: dc.filter((d) => d.khop).length, tong: dc.length };
require("node:fs").writeFileSync(require("node:path").join(require("node:os").tmpdir(), "da3-ban-ghi.json"), JSON.stringify(R.map((r) => ({ src: r.src, ma: r.ma, ten: r.ten, tinh: r.tinh, xa: r.xa,
  nga: r.kq.nga, tai: r.kq.tai, nut: r.kq.nut?.name ?? (r.kq.ung_vien ?? []).map((x) => x.name).join(" / "), dia_chi: r.dia_chi })), null, 0));

await c.end();
const ketQua = { doiChieu, luc_do: new Date().toISOString(), phu, rongGia, topCdt, topTen, phuNut, bong, mau, goiY, tenTLeChi, nutTier, trungNguon, k2NguonNguon, hienTrang,
  s16_chi_tiet: { co_trang: R.filter((r) => r.src === "S16" && r.co_trang).length, co_khu: R.filter((r) => r.src === "S16" && r.co_khu).length,
    ca_hai: R.filter((r) => r.src === "S16" && r.co_trang && r.co_khu).length },
  s07_chi_tiet: R.filter((r) => r.src === "S07" && r.co_chi_tiet).length,
  s09_phuong_nhieu_dich: R.filter((r) => r.xa_ten_nhieu_dich).length,
  xa_lech_tinh: R.filter((r) => r.xa_lech_tinh).length };
console.log(JSON.stringify(ketQua, (k, v) => (v instanceof Set ? [...v] : v), 1));
