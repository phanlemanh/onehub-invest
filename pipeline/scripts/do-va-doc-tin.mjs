// do-va-doc-tin.mjs — hồ sơ _acceptance/s03-va-doc-tin (SV1), AC-9: chấm bộ đọc trên tập nhãn audit 02/11 và toàn bộ bài S03 thật.
// Nhãn do tác tử gắn, KHÔNG phải nhãn vàng. Tập nằm ở research-local/ (kho công khai nên không vào kho); thiếu tập → exit 2.
// Chỉ đọc: DB mở BEGIN READ ONLY, không ghi gì, không chạy transform.
// Chia tập theo băm post_id: 2/3 để chỉnh, 1/3 giữ lại (không in lỗi). Lượt cây phải ĐẠT mọi thước; lượt bản nền ghim NEN chạy
// cùng thước phải TRƯỢT các thước pn, dt_phay, phuong_huong, không thì thước không đo gì. Sai → exit 1, gọi tên thước.
//   --loi   in lỗi của phần để chỉnh (chữ bài, chỉ dùng ở máy này), không chấm đạt/trượt.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { assignOfferIds } from "../lib/offer-key.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";

const NEN = "b96dd58b546f8efcd804b40a4b418d7d98cab9c1";
// Tập ghim trước khi chỉnh: sửa nhãn hay đổi cách chia để qua thước thì đỏ ở đây.
const BAM_NHAN = "cd87c30187705c46a026d93951f54f0929d76cda2658f205465eb11d15828ea1";
// Trần mức đổi trên dữ liệu thật (Hỏi-1). Vượt trần thì không mở PR, trình lại.
const TRAN = { nghi: 200, moc: 500, s05: 0.25, dung_thanh_sai: 3 };
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "..");
const LOI = process.argv.includes("--loi");

/** Tập nhãn: research-local/ của cây, rồi của checkout chính (worktree khác không có). */
function timTap() {
  const goc = [join(import.meta.dirname, "..", "..")];
  try {
    const chung = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: import.meta.dirname, encoding: "utf8" }).trim();
    goc.push(dirname(chung));
  } catch { /* không phải kho git: chỉ xét cây */ }
  for (const g of goc) {
    const d = join(g, "research-local", "s03-audit-0211");
    if (existsSync(join(d, "labels_all.json")) && existsSync(join(d, "sample_full.json"))) return d;
  }
  console.error("do-va-doc-tin: thiếu tập nhãn research-local/s03-audit-0211 (labels_all.json, sample_full.json); không chấm");
  process.exit(2);
}
const TAP = timTap();
const rawNhan = readFileSync(join(TAP, "labels_all.json"));
const bamNhan = createHash("sha256").update(rawNhan).digest("hex");
const nhan = new Map(JSON.parse(rawNhan.toString("utf8")));
const mau = JSON.parse(readFileSync(join(TAP, "sample_full.json"), "utf8"));
// Không có muối: phần giữ lại = 8 hex đầu của sha1(post_id) chia 3 dư 0.
const laGiuLai = (id) => parseInt(createHash("sha1").update(id).digest("hex").slice(0, 8), 16) % 3 === 0;

// Họ nhóm theo tên nhóm (audit §3), bảng cố định của hợp đồng; họ «khac» là phần còn lại.
const HO = [["grand-park", /grand\s*park|vhgp|\bvgp\b|rainbow|origami|\bori\b|glory\s*height|beverly|lumi[eè]re\s*b/iu],
  ["ocean-park", /ocean\s*park|oceanpark|\bocp\s*\d?\b|\bvhop\s*\d?\b|gia\s*lâm|sapphire|\bruby\b|zenpark|hawaii/iu],
  ["smart-city", /smart\s*city|\bvhsc\b|\bvsc\b|tây\s*mỗ|sakura|tonkin/iu]];
const hoCua = (s) => HO.find(([, re]) => re.test(`${s.g ?? ""} ${s.group ?? ""}`))?.[0] ?? "khac";

