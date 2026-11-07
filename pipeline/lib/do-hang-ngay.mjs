// do-hang-ngay.mjs — DO1 do-hieu-qua-hang-ngay: hàm thuần cho mẫu soát cuốn chiếu và dòng chuyển bậc. Không DB, không model.
// Nguyên tắc đo (design doc «Bổ sung sau rà soát», FRAMING §5): đơn vị + mẫu số đi cạnh số · giữ ô số theo dung sai · nhóm ô
// A/B/C theo F3 · phiên bản thước · cơ cấu mẫu · chênh có ý nghĩa khi hai khoảng Wilson 95% không chồng · tỉ lệ soát.
import { createHash } from "node:crypto";

import { chuanHoa } from "./chuan-hoa-nhan.mjs";
import { entriesFromTokens, guardValues } from "./tier-a-guard.mjs";

/** Nhóm ô theo F3 (classification-enrich-review.md): A định nhóm/định danh, B số, C còn lại. */
export const NHOM_O = Object.freeze({
  listing_intent: "A", kind: "A", property_type: "A", multi_unit: "A", project: "A", subzone: "A", building: "A",
  stack: "A", unit_number: "A",
  price_min_vnd: "B", price_max_vnd: "B", area_m2: "B", bedrooms: "B", bedrooms_plus: "B", bathrooms: "B", floor: "B",
});
export const nhomO = (o) => NHOM_O[o] ?? "C";

/** Dung sai «giữ» với ô số (Mạnh duyệt 07/11): giá ±1% tương đối, diện tích ±1 m² tuyệt đối. */
export const DUNG_SAI = Object.freeze({
  price_min_vnd: { tuong_doi: 0.01 }, price_max_vnd: { tuong_doi: 0.01 }, area_m2: { tuyet_doi: 1 },
});

export const PHIEN_BAN_THUOC = createHash("sha256")
  .update(JSON.stringify({ nhom: NHOM_O, dung_sai: DUNG_SAI, chuan_hoa: "labels-normalize@081" }))
  .digest("hex").slice(0, 12);

/** Khoảng Wilson 95% của k/n; n = 0 → null. */
export function wilson(k, n, z = 1.96) {
  if (!n) return null;
  const p = k / n, z2 = z * z, mau = 1 + z2 / n;
  const giua = (p + z2 / (2 * n)) / mau;
  const nua = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / mau;
  return { thap: Math.max(0, giua - nua), cao: Math.min(1, giua + nua) };
}

