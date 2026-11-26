// ban-chep-da-loc.itest.mjs — ca tích hợp của bản chép đã lọc cho M5 (HT18), chạy trên DB của RIÊNG lượt:
//   bash db/db-thu.sh oneinvest_suite_bcl --chay node --test --test-concurrency=1 --test-name-pattern='^BCL-<n>:' scripts/ban-chep-da-loc.itest.mjs
// NGUỒN = DATABASE_URL (oneinvest_suite_bcl_<pid>, bản chép dữ liệu máy thu do db-thu cấp, bị xoá khi lệnh dừng); cắt bớt dòng các
// bảng lớn NGAY TRONG DB đó trước khi chép (sổ quyết định d-…-24). ĐÍCH = oneinvest_m5_<hôm nay>, dọn sau mỗi ca.
// Ca cấy tầng A cấy vào ĐÍCH sau bước chép (móc sauChep), hoặc vào DB của lượt — KHÔNG BAO GIỜ vào oneinvest.
// Token cấy đọc từ source_registry của DB lượt (docSourceNameEntries), không viết cứng tên nguồn thật (kho công khai).
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  chayChep, chayKiem, donHet, dsDbM5, moNguon, xuatDump, sha256Tep, tenDich, cauDemNguon, dx, BANG_CO_DONG, BANG_CAM, laBangCam,
  COT_NGUON_GIU, phanTichNguon, keHoachCot, chuanChiMuc, cauDocNguon, loaiO, cauLocTenNguon, quaLocTho, bienTheLoc,
} from "./ban-chep-da-loc.mjs";
import { tokensFromEntries } from "../pipeline/lib/tier-a-guard.mjs";
import { FILL, RENAME } from "../pipeline/sync-cloud.mjs";
import { docSourceNameEntries } from "../pipeline/lib/source-name-entries.mjs";
import { findSourceNames } from "../pipeline/lib/mask-source-names.mjs";
import { nguonSaoLuu } from "./lib/sao-luu-ngoai-may.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(REPO, "app/package.json"))("pg");
const SCRIPT = path.join(REPO, "scripts", "ban-chep-da-loc.mjs");
const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

// Rào: chỉ chạy trên DB của lượt do db-thu --chay cấp. Không thì dừng trước mọi lệnh ghi (bước cắt dòng là ghi).
const NGUON = process.env.DATABASE_URL ?? "";
const NG = phanTichNguon(NGUON);
const DUNG_DB_LUOT = !NG.loi && /^oneinvest_suite_[a-z0-9_]+_[0-9]+$/.test(NG.db);
// Chế độ thử: mọi DB đích/DB tạm của lượt này mang tiền tố riêng theo pid — không chạm oneinvest_m5_<ngày> thật, không dọn của lượt
// khác chạy song song (S4 r1 BLOCKED 26/11).
const TIEN_TO = `oneinvest_m5_t${process.pid}`;
process.env.BCL_DICH_THU = TIEN_TO;
const KHUON = new RegExp(`^${TIEN_TO}(_[a-z0-9_]+)?$`);
const DICH = tenDich();
const dsCuaToi = () => dsDbM5(KHUON);
const urlCua = (db) => `postgres://oneinvest:oneinvest@localhost:5433/${db}`;

async function voi(url, fn) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try { return await fn(c); } finally { await c.end().catch(() => {}); }
}

let entries = [];
let TOKEN = null; // tên nguồn thật để cấy — chỉ nằm trong bộ nhớ, không in
const tamDirs = [];
const thuMucTam = () => { const d = mkdtempSync(path.join(os.tmpdir(), "bcl-")); tamDirs.push(d); return d; };