async function napBanSao(src, ten) {
  const f = join(PIPE, `.sv1-${ten}-${process.pid}.mjs`);
  writeFileSync(f, src);
  try { return await import(pathToFileURL(f).href); } finally { rmSync(f, { force: true }); }
}
const nen = await napBanSao(execFileSync("git", ["show", `${NEN}:pipeline/transform-zalo.mjs`], { cwd: import.meta.dirname, encoding: "utf8" }), "nen");
const cay = await import(pathToFileURL(join(PIPE, "transform-zalo.mjs")).href);

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let posts, phuong, moiTT, nhomTT, tinCu, postsS05;
try {
  await c.query("BEGIN READ ONLY");
  ({ moiThiTruong: moiTT, phuong } = await cay.docDanhSachPhuong(c));
  ({ posts } = await loadStgPosts(c, "zalo"));
  ({ posts: postsS05 } = await loadStgPosts(c, "facebook"));
  nhomTT = await cay.docThiTruongNhom(c);
  ({ rows: tinCu } = await c.query(`SELECT offer_id, originating_system_key, post_ids, retired_at, block_raw FROM sale_offer_records WHERE source = 'S03'`));
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}

/** So một trường với nhãn theo luật của audit: giá lệch ≤ 2%, DT ≤ 5%, PN bằng; giá che tính đúng khi nằm trong khoảng nhãn. */
function dung(truong, ra, t) {
  if (truong === "price_vnd" && t.price_vnd == null && t.price_low) {
    const hi = t.price_high ?? t.price_low;
    return ra != null && t.price_low * 0.98 <= ra && ra <= hi * 1.02;
  }
  if (t[truong] == null || ra == null) return false;
  if (truong === "price_vnd") return Math.abs(ra - t.price_vnd) <= 0.02 * Math.max(ra, t.price_vnd);
  if (truong === "area_m2") return Math.abs(ra - t.area_m2) <= 0.05 * Math.max(ra, t.area_m2, 1);
  return ra === t[truong];
}
const coTrongChu = (truong, t) => t[truong] != null || (truong === "price_vnd" && t.price_low != null);
const raCua = { price_vnd: "priceVnd", area_m2: "areaM2", bedrooms: "bedrooms" };
const gon = (s) => (s ?? "").toUpperCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Chấm một bộ đọc trên tập nhãn. Trả số đúng/có theo trường, phần và họ. */
function chamNhan(mod, tuyChon) {
  const kq = {};
  const cong = (k, d) => { kq[k] ??= [0, 0]; kq[k][1]++; if (d) kq[k][0]++; };
  for (const s of mau) {
    const t = nhan.get(s.post_id);
    if (t?.intent !== "offer") continue;
    const pr = mod.parsePost(s.text, tuyChon);
    const phan = laGiuLai(s.post_id) ? "giu" : "chinh";
    const ho = hoCua(s);
    for (const truong of Object.keys(raCua)) {
      if (!coTrongChu(truong, t)) continue;
      const d = dung(truong, pr[raCua[truong]], t);
      for (const k of [truong, `${truong}:${phan}`, `${truong}:${ho}`]) cong(k, d);
    }
    const unit = mod.docToaTruc ? mod.docToaTruc(s.text).unit : null;
    if (t.unit_code) {
      const a = gon(unit), b = gon(t.unit_code);
      const d = a && (a === b || a.includes(b) || b.includes(a));
      for (const k of ["unit", `unit:${phan}`]) cong(k, d);
    } else for (const k of ["unit_thua", `unit_thua:${phan}`]) cong(k, !!unit);
  }
  return kq;
}
const tile = ([a, b] = [0, 0]) => (b ? a / b : 0);
const hien = (x = [0, 0]) => `${x[0]}/${x[1]}`;

/** Số ô bản nền đúng mà bộ đọc đang chấm làm sai (số ròng của thước giá không thấy được phần này). */
function demDungThanhSai(mod) {
  let n = 0;
  for (const s of mau) {
    const t = nhan.get(s.post_id);
    if (t?.intent !== "offer") continue;
    const a = nen.parsePost(s.text), b = mod.parsePost(s.text);
    for (const truong of Object.keys(raCua)) {
      if (coTrongChu(truong, t) && dung(truong, a[raCua[truong]], t) && !dung(truong, b[raCua[truong]], t)) n++;
    }
  }
  return n;
}