/** Tuần ISO của một ngày lịch 'YYYY-MM-DD' (ngày đã theo giờ VN). */
export function tuanIso(ngay) {
  const d = new Date(`${ngay}T00:00:00Z`);
  const thu = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - thu + 3);
  const dau = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const tuan = 1 + Math.round(((d - dau) / 86400000 - 3 + ((dau.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(tuan).padStart(2, "0")}`;
}

/** Ngày giờ VN của một mốc thời gian. */
export const ngayVn = (t) => new Date(new Date(t).getTime() + 7 * 3600e3).toISOString().slice(0, 10);

/** Tuần ngay trước một tuần ISO. */
export function tuanTruoc(tuan, ngay) {
  const d = new Date(`${ngay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 7);
  const t = tuanIso(d.toISOString().slice(0, 10));
  return t === tuan ? null : t;
}

/**
 * Ô có được «giữ» không: nháp và nhãn người cùng «không nêu», hoặc cùng giá trị (ô số trong dung sai).
 * @param {string} o @param {string|null} nhap chuỗi khuôn eval_labels @param {{value: string|null, not_stated: boolean}} nhan
 */
export function giuO(o, nhap, nhan, { dotBien } = {}) {
  const nguoi = nhan.not_stated ? null : nhan.value;
  if (nhap === null || nguoi === null) return nhap === nguoi;
  const ds = dotBien === "bo-dung-sai" ? null : DUNG_SAI[o];
  if (ds) {
    const a = Number(nhap), b = Number(nguoi);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return nhap === nguoi;
    if (ds.tuong_doi !== undefined) return Math.abs(a - b) <= ds.tuong_doi * Math.max(Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= ds.tuyet_doi;
  }
  return nhap === nguoi;
}

/** So hai tuần: chênh, ý nghĩa (khoảng không chồng), ngưỡng phát hiện (tổng nửa độ rộng hai khoảng). */
export function soTuan(nay, truoc, { dotBien } = {}) {
  const a = wilson(nay.k, nay.n), b = wilson(truoc.k, truoc.n);
  if (!a || !b) return { chenh: null, co_y_nghia: false, nguong_phat_hien: null };
  const chenh = nay.k / nay.n - truoc.k / truoc.n;
  const chong = a.thap <= b.cao && b.thap <= a.cao;
  return {
    chenh,
    co_y_nghia: dotBien === "y-nghia-bo-chong" ? chenh !== 0 : !chong,
    nguong_phat_hien: (a.cao - a.thap) / 2 + (b.cao - b.thap) / 2,
  };
}

const oCuaThe = (draft, cachDoc) => draft?.cach_doc?.[cachDoc];

/**
 * Tỉ lệ giữ nháp theo (cách đọc × ô) cho tuần của `ngay` và tuần trước. Chỉ nháp `co`; nháp `khong-tin`/`vang` không vào.
 * @param {{draft: object, nhan: Record<string, {value: string|null, not_stated: boolean}>|null, ngay: string}[]} the
 *        `nhan` null = thẻ chưa soát.
 */
export function giuNhap(the, ngay, { dotBien } = {}) {
  const tNay = tuanIso(ngay), tTruoc = tuanTruoc(tNay, ngay);
  const o = new Map(); // `${cach}|${o}` → {cach, o, [tuan]: {n, k}}
  const nguoiSua = new Map(); // tuan → {n, k}
  const soat = { [tNay]: { rut: 0, soat: 0 }, [tTruoc]: { rut: 0, soat: 0 } };
  const coCau = { [tNay]: {}, [tTruoc]: {} };
  for (const t of the) {
    const tuan = tuanIso(t.ngay);
    if (tuan !== tNay && tuan !== tTruoc) continue;
    soat[tuan].rut++;
    if (!t.nhan) continue;
    soat[tuan].soat++;
    const nhom = `${t.nhan.kind?.value ?? "chua-ro"}|${t.nhan.property_type?.value ?? "chua-ro"}`;
    coCau[tuan][nhom] = (coCau[tuan][nhom] ?? 0) + 1;
    const cachDocs = dotBien === "gop-cach-doc"
      ? [...new Set(Object.keys(t.draft?.cach_doc ?? {}).map((k) => k.split(":").slice(0, 2).join(":")))]
      : Object.keys(t.draft?.cach_doc ?? {});
    for (const cach of cachDocs) {
      const n = dotBien === "gop-cach-doc"
        ? Object.entries(t.draft.cach_doc).find(([k]) => k.startsWith(cach))[1]
        : oCuaThe(t.draft, cach);
      if (n?.trang_thai !== "co") continue;
      const nguon = dotBien === "so-sale-offers" && t.hienTai?.[cach] ? t.hienTai[cach] : n.o;
      for (const [f, nhan] of Object.entries(t.nhan)) {
        if (!(f in nguon)) continue;
        const giu = giuO(f, nguon[f], nhan, { dotBien });
        const key = `${cach}|${f}`;
        if (!o.has(key)) o.set(key, { cach_doc: cach, o: f, nhom: nhomO(f), [tNay]: { n: 0, k: 0 }, [tTruoc]: { n: 0, k: 0 } });
        const r = o.get(key)[tuan];
        r.n++; if (giu) r.k++;
        // Ô người sửa chỉ tính ô người THẤY nháp: ô bảng chọn giao người (draft.o_nguoi) màn để trống.
        if (cach === t.draft.hien && !(t.draft.o_nguoi ?? []).includes(f)) {
          const s = nguoiSua.get(tuan) ?? { n: 0, k: 0 };
          s.n++; if (!giu) s.k++;
          nguoiSua.set(tuan, s);
        }
      }
    }
  }
  const dong = [...o.values()].map((r) => {
    const nay = r[tNay], truoc = r[tTruoc];
    return {
      cach_doc: r.cach_doc, o: r.o, nhom: r.nhom,
      tuan_nay: { tuan: tNay, n: nay.n, giu: nay.k, ty_le: nay.n ? nay.k / nay.n : null, wilson: wilson(nay.k, nay.n) },
      tuan_truoc: { tuan: tTruoc, n: truoc.n, giu: truoc.k, ty_le: truoc.n ? truoc.k / truoc.n : null, wilson: wilson(truoc.k, truoc.n) },
      ...soTuan(nay, truoc, { dotBien }),
    };
  }).sort((a, b) => (a.cach_doc + a.o).localeCompare(b.cach_doc + b.o));
  const ns = (t) => nguoiSua.get(t) ?? { n: 0, k: 0 };
  const tySoat = (t) => (soat[t].rut ? soat[t].soat / soat[t].rut : null);
  return {
    dong,
    nguoi_sua: { tuan_nay: { ...ns(tNay), ty_le: ns(tNay).n ? ns(tNay).k / ns(tNay).n : null }, tuan_truoc: { ...ns(tTruoc), ty_le: ns(tTruoc).n ? ns(tTruoc).k / ns(tTruoc).n : null } },
    ty_le_soat: { tuan_nay: { ...soat[tNay], ty_le: tySoat(tNay) }, tuan_truoc: { ...soat[tTruoc], ty_le: tySoat(tTruoc) } },
    canh_bao_soat: dotBien === "bo-canh-bao-soat" ? false : tySoat(tNay) !== null && tySoat(tNay) < 0.7,
    co_cau: { tuan_nay: coCau[tNay], tuan_truoc: coCau[tTruoc] },
    phien_ban_thuoc: PHIEN_BAN_THUOC,
  };
}

/** Ước bỏ sót theo (cách đọc × tuần) trên thẻ người gắn «Tin rao» (listing_intent = offer). */
export function boSot(the, ngay, { dotBien } = {}) {
  const tNay = tuanIso(ngay), tTruoc = tuanTruoc(tNay, ngay);
  const m = new Map();
  for (const t of the) {
    const tuan = tuanIso(t.ngay);
    if ((tuan !== tNay && tuan !== tTruoc) || !t.nhan) continue;
    const yd = t.nhan.listing_intent;
    if (dotBien !== "dem-ca-khong-tin" && (yd?.not_stated || yd?.value !== "offer")) continue;
    for (const [cach, n] of Object.entries(t.draft?.cach_doc ?? {})) {
      if (!m.has(cach)) m.set(cach, { [tNay]: { n: 0, k: 0, vang: 0 }, [tTruoc]: { n: 0, k: 0, vang: 0 } });
      const r = m.get(cach)[tuan];
      const tt = dotBien === "doc-lai-sale-offers" && t.hienTai?.[cach] ? t.hienTai[cach] : n.trang_thai;
      if (tt === "vang" && dotBien !== "vang-thanh-bo") { r.vang++; continue; }
      r.n++;
      if (tt === "khong-tin" || tt === "vang") r.k++;
    }
  }
  return [...m.entries()].map(([cach, r]) => ({
    cach_doc: cach,
    tuan_nay: { tuan: tNay, n: r[tNay].n, bo: r[tNay].k, thieu_nhap: r[tNay].vang, ty_le: r[tNay].n ? r[tNay].k / r[tNay].n : null, wilson: wilson(r[tNay].k, r[tNay].n) },
    tuan_truoc: { tuan: tTruoc, n: r[tTruoc].n, bo: r[tTruoc].k, thieu_nhap: r[tTruoc].vang, ty_le: r[tTruoc].n ? r[tTruoc].k / r[tTruoc].n : null, wilson: wilson(r[tTruoc].k, r[tTruoc].n) },
    ...soTuan(r[tNay], r[tTruoc]),
  })).sort((a, b) => a.cach_doc.localeCompare(b.cach_doc));
}

/** Khoá cách đọc của một dòng silver_labels: đọc gộp (prompt dg*) hay đọc chữ. */
export const khoaSilver = (r) => `${String(r.prompt_version).startsWith("dg") ? "doc-gop" : "doc-chu"}:${r.model}:${r.prompt_version}`;

/** Giá trị các ô của một dòng silver_labels đã chuẩn hoá: {o: {ô: chuỗi|null}, sai: Set<ô>, giao: string[]}. */
export function oCuaSilver(r) {
  const o = {}, sai = new Set();
  const p = r.probabilities ?? {};
  if (p.nguon === "doc-gop" && p.o) {
    const giao = p.o_duoc_giao ?? Object.keys(p.o);
    for (const f of giao) {
      const c = chuanHoa(f, p.o[f]?.v);
      if (c.ok) o[f] = c.v; else { o[f] = null; sai.add(f); }
    }
    return { o, sai, giao, trich: Object.values(p.o).filter((x) => x && x.trich_ok !== null && x.trich_ok !== undefined).map((x) => x.trich_ok) };
  }
  o.listing_intent = r.listing_intent === "unknown" ? null : r.listing_intent;
  o.kind = r.kind ?? null;
  return { o, sai, giao: ["listing_intent", "kind"], trich: r.quote_ok === null || r.quote_ok === undefined ? [] : [r.quote_ok] };
}

/**
 * Tín hiệu không cần nhãn của một ngày: mỗi cách đọc LLM đã biết một dòng; cách đọc không có lời gọi nào trong ngày → skip.
 * @param {object[]} dong silver_labels trong ngày @param {string[]} daBiet khoá cách đọc thấy trong 14 ngày
 * @param {Map<string, Record<string, string|null>>} boDocLuat post_id → ô của bộ đọc luật
 */
export function tinHieu(dong, daBiet, boDocLuat = new Map(), { dotBien } = {}) {
  const theoCach = new Map(daBiet.map((k) => [k, []]));
  for (const r of dong) {
    const k = khoaSilver(r);
    if (!theoCach.has(k)) theoCach.set(k, []);
    theoCach.get(k).push(r);
  }
  const giaTri = new Map(); // post_id → {cách đọc: ô}
  for (const [pid, o] of boDocLuat) giaTri.set(pid, { "bo-doc-luat": o });
  const ra = [];
  for (const [cach, rs] of theoCach) {
    if (!rs.length) {
      ra.push(dotBien === "vang-ghi-0"
        ? { cach_doc: cach, status: "pass", n_goi: 0, json_hong: 0 }
        : { cach_doc: cach, status: "skip", ly_do: "khong-co-luot-doc" });
      continue;
    }
    const json = rs.filter((r) => r.json_ok);
    const trich = [], phu = {};
    for (const r of json) {
      const { o, sai, giao, trich: t } = oCuaSilver(r);
      trich.push(...t);
      for (const f of giao) {
        phu[f] ??= { co: 0, giao: 0, sai_khuon: 0 };
        phu[f].giao++;
        if (sai.has(f)) { if (dotBien !== "sai-khuon-thanh-trong") phu[f].sai_khuon++; }
        else if (o[f] !== null) phu[f].co++;
      }
      const g = giaTri.get(r.post_id) ?? {};
      g[cach] = o;
      giaTri.set(r.post_id, g);
    }
    ra.push({
      cach_doc: cach, status: "pass", n_goi: rs.length,
      json_hong: (rs.length - json.length) / rs.length,
      trich_lac: trich.length ? trich.filter((x) => x === false).length / trich.length : null,
      n_trich: trich.length, phu,
    });
  }
  const batDong = {};
  for (const g of giaTri.values()) {
    const ks = Object.keys(g).sort();
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
      const cap = `${ks[i]}|${ks[j]}`;
      for (const f of Object.keys(g[ks[i]])) {
        if (!(f in g[ks[j]])) continue;
        const a = g[ks[i]][f], b = g[ks[j]][f];
        if (a === null || b === null) continue;
        batDong[cap] ??= {};
        batDong[cap][f] ??= { ca_hai: 0, khac: 0 };
        batDong[cap][f].ca_hai++;
        if (a !== b) batDong[cap][f].khac++;
      }
    }
  }
  return { cach_doc: ra.sort((a, b) => a.cach_doc.localeCompare(b.cach_doc)), bat_dong: batDong };
}

const BAC = { B0: 0, B1: 1, B2: 2, B3: 3, B4: 4, B5: 5 };
const TEN_LOI = { kind: "loai-tin", property_type: "loai-hinh", price_vnd: "gia", area_m2: "dien-tich", area_id: "phuong" };

/**
 * Dòng chuyển bậc giữa hai lần chạy. UnitRow: {unit_key, unit, source, data_level, core: {kind, property_type, price_vnd,
 * area_m2, area_id: boolean, measured: boolean, tin: string[]}, market_id, ward_id, project_key, building_key}.
 * @param {Map<string, object>} truoc @param {Map<string, object>} nay @param {{nghi?: Set<string>}} opts nghi = offer_id đã nghỉ
 */
export function chuyenBac(truoc, nay, { nghi = new Set(), dotBien } = {}) {
  const canCua = (m) => {
    const r = new Map();
    for (const u of m.values()) if (u.unit === "can") for (const t of u.core.tin ?? []) r.set(t, u.unit_key);
    return r;
  };
  const canTruoc = canCua(truoc), canNay = canCua(nay);
  const dong = (u, from, to, ly_do) => ({
    unit_key: u.unit_key, unit: u.unit, source: u.source ?? null, from_level: from, to_level: to,
    huong: from === null ? "moi" : to === null ? "mat" : BAC[to] > BAC[from] ? "len" : "tut",
    ly_do: dotBien === "bo-ly-do" ? [] : ly_do,
    market_id: u.market_id ?? null, ward_id: u.ward_id ?? null, project_key: u.project_key ?? null, building_key: u.building_key ?? null,
  });
  const ra = [];
  for (const [k, u] of nay) {
    const c = truoc.get(k);
    if (!c) {
      const tin = u.core.tin ?? [];
      const doiKhoa = tin.some((t) => canTruoc.has(t) && canTruoc.get(t) !== k && !nay.has(canTruoc.get(t)));
      const ganCan = tin.some((t) => truoc.has(`tin:${t}`));
      ra.push(dong(u, null, u.data_level, doiKhoa && dotBien !== "doi-khoa-thanh-bien-dong" ? ["doi-khoa"] : ganCan ? ["gan-can"] : ["moi-nhan"]));
      continue;
    }
    if (c.data_level === u.data_level && dotBien !== "dong-gia") continue;
    if (c.data_level === u.data_level) { ra.push(dong(u, c.data_level, u.data_level, ["khac"])); continue; }
    // Căn mất tin vì tin đi sang căn khác (khoá «căn» S06 chứa giá) → đổi khoá, không phải biến động trường lõi.
    if (u.unit === "can" && dotBien !== "doi-khoa-thanh-bien-dong"
        && (c.core.tin ?? []).some((t) => canNay.has(t) && canNay.get(t) !== k)) { ra.push(dong(u, c.data_level, u.data_level, ["doi-khoa"])); continue; }
    const ly = [];
    for (const f of Object.keys(TEN_LOI)) {
      if (c.core[f] && !u.core[f]) ly.push(`thieu-${TEN_LOI[f]}`);
      if (!c.core[f] && u.core[f]) ly.push(`du-${TEN_LOI[f]}`);
    }
    if (Boolean(c.core.measured) !== Boolean(u.core.measured) && dotBien !== "bo-do-luong") ly.push("do-luong");
    if (dotBien === "hai-dong" && ly.length > 1) { for (const l of ly) ra.push(dong(u, c.data_level, u.data_level, [l])); continue; }
    ra.push(dong(u, c.data_level, u.data_level, ly.length ? ly : ["khac"]));
  }
  for (const [k, c] of truoc) {
    if (nay.has(k)) continue;
    let ly;
    if (c.unit === "tin_le") {
      const oid = k.slice(4);
      ly = nghi.has(oid) ? ["tin-nghi"] : canNay.has(oid) ? ["gan-can"] : ["bien-mat"];
    } else {
      const doi = (c.core.tin ?? []).some((t) => canNay.has(t) && canNay.get(t) !== k);
      ly = doi && dotBien !== "doi-khoa-thanh-bien-dong" ? ["doi-khoa"] : (c.core.tin ?? []).every((t) => nghi.has(t)) ? ["tin-nghi"] : ["bien-mat"];
    }
    ra.push(dong(c, c.data_level, null, ly));
  }
  return ra.sort((a, b) => a.unit_key.localeCompare(b.unit_key));
}

/** Đếm dòng chuyển bậc: theo nguồn × hướng × lý do; cặp đổi khoá tách riêng khỏi mất/mới thật. */
export function demChuyenBac(dong, { dotBien } = {}) {
  const theoNguon = {}, theoLyDo = {};
  let doiKhoa = 0;
  for (const r of dong) {
    const laDoi = r.ly_do.includes("doi-khoa");
    if (laDoi) doiKhoa++;
    const nguon = dotBien === "bo-nguon" ? "tat-ca" : r.source ?? "chua-ro";
    theoNguon[nguon] ??= { len: 0, tut: 0, moi: 0, mat: 0, doi_khoa: 0 };
    if (laDoi) theoNguon[nguon].doi_khoa++; else theoNguon[nguon][r.huong]++;
    for (const l of r.ly_do) {
      const k = `${r.huong}:${l}`;
      theoLyDo[k] = (theoLyDo[k] ?? 0) + 1;
    }
  }
  return { so_dong: dong.length, doi_khoa: doiKhoa, theo_nguon: theoNguon, theo_huong_ly_do: theoLyDo };
}

/**
 * Phân rã một tập theo một chiều: tối đa `tran` ô lớn nhất, phần còn lại gộp `khac`; khoá trả `{chua: …}` vào ô chưa gắn.
 * @param {object[]} rows @param {(r: object) => string | {chua: 'khong-tin-hieu'|'chua-co-danh-ba'}} khoa
 */
export function phanRa(rows, khoa, dem = () => 1, tran = 30, { dotBien } = {}) {
  const dk = new Map(), chua = { "khong-tin-hieu": 0, "chua-co-danh-ba": 0 };
  let tong = 0;
  for (const r of rows) {
    const k = khoa(r), n = dem(r);
    tong += n;
    if (k && typeof k === "object") {
      if (dotBien === "bo-chua-gan") continue;
      chua[dotBien === "gop-chua-gan" ? "khong-tin-hieu" : k.chua] += n;
    } else dk.set(k, (dk.get(k) ?? 0) + n);
  }
  const xep = [...dk.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  const o = Object.fromEntries(xep.slice(0, tran));
  const du = xep.slice(tran).reduce((s, [, n]) => s + n, 0);
  if (du && dotBien !== "bo-khac") o.khac = du;
  if (dotBien === "gop-chua-gan") o["khong-tin-hieu"] = chua["khong-tin-hieu"];
  else Object.assign(o, chua);
  return { o, tong };
}

/**
 * So cặp trên cùng bài: mỗi phần tử {cu, moi} là ô đó có được giữ dưới khoá cũ / khoá mới. Khoảng 95% Wald cho hiệu hai tỉ
 * lệ cặp: se = √((b + c) − (b − c)²/n) / n, b = chỉ khoá mới giữ, c = chỉ khoá cũ giữ.
 */
export function soCap(cap) {
  const n = cap.length;
  if (!n) return { n_cap: 0, giu_cu: 0, giu_moi: 0, chenh_cap: null, khoang: null, co_y_nghia: false };
  const giuCu = cap.filter((x) => x.cu).length, giuMoi = cap.filter((x) => x.moi).length;
  const b = cap.filter((x) => x.moi && !x.cu).length, c = cap.filter((x) => x.cu && !x.moi).length;
  const chenh = (b - c) / n;
  const se = Math.sqrt(Math.max(0, b + c - ((b - c) ** 2) / n)) / n;
  const khoang = { thap: chenh - 1.96 * se, cao: chenh + 1.96 * se };
  return { n_cap: n, giu_cu: giuCu, giu_moi: giuMoi, chenh_cap: chenh, khoang, co_y_nghia: khoang.thap > 0 || khoang.cao < 0 };
}

/** Gập chuỗi để so rò: NFKD bỏ dấu, đ→d, chữ thường, gộp khoảng trắng (cùng tinh thần foldSql/nameVariants của sync-cloud). */
export const gapChu = (s) => String(s).normalize("NFKD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();

/** Chặn rò: một lá chuỗi hay khoá của detail (đã gập) chứa một chuỗi cấm (đã gập) → ném `LO <nhãn>`. Duyệt cây, không so trên
 * JSON đã escape (chữ có xuống dòng hay dấu nháy vẫn bắt được). Tên nguồn thật (`nhan` «TEN NGUON», real_name ∪ source_ids) đi
 * qua bộ soát tầng A dùng chung (`guardValues` → nameVariants: gập dấu, viết liền, từ đầu) trên cả giá trị lẫn khoá.
 * @param {{nhan: string, chuoi: string}[]} cam */
export function chanLo(detail, cam) {
  const goc = [];
  (function di(x) {
    if (x === null || x === undefined) return;
    if (typeof x === "string") { goc.push(x); return; }
    if (typeof x !== "object") return;
    for (const [k, v] of Object.entries(x)) { goc.push(k); di(v); }
  })(detail);
  const ten = entriesFromTokens(cam.filter((c) => c.nhan === "TEN NGUON").map((c) => c.chuoi));
  if (ten.length && guardValues(goc, ten).length) throw new Error("LO TEN NGUON");
  const la = goc.map(gapChu);
  for (const { nhan, chuoi } of cam) {
    if (nhan === "TEN NGUON") continue;
    const g = chuoi ? gapChu(chuoi) : "";
    if (g && la.some((x) => x.includes(g))) throw new Error(`LO ${nhan}`);
  }
}
