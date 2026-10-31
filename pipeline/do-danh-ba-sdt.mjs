#!/usr/bin/env node
// do-danh-ba-sdt.mjs — SD5 `do-danh-ba-sdt`: đo trục SĐT của danh bạ Người (audit docs/research/audit-bang-nguoi-sdt-3010.md
// §0 N1–N5, câu đo §7) theo nguồn S03, S05.
//   node pipeline/do-danh-ba-sdt.mjs           in bảng năm số
//   node pipeline/do-danh-ba-sdt.mjs --write   ghi dq_check_results, một dòng mỗi (kiểm, đối tượng) mỗi ngày giờ máy thu
// Đọc trong giao dịch chỉ đọc. Ghi: một giao dịch xoá dòng cùng kiểm + đối tượng của ngày hôm nay rồi chèn. Chỉ số đếm lên
// dq_check_results (bảng lên cloud) — không SĐT, không khoá băm, không tên. Dòng `fail` không đổi mã thoát.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { extractPhones } from "./transform-zalo.mjs";
import { loadStgPosts } from "./lib/test-posts.mjs";
import { ALIAS_KIND } from "./lib/vocab.generated.mjs";

export const NGUON = Object.freeze(["S03", "S05"]);
const KENH = Object.freeze({ S03: "zalo", S05: "facebook" });
/** Bí danh SĐT: dạng băm hôm nay, dạng số gốc sau SD3 (Hỏi-A). */
export const KIEU_BI_DANH_SDT = Object.freeze([ALIAS_KIND.sdt_bam, ALIAS_KIND.sdt]);
export const MUI_GIO = "Asia/Ho_Chi_Minh";
/** Ngưỡng đạt (Hỏi-1, Mạnh duyệt 31/10). */
export const NGUONG_N2 = 10;
const TRAN_SO_MOI_BAI = 3; // trần của extractPhones

/** Bộ dò rộng của audit §7: chữ số xen tối đa 3 ký tự tách, nhận «o» thay «0», gom về 10 số đầu di động, trả dạng E.164. */
const DO_RONG = /(?<!\d)(?:\(?\+?84\)?|0|[oO])(?:[\s.\-_,/()·•*]{0,3}[\doO]){8,10}(?!\d)/g;
export function doRong(text) {
  const out = new Set();
  for (const m of (text ?? "").matchAll(DO_RONG)) {
    let so = m[0].replace(/[oO]/g, "0").replace(/\D/g, "");
    if (so.startsWith("84")) so = "0" + so.slice(2);
    so = so.slice(0, 10);
    if (/^0[35789]\d{8}$/.test(so)) out.add("+84" + so.slice(1)); // SD3: cùng dạng E.164 với bộ bóc
  }
  return out;
}

/**
 * Năm số theo nguồn — hàm thuần. Đầu vào:
 * - `tin`: tin sống `{source, seller_phone, seller_phone_hash, post_ids}`;
 * - `bai`: Map post_id → `{sender_id, text}` của nguồn;
 * - `biDanh`: bí danh SĐT còn hiệu lực `{object_key, kind, value, source}`;
 * - `daGop`: Set party_key đã `merged`; `coVai`: Set party_key có vai chưa rút;
 * - `sellers`, `sdtTrenTin`: hai số đếm của N3.
 */
export function tinhSo({ tin, bai, biDanh, daGop, coVai, sellers, sdtTrenTin }) {
  const kq = {};
  for (const nguon of NGUON) {
    const tinNguon = tin.filter((t) => t.source === nguon);
    const baiNguon = bai[nguon] ?? new Map();
    const biDanhNguon = biDanh.filter((b) => b.source === nguon && KIEU_BI_DANH_SDT.includes(b.kind));

    // N1 — SĐT ↔ người gửi trên tin sống; cặp 1–1 mà người theo SĐT chưa gộp.
    const nguoiCuaSdt = new Map();
    const sdtCuaNguoi = new Map();
    const sdtGoc = new Map(); // khoá băm → số gốc (để khớp bí danh `sdt` sau SD3)
    for (const t of tinNguon) {
      if (!t.seller_phone_hash) continue;
      sdtGoc.set(t.seller_phone_hash, t.seller_phone);
      for (const pid of t.post_ids ?? []) {
        const s = baiNguon.get(pid)?.sender_id;
        if (!s) continue;
        if (!nguoiCuaSdt.has(t.seller_phone_hash)) nguoiCuaSdt.set(t.seller_phone_hash, new Set());
        nguoiCuaSdt.get(t.seller_phone_hash).add(s);
        if (!sdtCuaNguoi.has(s)) sdtCuaNguoi.set(s, new Set());
        sdtCuaNguoi.get(s).add(t.seller_phone_hash);
      }
    }
    const capMotMot = [...nguoiCuaSdt].filter(([, ng]) => ng.size === 1 && sdtCuaNguoi.get([...ng][0]).size === 1).map(([h]) => h);
    const nguoiTheoGiaTri = new Map(biDanhNguon.map((b) => [b.value, b.object_key]));
    const chuaGop = capMotMot.filter((h) => {
      const k = nguoiTheoGiaTri.get(h) ?? nguoiTheoGiaTri.get(sdtGoc.get(h));
      return k != null && !daGop.has(k);
    });

    // N2 — người theo SĐT không có vai chưa rút.
    const nguoiSdt = new Set(biDanhNguon.map((b) => b.object_key));
    const khongVai = [...nguoiSdt].filter((k) => !coVai.has(k));

    // N4 — hợp SĐT extractPhones đọc trên mọi bài của tin.
    let nhieu = 0;
    let rong = 0;
    for (const t of tinNguon) {
      const so = new Set();
      for (const pid of t.post_ids ?? []) for (const p of extractPhones(baiNguon.get(pid)?.text ?? "")) so.add(p);
      if (so.size >= 2) nhieu++;
      if (!t.seller_phone && so.size > 0) rong++;
    }

    // N5 — bài mà bộ dò rộng thấy số extractPhones bỏ sót; trừ bài chạm trần 3 số.
    let sot = 0;
    let coSo = 0;
    for (const p of baiNguon.values()) {
      const bat = extractPhones(p.text ?? "");
      if (bat.length > 0) coSo++;
      if (bat.length >= TRAN_SO_MOI_BAI) continue;
      const da = new Set(bat); // bộ bóc và bộ dò rộng cùng trả E.164 (SD3)
      if ([...doRong(p.text)].some((s) => !da.has(s))) sot++;
    }

    kq[nguon] = {
      n1: { so: chuaGop.length, tong: capMotMot.length },
      n2: { so: khongVai.length, tong: nguoiSdt.size },
      n4: { nhieu, rong, tong: tinNguon.length },
      n5: { so: sot, tong: coSo },
    };
  }
  kq.sellers = { n3: { sellers, sdt_tren_tin: sdtTrenTin } };
  return kq;
}