let DB_M5_THAT_TRUOC = [];
before(async () => {
  DB_M5_THAT_TRUOC = (await dsDbM5()).filter((d) => /^oneinvest_m5_[0-9]{8}$/.test(d));
  if (!DUNG_DB_LUOT) throw new Error("itest chỉ chạy dưới db-thu --chay (DATABASE_URL = oneinvest_suite_*_<pid>)");
  await voi(NGUON, async (c) => {
    entries = await docSourceNameEntries(c);
    // Cắt bớt dòng trong DB của lượt (bị xoá khi lệnh dừng). replica: bỏ khoá ngoại/trigger khi xoá — dòng mồ côi ở bảng không chép
    // vô hại, bảng con được chép đã lọc theo cha sống.
    await c.query("SET session_replication_role = replica");
    await c.query(`CREATE TEMP TABLE bcl_giu AS SELECT offer_id FROM sale_offers ORDER BY offer_id LIMIT 3000`);
    await c.query(`DELETE FROM sale_offer_records r WHERE NOT EXISTS (SELECT 1 FROM bcl_giu g WHERE g.offer_id = r.offer_id)
                     AND r.offer_id NOT IN (SELECT offer_id FROM sale_offer_records WHERE retired_at IS NOT NULL ORDER BY offer_id LIMIT 50)`);
    await c.query(`DELETE FROM offer_price_rank WHERE offer_id NOT IN (SELECT offer_id FROM sale_offer_records)`);
    await c.query(`DELETE FROM nights WHERE listing_id NOT IN (SELECT id FROM listings ORDER BY id LIMIT 100)`);
    await c.query(`DELETE FROM listing_stats WHERE listing_id NOT IN (SELECT id FROM listing_records)`);
    await c.query(`DELETE FROM properties WHERE id NOT IN (SELECT id FROM properties ORDER BY id LIMIT 3000)`);
    await c.query(`DELETE FROM property_offers WHERE property_id NOT IN (SELECT id FROM properties)`);
    for (const t of ["airdna_listings", "airdna_future_daily", "airdna_sub_monthly", "airdna_submarket_metrics"]) {
      await c.query(`DELETE FROM ${q(t)} WHERE ctid IN (SELECT ctid FROM ${q(t)} OFFSET 2000)`);
    }
    // Dòng con trỏ cha không sống — để chiều đỏ của BCL-1 (bỏ lọc cha sống thì lệch số) có thật trên fixture.
    await c.query(`INSERT INTO nights SELECT (jsonb_populate_record(NULL::nights, to_jsonb(n) || '{"listing_id":"bcl-khong-song"}')).* FROM nights n LIMIT 1`);
    await c.query(`INSERT INTO property_offers SELECT (jsonb_populate_record(NULL::property_offers, to_jsonb(p) || '{"offer_id":"bcl-khong-song"}')).*
                     FROM property_offers p LIMIT 1`);
    await c.query("RESET session_replication_role");
    await c.query("VACUUM ANALYZE").catch(() => {});
  });
  TOKEN = entries.map((e) => e.realName)
    .filter((s) => s.trim().length >= 5 && /\p{L}/u.test(s) && !/['"\\$]/.test(s) && Buffer.byteLength(s) <= 40)
    .find((s) => findSourceNames(s, entries).length > 0) ?? null;
  if (!TOKEN) throw new Error("không chọn được token cấy từ source_registry của DB lượt");
});

afterEach(async () => {
  await donHet({ nguonDb: NG.db }).catch(() => {});
});
after(async () => {
  await donHet({ nguonDb: NG.db }).catch(() => {});
  for (const d of tamDirs) rmSync(d, { recursive: true, force: true });
});

/** Chạy lệnh chép vào ĐÍCH, gom mọi dòng in ra. */
async function chep(opts = {}) {
  const ra = opts.ra ?? thuMucTam();
  const out = [];
  const err = [];
  const ma = await chayChep({ nguonUrl: NGUON, dich: DICH, ra, out: (s) => out.push(s), err: (s) => err.push(s), ...opts });
  return { ma, ra, out: out.join("\n"), err: err.join("\n"), tep: path.join(ra, `oneinvest-m5-${DICH.slice(-8)}.dump`) };
}
const khongToken = (s) => findSourceNames(s, entries).length === 0;
const coDump = (ra) => readdirSync(ra).some((f) => f.endsWith(".dump"));

/** Cấy một dòng vào một bảng bất kỳ của ĐÍCH: gỡ ràng buộc + NOT NULL của riêng bảng ấy rồi INSERT DEFAULT VALUES. */
async function cayMotDong(c, t) {
  const { rows: con } = await c.query(`SELECT conname FROM pg_constraint WHERE conrelid = to_regclass($1) AND contype IN ('p', 'u', 'f', 'c', 'x')`, [`public.${q(t)}`]);
  for (const r of con) await c.query(`ALTER TABLE ${q(t)} DROP CONSTRAINT IF EXISTS ${q(r.conname)} CASCADE`);
  const { rows: nn } = await c.query(`SELECT attname FROM pg_attribute WHERE attrelid = to_regclass($1) AND attnum > 0 AND NOT attisdropped AND attnotnull`, [`public.${q(t)}`]);
  for (const r of nn) await c.query(`ALTER TABLE ${q(t)} ALTER COLUMN ${q(r.attname)} DROP NOT NULL`);
  await c.query(`ALTER TABLE ${q(t)} DISABLE TRIGGER USER`);
  await c.query(`INSERT INTO ${q(t)} DEFAULT VALUES`);
}

async function demNguon(t) {
  return voi(NGUON, async (c) => Number((await c.query(cauDemNguon(t))).rows[0].n));
}

/** So số dòng đích với kỳ vọng; trả danh sách bảng lệch (thông điệp ghim tên bảng). */
const soLech = (dich, ky) => Object.keys(ky).filter((t) => dich[t] !== ky[t]).map((t) => `${t}: đích ${dich[t]}, kỳ vọng ${ky[t]}`);

// ───────── BCL-1 (E1) ─────────
test("BCL-1: tập bảng = FILL của sync-cloud, số dòng = câu đọc sync-cloud, ref_calib_*, còn lại 0 dòng, có postgis", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  const ky = {};
  for (const t of [...FILL, "source_registry"]) ky[RENAME(t)] = await demNguon(t);
  const boLoc = {};
  for (const t of ["nights", "property_offers"]) boLoc[t] = await voi(NGUON, async (c) => Number((await c.query(`SELECT count(*) FROM ${q(t)}`)).rows[0].count));
  await voi(urlCua(DICH), async (c) => {
    const dich = {};
    for (const t of Object.keys(ky)) {
      const { rows: [x] } = await c.query("SELECT to_regclass($1) IS NOT NULL AS co", [`public.${t}`]);
      dich[t] = x.co ? Number((await c.query(`SELECT count(*) FROM ${q(t)}`)).rows[0].count) : null;
    }
    assert.deepEqual(soLech(dich, ky), [], "bảng lệch số với câu đọc sync-cloud");
    // Chiều đỏ trên cùng fixture: bản chép bỏ lọc cha sống thì nights/property_offers lệch số — thước nêu đúng tên bảng.
    const lechBoLoc = soLech({ nights: dich.nights, property_offers: dich.property_offers }, boLoc);
    assert.ok(lechBoLoc.some((s) => s.startsWith("nights:")) && lechBoLoc.some((s) => s.startsWith("property_offers:")),
      `fixture phải có dòng con trỏ cha không sống: ${lechBoLoc.join("; ")}`);
    for (const t of FILL.filter((x) => x !== RENAME(x))) {
      assert.equal((await c.query("SELECT to_regclass($1) AS r", [`public.${t}`])).rows[0].r, null, `${t} phải mang tên ref_calib_*`);
    }
    const { rows: bang } = await c.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p')`);
    const thua = [];
    for (const { relname } of bang) {
      if (BANG_CO_DONG.includes(relname)) continue;
      if ((await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(relname)}) AS co`)).rows[0].co) thua.push(relname);
    }
    assert.deepEqual(thua, [], "bảng ngoài FILL có dòng");
    assert.equal((await c.query("SELECT count(*)::int AS n FROM pg_extension WHERE extname = 'postgis'")).rows[0].n, 1, "đích thiếu postgis");
  });
  const ke = JSON.parse(readFileSync(path.join(r.ra, "ke.json"), "utf8"));
  assert.deepEqual(ke.so_dong, ky);
  assert.equal(ke.sha256, await sha256Tep(r.tep));
});

test("BCL-1: cấy một dòng vào bảng ngoài danh sách thì thoát 1, nêu bảng, xoá đích, không dump", async () => {
  const bang = await voi(NGUON, async (c) => (await c.query(
    `SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relname = ANY('{media,field_assertions,ops_audit}') ORDER BY 1 LIMIT 1`)).rows[0]?.relname);
  assert.ok(bang, "DB lượt thiếu bảng mẫu ngoài FILL");
  const r = await chep({ sauChep: (c) => cayMotDong(c, bang) });
  assert.equal(r.ma, 1);
  assert.match(r.err, new RegExp(`bang_ngoai: ${bang}`));
  assert.deepEqual(await dsCuaToi(), []);
  assert.ok(!coDump(r.ra));
});

/** So chỉ mục theo định nghĩa: mỗi bảng thành-bảng → { thieu: [def], thua: [def], bo: [def] }. Kỳ vọng đọc độc lập từ pg_indexes của
 *  bảng gốc ở NGUỒN; chỉ mục chạm cột không lên đích (theo kế hoạch cột) được liệt kê ở `bo`, không tính thiếu. */
async function soChiMuc(views) {
  const tokens = tokensFromEntries(entries);
  const kq = {};
  for (const v of views) {
    const { goc, nguon, cols } = await voi(NGUON, async (c) => {
      const { rows: g } = await c.query(`SELECT table_name FROM information_schema.view_table_usage WHERE view_schema = 'public' AND view_name = $1`, [v]);
      const { rows: vc } = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, [v]);
      const ng = g.length === 1 ? (await c.query(`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`, [g[0].table_name])).rows.map((x) => x.indexdef) : [];
      return { goc: g.length, nguon: ng, cols: keHoachCot(v, vc.map((x) => x.column_name), tokens).cols };
    });
    const dich = await voi(urlCua(DICH), async (c) => (await c.query(`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`, [v])).rows.map((x) => chuanChiMuc(x.indexdef)));
    // Cột trong định nghĩa: mọi định danh trong ngoặc sau USING và mệnh đề WHERE.
    const cotCua = (def) => (def.replace(/^.* USING \S+ /s, "").match(/[a-z_][a-z0-9_]*/g) ?? []).filter((w) => !["is", "not", "null", "and", "or", "where", "desc", "asc", "nulls", "first", "last"].includes(w));
    const bo = nguon.filter((d) => cotCua(d).some((c) => !cols.includes(c)));
    const can = nguon.filter((d) => !bo.includes(d)).map(chuanChiMuc);
    kq[v] = { goc, thieu: can.filter((d) => !dich.includes(d)), thua: dich.filter((d) => !can.includes(d)), bo, soNguon: can.length, soDich: dich.length };
  }
  return kq;
}
const bangThieuChiMuc = (kq) => Object.entries(kq).filter(([, x]) => x.thieu.length || x.soDich !== x.soNguon).map(([v, x]) => `${v} (thiếu ${x.thieu.length}, đích ${x.soDich}/nguồn ${x.soNguon})`);

test("BCL-1: bảng thành-bảng mang đủ chỉ mục của bảng gốc theo định nghĩa; đích đã ANALYZE; thước P2 chạy dưới trần 60 s", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  const ke = JSON.parse(readFileSync(path.join(r.ra, "ke.json"), "utf8"));
  assert.deepEqual([...ke.view_thanh_bang].sort(), ["listings", "sale_offers", "sellers"]);
  const kq = await soChiMuc(ke.view_thanh_bang);
  const thieu = bangThieuChiMuc(kq);
  const bo = Object.entries(kq).flatMap(([v, x]) => x.bo.map((d) => `${v}: ${d}`));
  assert.deepEqual(thieu, [], `bảng thiếu chỉ mục; chỉ mục bỏ vì cột không lên: ${bo.join(" | ")}`);
  for (const [v, x] of Object.entries(kq)) assert.deepEqual(x.thua, [], `${v} có chỉ mục lạ`);
  assert.ok(kq.sale_offers.soNguon > 0 && kq.listings.soNguon > 0, "bảng gốc phải có chỉ mục để đo");
  await voi(urlCua(DICH), async (c) => {
    const bang = [...FILL.map(RENAME), "source_registry"];
    const { rows } = await c.query(`SELECT relname FROM pg_stat_user_tables WHERE schemaname = 'public' AND relname = ANY($1) AND last_analyze IS NULL`, [bang]);
    assert.deepEqual(rows.map((x) => x.relname), [], "bảng chưa ANALYZE");
    await c.query("SET statement_timeout = '60s'");
    const t0 = Date.now();
    await c.query("SELECT count(*) FROM v_ruler_p2_area");
    assert.ok(Date.now() - t0 < 60_000);
  });
});

test("BCL-1: chiều đỏ — bản chép bỏ bước dựng chỉ mục thì ca nêu bảng thiếu", async () => {
  const r = await chep({ _boChiMuc: true });
  assert.equal(r.ma, 0, r.err);
  const thieu = bangThieuChiMuc(await soChiMuc(["sale_offers", "listings", "sellers"]));
  assert.ok(thieu.some((x) => x.startsWith("sale_offers ")) && thieu.some((x) => x.startsWith("listings ")), `phải nêu sale_offers, listings: ${thieu.join("; ")}`);
  assert.ok(!thieu.some((x) => x.startsWith("sellers ")), "sellers không có chỉ mục gốc để thiếu");
});

// ───────── BCL-3 (E3) — mười ô cấy viết trước ─────────
const O_CAY = [
  ["o_chu", /o_chu: areas\.bcl_cay_chu/, async (c, t) => {
    await c.query("ALTER TABLE areas ADD COLUMN bcl_cay_chu text");
    await c.query(`UPDATE areas SET bcl_cay_chu = $1 WHERE id = (SELECT min(id) FROM areas)`, [`x ${t} y`]);
  }],
  ["o_json", /o_json: areas\.bcl_cay_json/, async (c, t) => {
    await c.query("ALTER TABLE areas ADD COLUMN bcl_cay_json jsonb");
    await c.query(`UPDATE areas SET bcl_cay_json = jsonb_build_object('k', $1::text) WHERE id = (SELECT min(id) FROM areas)`, [t]);
  }],
  ["o_mang", /o_mang: areas\.bcl_cay_mang/, async (c, t) => {
    await c.query("ALTER TABLE areas ADD COLUMN bcl_cay_mang text[]");
    await c.query(`UPDATE areas SET bcl_cay_mang = ARRAY['a', $1::text] WHERE id = (SELECT min(id) FROM areas)`, [t]);
  }],
  ["ham", /ham: public\.bcl_cay_ham/, (c, t) => c.query(`CREATE FUNCTION bcl_cay_ham() RETURNS text LANGUAGE sql AS $f$ SELECT ${lit(t)}::text $f$`)],
  ["view", /view: public\.bcl_cay_view/, (c, t) => c.query(`CREATE VIEW bcl_cay_view AS SELECT ${lit(t)}::text AS x`)],
  ["comment", /comment: table public\.areas/, (c, t) => c.query(`COMMENT ON TABLE areas IS ${lit(`nguồn ${t}`)}`)],
  ["default", /default: public\.users\.bcl_cay_mac_dinh/, (c, t) => c.query(`ALTER TABLE users ADD COLUMN bcl_cay_mac_dinh text DEFAULT ${lit(t)}`)],
  ["enum", /enum: public\.bcl_cay_enum/, (c, t) => c.query(`CREATE TYPE bcl_cay_enum AS ENUM (${lit(t)})`)],
  ["rang_buoc", /rang_buoc: public\.bcl_cay_rb/, async (c, t) => {
    await c.query("CREATE TABLE bcl_cay_rb (x int)");
    await c.query(`ALTER TABLE bcl_cay_rb ADD CONSTRAINT ${q(`bcl_${t}`)} CHECK (x > 0)`);
  }],
  ["chi_muc", /chi_muc: public\.bcl_cay_cm/, async (c, t) => {
    await c.query("CREATE TABLE bcl_cay_cm (x int)");
    await c.query(`CREATE INDEX ${q(`bcl_${t}`)} ON bcl_cay_cm (x)`);
  }],
];
const inBCL3 = [];

test("BCL-3: ma trận cấy viết trước đủ mười ô", () => {
  assert.equal(O_CAY.length, 10);
  assert.deepEqual(O_CAY.map((x) => x[0]), ["o_chu", "o_json", "o_mang", "ham", "view", "comment", "default", "enum", "rang_buoc", "chi_muc"]);
});

for (const [ten, mau, cay] of O_CAY) {
  test(`BCL-3: cấy tên nguồn vào ${ten} → thoát 1, nêu chỗ, không in token, xoá đích, không dump`, async () => {
    const r = await chep({ sauChep: (c) => cay(c, TOKEN) });
    inBCL3.push(r.out, r.err);
    assert.equal(r.ma, 1, `ô ${ten} phải đỏ`);
    assert.match(r.err, mau);
    assert.ok(khongToken(r.out) && khongToken(r.err), `dòng in ra của ô ${ten} mang token`);
    assert.deepEqual(await dsCuaToi(), [], "DB đích phải bị xoá");
    assert.ok(!coDump(r.ra), "không được có tệp dump");
  });
}

/** Ô trúng TRƯỚC che, đếm độc lập trên phép chiếu của câu đọc nguồn (DB lượt): { "bảng_đích.cột": số ô }. */
async function oTrungTruocChe() {
  return voi(NGUON, async (c) => {
    const tokens = tokensFromEntries(entries);
    const dem = {};
    for (const t of [...FILL, "source_registry"]) {
      const { rows: cols } = await c.query(`SELECT a.attname AS c, ty.typname AS u FROM pg_attribute a JOIN pg_type ty ON ty.oid = a.atttypid
        WHERE a.attrelid = to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = '' ORDER BY a.attnum`, [`public.${t}`]);
      if (!cols.length) continue;
      const ke = keHoachCot(t, cols.map((x) => x.c), tokens);
      const chu = ke.cols.filter((col) => loaiO(cols.find((x) => x.c === col).u));
      if (!chu.length) continue;
      const { rows } = await c.query(`SELECT ${chu.map((x) => `${q(x)}::text AS ${q(x)}`).join(", ")} FROM (${cauDocNguon(t, ke.sql)}) x`);
      for (const r of rows) for (const col of chu) {
        if (r[col] != null && findSourceNames(r[col], entries).length) dem[`${RENAME(t)}.${col}`] = (dem[`${RENAME(t)}.${col}`] ?? 0) + 1;
      }
    }
    return dem;
  });
}

test("BCL-3: ca xanh — bộ soát 0 trúng sau che; ô che theo bảng.cột trong ke.json = ô trúng trước che", async () => {
  const truoc = await oTrungTruocChe();
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  inBCL3.push(r.out, r.err);
  const ke = JSON.parse(readFileSync(path.join(r.ra, "ke.json"), "utf8"));
  assert.deepEqual(ke.o_da_che, truoc, "ô che lệch ô trúng trước che");
  assert.ok(Array.isArray(ke.khoa_ngoai_bo));
});

test("BCL-3: tệp kê — cấy tên nguồn vào một mục (lối thử) thì đỏ trước khi ghi; tệp kê lượt xanh không chứa token", async () => {
  const r = await chep({ _cayKe: (ke) => { ke.cot_loai_ve_null[`bcl_${TOKEN}`] = ["x"]; } });
  inBCL3.push(r.out, r.err);
  assert.equal(r.ma, 1);
  assert.match(r.err, /TRÚNG tệp kê: \.cot_loai_ve_null\.<khoá>/);
  assert.ok(khongToken(r.out) && khongToken(r.err));
  assert.ok(!existsSync(path.join(r.ra, "ke.json")) && !coDump(r.ra), "không được ghi tệp");
  assert.deepEqual(await dsCuaToi(), []);
  const x = await chep();
  assert.equal(x.ma, 0, x.err);
  const ke = readFileSync(path.join(x.ra, "ke.json"), "utf8");
  assert.equal(findSourceNames(ke, entries).length, 0, "tệp kê lượt xanh mang token");
  assert.ok(!/"doi_ten"/.test(ke));
});

test("BCL-3: lọc thô SQL trả đúng tập của bản JS (quaLocTho) trên mẫu bịa", async () => {
  const bia = [
    { code: "S91", realName: "Quoxa Bds", wholeOnly: false }, { code: "S92", realName: "Zêlva Nhà", wholeOnly: true },
    { code: "S93", realName: "vnk", wholeOnly: false }, { code: "S95", realName: "Đồng Lúa Xanh", wholeOnly: false },
  ];
  const mau = ["BÁN QUOXA BDS", "quoxa-bds", "zelva_nha", "zelva%20nha", "ZÊLVA-NHÀ", "Ze\u0302lva Nha\u0300", "abc vnk def", "ĐỒNG LÚA",
    "donglua-xanh", "không có gì", "q u o x a", '{"quoxa_bds_id": 1}'];
  const loc = bienTheLoc(bia);
  await voi(NGUON, async (c) => {
    await c.query("CREATE TEMP TABLE bcl_mau (v text)");
    for (const s of mau) await c.query("INSERT INTO bcl_mau VALUES ($1)", [s]);
    const sql = new Set((await c.query(cauLocTenNguon("bcl_mau", "v", bia).replace(/"bcl_mau"/, () => "pg_temp.bcl_mau"))).rows.map((x) => x.v));
    const js = new Set(mau.filter((s) => quaLocTho(s, loc)));
    assert.deepEqual([...sql].sort(), [...js].sort(), "lọc thô SQL khác bản JS");
  });
});

test("BCL-3: đối chứng dương — chuỗi không có trong source_registry cấy vào ô text[] thì không trúng", async () => {
  const bia = "zzbcl-khong-phai-nguon-qx";
  assert.equal(findSourceNames(bia, entries).length, 0);
  const r = await chep({
    sauChep: async (c) => {
      await c.query("ALTER TABLE areas ADD COLUMN bcl_cay_mang text[]");
      await c.query(`UPDATE areas SET bcl_cay_mang = ARRAY[$1::text] WHERE id = (SELECT min(id) FROM areas)`, [bia]);
    },
  });
  inBCL3.push(r.out, r.err);
  assert.equal(r.ma, 0, r.err);
  assert.ok(coDump(r.ra));
});

test("BCL-3: toàn bộ stdout/stderr của các ca không chứa token nào của từ điển", () => {
  assert.ok(inBCL3.length >= 2);
  const hits = inBCL3.flatMap((s) => findSourceNames(s, entries));
  assert.equal(hits.length, 0, `có ${hits.length} chỗ mang token (mã ${[...new Set(hits.map((h) => h.code))].join(",")})`);
});

// ───────── BCL-4 (E4) ─────────
test("BCL-4: mọi bảng cấm ở đích 0 dòng", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  await voi(urlCua(DICH), async (c) => {
    const { rows } = await c.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p')`);
    const cam = rows.map((x) => x.relname).filter(laBangCam);
    for (const s of BANG_CAM.filter((x) => typeof x === "string")) assert.ok(cam.includes(s), `đích thiếu bảng ${s} (lược đồ phải có, 0 dòng)`);
    for (const t of cam) assert.equal((await c.query(`SELECT count(*)::int AS n FROM ${q(t)}`)).rows[0].n, 0, `bảng cấm ${t} có dòng`);
  });
});

test("BCL-4: cấy một dòng vào sessions → thoát 1 nêu sessions", async () => {
  const r = await chep({ sauChep: (c) => cayMotDong(c, "sessions") });
  assert.equal(r.ma, 1);
  assert.match(r.err, /bang_cam: sessions/);
  assert.deepEqual(await dsCuaToi(), []);
});

test("BCL-4: cấy một dòng vào bảng stg_* → thoát 1 nêu bảng", async () => {
  let bang;
  const r = await chep({
    sauChep: async (c) => {
      const { rows } = await c.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relname ~ '^stg_'
        ORDER BY relname = 'stg_s08_inventory' DESC, relname LIMIT 1`);
      bang = rows[0].relname;
      await cayMotDong(c, bang);
    },
  });
  assert.equal(r.ma, 1);
  assert.match(r.err, new RegExp(`bang_cam: ${bang}`));
  assert.deepEqual(await dsCuaToi(), []);
});

// ───────── BCL-5 (E5) ─────────
test("BCL-5: source_registry đích chỉ mã + vai trò, cột khác NULL", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  const n = await voi(NGUON, async (c) => Number((await c.query("SELECT count(*) FROM source_registry")).rows[0].count));
  await voi(urlCua(DICH), async (c) => {
    const { rows: cot } = await c.query(`SELECT attname FROM pg_attribute WHERE attrelid = 'public.source_registry'::regclass AND attnum > 0 AND NOT attisdropped`);
    for (const { attname } of cot) {
      const k = Number((await c.query(`SELECT count(*) FROM source_registry WHERE ${q(attname)} IS NOT NULL`)).rows[0].count);
      if (COT_NGUON_GIU.includes(attname)) assert.ok(attname !== "code" || k === n, "mã phải đủ dòng");
      else assert.equal(k, 0, `source_registry.${attname} phải NULL`);
    }
    assert.equal(Number((await c.query("SELECT count(*) FROM source_registry")).rows[0].count), n);
  });
});

test("BCL-5: cấy real_name → thoát 1 nêu source_registry.real_name", async () => {
  const r = await chep({ sauChep: (c) => c.query(`UPDATE source_registry SET real_name = 'bcl-cay' WHERE code = (SELECT min(code) FROM source_registry)`) });
  assert.equal(r.ma, 1);
  assert.match(r.err, /nguon: source_registry\.real_name/);
  assert.deepEqual(await dsCuaToi(), []);
});

// ───────── BCL-6 (E6) ─────────
test("BCL-6: cột seller_dob có giá trị → thoát 1 nêu chỗ", async () => {
  const r = await chep({
    sauChep: async (c) => {
      await c.query("ALTER TABLE areas ADD COLUMN seller_dob date");
      await c.query("UPDATE areas SET seller_dob = '1990-01-01' WHERE id = (SELECT min(id) FROM areas)");
    },
  });
  assert.equal(r.ma, 1);
  assert.match(r.err, /sinh_gioi_cot: areas\.seller_dob/);
});

test("BCL-6: khoá gender trong json → thoát 1 nêu chỗ", async () => {
  const r = await chep({
    sauChep: async (c) => {
      await c.query("ALTER TABLE areas ADD COLUMN bcl_cay_j jsonb");
      await c.query(`UPDATE areas SET bcl_cay_j = '{"meta": {"gender": "x"}}' WHERE id = (SELECT min(id) FROM areas)`);
    },
  });
  assert.equal(r.ma, 1);
  assert.match(r.err, /sinh_gioi_khoa: areas\.bcl_cay_j/);
});

test("BCL-6: schema lạ có bảng → thoát 1 nêu schema", async () => {
  const r = await chep({
    sauChep: async (c) => {
      await c.query("CREATE SCHEMA bcl_la");
      await c.query("CREATE TABLE bcl_la.t (x int)");
      await c.query("INSERT INTO bcl_la.t VALUES (1)");
    },
  });
  assert.equal(r.ma, 1);
  assert.match(r.err, /schema_la: bcl_la/);
});

test("BCL-6: cột tên khớp mà toàn NULL thì không đỏ", async () => {
  const r = await chep({ sauChep: (c) => c.query("ALTER TABLE areas ADD COLUMN seller_dob date") });
  assert.equal(r.ma, 0, r.err);
});

// ───────── BCL-7 (E7) ─────────
async function vanTay() {
  const dau = readFileSync(path.join(REPO, "db", "dau-luoc-do.sql"), "utf8");
  return voi(NGUON, async (c) => {
    const { rows: bang } = await c.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p') ORDER BY 1`);
    const so = {};
    for (const { relname } of bang) so[relname] = Number((await c.query(`SELECT count(*) FROM ${q(relname)}`)).rows[0].count);
    const md5 = (await c.query(dau)).rows[0].md5;
    return { so, md5 };
  });
}

test("BCL-7: vân tay DB nguồn (số dòng từng bảng + dấu lược đồ) trước = sau", async () => {
  const truoc = await vanTay();
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  const sau = await vanTay();
  assert.equal(sau.md5, truoc.md5, "dấu lược đồ nguồn đổi");
  assert.deepEqual(soLech(sau.so, truoc.so), [], "số dòng nguồn đổi");
});

test("BCL-7: phiên đọc nguồn chạy dưới default_transaction_read_only, ghi bị chặn", async () => {
  const n = await moNguon(NGUON);
  try {
    assert.equal((await n.client.query("SHOW default_transaction_read_only")).rows[0].default_transaction_read_only, "on");
    assert.equal((await n.client.query("SHOW transaction_read_only")).rows[0].transaction_read_only, "on");
    await assert.rejects(n.client.query("CREATE TABLE bcl_ghi_thu (x int)"), /read-only/);
  } finally {
    await n.client.query("ROLLBACK").catch(() => {});
    await n.client.end();
  }
  // Ống COPY và pg_dump phía nguồn mang cùng cờ.
  assert.ok(dx(["psql"], { chiDoc: true })[1].includes("PGOPTIONS=-c default_transaction_read_only=on"));
  // psql trong container với cờ ấy cũng từ chối ghi.
  const [cmd, args] = dx(["psql", "-U", "oneinvest", "-h", "localhost", "-At", "-d", NG.db, "-c", "CREATE TABLE bcl_ghi_thu (x int)"], { chiDoc: true });
  const p = spawnSync(cmd, args, { encoding: "utf8" });
  assert.notEqual(p.status, 0);
  assert.match(p.stderr, /read-only/);
});

for (const dich of ["oneinvest", "oneinvest_m5_2026", "oneinvest_x"]) {
  test(`BCL-7: đích «${dich}» bị từ chối mã 2`, () => {
    const p = spawnSync(process.execPath, [SCRIPT, "--dich", dich], { encoding: "utf8", env: { ...process.env, DATABASE_URL: NGUON } });
    assert.equal(p.status, 2, p.stderr);
  });
}

// ───────── BCL-8 (E8) ─────────
async function kiem(tep, khongTuDien = false) {
  const out = [];
  const err = [];
  const ma = await chayKiem({ tep, khongTuDien, nguonUrl: NGUON, out: (s) => out.push(s), err: (s) => err.push(s) });
  return { ma, out: out.join("\n"), err: err.join("\n") };
}
const conDbKiem = async () => (await dsCuaToi()).filter((d) => d.startsWith(`${TIEN_TO}_kiem_`));
function chepBo(tep) {
  const d = thuMucTam();
  const moi = path.join(d, path.basename(tep));
  copyFileSync(tep, moi);
  copyFileSync(path.join(path.dirname(tep), "ke.json"), path.join(d, "ke.json"));
  return moi;
}

test("BCL-8: --kiem xanh, sha256 sửa byte đỏ, ke.json lệch một dòng đỏ nêu bảng, --khong-tu-dien, DB tạm luôn bị xoá", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);

  const xanh = await kiem(r.tep);
  assert.equal(xanh.ma, 0, xanh.err);
  assert.deepEqual(await conDbKiem(), []);

  // Đỏ 1: sửa một byte tệp dump.
  const hong = chepBo(r.tep);
  const buf = readFileSync(hong);
  buf[Math.floor(buf.length / 2)] ^= 0xff;
  writeFileSync(hong, buf);
  const d1 = await kiem(hong);
  assert.equal(d1.ma, 1);
  assert.match(d1.err, /sha256/);
  assert.deepEqual(await conDbKiem(), []);

  // Đỏ 2: dump hợp lệ, sha khớp, ke.json lệch một dòng ở một bảng.
  const lech = chepBo(r.tep);
  const keTep = path.join(path.dirname(lech), "ke.json");
  const ke = JSON.parse(readFileSync(keTep, "utf8"));
  const bang = Object.keys(ke.so_dong).find((t) => ke.so_dong[t] > 0);
  ke.so_dong[bang] += 1;
  writeFileSync(keTep, JSON.stringify(ke));
  const d2 = await kiem(lech);
  assert.equal(d2.ma, 1);
  assert.match(d2.err, new RegExp(`số dòng: ${bang} `));
  assert.deepEqual(await conDbKiem(), []);

  // Không từ điển (M5): xanh trên dump xanh.
  const kt = await kiem(r.tep, true);
  assert.equal(kt.ma, 0, kt.err);
  assert.deepEqual(await conDbKiem(), []);

  // Không từ điển: dump cấy một dòng sessions (ke.json cập nhật sha, số dòng giữ) → đỏ nêu sessions.
  await voi(urlCua(DICH), (c) => cayMotDong(c, "sessions"));
  const d = thuMucTam();
  const tepCay = path.join(d, path.basename(r.tep));
  const { sha256 } = await xuatDump(DICH, tepCay);
  writeFileSync(path.join(d, "ke.json"), JSON.stringify({ ...JSON.parse(readFileSync(path.join(r.ra, "ke.json"), "utf8")), sha256 }));
  const d3 = await kiem(tepCay, true);
  assert.equal(d3.ma, 1);
  assert.match(d3.err, /bang_cam: sessions/);
  assert.deepEqual(await conDbKiem(), []);
});

