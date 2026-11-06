#!/usr/bin/env node
// do-lien-lac-nguoi.mjs — enrich-nguoi-s03 (AC-8, AC-9): đo sổ liên lạc của Người S03 và gán số qua người đăng trên DB THỬ.
//   bash _acceptance/enrich-nguoi-s03/probes/db-dong-bang.sh oneinvest_en_do && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_en_do node pipeline/do-lien-lac-nguoi.mjs
//   … --mau 30 --ra <research-local/…/phieu.md>   ghi phiếu đọc mù 30 Người (có số, chữ bài — tầng C, chỉ ở research-local/)
// Trong MỘT giao dịch ROLLBACK: tự áp 068, 070, 079 nếu thiếu, chạy dungNguoi → dungLienLac → ganSdtQuaNguoi, in số trước và sau.
// md5 cột số S03 đo bằng client thứ hai, ngoài giao dịch, để chứng ROLLBACK thật. Đầu ra không mang số. Bất biến sai thì thoát 1;
// DB tên oneinvest (dùng chung, máy thu) thì thoát 2.
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { ganSdtQuaNguoi } from "./lib/gan-sdt-qua-nguoi.mjs";
import { inKhongSo } from "./lib/in-khong-so.mjs";
import { dungNguoi, RULE_QUA_NGUOI } from "./lib/danh-ba-nguoi.mjs";
import { docNguoiCuaTaiKhoan, docSoNguoi, dungLienLac, KENH_LIEN_LAC } from "./lib/lien-lac-nguoi.mjs";
import { nap068 } from "./lib/nap-068.mjs";
import { nap070 } from "./lib/nap-070.mjs";
import { nap079 } from "./lib/nap-079.mjs";
import { CONTACT_RULE } from "./lib/vocab.generated.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Mốc đo 06/11 và ngưỡng lệch. Mốc chốt từ bản dump đóng băng e8-0611.dump (giám sát 06/11: đo trên DB sống thì số trôi
 *  theo dữ liệu thu); mốc Cổng Phạm vi buổi sáng đo trên DB sống là so_trong_bai 80, thue 586, ban 156. */
export const MOC_0611 = Object.freeze({ tin_song: 4359, so_tren_tin: 662, so_trong_bai: 93, thue: 594, ban: 161 });
export const LECH_TOI_DA = 0.15;
export const HAT_MAU = 20261106;

/**
 * Mã lỗi của lượt đo; rỗng là đạt. Thuần.
 * @param {{ md5_truoc, md5_sau, truoc: {co_so}, sau: {co_so, tin_song}, suy_truoc, suy_sau, gan: Record<string, number> }} so
 */
export function kiemBatBien(so) {
  const loi = [];
  if (so.md5_truoc !== so.md5_sau) loi.push("DB-DOI");
  if (so.sau.co_so - so.truoc.co_so !== so.suy_sau - so.suy_truoc) loi.push("GAN-LECH-SO");
  if (so.suy_sau <= 0) loi.push("KHONG-GAN");
  const heSo = so.sau.tin_song / MOC_0611.tin_song;
  for (const k of [CONTACT_RULE.so_tren_tin, CONTACT_RULE.so_trong_bai, "thue", "ban"]) {
    const mong = MOC_0611[k] * heSo;
    if (Math.abs((so.gan[k] ?? 0) - mong) > LECH_TOI_DA * mong) loi.push(`LECH-MOC:${k}`);
  }
  return loi;
}

/** Tin S03 sống có số, theo bán/thuê. */
async function doTin(c) {
  const { rows: [r] } = await c.query(`SELECT count(*)::int AS tin_song, count(seller_phone)::int AS co_so,
      count(seller_phone) FILTER (WHERE kind = 'rent_lt')::int AS co_so_thue, count(seller_phone) FILTER (WHERE kind = 'sale')::int AS co_so_ban,
      count(*) FILTER (WHERE field_provenance -> 'seller_phone' ->> 'rule_id' = $1)::int AS suy
    FROM sale_offers WHERE source = 'S03'`, [RULE_QUA_NGUOI]);
  return r;
}