/** Đi đúng đường đọc của runTransformZalo, không ghi: nhóm tin và các đếm. */
function nhomTin(mod, tuyChon) {
  const doc = posts.map((p) => ({ p, pr: mod.parsePost(p.text, tuyChon) }));
  const muc = mod.mucDichNhom(doc.map(({ p, pr }) => ({ conversation_id: p.conversation_id, group_name: p.group_name, kind: pr.kind })));
  const nhom = new Map();
  const dem = { ban: 0, ban_duoi_300tr: 0, thue: 0, phuong_huong: 0, dt_phay_sai: 0, doi_loai_thue_ty: 0 };
  const cacheEntries = new Map();
  const entries = (ms) => {
    const k = [...ms].sort().join(",");
    if (!cacheEntries.has(k)) { const set = new Set(ms); cacheEntries.set(k, phuong.filter((e) => set.has(e.market))); }
    return cacheEntries.get(k);
  };
  for (const { p, pr } of doc) {
    const phay = (p.text ?? "").match(/(?<![\d.,])(\d{1,4},\d{1,2})\s*m[²2]/iu);
    if (phay && pr.areaM2 !== parseFloat(phay[1].replace(",", ".")) && (pr.areaM2 ?? 0) < 15) dem.dt_phay_sai++;
    pr.kind = mod.suyLoai(pr, p.text, muc.get(p.conversation_id ?? "")).kind;
    if (!pr.kind) continue;
    const truoc = pr.kind;
    mod.chinhLoaiThueTy?.(pr, p.text);
    if (truoc !== pr.kind) dem.doi_loai_thue_ty++;
    if (mod.lyDoGiaPhiLy(pr)) continue;
    const khai = nhomTT.get(p.conversation_id);
    const ph = mod.matchPhuongThiTruong(p.text, entries(khai?.length ? khai : moiTT));
    if (ph) { pr.phuong = ph.slug; pr.areaId = ph.id; }
    if (ph && /(?:^|-)(?:tay|dong)-(?:nam|bac)$/.test(ph.slug) && !/(?:phường|xã|(?<![\p{L}])p\.?)\s*(?:tây|đông)\s*(?:nam|bắc)/iu.test(p.text.normalize("NFC"))) dem.phuong_huong++;
    if (!pr.pricePerm2Vnd && pr.priceVnd && pr.areaM2) pr.pricePerm2Vnd = Math.round(pr.priceVnd / pr.areaM2);
    if (pr.priceVnd === null && pr.pricePerm2Vnd === null) continue;
    const k = mod.repostKey(pr, p);
    if (!nhom.has(k)) nhom.set(k, { kind: pr.kind, price: pr.priceVnd, units: new Set(), noiDung: k.split("|").slice(0, 5).join("|"), posts: [] });
    const o = nhom.get(k);
    if (pr.unit) o.units.add(pr.unit.toUpperCase());
    o.posts.push({ post_id: p.post_id, posted_at: p.posted_at });
  }
  for (const o of nhom.values()) {
    if (o.kind === "sale") { dem.ban++; if (o.price != null && o.price < 3e8) dem.ban_duoi_300tr++; } else dem.thue++;
  }
  return { nhom: [...nhom.values()], dem };
}

