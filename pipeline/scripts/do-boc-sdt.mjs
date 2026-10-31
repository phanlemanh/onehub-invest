// do-boc-sdt.mjs — hồ sơ _acceptance/boc-sdt-du-va-chon-ro (SD2) AC-5…AC-8: thước trên bản chép dữ liệu thật (DB thử).
// Một giao dịch ROLLBACK trên DATABASE_URL (chỉ DB thử oneinvest_<dãy>_<việc>):
//   1. transform S03 + S05 bằng bản gốc ghim GOC (trước SD2) → chụp «trước»;
//   2. transform S03 + S05 bằng cây (bắt log) → chụp «sau»;
//   3. SD-AC-8 tập tin (nhóm post_ids, giá, DT, kind) trước = sau; SD-AC-5 dòng log «tin nhiều SĐT» = thước đếm bằng bộ dò
//      rộng; SD-AC-6 dạng số + băm; SD-AC-7 sót/11 chữ số/tin rỗng/luật chọn — và cùng thước trên «trước» phải đỏ.
// Không in số thật: chỉ số đếm, mã tin và hình dạng (chữ số → d). Sai → exit 1.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { runTransformFb } from "../transform-fb.mjs";
import { chonSdtTin, extractPhones, runTransformZalo } from "../transform-zalo.mjs";

const GOC = "9b40715dab682a3bff273caa72c588128c871aba";
// Số đo của audit 30/10 (docs/research/audit-bang-nguoi-sdt-3010.md §2.3) — chỉ in cạnh, không làm ngưỡng.
// Khoá theo «<nguồn>_30_10» để không giống khai báo SLO nguồn mà scripts/s05-slo.test.mjs quét.
const AUDIT_NHIEU_SDT = { s03_30_10: 11, s05_30_10: 1 };
const auditNhieuSdt = (s) => AUDIT_NHIEU_SDT[`${s.toLowerCase()}_30_10`];
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("do-boc-sdt: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  process.exit(2);
}
const PIPE = join(import.meta.dirname, "..");

const tam = [];
function ghiTam(ten, src) {
  const f = join(PIPE, `.dbs-${ten}-${process.pid}.mjs`);
  writeFileSync(f, src);
  tam.push(f);
  return f;
}
async function napGoc() {
  const show = (p) => execFileSync("git", ["show", `${GOC}:pipeline/${p}`], { cwd: PIPE, encoding: "utf8" });
  const fz = ghiTam("tz", show("transform-zalo.mjs"));
  const fb = show("transform-fb.mjs");
  const nhap = 'from "./transform-zalo.mjs"';
  if (!fb.includes(nhap)) throw new Error("do-boc-sdt: transform-fb gốc không nhập ./transform-zalo.mjs");
  const ff = ghiTam("fb", fb.replace(nhap, `from "./${fz.split("/").pop()}"`));
  return { z: await import(pathToFileURL(fz).href), f: await import(pathToFileURL(ff).href) };
}

/** Bộ dò rộng (audit §2.2), độc lập với extractPhones: chữ số xen tối đa 3 ký tự tách bất kỳ, «o» thay «0», gom 10 số
 *  đầu di động. Gạt URL trước (tên tệp ảnh không phải SĐT); «o» dính sau chữ cái («Zalo 09…») không phải số 0. */
const URL_RE = /https?:\/\/\S+|www\.\S+/gi;
const RONG = /(?<![\d\p{L}])(?:\(?\+?84\)?|[0o])(?:[.\-\s•·*/()]{0,3}[\do]){8,10}(?![\d])/giu;
function rong(text) {
  const out = new Set();
  for (const m of (text ?? "").replace(URL_RE, " ").match(RONG) ?? []) {
    let d = m.replace(/o/gi, "0").replace(/\D/g, "");
    if (d.startsWith("84")) d = "0" + d.slice(2);
    if (d.length === 10 && /^0[35789]/.test(d)) out.add(d);
  }
  return out;
}