/** Tin sống mang số suy, theo luật liên lạc và theo bán/thuê. */
async function doGan(c) {
  const { rows } = await c.query(`SELECT field_provenance -> 'seller_phone' ->> 'contact_rule' AS rule, kind, count(*)::int AS n
    FROM sale_offers WHERE source = 'S03' AND field_provenance -> 'seller_phone' ->> 'rule_id' = $1 GROUP BY 1, 2`, [RULE_QUA_NGUOI]);
  const g = { [CONTACT_RULE.so_tren_tin]: 0, [CONTACT_RULE.so_trong_bai]: 0, thue: 0, ban: 0 };
  for (const r of rows) {
    g[r.rule] = (g[r.rule] ?? 0) + r.n;
    g[r.kind === "rent_lt" ? "thue" : "ban"] += r.n;
  }
  return g;
}

/** Tin sống không số mà người đăng có liên lạc nhưng luật A không chọn được (nhiều số). */
async function doNhieuSo(c) {
  const nguoiCua = await docNguoiCuaTaiKhoan(c);
  const chon = await docSoNguoi(c);
  const coLienLac = new Set((await c.query(`SELECT DISTINCT party_key FROM party_contacts WHERE retracted_at IS NULL AND kind = 'sdt'`)).rows
    .map((r) => r.party_key));
  const { rows } = await c.query(`SELECT seller_ref FROM sale_offers WHERE source = 'S03' AND seller_phone IS NULL AND seller_ref IS NOT NULL`);
  return rows.filter((r) => { const k = nguoiCua.get(r.seller_ref); return k && coLienLac.has(k) && !chon.has(k); }).length;
}

/** md5 cột số của tin S03, không lộ số. */
export async function md5SoS03(c) {
  const { rows } = await c.query(`SELECT md5(coalesce(string_agg(offer_id || '|' || coalesce(seller_phone, '') || '|'
      || coalesce(field_provenance ->> 'seller_phone', ''), ',' ORDER BY offer_id), '')) AS m FROM sale_offer_records WHERE source = 'S03'`);
  return rows[0].m;
}

/** Bộ sinh số giả ngẫu nhiên có hạt (mulberry32) — mẫu tái lập được. */
function ngauNhien(hat) {
  let a = hat >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Phiếu đọc mù: n Người có tin nhận số suy; mỗi Người một số, ≤ 5 bài của chính người gửi mang số ấy, ≤ 3 bài khác của họ. */
async function ghiPhieu(c, n, ra) {
  const tep = resolve(ra);
  if (!tep.startsWith(resolve(GOC, "research-local") + "/") && !tep.includes("/research-local/")) {
    throw Object.assign(new Error("do-lien-lac-nguoi: phiếu chỉ được ghi dưới research-local/ (chữ bài, SĐT tầng C không vào kho)"), { code: 2 });
  }
  const { rows: ng } = await c.query(`SELECT DISTINCT field_provenance -> 'seller_phone' ->> 'party_key' AS k, seller_phone AS so,
      field_provenance -> 'seller_phone' ->> 'contact_rule' AS rule, seller_ref AS ai
    FROM sale_offers WHERE source = 'S03' AND field_provenance -> 'seller_phone' ->> 'rule_id' = $1 ORDER BY 1`, [RULE_QUA_NGUOI]);
  const mot = new Map();
  for (const r of ng) if (!mot.has(r.k)) mot.set(r.k, r);
  const ds = [...mot.values()];
  const rand = ngauNhien(HAT_MAU);
  for (let i = ds.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ds[i], ds[j]] = [ds[j], ds[i]]; }
  const mau = ds.slice(0, n);
  const dong = [`# Phiếu đọc mù — enrich-nguoi-s03 (${mau.length} Người, hạt ${HAT_MAU})`, "",
    "Mỗi mục: một số được chọn cho người đăng và các bài của chính người gửi. Câu hỏi: số này có phải số liên lạc của chính người",
    "đăng không? Gắn `dung` · `sai` · `khong_ro`, lý do một câu, KHÔNG chép số hay tên vào phần trả lời.", ""];
  for (const [i, m] of mau.entries()) {
    const so0 = "0" + m.so.slice(3);
    const { rows: bai } = await c.query(`SELECT DISTINCT ON (post_id) post_id, text, posted_at FROM stg_zalo_posts
       WHERE agent_id = $1 AND sender_id = $2 ORDER BY post_id, captured_at DESC`, [KENH_LIEN_LAC, m.ai]);
    const coSo = bai.filter((b) => (b.text ?? "").replace(/\D/g, "").includes(so0.replace(/\D/g, ""))).slice(0, 5);
    const khac = bai.filter((b) => !coSo.includes(b)).slice(0, 3);
    dong.push(`## M${String(i + 1).padStart(2, "0")} — luật ${m.rule}`, "", `Số được chọn: ${m.so}`, "", "Bài có số:");
    for (const b of coSo) dong.push(`- ${(b.text ?? "").replace(/\s+/g, " ").slice(0, 600)}`);
    dong.push("", "Bài khác của người này:");
    for (const b of khac) dong.push(`- ${(b.text ?? "").replace(/\s+/g, " ").slice(0, 400)}`);
    dong.push("");
  }
  mkdirSync(dirname(tep), { recursive: true });
  writeFileSync(tep, dong.join("\n"));
  return mau.length;
}

