// ban-ghi-nguon.mjs — DA3 bang-noi-ma-du-an AC-1: khuôn chung bản ghi nguồn cấp dự án (mo-hinh-danh-ba-du-an.md §1.1) và bộ
// chuyển stg_* → bản ghi chuẩn cho S07, S08, S09, S10, S16. Đọc chỉ đọc; hàm chuyen* thuần. Thiết kế §3.1.
//   Tỉnh, xã: từ điểm trước (ST_Covers trên areas có hình, như SQL_DU_AN của DA55), rồi từ chữ. Tên tỉnh cũ → mã cũ (tinh-cu.mjs)
//   → mã mới (area_aliases) → thị trường; phường cũ S09 → phường mới qua area_aliases khi đúng một đích.
import { chuanKhop, chuanTen } from "./noi-du-an-s06-lop.mjs";
import { boTienToTinh, maTinhCu } from "./tinh-cu.mjs";

export const NGUON_DANH_MUC = Object.freeze(["S07", "S08", "S09", "S10", "S16"]);

/** Quy ước giá trị rỗng giả (Hỏi-1, Mạnh duyệt 25/11): ba giá trị mục 45 cộng chuỗi trống, «-», «N/A». Giữ «Khác», «Liên hệ». */
export const RONG_GIA = new Set(["", "Đang cập nhật", "--", "-", "0", "N/A"].map(chuanTen));

/** Giá trị rỗng giả → null; còn lại trim. */
export function trongGia(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return RONG_GIA.has(chuanTen(s)) ? null : s;
}

// ---- Bảng tra vùng (đọc một lần) ----

/** @returns {Promise<object>} ctx cho các hàm chuyen*. */
export async function docVung(client) {
  const { rows: markets } = await client.query("SELECT id, name, admin_code FROM areas WHERE region_type = 'market'");
  const { rows: subs } = await client.query("SELECT id, name, parent_id, admin_code FROM areas WHERE region_type = 'submarket'");
  const { rows: tinhCu } = await client.query("SELECT DISTINCT old_province_code AS o, province_code AS n FROM area_aliases");
  const { rows: aa } = await client.query("SELECT name, old_district, old_province_code, targets FROM area_aliases");
  return dungVung({ markets, subs, tinhCu, aa });
}

/** Dựng ctx từ dòng thô (tách riêng để test hàm thuần không cần DB). */
export function dungVung({ markets, subs, tinhCu, aa }) {
  const mktByName = new Map(markets.map((m) => [chuanTen(boTienToTinh(m.name)), m.id]));
  const mktByCode = new Map(markets.filter((m) => m.admin_code).map((m) => [m.admin_code, m.id]));
  const subByCode = new Map(subs.filter((s) => s.admin_code).map((s) => [s.admin_code, s.id]));
  const subByTinhTen = new Map();
  for (const s of subs) {
    const k = `${s.parent_id}|${chuanTen(s.name)}`;
    subByTinhTen.set(k, subByTinhTen.has(k) ? null : s.id); // trùng tên trong tỉnh → không suy
  }
  const tinhCuMoi = new Map(tinhCu.map((r) => [r.o, r.n]));
  const phuongCu = new Map();
  for (const r of aa) {
    const k = `${r.old_province_code}|${chuanTen(String(r.old_district).replace(/^(quận|huyện|thị xã|thành phố)\s*/iu, ""))}|${chuanTen(r.name)}`;
    phuongCu.set(k, phuongCu.has(k) ? null : r.targets);
  }
  return { mktByName, mktByCode, subByCode, subByTinhTen, tinhCuMoi, phuongCu };
}

const boTienToXa = (s) => String(s ?? "").replace(/^\s*(phường|xã|đặc khu|thị trấn|p\.|x\.|tt\.)\s*/iu, "").trim();
const tachDiaChi = (s) => String(s ?? "").split(",").map((x) => x.trim()).filter(Boolean);

/** Tên tỉnh (mới, cũ, viết tắt) → {id, cu, lyDo}. Mã cũ có mà area_aliases không có đích → lyDo 'tinh-cu-khong-anh-xa'. */
export function tinhTuTen(ctx, s) {
  const k = chuanTen(boTienToTinh(s));
  if (!k) return { id: null, cu: false, lyDo: null };
  if (ctx.mktByName.has(k)) return { id: ctx.mktByName.get(k), cu: false, lyDo: null };
  const maCu = maTinhCu(s);
  if (!maCu) return { id: null, cu: false, lyDo: null };
  const moi = ctx.tinhCuMoi.get(maCu);
  const id = moi ? ctx.mktByCode.get(moi) ?? null : null;
  return { id, cu: true, lyDo: id ? null : "tinh-cu-khong-anh-xa" };
}

