#!/usr/bin/env node
// do-luu-tang-huong.mjs — hồ sơ _acceptance/s03-luu-tang-huong (SV2): ba phép đo, mỗi lần một chế độ. Không in chữ bài. Hỏng ngưỡng → exit 1.
//   --nhan  bộ đọc trên 250 nhãn của audit (research-local, gitignored). Nhãn do tác tử gắn, cũng là nguồn của bộ đọc nháp, KHÔNG phải nhãn vàng.
//   --db    bản sao DB oneinvest_n1_sv2_do, BEGIN…ROLLBACK: 067 giữ từng cặp tầng, transform không đổi offer_id, độ phủ, bất đồng.
//   --ranh  ranh giới so với nhánh chính: sync cloud, route Zalo, tên nguồn thật, nhãn gitignore, chữ bài trong diff.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import pg from "pg";

import { docTangHuong, docToaTruc } from "../transform-zalo.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_067, napTangHuong } from "../lib/nap-067.mjs";
import { FACING_DIRECTION } from "../lib/vocab.generated.mjs";

const PIPE = join(import.meta.dirname, "..");
const ROOT = join(PIPE, "..");
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });
let hong = 0;
/** In dòng số; `dat` false thì tính hỏng. */
function dong(chu, dat = true) {
  console.log(`${dat ? "" : "ĐỎ "}${chu}`);
  if (!dat) hong++;
}

/** Tập nhãn: research-local/ của cây, rồi của checkout chính (worktree khác không có). */
function timTap() {
  const goc = [ROOT];
  try { goc.push(dirname(git("rev-parse", "--path-format=absolute", "--git-common-dir").trim())); } catch { /* không phải kho git */ }
  for (const g of goc) {
    const d = join(g, "research-local", "s03-audit-0211");
    if (existsSync(join(d, "labels_huong.jsonl"))) return d;
  }
  console.error("do-luu-tang-huong: thiếu tập nhãn research-local/s03-audit-0211/labels_huong.jsonl; không chấm");
  process.exit(2);
}
const docJsonl = (p) => readFileSync(p, "utf8").trim().split("\n").map((l) => JSON.parse(l));
/** Hai bộ nhãn nối với chữ bài: mỗi phần tử { nhan, text }. */
function docNhan() {
  const d = timTap();
  const ids = JSON.parse(readFileSync(join(d, "sample_ids.json"), "utf8"));
  const bai = new Map(docJsonl(join(d, "posts.jsonl")).map((p) => [p.post_id, p.text]));
  return docJsonl(join(d, "labels_huong.jsonl")).map((nhan) => ({ nhan, text: bai.get(ids[String(nhan.id)]) ?? "" }));
}

const NHAN_HUONG = { D: FACING_DIRECTION.east, T: FACING_DIRECTION.west, N: FACING_DIRECTION.south, B: FACING_DIRECTION.north, DN: FACING_DIRECTION.southeast, DB: FACING_DIRECTION.northeast, TN: FACING_DIRECTION.southwest, TB: FACING_DIRECTION.northwest };
// Mã khoảng trong tệp nhãn của audit (research-local), không phải trục từ vựng.
const nhanKhoang = (ma) => (ma === "low" ? "tầng thấp" : ma === "mid" ? "tầng trung" : "tầng cao");

function doNhan() {
  console.log("nhãn do tác tử gắn, không phải nhãn vàng");
  let hDung = 0, hCo = 0, hThua = 0, hKhong = 0, cuaKhop = 0;
  let kDung = 0, kCo = 0, kThua = 0, sDung = 0, sCo = 0, sThua = 0;
  for (const { nhan, text } of docNhan()) {
    const { floor, facing } = docTangHuong(text);
    const dap = (nhan.direction ?? []).map((x) => NHAN_HUONG[x]).sort().join(",");
    if (dap) {
      hCo++;
      if (facing?.split(":")[1] === dap) {
        hDung++;
        if (facing.split(":")[0] === nhan.direction_of) cuaKhop++;
      }
    } else {
      hKhong++;
      if (facing) hThua++;
    }
    const laSo = floor !== null && /^\d+$/.test(floor);
    const khoangDap = nhan.floor_band ? nhanKhoang(nhan.floor_band) : null;
    if (nhan.floor_number != null) {
      sCo++;
      if (laSo && Number(floor) === Number(nhan.floor_number)) sDung++;
    } else if (laSo && !docToaTruc(text).unit) sThua++;   // tầng trong mã căn không có nhãn riêng, không tính thừa
    if (khoangDap) {
      kCo++;
      if (floor === khoangDap || (laSo && nhan.floor_number != null) || (laSo && docToaTruc(text).unit)) kDung++;   // có số thì số thắng
    } else if (floor !== null && !laSo) kThua++;
  }
  dong(`huong_dung=${hDung}/${hCo} huong_thua=${hThua}/${hKhong}`, hDung >= 100 && hCo === 109 && hThua <= 2 && hKhong === 141);
  console.log(`huong_nhan_khop=${cuaKhop}/${hDung}`);
  dong(`khoang_dung=${kDung}/${kCo} khoang_thua=${kThua}`, kDung >= 22 && kCo === 25 && kThua <= 2);
  dong(`so_dung=${sDung}/${sCo} so_thua=${sThua}`, sDung >= 4 && sCo === 5 && sThua <= 2);
}