/** Bài thật mới nhất mỗi post_id, nguồn theo agent_id (S05 = apify-facebook). */
async function docBai(c) {
  const { rows } = await c.query(`
    SELECT DISTINCT ON (post_id) post_id, posted_at, text,
           CASE WHEN agent_id = 'apify-facebook' THEN 'S05' ELSE 'S03' END AS source
    FROM stg_zalo_posts ORDER BY post_id, captured_at DESC`);
  return new Map(rows.map((r) => [r.post_id, r]));
}
async function chupTin(c) {
  const { rows } = await c.query(`
    SELECT offer_id, source, kind, price_vnd::text AS price_vnd, area_m2::text AS area_m2, post_ids, seller_phone, seller_phone_hash
    FROM sale_offers WHERE source IN ('S03','S05') ORDER BY offer_id`);
  return rows;
}
async function chay(z, f, c) {
  const log = [];
  const goc = console.log;
  console.log = (...a) => log.push(a.join(" "));
  try {
    await z.runTransformZalo(c);
    const s03 = log.length;
    await f.runTransformFb(c);
    return { S03: log.slice(0, s03), S05: log.slice(s03) };
  } finally {
    console.log = goc;
  }
}

const khoaTin = (t) => `${t.source}|${[...t.post_ids].sort().join(",")}|${t.price_vnd}|${t.area_m2}|${t.kind}`;
/** Lệch giữa hai tập tin theo khoá nội dung — mỗi phần tử một mã tin. */
function lechTapTin(a, b) {
  const kb = new Set(b.map(khoaTin));
  const ka = new Set(a.map(khoaTin));
  return [...a.filter((t) => !kb.has(khoaTin(t))).map((t) => `mất ${t.offer_id}`), ...b.filter((t) => !ka.has(khoaTin(t))).map((t) => `thêm ${t.offer_id}`)];
}
/** Tin mà hợp số (bộ dò rộng) trên mọi bài có ≥ 2 số khác nhau. */
function demNhieuSdt(tin, bai, source) {
  return tin.filter((t) => t.source === source && new Set(t.post_ids.flatMap((id) => [...rong(bai.get(id)?.text)])).size >= 2).length;
}
/** Thước SD-AC-7 trên một chụp + một bộ bóc; trả danh sách lỗi có tên. */
/** SD3 đổi dạng ra sang E.164; thước SD2 so ở dạng 10 chữ số «0…» của bộ dò rộng, nên quy về đó trước khi so. */
const ve0 = (p) => (p && p.startsWith("+84") ? "0" + p.slice(3) : p);
function thuocBay(tin, bai, bocGoc) {
  const boc = (text) => bocGoc(text).map(ve0);
  const loi = [];
  let sot = 0;
  let so11 = 0;
  for (const b of bai.values()) {
    if (b.source !== "S03") continue;
    const hien = boc(b.text ?? "");
    if (hien.some((p) => p.length !== 10)) so11++;
    if (hien.length >= 3) continue; // chạm trần 3 số (Hỏi-1 giữ trần)
    if ([...rong(b.text)].some((p) => !hien.includes(p))) sot++;
  }
  if (sot) loi.push(`sót: ${sot} bài S03 bộ dò rộng thấy số mà bộ bóc không ra`);
  if (so11) loi.push(`11 chữ số: ${so11} bài S03 nhận số không đủ 10 chữ số`);
  for (const t of tin) {
    const chon = chonSdtTin(t.post_ids.map((id) => ({ post_id: id, posted_at: bai.get(id)?.posted_at, phones: boc(bai.get(id)?.text ?? "") })));
    if ((ve0(t.seller_phone) ?? null) !== chon) loi.push(`chọn: tin ${t.offer_id} seller_phone khác chonSdtTin trên bài của tin`);
  }
  return { loi, sot, so11 };
}

