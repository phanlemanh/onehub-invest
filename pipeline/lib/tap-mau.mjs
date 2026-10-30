// tap-mau.mjs — PL8 `tap-nhan-mau-ocp1`: tập tin mẫu của một lát, đáp án biết sẵn vì chính bộ sinh bơm giá trị vào khuôn.
// Spec: docs/superpowers/specs/2026-10-30-tap-nhan-mau-ocp1-design.md. Lệnh: label-mau.mjs. Test: tap-mau.test.mjs.
//
// Hàm thuần: không DB, không ngẫu nhiên, không đồng hồ — cùng (lat, n, seed, bản thư viện khuôn) cho cùng tập từng byte.
// Tập mẫu chỉ đi ra JSONL cho PL9; không có đường nào tới bảng canonical hay stg (L19: dữ liệu giả từng lẫn vào
// sale_offers). Nhãn theo khuôn chuẩn hoá của bộ ghi nhãn PL7 (app/src/lib/labels-normalize.ts).
import { createHash } from "node:crypto";

import { BE, KHUON } from "./khuon-mau-ocp1.mjs";

/** Chín trường của PL7, theo thứ tự trên màn gắn nhãn. */
export const TRUONG = Object.freeze([
  "listing_intent", "kind", "property_type", "project", "building", "price_min_vnd", "price_max_vnd", "area_m2", "bedrooms",
]);

/** Thư viện khuôn theo lát — lát khác OCP1 ngoài vòng PL8. */
const THU_VIEN = Object.freeze({ ocp1: { khuon: KHUON, be: BE } });

const sha = (s) => createHash("sha256").update(s).digest("hex");
/** Chọn tất định một chỉ số trong [0, m) theo khoá. */
const chiSo = (khoa, m) => Number(BigInt("0x" + sha(khoa).slice(0, 12)) % BigInt(m));
const chon = (khoa, ds) => ds[chiSo(khoa, ds.length)];

const VANG = Object.freeze({ value: null, not_stated: true });
const co = (value) => ({ value, not_stated: false });

/** Số thập phân bỏ số 0 thừa, dấu phân cách cho trước: (3150, 1000, ",") → "3,15". */
function thapPhan(so, mau, dau) {
  const nguyen = Math.floor(so / mau);
  const le = String(so % mau).padStart(String(mau).length - 1, "0").replace(/0+$/, "");
  return le ? `${nguyen}${dau}${le}` : String(nguyen);
}
const nhom3 = (so) => String(so).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Dạng viết giá bán (triệu). Mỗi dạng trả chữ và khoảng giá VND. */
const DANG_GIA_BAN = Object.freeze({
  "ty-phay": (v) => ({ chu: `${thapPhan(v, 1000, ",")} tỷ`, min: v, max: v }),
  "ty-cham": (v) => ({ chu: `${thapPhan(v, 1000, ".")} tỷ`, min: v, max: v }),
  "x-ty-y": (v) => ({ chu: `${Math.floor(v / 1000)} tỷ ${String(v % 1000).padStart(3, "0")}`, min: v, max: v }),
  trieu: (v) => ({ chu: `${v} triệu`, min: v, max: v }),
  khoang: (v, hi) => ({ chu: `${thapPhan(v, 1000, ",")}–${thapPhan(hi, 1000, ",")} tỷ`, min: v, max: hi }),
});
/** Dạng viết giá thuê (nghìn). */
const DANG_GIA_THUE = Object.freeze({
  trieu: (v) => ({ chu: `${thapPhan(v, 1000, ",")} triệu`, min: v, max: v }),
  "tr-thang": (v) => ({ chu: `${thapPhan(v, 1000, ",")}tr/tháng`, min: v, max: v }),
  "vnd-du": (v) => ({ chu: nhom3(v * 1000), min: v, max: v }),
});
/** Dạng viết diện tích (phần mười m²); `dau` là dấu thập phân khi có phần lẻ. */
const DANG_DT = Object.freeze({
  m2: (d, dau) => `${thapPhan(d, 10, dau)}m2`,
  "m²": (d, dau) => `${thapPhan(d, 10, dau)} m²`,
  m: (d, dau) => `${thapPhan(d, 10, dau)}m`,
});
const DANG_PN = Object.freeze({ PN: (b) => `${b}PN`, ngu: (b) => `${b} ngủ`, N: (b) => `${b}N` });

/** Nhãn diện tích ở khuôn chuẩn của PL7: «64.5», «64». */
const nhanDt = (d) => thapPhan(d, 10, ".");
/** Chữ tự do như bộ ghi nhãn PL7 (chuanChu): NFC, gộp khoảng trắng, chữ thường. */
const chuanChu = (s) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Bơm giá trị vào một khuôn: chữ tin và nhãn chín trường.
 * @param {import("./khuon-mau-ocp1.mjs").Khuon} kh
 * @param {typeof BE} be
 * @param {string} khoa tiền tố khoá chọn (seed:k)
 */