test("BCL-8: --kiem qua docker exec (không qua cổng 5433) xanh, có và không có từ điển; DB tạm bị xoá", async () => {
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  for (const khongTuDien of [false, true]) {
    const out = [];
    const err = [];
    const ma = await chayKiem({ tep: r.tep, khongTuDien, nguonUrl: NGUON, quaDocker: true, out: (s) => out.push(s), err: (s) => err.push(s) });
    assert.equal(ma, 0, err.join("\n"));
    assert.match(out.join("\n"), /nối qua docker exec/);
    assert.deepEqual(await conDbKiem(), []);
  }
  // Đỏ qua docker vẫn đỏ: ke.json lệch một dòng thì nêu bảng.
  const lech = chepBo(r.tep);
  const keTep = path.join(path.dirname(lech), "ke.json");
  const ke = JSON.parse(readFileSync(keTep, "utf8"));
  const bang = Object.keys(ke.so_dong).find((t) => ke.so_dong[t] > 0);
  ke.so_dong[bang] += 1;
  writeFileSync(keTep, JSON.stringify(ke));
  const err = [];
  const ma = await chayKiem({ tep: lech, khongTuDien: true, quaDocker: true, out: () => {}, err: (s) => err.push(s) });
  assert.equal(ma, 1);
  assert.match(err.join("\n"), new RegExp(`số dòng: ${bang} `));
  assert.deepEqual(await conDbKiem(), []);
});

