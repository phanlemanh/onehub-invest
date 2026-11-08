// nap-dvhc-do.mjs — PX1 danh-ba-phuong-xa-toan-quoc AC-9: thước tin có xã TRƯỚC/SAU khi nạp danh bạ, theo tỉnh.
// Chạy trên DB thử (bản chép DB máy thu): bash ../db/db-thu.sh oneinvest_suite_px1do --chay node scripts/nap-dvhc-do.mjs
// Một giao dịch, luôn ROLLBACK — DB thử không đổi.
//   «trước» = area_id đang lưu trên sale_offer_records (kết quả transform nhánh chính), nối với stg: S06 theo
//            mintOfferId("S06", list_id); S03 tin một bài theo post_ids. Tin gộp nhiều bài, S05 không vào so sánh.
//   đối chứng code = hàm gán MỚI chạy trước khi nạp phải ra đúng area_id đang lưu (bắt nhánh rơi khi tách hàm).
//   «sau» = áp 084 (nếu chưa) + napDvhc trong cùng giao dịch, gán lại bằng cùng hàm.
// Thoát 1: đối chứng lệch, tỉnh giảm, tin mất xã, tin đổi xã ngoài doi-xa-khai-truoc.json.
// doi-xa-khai-truoc.json: mảng mã tin, hoặc luật {"luat":"v3-xa-moi"} — tin S06 có trường phường chuẩn 2025
//   (ward_name_v3) trỏ đúng một xã vừa chèn từ danh bạ, trước đó bị khớp chữ vào xã khác vì xã ấy chưa có trong areas.
//   --doi-chung-hong   đặt tập nhóm S03 chưa khai = mọi tỉnh có xã (chiều đỏ của thước, phải thoát 1)
import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

import { soSanhTruocSau } from "../lib/dvhc.mjs";
import { khoaNhomThat } from "../lib/eval-labels.mjs";
import { mintOfferId } from "../lib/offer-key.mjs";
import { docBiDanhAnToan, docPhuongHopLe, docThiTruongCoPhuong, docThiTruongCoXa } from "../lib/osm.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { thiTruongCua } from "../lib/thi-truong.mjs";
import { napDvhc } from "../nap-dvhc.mjs";
import { ganPhuongS06 } from "../transform-chotot.mjs";
import { docThiTruongNhom, ganKhuVuc, ganPhuongS03 } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const MIG_084 = readFileSync(join(ROOT, "db/migrations/084_danh_ba_dvhc.sql"), "utf8");
const KHAI_TRUOC = join(ROOT, "_acceptance/danh-ba-phuong-xa-toan-quoc/doi-xa-khai-truoc.json");
const HONG = process.argv.includes("--doi-chung-hong");
const IM = { log() {}, warn() {} };

const normS06 = (s) => (s ?? "").normalize("NFC").toLowerCase().replace(/^(phường|xã|thị trấn|thị xã)\s+/i, "").trim();
const veKhoaNhom = (p) => (p.conversation_id == null ? p : { ...p, conversation_id: khoaNhomThat(p.conversation_id) });

/** Bối cảnh gán của cả hai transform, đọc bằng chính bộ đọc của transform. */
async function dungBoiCanh(c, { hong = false } = {}) {
  const coXa = await docThiTruongCoXa(c);
  const areas = await docPhuongHopLe(c, coXa);
  const biDanhCua = await docBiDanhAnToan(c, coXa);
  const moiThiTruong = hong ? coXa : await docThiTruongCoPhuong(c);
  const { rows: mk } = await c.query(`SELECT id FROM areas WHERE region_type = 'market'`);
  const maCoThat = new Set(mk.map((r) => r.id));
  const byCity = new Map(coXa.map((m) => [m, new Map(areas.filter((a) => a.parent_id === m).map((a) => [normS06(a.name), a.id]))]));
  const slugLists = new Map(coXa.map((m) => [m, areas.filter((a) => a.parent_id === m).map((a) => [a.id.slice(m.length + 1), a.name])]));
  const cache = new Map();
  const entries = (ms) => {
    const k = [...ms].sort().join(",");
    if (!cache.has(k)) {
      const set = new Set(ms);
      cache.set(k, areas.filter((a) => set.has(a.parent_id)).map((a) => ({ id: a.id, name: a.name, market: a.parent_id })));
    }
    return cache.get(k);
  };
  return { byCity, slugLists, biDanhCua, moiThiTruong, entries, maCoThat };
}