/** Trạng thái theo ngưỡng Hỏi-1. */
export function xepTrangThai(kiem, v) {
  const dat =
    kiem === "n1" ? v.so === 0
    : kiem === "n2" ? v.so <= NGUONG_N2
    : kiem === "n3" ? v.sellers === v.sdt_tren_tin
    : kiem === "n4" ? v.rong === 0
    : v.so === 0;
  return dat ? "pass" : "fail";
}

export const veDetail = (v) => Object.entries(v).map(([k, x]) => `${k}=${x}`).join(" ");

/** Dòng ghi: `[{check_name, entity, status, detail}]` — 4 kiểm × 2 nguồn + N3. */
export function veDong(kq) {
  const dong = [];
  for (const nguon of NGUON) {
    for (const kiem of ["n1", "n2", "n4", "n5"]) {
      const v = kq[nguon][kiem];
      dong.push({ check_name: `danh-ba-sdt:${kiem}`, entity: nguon, status: xepTrangThai(kiem, v), detail: veDetail(v) });
    }
  }
  const v = kq.sellers.n3;
  dong.push({ check_name: "danh-ba-sdt:n3", entity: "sellers", status: xepTrangThai("n3", v), detail: veDetail(v) });
  return dong;
}

/** Đọc mọi thứ tinhSo cần, trong một giao dịch chỉ đọc. */
export async function docDuLieu(client) {
  await client.query("BEGIN TRANSACTION READ ONLY");
  try {
    const { rows: tin } = await client.query(
      `SELECT source, seller_phone, seller_phone_hash, post_ids FROM sale_offers WHERE source = ANY ($1)`, [NGUON]);
    const bai = {};
    for (const nguon of NGUON) {
      const { posts } = await loadStgPosts(client, KENH[nguon]);
      bai[nguon] = new Map(posts.map((p) => [p.post_id, { sender_id: p.sender_id, text: p.text }]));
    }
    const { rows: biDanh } = await client.query(
      `SELECT object_key, kind, value, source FROM registry_aliases
       WHERE retired_at IS NULL AND kind = ANY ($1) AND source = ANY ($2)`, [KIEU_BI_DANH_SDT, NGUON]);
    const { rows: gop } = await client.query(`SELECT party_key FROM parties WHERE status = 'merged'`);
    const { rows: vai } = await client.query(`SELECT DISTINCT party_key FROM party_roles WHERE retracted_at IS NULL`);
    const { rows: [n3] } = await client.query(
      `SELECT (SELECT count(*) FROM sellers)::int AS sellers,
              (SELECT count(DISTINCT seller_phone_hash) FROM sale_offers WHERE seller_phone_hash IS NOT NULL)::int AS sdt`);
    await client.query("COMMIT");
    return {
      tin, bai, biDanh,
      daGop: new Set(gop.map((r) => r.party_key)),
      coVai: new Set(vai.map((r) => r.party_key)),
      sellers: n3.sellers, sdtTrenTin: n3.sdt,
    };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/** Ghi theo ngày giờ máy thu: xoá dòng hôm nay của cùng (kiểm, đối tượng) rồi chèn — một giao dịch. */
export async function ghi(client, dong) {
  await client.query("BEGIN");
  try {
    for (const d of dong) {
      await client.query(
        `DELETE FROM dq_check_results WHERE check_name = $1 AND entity = $2
           AND (checked_at AT TIME ZONE '${MUI_GIO}')::date = (now() AT TIME ZONE '${MUI_GIO}')::date`,
        [d.check_name, d.entity]);
      await client.query(
        `INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)`,
        [d.check_name, d.entity, d.status, d.detail]);
    }
    await client.query("COMMIT");
    return dong.length;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

async function main() {
  const args = process.argv.slice(2);
  for (const a of args) if (a !== "--write") throw new Error(`do-danh-ba-sdt: cờ lạ «${a}» — chỉ nhận --write`);
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  await client.connect();
  try {
    const dong = veDong(tinhSo(await docDuLieu(client)));
    for (const d of dong) console.log(`${d.check_name} ${d.entity} ${d.status} ${d.detail}`);
    if (args.includes("--write")) console.log(`do-danh-ba-sdt: đã ghi ${await ghi(client, dong)} dòng dq_check_results`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