// ───────── BCL-10 (E10) ─────────
test("BCL-10: hai lượt chép song song với hai tiền tố khác nhau không xoá DB của nhau", async () => {
  const tt = [`oneinvest_m5_t${process.pid}1`, `oneinvest_m5_t${process.pid}2`];
  const chay1 = (t) => new Promise((resolve) => {
    const ra = thuMucTam();
    const p = spawn(process.execPath, [SCRIPT, "--dich", tenDich(new Date(), t), "--ra", ra],
      { env: { ...process.env, DATABASE_URL: NGUON, BCL_DICH_THU: t }, stdio: ["ignore", "pipe", "pipe"] });
    let e = "";
    p.stderr.on("data", (b) => { e += b; });
    p.stdout.resume();
    p.on("close", (ma) => resolve({ ma, e }));
  });
  try {
    const kq = await Promise.all(tt.map(chay1));
    kq.forEach((k, i) => assert.equal(k.ma, 0, `lượt ${i + 1}: ${k.e.slice(0, 500)}`));
    const ds = await dsDbM5(/^oneinvest_m5_/);
    for (const t of tt) assert.ok(ds.includes(tenDich(new Date(), t)), `DB của ${t} bị xoá: còn ${ds.filter((d) => d.startsWith("oneinvest_m5_t")).join(", ")}`);
    assert.ok(!ds.some((d) => /^oneinvest_m5_[0-9]{8}$/.test(d) && !DB_M5_THAT_TRUOC.includes(d)), "lượt thử không được dựng tên đích thật");
  } finally {
    for (const t of tt) spawnSync(process.execPath, [SCRIPT, "--don"], { env: { ...process.env, DATABASE_URL: NGUON, BCL_DICH_THU: t } });
  }
  for (const t of tt) assert.deepEqual((await dsDbM5(/^oneinvest_m5_/)).filter((d) => d.startsWith(`${t}_`)), [], `--don của ${t} chưa dọn`);
});