/** Tên xã trong một tỉnh (tên mới) → id submarket; tên trùng trong tỉnh → null. */
export function xaTuTen(ctx, tinh, ten) {
  if (!tinh || !ten) return null;
  return ctx.subByTinhTen.get(`${tinh}|${chuanTen(boTienToXa(ten))}`) ?? null;
}

/** Ghép phần chung: tỉnh, xã từ điểm trước rồi từ chữ; lý do khi tỉnh trống. */
function banGhi(nguon, r, { ma, maCha = null, tenGoc, diaChi = null, cdt = null, loai = null, tinhChu, xaChu, lyDoTrong = null }) {
  const ten = trongGia(tenGoc);
  const tinh = r.tinh_diem ?? tinhChu?.id ?? null;
  const tinhTu = r.tinh_diem ? "diem" : tinhChu?.id ? "chu" : null;
  const xa = r.xa_diem ?? xaChu ?? null;
  const coDiem = r.lat != null && r.lng != null;
  return {
    nguon, cap: "du_an", ma: String(ma), ma_cha: maCha,
    ten_goc: ten, ten_chuan: ten ? chuanKhop(ten) : null,
    dia_chi: trongGia(diaChi), tinh, tinh_tu: tinhTu, xa,
    diem: coDiem ? { lat: Number(r.lat), lng: Number(r.lng) } : null,
    cdt: trongGia(cdt), mst: null, loai_hinh: trongGia(loai),
    ly_do_trong: tinh ? null : lyDoTrong ?? tinhChu?.lyDo ?? "khong-tinh",
  };
}

// ---- SQL đọc từng nguồn (bản mới nhất mỗi mã) ----

const PHU = (lng, lat) => `
  (SELECT a.id FROM areas a WHERE ${lng} IS NOT NULL AND a.region_type = 'market' AND a.geom IS NOT NULL
     AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint((${lng})::float, (${lat})::float), 4326)) ORDER BY a.id LIMIT 1) AS tinh_diem,
  (SELECT a.id FROM areas a WHERE ${lng} IS NOT NULL AND a.region_type <> 'market' AND a.geom IS NOT NULL
     AND ST_Covers(a.geom, ST_SetSRID(ST_MakePoint((${lng})::float, (${lat})::float), 4326)) ORDER BY a.id LIMIT 1) AS xa_diem`;

export const SQL_NGUON = Object.freeze({
  S07: `
    WITH cd AS (SELECT DISTINCT ON (pj_id) * FROM stg_s07_project_card ORDER BY pj_id, captured_at DESC),
         dt AS (SELECT DISTINCT ON (pj_id) * FROM stg_s07_project ORDER BY pj_id, captured_at DESC)
    SELECT coalesce(dt.pj_id, cd.pj_id)::text AS ma, coalesce(dt.project_name, cd.project_name) AS ten,
           coalesce(dt.unparsed_address, cd.unparsed_address) AS dia_chi, coalesce(dt.builder_name_raw, cd.builder_name_raw) AS cdt,
           coalesce(dt.project_type_slug, cd.project_type_slug) AS loai, dt.longitude AS lng, dt.latitude AS lat,
           ${PHU("dt.longitude", "dt.latitude")}
      FROM cd FULL JOIN dt ON dt.pj_id = cd.pj_id`,
  S08: `
    WITH p AS (SELECT DISTINCT ON (project_id) * FROM stg_s08_project ORDER BY project_id, fetched_at DESC NULLS LAST)
    SELECT project_id AS ma, coalesce(project_name, catalog_payload ->> 'project_name') AS ten, project_address AS dia_chi,
           coalesce(investor, catalog_payload ->> 'investor') AS cdt, project_type AS loai,
           point_lng::float AS lng, point_lat::float AS lat, ${PHU("point_lng", "point_lat")}
      FROM p`,
  S09: `
    WITH d AS (SELECT DISTINCT ON (project_id) project_id, data, fetched_at FROM v_s09_du_an_moi ORDER BY project_id, fetched_at DESC)
    SELECT project_id AS ma, data ->> 'name' AS ten, data ->> 'address' AS dia_chi, data ->> 'developer_name' AS cdt,
           data ->> 'insight_type' AS loai, data ->> 'province' AS tinh_ten, data ->> 'province_code' AS tinh_ma,
           data ->> 'district' AS quan, data ->> 'ward' AS phuong,
           (data ->> 'long_cdnt')::float AS lng, (data ->> 'lat_cdnt')::float AS lat,
           ${PHU("(data ->> 'long_cdnt')", "(data ->> 'lat_cdnt')")}
      FROM d`,
  S10: `
    SELECT DISTINCT ON (project_id) project_id AS ma, project_label AS ten, du_an AS cha_ten
      FROM stg_s10_project ORDER BY project_id, captured_at DESC`,
  S16: `
    WITH pg AS (SELECT DISTINCT ON (payload -> 'html' ->> 'slug') payload -> 'html' ->> 'slug' AS slug, payload -> 'html' -> 'project' AS p
                  FROM stg_s16_item WHERE kind = 'du-an' AND jsonb_typeof(payload -> 'html' -> 'project') = 'object'
                 ORDER BY payload -> 'html' ->> 'slug', fetched_at DESC),
         kh AS (SELECT du_an AS slug, max(du_an_ten) AS ten FROM stg_s16_khu GROUP BY 1),
         u AS (SELECT coalesce(pg.slug, kh.slug) AS slug, pg.p, kh.ten AS kten FROM pg FULL JOIN kh ON kh.slug = pg.slug)
    SELECT slug AS ma, coalesce(p ->> 'name', kten) AS ten, p -> 'address' ->> 'full' AS dia_chi, p -> 'address' ->> 'city' AS tinh_ten,
           p -> 'address' ->> 'ward' AS phuong,
           (p -> 'address' -> 'geolocation' ->> 'lon')::float AS lng, (p -> 'address' -> 'geolocation' ->> 'lat')::float AS lat,
           ${PHU("(p -> 'address' -> 'geolocation' ->> 'lon')", "(p -> 'address' -> 'geolocation' ->> 'lat')")}
      FROM u`,
});

