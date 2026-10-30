// do-cam-mau-s03.mjs — hồ sơ _acceptance/s03-cam-mau-so-lieu (N1), AC-9: bảy thước «Bật khi» trên bản chép dữ liệu thật.
// Hai lượt, mỗi lượt BEGIN…ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>):
//   lượt cây — transform-zalo.mjs của cây: mọi thước phải ĐẠT;
//   lượt đối chứng — transform-zalo.mjs của commit nền ghim NEN (trước N1): mỗi thước phụ thuộc transform phải TRƯỢT đúng
//   mốc gốc; noi_nhom_pct đối chứng bằng phép nối sai khoá (group_name thay conversation_id).
// Sai một điều → exit 1, gọi tên thước.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { docPhuongHopLe } from "../lib/osm.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";

const NEN = "c333a342";
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-cam-mau-s03: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}
const PIPE = join(import.meta.dirname, "..");

// Thước dùng bộ gạt và bộ chuẩn hoá RIÊNG, không mượn của transform đang bị đo.
const URL_RE = /https?:\/\/\S+|www\.\S+/gi;
const PHONE_RE = /(?<!\d)(?:\+84|0)(?:[.\-\s]?\d){8,10}(?!\d)/g;
const gat = (t) => (t ?? "").replace(URL_RE, " ").replace(PHONE_RE, " ");
const chuan = (t) => gat(t).normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const bare = (n) => n.normalize("NFC").toLowerCase().replace(/^(quận|huyện|phường|thị xã|thị trấn|xã)\s+/i, "");