async function main() {
  const ten = new URL(DB_URL).pathname.slice(1);
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten)) {
    console.error("do-lien-lac-nguoi: chỉ chạy trên DB thử oneinvest_<việc> (bash db/db-thu.sh oneinvest_en), không trên oneinvest");
    process.exit(2);
  }
  const iMau = process.argv.indexOf("--mau");
  const iRa = process.argv.indexOf("--ra");
  const c = new pg.Client({ connectionString: DB_URL });
  const c2 = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  await c2.connect();
  const yen = () => {};
  try {
    const md5_truoc = await md5SoS03(c2);
    await c.query("BEGIN");
    let so;
    try {
      await nap068(c);
      await nap070(c);
      await nap079(c);
      const truoc = await doTin(c);
      await dungNguoi(c, { out: yen });
      const ll = await dungLienLac(c, { out: yen });
      const gs = await ganSdtQuaNguoi(c, { out: yen });
      const sau = await doTin(c);
      const gan = await doGan(c);
      const nhieu_so = await doNhieuSo(c);
      so = { md5_truoc, truoc, sau, suy_truoc: truoc.suy, suy_sau: sau.suy, gan };
      console.log(inKhongSo(`truoc tin_song=${truoc.tin_song} co_so=${truoc.co_so} thue=${truoc.co_so_thue} ban=${truoc.co_so_ban}`));
      console.log(inKhongSo(`sau   tin_song=${sau.tin_song} co_so=${sau.co_so} thue=${sau.co_so_thue} ban=${sau.co_so_ban}`));
      console.log(inKhongSo(`gan   so_tren_tin=${gan.so_tren_tin} so_trong_bai=${gan.so_trong_bai} thue=${gan.thue} ban=${gan.ban} doi=${gs.doi}`));
      console.log(inKhongSo(`lien_lac moi=${ll.lien_lac_moi} so_chung=${ll.so_chung} khong_nguoi=${ll.khong_nguoi} nhieu_so=${nhieu_so}`));
      if (iMau > 0) {
        if (iRa < 0) throw Object.assign(new Error("do-lien-lac-nguoi: --mau cần --ra <tệp dưới research-local/>"), { code: 2 });
        console.log(inKhongSo(`phieu ${await ghiPhieu(c, Number(process.argv[iMau + 1]), process.argv[iRa + 1])} Người`));
      }
    } finally {
      await c.query("ROLLBACK");
    }
    so.md5_sau = await md5SoS03(c2);
    console.log(inKhongSo(`md5_khop=${so.md5_truoc === so.md5_sau}`));
    const loi = kiemBatBien(so);
    if (loi.length) {
      console.error(`BẤT BIẾN SAI: ${loi.join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    await c.end();
    await c2.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message); process.exit(e.code === 2 ? 2 : 1); });