const DB_DO = "oneinvest_n1_sv2_do";
const COT_KHAC = `md5(concat_ws('|', property_type, bedrooms, bathrooms, street_raw, block_raw, street_number, unit_number, frontage_length,
  lot_size_dimensions, stories, latitude, longitude, (field_provenance - 'floor_raw' - 'unit_facing')::text))`;
const chup = async (c) => new Map((await c.query(`SELECT offer_id, floor_raw, ${COT_KHAC} AS khac FROM sale_offer_records`)).rows.map((r) => [r.offer_id, r]));
async function trongSavepoint(c, fn) {
  await c.query("SAVEPOINT do_sv2");
  try {
    return await fn();
  } finally {
    await c.query("ROLLBACK TO SAVEPOINT do_sv2");
  }
}
function soMoc(truoc, sau) {
  let tangLech = 0, tangCo = 0, khacDoi = 0;
  for (const [id, a] of truoc) {
    const b = sau.get(id);
    if (a.floor_raw !== null) tangCo++;
    if (a.floor_raw !== (b?.floor_raw ?? null)) tangLech++;
    if (a.khac !== b?.khac) khacDoi++;
  }
  return { tangLech, tangCo, khacDoi };
}
/** Nạp một bản sao transform đặt cạnh tệp thật để import tương đối còn đúng; xoá ngay sau khi nạp. */
async function napBan(nguon, ten) {
  const tep = join(PIPE, `.do-sv2-${ten}-${process.pid}.mjs`);
  writeFileSync(tep, nguon);
  try {
    return (await import(pathToFileURL(tep).href)).runTransformZalo;
  } finally {
    rmSync(tep, { force: true });
  }
}
const tapS03 = async (c) => new Set((await c.query("SELECT offer_id FROM sale_offers WHERE source = 'S03'")).rows.map((r) => r.offer_id));
const lechTap = (a, b) => [...a].filter((x) => !b.has(x)).length + [...b].filter((x) => !a.has(x)).length;

