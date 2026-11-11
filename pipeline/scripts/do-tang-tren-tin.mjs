#!/usr/bin/env node
// do-tang-tren-tin.mjs — hồ sơ _acceptance/tang-tren-tin-s03 (DV4): lệnh đo. Chỉ in số, không in chữ bài, không in tên nguồn.
//   --toan-bo                 (DB thử, qua tang-tren-tin-db.sh do) trong MỘT giao dịch ROLLBACK: áp 095 + phân xử toàn bộ (AC-2),
//                             rồi transform S03 bản nền / bản mới / bản đột biến khoá (AC-8) và dòng DQ trên chính đầu ra
//   --mau [tệp]               (DB máy thu, chỉ đọc) so bộ đọc với đáp án đọc tay (AC-5)
//   --rut-mau <tệp ra>        (DB máy thu, chỉ đọc) rút 300 post_id có hạt giống cố định, chỉ ghi post_id + nhóm
//   --ranh-gioi --base <ref>  quét diff của hàng (AC-9); --thu-ten-nguon <thư mục> quét thư mục thay cho diff (đối chứng)
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { napTang } from "../lib/nap-095.mjs";
import { docTang, parsePost, runTransformZalo } from "../transform-zalo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_CHUNG = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MAU_MAC_DINH = join(homedir(), "dev/onehub-invest/research-local/tang-tren-tin-s03/mau-doc-tay.jsonl");
const HAT_GIONG = "dv4-1111";
const MOC = /(?<![\p{L}\d])T\d{1,2}\s*\/\s*20\d\d/iu;
const T_TRAN = /(?<![\p{L}\d])T\d{1,2}(?![\d/])/u;
const TU_DAN = /(?<![\p{L}])(?:tầng|lầu)(?![\p{L}])/iu;

const args = process.argv.slice(2);
const co = (c) => args.includes(c);
const giaTri = (c) => { const i = args.indexOf(c); return i >= 0 ? args[i + 1] : undefined; };

async function noi(url, { chiDoc = false } = {}) {
  const c = new pg.Client({ connectionString: url, ...(chiDoc ? { options: "-c default_transaction_read_only=on" } : {}) });
  await c.connect();
  return c;
}

// ---------- --toan-bo ----------
async function toanBo() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/oneinvest_[a-z0-9_]+$/.test(url)) throw new Error("--toan-bo: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");
  const c = await noi(url);
  let ok = true;
  const bao = (dong, dat) => { console.log(dong); if (!dat) ok = false; };
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    const chup = async () => new Map((await c.query(
      `SELECT offer_id, floor_raw, md5((to_jsonb(r) - 'floor_raw' - 'field_provenance')::text) AS h FROM sale_offer_records r`)).rows.map((r) => [r.offer_id, r]));
    const truoc = await chup();
    await napTang(c);
    await c.query("SELECT resolve_offer_fields(NULL)");
    const sau = await chup();
    let n = 0; let lech = 0; let cotDoi = 0;
    for (const [id, r] of truoc) {
      const s = sau.get(id);
      if (r.floor_raw !== null) { n++; if (s?.floor_raw !== r.floor_raw) lech++; }
      if (s?.h !== r.h) cotDoi++;
    }
    bao(`floor_raw_lech=${lech}/${n} cot_doi=${cotDoi}`, lech === 0 && cotDoi === 0 && n > 0);

    const tapTin = async () => new Set((await c.query(`SELECT offer_id FROM sale_offers WHERE source = 'S03'`)).rows.map((r) => r.offer_id));
    const lechTap = (a, b) => [...a].filter((x) => !b.has(x)).length + [...b].filter((x) => !a.has(x)).length;
    const imLang = async (fn) => { const goc = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = goc; } };
    // Bản nền: cùng mã nhưng bộ đọc không trả tầng — tập tin nếu không có việc này.
    await c.query("SAVEPOINT nen");
    await imLang(() => runTransformZalo(c, { parse: (t, o) => ({ ...parsePost(t, o), floor: null, floorBand: null, trichTang: null }) }));
    const nen = await tapTin();
    await c.query("ROLLBACK TO SAVEPOINT nen");
    // Bản đột biến: tầng vào khoá gom — đối chứng đỏ của thước.
    await c.query("SAVEPOINT dot_bien");
    await imLang(() => runTransformZalo(c, { parse: (t, o) => {
      const r = parsePost(t, o);
      return r.floor || r.floorBand ? { ...r, ma: [...(r.ma ?? []), `TANG${r.floor ?? r.floorBand}`] } : r;
    } }));
    const dotBien = await tapTin();
    await c.query("ROLLBACK TO SAVEPOINT dot_bien");
    await imLang(() => runTransformZalo(c));
    const moi = await tapTin();
    bao(`offer_id_lech=${lechTap(nen, moi)}`, lechTap(nen, moi) === 0);
    bao(`dot_bien_lech=${lechTap(nen, dotBien)}`, lechTap(nen, dotBien) > 0);
    const { rows: [d] } = await c.query(
      `SELECT count(*) FILTER (WHERE floor_raw IS NOT NULL OR field_provenance ? 'floor_band') AS n, count(*) AS m
         FROM sale_offers WHERE source = 'S03' AND property_type = 'apartment' AND offer_status = 'active'`);
    const tiLe = Number(d.n) / Number(d.m);
    bao(`co_tang=${d.n}/${d.m}`, tiLe >= 0.08 && tiLe <= 0.25);
    const sql450 = readFileSync(join(ROOT, "pipeline/sql/450_dq_checks.sql"), "utf8");
    const dau = sql450.indexOf("-- ============ s03-floor-fill");
    await c.query(sql450.slice(dau, sql450.indexOf("-- Tổng kết cho log", dau)));
    const { rows: [q] } = await c.query(`SELECT status, detail FROM dq_check_results WHERE check_name = 's03-floor-fill' ORDER BY id DESC LIMIT 1`);
    const qso = q.detail.match(/^(\d+)\/(\d+) /);
    const r = qso ? Number(qso[1]) / Number(qso[2]) : NaN;
    bao(`dq_s03_floor_fill=${q.status} ti_le=${r.toFixed(4)}`, q.status === "pass" && Math.abs(r - tiLe) < 1e-9);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
  return ok ? 0 : 1;
}