async function napModule(nguon) {
  if (nguon === "cay") return import(pathToFileURL(join(PIPE, "transform-zalo.mjs")).href);
  const src = execFileSync("git", ["show", `${NEN}:pipeline/transform-zalo.mjs`], { cwd: PIPE, encoding: "utf8" });
  const f = join(PIPE, `.cm-nen-${process.pid}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

/** Bảy thước sau một lượt transform, trong cùng giao dịch. */
async function demThuoc(c, m, { noiTheo = "conversation_id" } = {}) {
  const { posts } = await loadStgPosts(c, "zalo");
  const bai = new Map(posts.map((p) => [p.post_id, p]));
  const { rows: offers } = await c.query(
    `SELECT offer_id, kind, price_vnd::float8 AS gia, area_id, seller_name, post_ids FROM sale_offers WHERE source = 'S03'`);
  const { rows: don } = await c.query(
    `SELECT group_key, name, market_codes FROM collection_units WHERE source_code = 'S03'`);
  const theoKhoa = new Map(don.map((d) => [noiTheo === "conversation_id" ? d.group_key : d.name, d.market_codes]));
  const khoaBai = (p) => (noiTheo === "conversation_id" ? p.conversation_id : p.group_name);

  // Tên phường chỉ thuộc TP.HCM: không trùng, không chứa / nằm trong tên Hà Nội nào.
  const hn = (await docPhuongHopLe(c, ["vn-hanoi"])).map((a) => bare(a.name));
  const hcm = (await docPhuongHopLe(c, ["vn-hcmc"])).map((a) => bare(a.name));
  const sach = (t, khac) => khac.every((k) => !k.includes(t) && !t.includes(k));
  const chiHcm = hcm.filter((t) => t.length >= 4 && sach(t, hn));
  const coTen = (text, ds) => { const l = text.normalize("NFC").toLowerCase(); return ds.some((t) => l.includes(t)); };

  let thue = 0, ban = 0, url = 0, maxNd = 0, coTenBan = 0, hcmSai = 0;
  for (const o of offers) {
    if (o.kind === "rent_lt" && o.gia >= 1e9) thue++;
    if (o.kind === "sale" && o.gia > 100e9) ban++;
    const ps = o.post_ids.map((id) => bai.get(id)).filter(Boolean);
    if (o.gia != null && ps.some((p) => m.parsePost(p.text).priceVnd === o.gia
      && m.parsePost(p.text.replace(URL_RE, " ")).priceVnd !== o.gia)) url++;
    maxNd = Math.max(maxNd, new Set(ps.map((p) => chuan(p.text))).size);
    if (o.seller_name) coTenBan++;
    const dau = ps[0];
    if (dau && coTen(dau.text, chiHcm) && !coTen(dau.text, hn.filter((t) => t.length >= 4))) {
      const khai = theoKhoa.get(dau.conversation_id) ?? [];
      if ((khai.length === 0 || khai.includes("vn-hcmc")) && !(o.area_id ?? "").startsWith("vn-hcmc-")) hcmSai++;
    }
  }
  const noi = posts.filter((p) => theoKhoa.has(khoaBai(p))).length;
  return {
    thue_tu_1_ty: thue,
    ban_tren_100_ty: ban,
    gia_tu_url: url,
    max_noi_dung_moi_offer: maxNd,
    seller_name_pct: offers.length ? +(100 * coTenBan / offers.length).toFixed(1) : 0,
    noi_nhom_pct: posts.length ? +(100 * noi / posts.length).toFixed(1) : 0,
    hcm_sai_thi_truong: hcmSai,
    _offers: offers.length,
  };
}

// Ngưỡng ĐẠT của lượt cây và mốc gốc phải tái lập ở lượt đối chứng (evals E9).
const DAT = {
  thue_tu_1_ty: (v) => v === 0, ban_tren_100_ty: (v) => v === 0, gia_tu_url: (v) => v === 0,
  max_noi_dung_moi_offer: (v) => v <= 10, seller_name_pct: (v) => v >= 95, noi_nhom_pct: (v) => v >= 95,
  hcm_sai_thi_truong: (v) => v === 0,
};
const MOC_GOC = {
  thue_tu_1_ty: (v) => v >= 1, ban_tren_100_ty: (v) => v >= 1, gia_tu_url: (v) => v >= 1,
  max_noi_dung_moi_offer: (v) => v > 10, seller_name_pct: (v) => v === 0, hcm_sai_thi_truong: (v) => v > 0,
};

async function luot(nguon, opts) {
  const m = await napModule(nguon);
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    const t0 = Date.now();
    await m.runTransformZalo(c);
    const thuoc = await demThuoc(c, m, opts);
    if (opts?.noiSai) thuoc.noi_nhom_pct = (await demThuoc(c, m, { noiTheo: "group_name" })).noi_nhom_pct;
    return { thuoc, giay: ((Date.now() - t0) / 1000).toFixed(0) };
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const loi = [];
const cay = await luot("cay");
console.log(`lượt cây (${cay.giay}s, ${cay.thuoc._offers} offer S03):`);
for (const [k, ok] of Object.entries(DAT)) {
  const v = cay.thuoc[k];
  console.log(`  ${k}=${v} ${ok(v) ? "ĐẠT" : "TRƯỢT"}`);
  if (!ok(v)) loi.push(`lượt cây: ${k}=${v}`);
}
const nen = await luot("nen", { noiSai: true });
console.log(`lượt đối chứng transform ${NEN} (${nen.giay}s, ${nen.thuoc._offers} offer S03):`);
for (const [k, ok] of Object.entries(DAT)) {
  const v = nen.thuoc[k];
  const tai = k === "noi_nhom_pct" ? !ok(v) : MOC_GOC[k](v);
  console.log(`  ${k}=${v} ${ok(v) ? "ĐẠT" : "TRƯỢT"}${tai ? "" : " — KHÔNG tái lập mốc gốc"}`);
  if (!tai) loi.push(`đối chứng: ${k}=${v} không tái lập mốc gốc`);
}
if (loi.length) {
  console.error(`do-cam-mau-s03: ${loi.length} lỗi — ${loi.join("; ")}`);
  process.exit(1);
}
console.log("do-cam-mau-s03: bảy thước ĐẠT ở lượt cây; đối chứng tái lập mốc gốc từng thước");