function chamThuoc(mod, ten) {
  const n = chamNhan(mod, undefined);
  const baiNen = chamNhan(nen, undefined);
  const tat = chamNhan(mod, { giaKhongDonVi: false });
  const that = nhomTin(mod);
  const thatTat = nhomTin(mod, { giaKhongDonVi: false });
  const HO_TEN = ["", ...HO.map(([h]) => `:${h}`), ":khac"];
  const khongTut = (a, b) => HO_TEN.filter((h) => (a[`price_vnd${h}`]?.[0] ?? 0) < (b[`price_vnd${h}`]?.[0] ?? 0));
  const tutNen = khongTut(n, baiNen), tutKdv = khongTut(n, tat);
  const dungThanhSai = demDungThanhSai(mod);
  const haiTruc = that.nhom.filter((o) => o.units.size > 1).length;
  const t = [
    ["pn", tile(n.bedrooms) >= 0.9 && tile(n["bedrooms:giu"]) >= 0.85, `toàn tập ${hien(n.bedrooms)}, giữ lại ${hien(n["bedrooms:giu"])}`],
    ["dt_phay", that.dem.dt_phay_sai === 0, `${that.dem.dt_phay_sai} bài thật còn đọc sai DT có phẩy; nhãn ${hien(n.area_m2)}`],
    ["phuong_huong", that.dem.phuong_huong === 0, `${that.dem.phuong_huong} bài thật đọc phường từ hướng`],
    ["gia_khong_tut_nen", tutNen.length === 0, `cây ${hien(n.price_vnd)}, nền ${hien(baiNen.price_vnd)}, giữ lại ${hien(n["price_vnd:giu"])}; họ tụt: ${tutNen.join(",") || "không"}`],
    ["gia_kdv_khong_tut", tutKdv.length === 0 && that.dem.ban_duoi_300tr <= thatTat.dem.ban_duoi_300tr, `bật ${hien(n.price_vnd)}, tắt ${hien(tat.price_vnd)}; họ tụt: ${tutKdv.join(",") || "không"}; bán < 300 triệu bật ${that.dem.ban_duoi_300tr}, tắt ${thatTat.dem.ban_duoi_300tr}`],
    ["dung_thanh_sai", dungThanhSai <= TRAN.dung_thanh_sai, `${dungThanhSai} ô bản nền đúng nay sai, trần ${TRAN.dung_thanh_sai}`],
    ["hai_truc", haiTruc === 0, `${haiTruc} tin mang hai trục`],
    ["cong_tac_co_tac_dung", ten === "bản nền" || tile(n.price_vnd) !== tile(tat.price_vnd), `bật ${hien(n.price_vnd)}, tắt ${hien(tat.price_vnd)}`],
    ["ma_can", tile(n.unit) >= 0.7 && tile(n.unit_thua) <= 0.1, `đúng ${hien(n.unit)} (giữ lại ${hien(n["unit:giu"])}), thừa ${hien(n.unit_thua)} (giữ lại ${hien(n["unit_thua:giu"])})`],
  ];
  console.log(`--- lượt ${ten} (nhãn do tác tử gắn, không phải nhãn vàng), công tắc giá không đơn vị: mặc định ---`);
  console.log(`giá đúng theo họ: ${HO_TEN.map((h) => `${h.slice(1) || "toàn tập"} ${hien(n[`price_vnd${h}`])}`).join(" · ")}`);
  for (const [k, d, so] of t) console.log(`${d ? "ĐẠT  " : "TRƯỢT"} ${k}: ${so}`);
  return { t, n, that };
}

if (LOI) {
  for (const s of mau) {
    if (laGiuLai(s.post_id)) continue;
    const t = nhan.get(s.post_id);
    if (t?.intent !== "offer") continue;
    const pr = cay.parsePost(s.text);
    const hong = [];
    for (const truong of Object.keys(raCua)) if (coTrongChu(truong, t) && !dung(truong, pr[raCua[truong]], t)) hong.push(`${truong}: ra ${pr[raCua[truong]]}, nhãn ${t[truong] ?? `${t.price_low}-${t.price_high}`}`);
    const u = cay.docToaTruc(s.text).unit;
    if (t.unit_code && !(u && (gon(u).includes(gon(t.unit_code)) || gon(t.unit_code).includes(gon(u))))) hong.push(`unit: ra ${u}, nhãn ${t.unit_code}`);
    if (!t.unit_code && u) hong.push(`unit thừa: ${u}`);
    if (hong.length) console.log(`${hong.join(" · ")}\n  ${(s.text ?? "").replace(/(?<!\d)(?:\+84|0)(?:[.\-\s]?\d){8,10}(?!\d)/g, "#").replace(/\s+/g, " ").slice(0, 170)}`);
  }
  process.exit(0);
}