const hinh = (s) => (s ?? "").replace(/\d/g, "d");
let hong = 0;
const bao = (ok, dong) => {
  console.log(`${ok ? "✔" : "✖"} ${dong}`);
  if (!ok) hong++;
};

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const goc = await napGoc();
  await c.query("BEGIN");
  const bai = await docBai(c);
  const logTruoc = await chay(goc.z, goc.f, c);
  const truoc = await chupTin(c);
  const logSau = await chay({ runTransformZalo }, { runTransformFb }, c);
  const sau = await chupTin(c);

  // ---- SD-AC-8: tập tin không đổi ----
  for (const s of ["S03", "S05"]) {
    const a = truoc.filter((t) => t.source === s);
    const b = sau.filter((t) => t.source === s);
    const lech = lechTapTin(a, b);
    bao(lech.length === 0 && a.length > 0, `SD-AC-8 ${s}: tập tin trước ${a.length} · sau ${b.length} · lệch ${lech.length}${lech.length ? ` (${lech.slice(0, 10).join("; ")})` : ""}`);
  }
  const doi = truoc.map((t, i) => (i === 0 ? { ...t, price_vnd: String(Number(t.price_vnd ?? 0) + 1) } : t));
  const lechDoi = lechTapTin(truoc, doi);
  bao(lechDoi.length === 2 && lechDoi[0].includes(truoc[0].offer_id), `SD-AC-8 đối chứng: đổi giá một tin thì thước gọi tên tin ấy (${lechDoi.join("; ")})`);

  // ---- SD-AC-5: dòng log «tin nhiều SĐT» ----
  const duong = demNhieuSdt([{ source: "X", post_ids: ["a", "b"] }], new Map([["a", { text: "LH 0911111111" }], ["b", { text: "LH 0922222222" }]]), "X");
  bao(duong === 1, `SD-AC-5 ca dương: tin hai bài mỗi bài một số khác nhau được đếm (${duong})`);
  for (const s of ["S03", "S05"]) {
    const dong = logSau[s].filter((l) => l.startsWith("tin nhiều SĐT:"));
    const n = dong.length === 1 ? Number(dong[0].split(":")[1]) : NaN;
    const thuoc = demNhieuSdt(sau, bai, s);
    const truocCo = logTruoc[s].some((l) => l.startsWith("tin nhiều SĐT:"));
    bao(dong.length === 1 && n === thuoc && !truocCo, `SD-AC-5 ${s}: log «tin nhiều SĐT: ${n}» (${dong.length} dòng) · thước bộ dò rộng ${thuoc} · audit 30/10 ${auditNhieuSdt(s)} · bản trước có dòng: ${truocCo}`);
  }

  // ---- SD-AC-6: dạng số và băm — từ SD3 là E.164 `+84…`, băm từ dạng ấy ----
  for (const s of ["S03", "S05"]) {
    const co = sau.filter((t) => t.source === s && t.seller_phone);
    const sai = co.filter((t) => !/^\+84[35789]\d{8}$/.test(t.seller_phone) || t.seller_phone_hash !== createHash("sha256").update(t.seller_phone).digest("hex").slice(0, 32));
    bao(co.length > 0 && sai.length === 0, `SD-AC-6 ${s}: ${co.length} tin có SĐT · sai dạng/băm ${sai.length}${sai.length ? ` (${sai.slice(0, 5).map((t) => `${t.offer_id}:${hinh(t.seller_phone)}`).join("; ")})` : ""}`);
  }

  // ---- SD-AC-7: thước «Bật khi» trên bản mới, và đỏ trên bản trước ----
  const moi = thuocBay(sau, bai, extractPhones);
  bao(moi.loi.length === 0, `SD-AC-7 bản mới: sót ${moi.sot} · 11 chữ số ${moi.so11} · lỗi chọn ${moi.loi.filter((l) => l.startsWith("chọn")).length}${moi.loi.length ? ` (${moi.loi.slice(0, 5).join("; ")})` : ""}`);
  const cu = thuocBay(truoc, bai, goc.z.extractPhones);
  bao(cu.loi.some((l) => l.startsWith("sót")) && cu.loi.some((l) => l.startsWith("11 chữ số")), `SD-AC-7 đỏ trên bản trước: ${cu.loi.filter((l) => !l.startsWith("chọn")).join("; ") || "KHÔNG đỏ — thước không đo gì"}`);
  const rongTruoc = truoc.filter((t) => t.source === "S03" && !t.seller_phone && t.post_ids.some((id) => goc.z.extractPhones(bai.get(id)?.text ?? "").length));
  const conRong = rongTruoc.filter((t) => !sau.find((x) => x.offer_id === t.offer_id)?.seller_phone);
  bao(conRong.length === 0, `SD-AC-7 tin S03 rỗng SĐT mà bài có số ở bản trước: ${rongTruoc.length} (audit 30/10: 3) · bản mới còn rỗng ${conRong.length}${conRong.length ? ` (${conRong.map((t) => t.offer_id).join("; ")})` : ""}`);
  for (const s of ["S03", "S05"]) console.log(`  tin nhiều SĐT ${s}: ${demNhieuSdt(sau, bai, s)}`);
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
  for (const f of tam) rmSync(f, { force: true });
}
console.log(hong ? `do-boc-sdt: ${hong} dòng đỏ` : "do-boc-sdt: xanh");
process.exit(hong ? 1 : 0);