// ---- Bộ chuyển (thuần) ----

export function chuyenS07(r, ctx) {
  const seg = tachDiaChi(r.dia_chi);
  const tinhChu = tinhTuTen(ctx, seg.at(-1));
  const xaSeg = seg.find((x) => /^(phường|xã|đặc khu)\s/iu.test(x));
  return banGhi("S07", r, { ma: r.ma, tenGoc: r.ten, diaChi: r.dia_chi, cdt: r.cdt, loai: r.loai, tinhChu,
    xaChu: xaTuTen(ctx, r.tinh_diem ?? tinhChu.id, xaSeg) });
}

/** Luật tenGoc của DA55: bỏ «_TT»/« TT» cuối và «TMDV » đầu. */
export const tenGocS08 = (t) => String(t ?? "").trim().replace(/(?:_|\s)TT$/i, "").replace(/^TMDV\s+/i, "").trim();

export function chuyenS08(r, ctx) {
  const seg = tachDiaChi(r.dia_chi);
  const tinhChu = tinhTuTen(ctx, seg.at(-1));
  const xaSeg = seg.map((x) => x.match(/(?:phường|xã|đặc khu)\s+(.+)$/iu)?.[1]).find(Boolean);
  return banGhi("S08", r, { ma: r.ma, tenGoc: tenGocS08(r.ten), diaChi: r.dia_chi, cdt: r.cdt, loai: r.loai, tinhChu,
    xaChu: xaTuTen(ctx, r.tinh_diem ?? tinhChu.id, xaSeg) });
}

export function chuyenS09(r, ctx) {
  const moi = ctx.tinhCuMoi.get(r.tinh_ma);
  const theoMa = moi ? ctx.mktByCode.get(moi) ?? null : null;
  const tinhChu = theoMa ? { id: theoMa, cu: false, lyDo: null } : tinhTuTen(ctx, r.tinh_ten);
  const k = `${r.tinh_ma}|${chuanTen(String(r.quan ?? "").replace(/^(q\.|h\.|tx\.|tp\.)\s*/iu, ""))}|${chuanTen(boTienToXa(r.phuong))}`;
  const tg = ctx.phuongCu.get(k);
  const xaChu = tg && tg.length === 1 ? ctx.subByCode.get(tg[0]) ?? null : null;
  return banGhi("S09", r, { ma: r.ma, tenGoc: r.ten, diaChi: r.dia_chi, cdt: r.cdt, loai: r.loai, tinhChu, xaChu });
}

export function chuyenS10(r) {
  return banGhi("S10", r, { ma: r.ma, maCha: trongGia(r.cha_ten), tenGoc: r.ten, tinhChu: null, xaChu: null, lyDoTrong: "khong-vi-tri" });
}

export function chuyenS16(r, ctx) {
  const tinhChu = tinhTuTen(ctx, r.tinh_ten);
  return banGhi("S16", r, { ma: r.ma, tenGoc: r.ten, diaChi: r.dia_chi, tinhChu,
    xaChu: xaTuTen(ctx, r.tinh_diem ?? tinhChu.id, r.phuong) });
}

const CHUYEN = { S07: chuyenS07, S08: chuyenS08, S09: chuyenS09, S10: chuyenS10, S16: chuyenS16 };

/** Đọc mọi bản ghi cấp dự án của một nguồn, đã chuẩn. */
export async function docBanGhi(client, nguon, ctx = null) {
  if (!CHUYEN[nguon]) throw new Error(`nguon-la: ${nguon} không phải nguồn danh mục (${NGUON_DANH_MUC.join(", ")})`);
  const vung = ctx ?? (await docVung(client));
  const { rows } = await client.query(SQL_NGUON[nguon]);
  return rows.map((r) => CHUYEN[nguon](r, vung));
}