async function taoDbCu(ten) {
  await voi(urlCua("postgres"), (c) => c.query(`CREATE DATABASE ${q(ten)} TEMPLATE template0`));
}

test("BCL-10: có sẵn một oneinvest_m5_ cũ → chép mới xong chỉ còn đúng một DB", async () => {
  await taoDbCu(`${TIEN_TO}_20200101`);
  const r = await chep();
  assert.equal(r.ma, 0, r.err);
  const ds = await dsCuaToi();
  assert.deepEqual(ds, [DICH], `còn ${ds.length} DB oneinvest_m5_*: ${ds.join(", ")}`);
});

test("BCL-10: lỗi cấy giữa bước chép → không còn DB đích, không dump", async () => {
  const r = await chep({ loiCay: "giua-chep" });
  assert.equal(r.ma, 1);
  assert.deepEqual(await dsCuaToi(), []);
  assert.ok(!coDump(r.ra));
});

test("BCL-10: --don xoá mọi oneinvest_m5_*", async () => {
  await taoDbCu(`${TIEN_TO}_20200101`);
  await taoDbCu(`${TIEN_TO}_kiem_1`);
  const p = spawnSync(process.execPath, [SCRIPT, "--don"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: NGUON } });
  assert.equal(p.status, 0, p.stderr);
  assert.deepEqual(await dsCuaToi(), []);
});

test("BCL-10: state/ban-chep-m5 bị git bỏ qua và nằm ngoài nguồn sao lưu ra ngoài máy", () => {
  const g = spawnSync("git", ["-C", REPO, "check-ignore", "-q", "state/ban-chep-m5/x"]);
  assert.equal(g.status, 0, "state/ban-chep-m5/ phải bị git bỏ qua");
  // Nguồn sao lưu ra ngoài máy (collector/snapshots, collector/state, kho ảnh) không được có đường nào dưới state/ban-chep-m5.
  const goc = path.join(REPO, "state", "ban-chep-m5");
  const { duong } = nguonSaoLuu({ gocNguon: REPO, khoAnh: null });
  const duoi = duong.filter((d) => (path.resolve(d) + path.sep).startsWith(goc + path.sep) || (goc + path.sep).startsWith(path.resolve(d) + path.sep));
  assert.deepEqual(duoi, [], `nguồn sao lưu chạm state/ban-chep-m5: ${duoi.join(", ")}`);
  assert.ok(existsSync(SCRIPT));
});