// ---------- --mau ----------
async function mau(tep) {
  if (!existsSync(tep)) {
    console.error(`--mau: không có tệp đáp án ${tep} — chạy --rut-mau rồi cho tác tử đọc mù (kế hoạch Task 6)`);
    return 2;
  }
  const dapAn = readFileSync(tep, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const c = await noi(DB_CHUNG, { chiDoc: true });
  try {
    const { rows } = await c.query(`SELECT DISTINCT ON (post_id) post_id, text FROM stg_zalo_posts WHERE post_id = ANY ($1::text[])`,
      [dapAn.map((x) => x.post_id)]);
    const chu = new Map(rows.map((r) => [r.post_id, r.text ?? ""]));
    let ra = 0; let dung = 0; let coDapAn = 0; let sot = 0; let sotT = 0; let moc = 0; let mocThanhTang = 0; let thieu = 0;
    for (const x of dapAn) {
      const t = chu.get(x.post_id);
      if (t === undefined) { thieu++; continue; }
      const r = docTang(t);
      const giaTriMay = r.floor ?? r.floorBand;
      const giaTriDung = x.floor ?? x.floorBand ?? null;
      if (giaTriMay !== null) { ra++; if (r.floor === (x.floor ?? null) && r.floorBand === (x.floorBand ?? null)) dung++; }
      if (giaTriDung !== null) { coDapAn++; if (giaTriMay === null) { sot++; if (T_TRAN.test(t) && !TU_DAN.test(t)) sotT++; } }
      if (MOC.test(t) && !TU_DAN.test(t) && docTang(t.replace(MOC, " ")).floor === null) { moc++; if (r.floor !== null) mocThanhTang++; }
    }
    console.log(`dung=${dung}/${ra} moc_thanh_tang=${mocThanhTang}/${moc} sot=${sot}/${coDapAn} sot_T_tran=${sotT} thieu_bai=${thieu}`);
    return ra > 0 && dung / ra >= 0.95 && mocThanhTang === 0 && moc >= 1 && thieu === 0 ? 0 : 1;
  } finally {
    await c.end();
  }
}

// ---------- --rut-mau ----------
async function rutMau(tepRa) {
  if (!tepRa) { console.error("--rut-mau: thiếu tệp ra"); return 2; }
  const c = await noi(DB_CHUNG, { chiDoc: true });
  try {
    const base = `WITH b AS (
        SELECT DISTINCT ON (p.post_id) p.post_id, p.text
          FROM sale_offers o CROSS JOIN LATERAL unnest(o.post_ids) AS pid JOIN stg_zalo_posts p ON p.post_id = pid
         WHERE o.source = 'S03' AND p.text IS NOT NULL)`;
    const lay = async (dk, n) => (await c.query(`${base} SELECT post_id FROM b WHERE ${dk}
      ORDER BY md5(post_id || '${HAT_GIONG}') LIMIT ${n}`)).rows.map((r) => r.post_id);
    const coTuDan = await lay(`text ~* '(^|[^[:alpha:]])(tầng|lầu)([^[:alpha:]]|$)' OR text ~ '[A-Z]{1,3}[0-9]{1,2}[.-][0-9]{2}[.-]?[0-9]{2}'`, 200);
    const moc = await lay(`text ~* '(^|[^[:alpha:]0-9])T[0-9]{1,2} */ *20[0-9][0-9]' AND text !~* '(tầng|lầu)'`, 20);
    const tTran = await lay(`text ~ '(^|[^[:alpha:]0-9])T[0-9]{1,2}([^0-9/]|$)' AND text !~* '(tầng|lầu)'`, 40);
    const daCo = new Set([...coTuDan, ...moc, ...tTran]);
    const con = (await lay(`text !~* '(tầng|lầu)'`, 400)).filter((x) => !daCo.has(x)).slice(0, 100 - moc.length - Math.min(tTran.length, 20));
    const dong = [...coTuDan.map((p) => ({ post_id: p, nhom: "co-tu-dan" })), ...moc.map((p) => ({ post_id: p, nhom: "moc" })),
      ...tTran.filter((p) => !moc.includes(p)).slice(0, 20).map((p) => ({ post_id: p, nhom: "t-tran" })), ...con.map((p) => ({ post_id: p, nhom: "khong" }))];
    writeFileSync(tepRa, dong.map((d) => JSON.stringify(d)).join("\n") + "\n");
    console.log(`rut_mau=${dong.length} co_tu_dan=${coTuDan.length} moc=${moc.length} tep=${tepRa}`);
    return 0;
  } finally {
    await c.end();
  }
}

// ---------- --ranh-gioi ----------
function tepTrongThuMuc(d) {
  return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? tepTrongThuMuc(p) : [p]; });
}
async function ranhGioi() {
  const thu = giaTri("--thu-ten-nguon");
  const base = giaTri("--base") ?? "origin/main";
  const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" });
  const tep = thu ? tepTrongThuMuc(thu) : git("diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean).map((f) => join(ROOT, f));
  const rel = tep.map((f) => f.slice(ROOT.length + 1));
  const syncCloud = rel.filter((f) => f === "pipeline/sync-cloud.mjs").length;
  const routeZalo = rel.filter((f) => /^app\/src\/app\/.*zalo/i.test(f) || f.startsWith("collector/")).length;
  const them = thu ? "" : git("diff", `${base}...HEAD`, "--unified=0").split("\n").filter((l) => l.startsWith("+")).join("\n");
  const apCloud = /supabase\s+db\s+push|api\.supabase\.com/i.test(them) ? 1 : 0;
  const c = await noi(DB_CHUNG, { chiDoc: true });
  let ten;
  try {
    ten = (await c.query(`SELECT real_name FROM source_registry WHERE real_name IS NOT NULL`)).rows
      .map((r) => r.real_name.trim().toLowerCase()).filter((x) => x.length >= 4);
  } finally {
    await c.end();
  }
  if (!ten.length) { console.error("--ranh-gioi: source_registry không có tên — không soát được thì không báo xanh"); return 2; }
  const tenNguon = tep.filter((f) => existsSync(f) && statSync(f).isFile())
    .filter((f) => { const s = readFileSync(f, "utf8").toLowerCase(); return ten.some((x) => s.includes(x)); }).length;
  let ignored = 0;
  try { execFileSync("git", ["-C", join(homedir(), "dev/onehub-invest"), "check-ignore", "-q", "research-local/tang-tren-tin-s03/mau-doc-tay.jsonl"]); ignored = 1; } catch { ignored = 0; }
  console.log(`sync_cloud_doi=${syncCloud} route_zalo_doi=${routeZalo} ap_cloud=${apCloud} ten_nguon=${tenNguon} mau_ignored=${ignored} tep_quet=${tep.length}`);
  return syncCloud + routeZalo + apCloud + tenNguon === 0 && ignored === 1 ? 0 : 1;
}

let ma;
if (co("--toan-bo")) ma = await toanBo();
else if (co("--mau")) ma = await mau(giaTri("--mau") && !giaTri("--mau").startsWith("--") ? giaTri("--mau") : MAU_MAC_DINH);
else if (co("--rut-mau")) ma = await rutMau(giaTri("--rut-mau"));
else if (co("--ranh-gioi")) ma = await ranhGioi();
else { console.error("cần một chế độ: --toan-bo | --mau [tệp] | --rut-mau <tệp> | --ranh-gioi --base <ref>"); ma = 2; }
process.exit(ma);