function ganS06(ad, bc) {
  const mk = thiTruongCua(ad.city_code, bc.maCoThat);
  return ganPhuongS06(ad, { mk, wardMap: bc.byCity.get(mk), biDanh: bc.biDanhCua.get(mk), slugList: bc.slugLists.get(mk) });
}

function ganS03(p, khai, bc) {
  const { ph, cach } = ganPhuongS03(p.text, khai, bc);
  const kv = ganKhuVuc({ khai, ph, maCoThat: bc.maCoThat });
  return { areaId: kv.areaId, cach: ph ? (cach === "bi-danh" ? "bi-danh" : "ten") : null };
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const { rows: [db] } = await c.query("SELECT current_database() AS d");
  if (db.d === "oneinvest") throw new Error("nap-dvhc-do: chạy trên DB thử (db/db-thu.sh --chay), không chạy trên oneinvest dùng chung");
  let loi = [];
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const { rows: [dem0] } = await c.query(`SELECT (SELECT count(*) FROM areas)::int AS a`);
    console.log(`trước: areas ${dem0.a}`);

    // ---- Tin nối được với stg ----
    const { rows: ads } = await c.query(
      `SELECT list_id, city_code, ward_name_v3, ward_name, subject, area_name FROM stg_chotot_ads WHERE price > 0 AND size_m2 > 0`,
    );
    const { rows: luu } = await c.query(`SELECT offer_id, area_id, post_ids FROM sale_offer_records WHERE retired_at IS NULL`);
    const luuTheoOffer = new Map(luu.map((r) => [r.offer_id, r.area_id]));
    const offerTheoBai = new Map();
    for (const r of luu) if (Array.isArray(r.post_ids) && r.post_ids.length === 1) offerTheoBai.set(String(r.post_ids[0]), r);
    const s06 = ads.map((ad) => ({ ad, offer: mintOfferId("S06", String(ad.list_id)) })).filter((x) => luuTheoOffer.has(x.offer));
    const { posts } = await loadStgPosts(c, "zalo");
    const s03 = posts.map(veKhoaNhom).map((p) => ({ p, o: offerTheoBai.get(String(p.post_id)) })).filter((x) => x.o);
    const thiTruongNhom = await docThiTruongNhom(c, khoaNhomThat);

    // ---- Đối chứng code: hàm mới trên DB chưa nạp = area_id đang lưu ----
    const bcTruoc = await dungBoiCanh(c);
    const lech = [];
    for (const { ad, offer } of s06) {
      const g = ganS06(ad, bcTruoc);
      const hieuLuc = g.areaId ?? luuTheoOffer.get(offer); // S06 ghi COALESCE(mới, cũ)
      if (hieuLuc !== luuTheoOffer.get(offer)) lech.push(`S06 ${offer}: lưu ${luuTheoOffer.get(offer)} · mới ${hieuLuc}`);
    }
    for (const { p, o } of s03) {
      const g = ganS03(p, thiTruongNhom.get(p.conversation_id), bcTruoc);
      if (g.areaId !== o.area_id) lech.push(`S03 ${o.offer_id}: lưu ${o.area_id} · mới ${g.areaId}`);
    }
    console.log(`tin nối được: S06 ${s06.length}/${ads.length} · S03 ${s03.length} bài một-bài/${posts.length} bài`);
    console.log(`đối chứng code: lệch ${lech.length}`);
    for (const l of lech.slice(0, 10)) console.log(`  · ${l}`);
    if (lech.length) loi.push(`PX1-AC-9 đối chứng code lệch: ${lech.length}`);

    const arrTruoc = (await c.query(`SELECT id FROM areas`)).rows.map((r) => r.id);
    // ---- Nạp danh bạ trong giao dịch ----
    const { rows: [co] } = await c.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'admin_code') AS ok`,
    );
    if (!co.ok) await c.query(MIG_084);
    await napDvhc(c, { log: IM });
    const bcSau = await dungBoiCanh(c, { hong: HONG });

    // ---- So trước/sau theo tỉnh ----
    const { rows: arr } = await c.query(`SELECT id, region_type, parent_id FROM areas WHERE country_code = 'vn'`);
    const kv = new Map(arr.map((r) => [r.id, r]));
    const tinhCua = (id) => (!id ? null : kv.get(id)?.region_type === "market" ? id : kv.get(id)?.parent_id ?? null);
    const laXa = (id) => !!id && kv.get(id)?.region_type === "submarket";
    const dong = [];
    for (const { ad, offer } of s06) {
      const truoc = luuTheoOffer.get(offer);
      const g = ganS06(ad, bcSau);
      const sau = g.areaId ?? truoc;
      dong.push({ ma: offer, tinh: tinhCua(truoc) ?? tinhCua(sau), truoc, sau, cachSau: g.cach === "bi-danh" ? "bi-danh" : "ten",
        cach: g.cach, chiTiet: `S06 v3=${ad.ward_name_v3} ward=${ad.ward_name} cách=${g.cach}` });
    }
    for (const { p, o } of s03) {
      const g = ganS03(p, thiTruongNhom.get(p.conversation_id), bcSau);
      dong.push({ ma: o.offer_id, tinh: tinhCua(o.area_id) ?? tinhCua(g.areaId), truoc: o.area_id, sau: g.areaId, cachSau: g.cach,
        chiTiet: `S03 cách=${g.cach}` });
    }
    let khai = [];
    try { khai = JSON.parse(readFileSync(KHAI_TRUOC, "utf8")); } catch { /* chưa khai */ }
    const maKhai = new Set(khai.filter((k) => typeof k === "string"));
    const luat = new Set(khai.filter((k) => k && typeof k === "object").map((k) => k.luat));
    const daCoTruoc = new Set(arrTruoc);
    const khaiTruoc = (d) => maKhai.has(d.ma) || (luat.has("v3-xa-moi") && d.cach === "v3" && !daCoTruoc.has(d.sau));
    const kq = soSanhTruocSau(dong, { laXa, khaiTruoc });
    console.log("tỉnh | tin | có xã trước | có xã sau | mất xã | đổi xã | đổi đã khai | mới qua tên | mới qua bí danh");
    const tong = { tin: 0, truoc: 0, sau: 0, matXa: 0, doiXa: 0, doiKhai: 0, moiTen: 0, moiBiDanh: 0 };
    for (const r of kq.bang) {
      console.log(`${r.tinh} | ${r.tin} | ${r.truoc} | ${r.sau} | ${r.matXa} | ${r.doiXa} | ${r.doiKhai} | ${r.moiTen} | ${r.moiBiDanh}`);
      for (const k of Object.keys(tong)) tong[k] += r[k];
    }
    console.log(`tổng | ${tong.tin} | ${tong.truoc} | ${tong.sau} | ${tong.matXa} | ${tong.doiXa} | ${tong.doiKhai} | ${tong.moiTen} | ${tong.moiBiDanh}`);
    const theoMa = new Map(dong.map((d) => [d.ma, d]));
    for (const [k, v] of Object.entries(kq.mau)) {
      if (!v.length) continue;
      console.log(`mẫu ${k} (${v.length}):`);
      for (const m of v.slice(0, 5)) { const d = theoMa.get(m); console.log(`  · ${m}: ${d.truoc} → ${d.sau} · ${d.chiTiet}`); }
    }
    // Tập khai trước: tin Hưng Yên, tin không tỉnh, tin HN/HCM chỉ gắn tỉnh
    const tap = (f) => dong.filter(f);
    const moi = (ds) => ds.filter((d) => !laXa(d.truoc) && laXa(d.sau)).length;
    const hy = tap((d) => d.tinh === "vn-hung-yen");
    const kt = tap((d) => !d.tinh);
    const chiTinh = tap((d) => ["vn-hanoi", "vn-hcmc"].includes(d.truoc));
    console.log(`tập khai trước: Hưng Yên ${hy.length} tin (gắn mới ${moi(hy)}) · không tỉnh ${kt.length} (gắn mới ${moi(kt)}) · HN/HCM chỉ gắn tỉnh ${chiTinh.length} (gắn mới ${moi(chiTinh)})`);
    loi = loi.concat(kq.do);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    const { rows: [dem1] } = await c.query(`SELECT (SELECT count(*) FROM areas)::int AS a`).catch(() => ({ rows: [{}] }));
    console.log(`sau ROLLBACK: areas ${dem1.a}`);
    await c.end();
  }
  for (const l of loi) console.log(l);
  if (loi.length) { process.exitCode = 1; return; }
  console.log("PX1-AC-9 xanh");
}

await main();