async function doDb() {
  const docker = (...a) => execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", ...a], { encoding: "utf8" });
  const coDb = docker("psql", "-U", "oneinvest", "-h", "localhost", "-d", "postgres", "-Atc", `SELECT 1 FROM pg_database WHERE datname = '${DB_DO}'`).trim() === "1";
  if (!coDb) execFileSync("bash", [join(ROOT, "db/db-thu.sh"), DB_DO], { stdio: "inherit" });
  const c = new pg.Client({ connectionString: `postgres://oneinvest:oneinvest@localhost:5433/${DB_DO}` });
  await c.connect();
  const log = console.log, warn = console.warn;
  const imLang = () => { console.log = () => {}; console.warn = () => {}; };
  const moLai = () => { console.log = log; console.warn = warn; };
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await c.query("SELECT resolve_offer_fields(NULL)");   // mốc đã phân xử, để phần đổi chỉ do 067
    const moc = await chup(c);
    // Đối chứng: bỏ bước legacy thì tầng mất.
    const dauLegacy = MIG_067.indexOf("-- 2. Tầng có từ 030");
    const boLegacy = MIG_067.slice(0, dauLegacy) + MIG_067.slice(MIG_067.indexOf("-- 3. Khuôn hướng"));
    const dc = await trongSavepoint(c, async () => {
      await napTangHuong(c, { sql: boLegacy });
      await c.query("SELECT resolve_offer_fields(NULL)");
      return soMoc(moc, await chup(c));
    });
    dong(`doi_chung_bo_legacy floor_raw_lech=${dc.tangLech}/${dc.tangCo}`, dc.tangLech > 0);

    await napTangHuong(c);
    await c.query("SELECT resolve_offer_fields(NULL)");
    const sau = soMoc(moc, await chup(c));
    dong(`floor_raw_lech=${sau.tangLech}/${sau.tangCo}`, sau.tangLech === 0 && sau.tangCo > 0);
    dong(`cot_doi=${sau.khacDoi}`, sau.khacDoi === 0);

    const base = git("merge-base", "HEAD", "origin/main").trim();
    const nguonNen = git("show", `${base}:pipeline/transform-zalo.mjs`);
    const nguonCo = readFileSync(join(PIPE, "transform-zalo.mjs"), "utf8");
    const KHOA = "update(repostKey(pr, pr.post))";
    if (!nguonCo.includes(KHOA)) throw new Error("đột biến khoá gom không khớp transform-zalo.mjs");
    imLang();
    const nen = await trongSavepoint(c, async () => { await (await napBan(nguonNen, "nen"))(c); return tapS03(c); });
    const dotBien = await trongSavepoint(c, async () => {
      await (await napBan(nguonCo.replace(KHOA, 'update(repostKey(pr, pr.post) + (pr.facing ?? ""))'), "dotbien"))(c);
      return tapS03(c);
    });
    const co = await trongSavepoint(c, async () => {
      await (await napBan(nguonCo, "co"))(c);
      const { rows: [d] } = await c.query(`SELECT count(*)::int AS n,
          count(*) FILTER (WHERE unit_facing IS NOT NULL)::int AS huong, count(*) FILTER (WHERE floor_raw IS NOT NULL)::int AS tang,
          count(*) FILTER (WHERE (field_provenance -> 'unit_facing' ->> 'conflict')::boolean)::int AS bd_huong,
          count(*) FILTER (WHERE (field_provenance -> 'floor_raw' ->> 'conflict')::boolean)::int AS bd_tang
        FROM sale_offers WHERE source = 'S03'`);
      return { tap: await tapS03(c), d };
    });
    moLai();
    const lech = lechTap(co.tap, nen);
    dong(`offer_id_lech=${lech}`, lech === 0);
    const dbl = lechTap(dotBien, nen);
    dong(`dot_bien_lech=${dbl}`, dbl > 0);
    const { n, huong, tang, bd_huong: bdh, bd_tang: bdt } = co.d;
    const pct = (a, b) => (b ? a / b : 0);
    dong(`tin_co_huong=${huong}/${n}`, pct(huong, n) >= 0.25 && pct(huong, n) <= 0.35);
    dong(`tin_co_tang=${tang}/${n}`, pct(tang, n) >= 0.06 && pct(tang, n) <= 0.15);
    dong(`bat_dong_huong=${bdh}/${huong}`, pct(bdh, huong) <= 0.15);
    dong(`bat_dong_tang=${bdt}/${tang}`, pct(bdt, tang) <= 0.15);
  } finally {
    moLai();
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Số tên thật xuất hiện trong chữ. Không in tên nào. */
const demTen = (chu, ten) => ten.filter((t) => chu.toLowerCase().includes(t)).length;

async function doRanh() {
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const tep = [...new Set([...git("diff", "--name-only", base).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")])].filter(Boolean);
  dong(`sync_cloud_doi=${tep.filter((t) => t === "pipeline/sync-cloud.mjs").length}`, !tep.includes("pipeline/sync-cloud.mjs"));
  const sync = readFileSync(join(PIPE, "sync-cloud.mjs"), "utf8");
  dong(`unit_facing_trong_sync=${sync.includes("unit_facing") ? 1 : 0}`, !sync.includes("unit_facing"));
  const zalo = tep.filter((t) => /(^|\/)api\/v1\/ops\/zalo\//.test(t) || t.startsWith("collector/openclaw/"));
  dong(`route_zalo_doi=${zalo.length}`, zalo.length === 0);

  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  let ten;
  try {
    await c.query("BEGIN READ ONLY");
    const { rows } = await c.query("SELECT real_name, source_ids FROM source_registry");
    ten = [...new Set(rows.flatMap((r) => [r.real_name, ...(Array.isArray(r.source_ids) ? r.source_ids : [])])
      .filter((x) => typeof x === "string" && x.trim().length >= 4).map((x) => x.trim().toLowerCase()))];
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
  const noiDung = tep.filter((t) => existsSync(join(ROOT, t))).map((t) => readFileSync(join(ROOT, t), "utf8")).join("\n");
  const n = demTen(noiDung, ten);
  dong(`ten_that=${n}`, n === 0 && ten.length > 0);
  // Đối chứng: tệp giả chứa một tên thật thì thước phải thấy.
  const dc = demTen(`${noiDung}\n${ten[0] ?? ""}`, ten);
  dong(`ten_that_doi_chung=${dc > n ? "do" : "khong-do"}`, dc > n);
  const tapDir = timTap();
  const tuongDoi = tapDir.startsWith(ROOT) ? tapDir.slice(ROOT.length + 1) : "research-local/s03-audit-0211";
  let boQua = 0;
  try { git("check-ignore", "-q", join(tuongDoi, "labels_huong.jsonl")); boQua = 1; } catch { boQua = 0; }
  dong(`nhan_gitignore=${boQua}`, boQua === 1);
  // Dòng dài của 250 bài không được nằm trong tệp nào của diff.
  const dongBai = new Set(docNhan().flatMap(({ text }) => text.split("\n").map((l) => l.trim()).filter((l) => l.length >= 30)));
  const cau = [...dongBai].filter((l) => noiDung.includes(l)).length;
  dong(`cau_bai_trong_diff=${cau}`, cau === 0);
}

const che = process.argv[2];
if (che === "--nhan") doNhan();
else if (che === "--db") await doDb();
else if (che === "--ranh") await doRanh();
else { console.error("do-luu-tang-huong: chọn --nhan, --db hoặc --ranh"); process.exit(2); }
process.exit(hong ? 1 : 0);