function bom(kh, be, khoa) {
  const nhan = { listing_intent: co(kh.listing_intent), kind: kh.kind ? co(kh.kind) : VANG, property_type: kh.property_type ? co(kh.property_type) : VANG,
    project: VANG, building: VANG, price_min_vnd: VANG, price_max_vnd: VANG, area_m2: VANG, bedrooms: VANG };
  const o = {
    gia: () => {
      if (kh.kind === "sale") {
        const v = chon(`${khoa}:gia`, be.gia_ban);
        const ten = chon(`${khoa}:gia:dang`, Object.keys(DANG_GIA_BAN));
        const g = DANG_GIA_BAN[ten](v, v + chon(`${khoa}:gia:hi`, be.gia_khoang));
        nhan.price_min_vnd = co(String(BigInt(g.min) * 1_000_000n));
        nhan.price_max_vnd = co(String(BigInt(g.max) * 1_000_000n));
        return g.chu;
      }
      const v = chon(`${khoa}:gia`, be.gia_thue);
      const ten = chon(`${khoa}:gia:dang`, Object.keys(DANG_GIA_THUE));
      const g = DANG_GIA_THUE[ten](v);
      nhan.price_min_vnd = co(String(BigInt(g.min) * 1_000n));
      nhan.price_max_vnd = co(String(BigInt(g.max) * 1_000n));
      return g.chu;
    },
    dt: () => {
      const d = chon(`${khoa}:dt`, be.dt);
      const ten = chon(`${khoa}:dt:dang`, Object.keys(DANG_DT));
      nhan.area_m2 = co(nhanDt(d));
      return DANG_DT[ten](d, chon(`${khoa}:dt:dau`, [",", "."]));
    },
    pn: () => {
      const b = chon(`${khoa}:pn`, be.pn);
      const ten = chon(`${khoa}:pn:dang`, Object.keys(DANG_PN));
      nhan.bedrooms = co(String(b));
      return DANG_PN[ten](b);
    },
    toa: () => {
      const t = chon(`${khoa}:toa`, be.toa);
      nhan.building = co(chuanChu(t));
      return t;
    },
    du_an: () => {
      const p = chon(`${khoa}:du_an`, be.du_an);
      nhan.project = co(chuanChu(p));
      return p;
    },
    sdt: () => be.sdt,
  };
  const text = kh.khung.replace(/\{([a-z_]+)\}/g, (_, ten) => {
    if (!o[ten]) throw new Error(`tap-mau: khuôn ${kh.id} có ô lạ {${ten}}`);
    return o[ten]();
  });
  return { text, nhan: Object.fromEntries(TRUONG.map((f) => [f, nhan[f]])) };
}

/** Băm thư viện khuôn của lát — đổi khuôn hay bể giá trị thì băm đổi, PL9 biết tập cũ không còn sinh lại được. */
export function khuonBan(lat) {
  const tv = THU_VIEN[lat];
  if (!tv) throw new Error(`tap-mau: lát «${lat}» chưa có thư viện khuôn`);
  return sha(JSON.stringify({ khuon: tv.khuon, be: tv.be }));
}

/**
 * Sinh tập tin mẫu. Khuôn đi theo hoán vị băm (seed) rồi lặp vòng — mỗi khuôn xuất hiện đều; dạng viết và giá trị chọn bằng
 * băm `seed:k:ô`; dev/test chia đôi theo băm id (lệch tối đa 1).
 * @param {{ lat: string, n: number, seed: string }} opts
 * @returns {{ lat: string, n: number, seed: string, khuon_ban: string, tin: object[] }}
 */
export function sinhTapMau({ lat, n, seed }) {
  const tv = THU_VIEN[lat];
  if (!tv) throw new Error(`tap-mau: lát «${lat}» chưa có thư viện khuôn`);
  if (!Number.isInteger(n) || n <= 0) throw new Error("tap-mau: n phải là số nguyên dương");
  if (typeof seed !== "string" || seed === "") throw new Error("tap-mau: thiếu seed");
  const thuTu = [...tv.khuon].sort((a, b) => {
    const x = sha(`${seed}:khuon:${a.id}`), y = sha(`${seed}:khuon:${b.id}`);
    return x < y ? -1 : x > y ? 1 : 0;
  });
  const tin = [];
  for (let k = 0; k < n; k++) {
    const kh = thuTu[k % thuTu.length];
    const { text, nhan } = bom(kh, tv.be, `${seed}:${k}`);
    tin.push({ id: `mau-${lat}-${seed}-${k}`, mau: true, lat, khuon: kh.id, split: "test", text, nhan });
  }
  const dev = new Set([...tin].map((t) => t.id).sort((a, b) => {
    const x = sha(`${seed}:split:${a}`), y = sha(`${seed}:split:${b}`);
    return x < y ? -1 : x > y ? 1 : 0;
  }).slice(0, Math.ceil(n / 2)));
  for (const t of tin) if (dev.has(t.id)) t.split = "dev";
  return { lat, n, seed, khuon_ban: khuonBan(lat), tin };
}

/** JSONL: dòng đầu là dấu mẫu của cả tập, sau đó mỗi tin một dòng. */
export function veJsonl(tap) {
  const dau = { loai: "tap-nhan-mau", mau: true, lat: tap.lat, seed: tap.seed, n: tap.n, khuon_ban: tap.khuon_ban };
  return [dau, ...tap.tin].map((x) => JSON.stringify(x)).join("\n") + "\n";
}