console.log(`tập: ${TAP} · sha256 nhãn ${bamNhan} · chia sha1(post_id) mod 3 không muối · bản nền ${NEN}`);
if (bamNhan !== BAM_NHAN) {
  console.error(`do-va-doc-tin: tập nhãn đã đổi so với bản ghim ${BAM_NHAN}; không chấm`);
  process.exit(1);
}
const trenNhanh = execFileSync("git", ["log", "--format=", "--name-only", "origin/main..HEAD", "--", ":/db/migrations"], { cwd: import.meta.dirname, encoding: "utf8" }).trim();
const chuaCommit = execFileSync("git", ["status", "--porcelain", "--", ":/db/migrations"], { cwd: import.meta.dirname, encoding: "utf8" }).trim();

const cuaCay = chamThuoc(cay, "cây");
const cuaNen = chamThuoc(nen, "bản nền");
let hong = false;
for (const [k, d] of cuaCay.t) if (!d) { console.error(`do-va-doc-tin: thước ${k} trượt ở lượt cây`); hong = true; }
for (const k of ["pn", "dt_phay", "phuong_huong"]) {
  if (cuaNen.t.find(([x]) => x === k)[1]) { console.error(`do-va-doc-tin: thước ${k} không trượt ở bản nền, thước không đo gì`); hong = true; }
}

const songCu = tinCu.filter((o) => !o.retired_at);
const khoa = assignOfferIds("S03", cuaCay.that.nhom.map((o) => ({ posts: o.posts })), tinCu);
const moi = new Set(khoa.map((k) => k.offer_id));
const giu = songCu.filter((o) => moi.has(o.offer_id)).length;
const nghi = songCu.length - giu, moc = moi.size - giu;
const baiTheoId = new Map(posts.map((p) => [p.post_id, p]));
const toaMoi = (o) => { for (const id of o.post_ids) { const p = baiTheoId.get(id); const b = p && cay.docToaTruc(p.text).block; if (b) return b; } return null; };
let oToaThem = 0, oToaDoi = 0;
for (const o of songCu) {
  const b = toaMoi(o);
  if (!b) continue;
  if (!o.block_raw) oToaThem++;
  else if (o.block_raw.toUpperCase() !== b) oToaDoi++;
}
const coTruc = new Set(cuaCay.that.nhom.filter((o) => o.units.size).map((o) => o.noiDung));
const tachThieuMa = cuaCay.that.nhom.filter((o) => !o.units.size && coTruc.has(o.noiDung)).length;
console.log(`số tin: ${songCu.length} → ${moi.size} · offer_id giữ ${giu}, nghỉ ${nghi}, mọc ${moc}`);
console.log(`bán ${cuaCay.that.dem.ban} (nền ${cuaNen.that.dem.ban}), thuê ${cuaCay.that.dem.thue} (nền ${cuaNen.that.dem.thue}), bài đổi loại thuê từ 1 tỷ ${cuaCay.that.dem.doi_loai_thue_ty}; tin có trục ${cuaCay.that.nhom.filter((o) => o.units.size).length}`);
console.log(`ô block_raw: thêm ${oToaThem}, đổi so với giá trị đang có ${oToaDoi}; tin không mã cùng nội dung với tin có trục (giữ tách, không chứng được cùng căn) ${tachThieuMa}`);
const TRUONG = ["kind", "priceVnd", "pricePerm2Vnd", "areaM2", "bedrooms"];
const doiS05 = postsS05.filter((p) => { const a = nen.parsePost(p.text), b = cay.parsePost(p.text); return TRUONG.some((k) => a[k] !== b[k]); }).length;
console.log(`S05 dùng chung bộ đọc: ${doiS05}/${postsS05.length} bài đổi đầu ra (không có nhãn S05)`);
const vuot = [
  [nghi > TRAN.nghi, `nghỉ ${nghi} > ${TRAN.nghi}`],
  [moc > TRAN.moc, `mọc ${moc} > ${TRAN.moc}`],
  [doiS05 > TRAN.s05 * postsS05.length, `S05 đổi ${doiS05}/${postsS05.length} > ${TRAN.s05 * 100}%`],
  [trenNhanh !== "" || chuaCommit !== "", `có migration mới: ${trenNhanh} ${chuaCommit}`],
];
for (const [co, ly] of vuot) if (co) { console.error(`do-va-doc-tin: vượt trần: ${ly}`); hong = true; }
if (hong) process.exit(1);
console.log("do-va-doc-tin: ĐẠT");
