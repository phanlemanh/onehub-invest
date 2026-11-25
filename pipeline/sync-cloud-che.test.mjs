// sync-cloud-che.test.mjs — HT26 `sync-cloud-che-ten-nguon-moi-cot`: che tên nguồn ở mọi cột và bộ chặn mọi bảng của sync-cloud.
// Chạy trên DB của riêng lượt (bash db/db-thu.sh oneinvest_suite_scc --chay node --test --test-name-pattern='^SCC-<n>:' …) — mỗi ca
// dựng lược đồ phủ riêng (scc<n>) trên DB ấy, đọc bằng đúng đường đọc của sync (syncOnce / localReadSql); cloud là exec GIẢ chỉ trả
// catalog và dừng ở câu nạp đầu tiên — không ca nào gọi cloud thật. Tên nguồn: chuỗi bịa rõ ràng (BIA) hoặc đọc từ source_registry
// của DB lượt; thông điệp ca không bao giờ in token.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";
import { cheGiaTri, cheO, cheOJson, docJson, laCotUrl } from "./lib/che-ten-nguon-gia-tri.mjs";
import { findSourceNames } from "./lib/mask-source-names.mjs";
import { docSourceNameEntries } from "./lib/source-name-entries.mjs";
import { tokensFromEntries } from "./lib/tier-a-guard.mjs";
import {
  CLOUD_ALLOW, RENAME, assertNoSourceNames, cheDuLieu, cheWarning, localReadSql, localTypes, mgmtExec, runMain, selectList, syncOnce, tachDong,
} from "./sync-cloud.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.resolve(HERE, "..");
const DB = process.env.DATABASE_URL;
const coDb = { skip: DB ? false : "thiếu DATABASE_URL — chạy qua db/db-thu.sh oneinvest_suite_scc --chay" };
// Bản sync-cloud.mjs trước HT26 (merge-base của nhánh với main lúc cắt hàng) — đối chứng «bộ chặn cũ để lọt».
const SHA_CU = "caadfbb1c67d4a4296357875fa4e6fbef42d6f50";

// Từ điển BỊA (không phải nguồn thật): một tên hai từ khai cờ, tên miền của nó, một tên một từ.
const BIA = [
  { code: "S97", realName: "Nguonbia Kappa", wholeOnly: true },
  { code: "S97", realName: "nguonbiakappa.example", wholeOnly: true },
  { code: "S96", realName: "Zetabia", wholeOnly: false },
];
const coTen = (s, entries = BIA) => s != null && findSourceNames(typeof s === "string" ? s : JSON.stringify(s), entries).length > 0;

let c;
before(async () => {
  if (!DB) return;
  c = new pg.Client({ connectionString: DB, types: localTypes });
  await c.connect();
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
  if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — chạy qua db/db-thu.sh (DB của lượt)");
});
after(async () => { await c?.end(); });

/** Client đọc với search_path = lược đồ phủ trước public: bảng phủ thay bảng thật cùng tên, phần còn lại đọc public. */
async function moPhu(schema) {
  const l = new pg.Client({ connectionString: DB, types: localTypes, options: `-c search_path=${schema},public` });
  await l.connect();
  return l;
}
async function dungPhu(schema, bang) {
  await c.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema}`);
  // sale_offers rỗng làm mặc định: bản cũ đếm ô che người bán trên cả sale_offers ở mọi lượt (biểu thức che SQL chậm trên 150k dòng).
  for (const [t, where] of Object.entries({ sale_offers: "LIMIT 0", ...bang })) await c.query(`CREATE TABLE ${schema}.${t} AS SELECT * FROM public.${t} ${where}`);
}

/** Cloud GIẢ: trả catalog dựng từ catalog máy thu, qua hai chốt trước gửi; câu nạp staging đầu tiên được ghi lại rồi dừng lượt. */
function cloudGia() {
  const calls = [];
  const staged = [];
  const exec = async (sql) => {
    calls.push(sql);
    if (/INSERT INTO sync_stage\.rows/.test(sql)) {
      const m = sql.match(/(\$sync_[A-Za-z0-9]+\$)([\s\S]*)\1::jsonb/);
      staged.push(...JSON.parse(m[2]));
      throw new Error("SCC-DUNG-O-STAGE");
    }
    if (sql.includes("to_regclass('sync_stage.rows')")) return [{ r: "sync_stage.rows", s: "sync_stage.swaps" }];
    if (sql.includes("SELECT c.relname AS t, c.relkind::text AS kind")) {
      const names = [...sql.matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1]);
      return names.map((t) => ({ t, kind: "r" }));
    }
    if (sql.includes("is_generated")) {
      const names = [...sql.matchAll(/'([a-z0-9_]+)'/g)].map((x) => x[1]);
      const loc = names.map((t) => t.replace(/^ref_calib_/, "airdna_"));
      const { rows } = await c.query(
        `SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ANY($1)
         ORDER BY table_name, ordinal_position`, [loc]);
      return rows.map((r) => ({ t: RENAME(r.t), c: r.c, gen: false }));
    }
    if (sql.includes("aclexplode")) return [];
    if (sql.includes("FROM pg_roles WHERE rolname = 'anon'")) return [{ n: 1 }];
    if (/to_regclass\('public\./.test(sql)) return [{ r: null }];
    return [];
  };
  return { exec, calls, staged, soCauNap: () => calls.filter((s) => /INSERT INTO sync_stage\.rows/.test(s)).length };
}
/** Chạy một lượt; trả { loi, staged } — lượt khoẻ dừng ở câu nạp đầu (SCC-DUNG-O-STAGE) với payload đã ghi lại. */
async function chayLuot(mod, local, opts) {
  const cg = cloudGia();
  let loi = null;
  try {
    await mod.syncOnce({ local, exec: cg.exec, log: () => {}, ...opts });
  } catch (e) {
    loi = e;
  }
  return { loi, staged: cg.staged, soCauNap: cg.soCauNap() };
}
const quaScan = (r) => r.loi && /SCC-DUNG-O-STAGE/.test(r.loi.message) && r.loi.phase === "stage";

// ───────────────────────── SCC-1 (E1, AC-1): che mọi kiểu ô ─────────────────────────

const SACH_JSON = '{"a": 1.50, "b": "x"}';
async function dongSCC1() {
  await c.query(`DROP SCHEMA IF EXISTS scc1 CASCADE; CREATE SCHEMA scc1;
    CREATE TABLE scc1.bang_thu (id text PRIMARY KEY, mo_ta text, listing_url text, photo_urls text[], anh jsonb, meta jsonb, sach text, sach_json jsonb, so numeric)`);
  await c.query(`INSERT INTO scc1.bang_thu VALUES
    ('r1', 'Căn đẹp, đăng trên Nguonbia Kappa hôm qua', 'https://www.nguonbiakappa.example/rooms/1',
     ARRAY['https://cdn.nguonbiakappa.example/a.jpg', 'https://anh-sach.example/b.jpg'],
     '["cdn.nguonbiakappa.example/x.jpg", "anh-sach.example/y.jpg"]',
     '{"zetabia_id": 12, "gia": 1234567890.123456789012345, "ghi": "theo Zetabia", "x": [1.10, 2.500]}',
     'ngõ 3 phố Huế', $1, 0.1000000000000000055511151231257827),
    ('r2', 'chữ sạch', 'https://anh-sach.example/p/2', ARRAY['https://anh-sach.example/c.jpg'], '["anh-sach.example/z.jpg"]',
     '{"k": 3.14159265358979323846264338327950288}', 'sạch', $1, 42.000)`, [SACH_JSON]);
  const l = await moPhu("scc1");
  try {
    const { rows: cols } = await l.query(`SELECT column_name AS c FROM information_schema.columns WHERE table_schema = 'scc1' AND table_name = 'bang_thu' ORDER BY ordinal_position`);
    const cot = cols.map((r) => r.c);
    const { rows } = await l.query(localReadSql("bang_thu", selectList("bang_thu", cot).sql) + " ORDER BY 1");
    return { goc: rows.map((r) => r.j), cot };
  } finally {
    await l.end();
  }
}
const oTho = (j) => Object.fromEntries(tachDong(j).map(({ k, a, b }) => [k, j.slice(a, b)]));

/** Ma trận viết trước: trả danh sách kiểu ô SAI (rỗng = đạt). Không in giá trị. */
function kiemMaTran(goc, ra, dem) {
  const sai = [];
  const [g1, g2] = goc.map(oTho);
  const [r1, r2] = ra.map(oTho);
  const v1 = JSON.parse(ra[0]);
  if (!(typeof v1.mo_ta === "string" && v1.mo_ta.includes("S97") && !coTen(v1.mo_ta))) sai.push("chữ tự do");
  if (v1.listing_url !== null) sai.push("URL đứng riêng");
  if (!(JSON.stringify(v1.photo_urls) === '["https://anh-sach.example/b.jpg"]' && JSON.stringify(v1.anh) === '["anh-sach.example/y.jpg"]')) sai.push("mảng URL");
  const khoa = Object.keys(v1.meta ?? {});
  if (!(khoa.includes("S96_id") && !khoa.some((k) => coTen(k)))) sai.push("khoá json");
  if (v1.meta?.ghi !== "theo S96") sai.push("giá trị json");
  if (!["1234567890.123456789012345", "1.10", "2.500"].every((s) => (r1.meta ?? "").includes(s))) sai.push("số thập phân jsonb");
  const giu = ["id", "sach", "sach_json", "so"].every((k) => r1[k] === g1[k]) && ra[1] === goc[1] && r2.sach_json === g2.sach_json;
  if (!giu) sai.push("ô không trúng giữ nguyên byte");
  const w = cheWarning(dem) ?? "";
  if (!(/^che tên nguồn \d+ ô: /.test(w) && w.includes("bang_thu.mo_ta 1") && !coTen(w) && !w.includes("anh-sach"))) sai.push("dòng cảnh báo");
  return sai;
}
function che(goc, cot, opts = {}) {
  const data = new Map([["bang_thu", [...goc]]]);
  const dem = cheDuLieu(data, BIA, { columns: { bang_thu: cot }, ...opts });
  return { ra: data.get("bang_thu"), dem };
}

test("SCC-1: dòng localReadSql (DB của lượt) → che đúng mọi kiểu ô, ô sạch giữ byte, số jsonb giữ chữ số, cảnh báo không giá trị", coDb, async () => {
  const { goc, cot } = await dongSCC1();
  assert.ok(goc.length === 2 && goc.every((j) => j.startsWith("{")), "SCC-1 tiền đề: đọc được hai dòng bằng localReadSql");
  assert.ok(coTen(goc[0]), "SCC-1 tiền đề: dòng r1 phải mang tên bịa trước khi che");
  const { ra, dem } = che(goc, cot);
  assert.deepEqual(kiemMaTran(goc, ra, dem), [], "SCC-1 ma trận che");
  assert.deepEqual(dem, { "bang_thu.mo_ta": 1, "bang_thu.listing_url": 1, "bang_thu.photo_urls": 1, "bang_thu.anh": 1, "bang_thu.meta": 1 }, "SCC-1 số ô che theo bảng.cột");
  assert.doesNotThrow(() => assertNoSourceNames(new Map([["bang_thu", ra]]), tokensFromEntries(BIA), { columns: { bang_thu: cot } }), "SCC-1 bộ chặn sau che");
});

// Chiều đỏ: mỗi đột biến bỏ bước che của MỘT kiểu ô → ma trận nêu đúng kiểu ấy.
const giuKhoa = (v, r) => Object.fromEntries(Object.keys(v).map((k, i) => [k, Object.values(r)[i]]));
const DOT_BIEN = {
  "chữ tự do": (v, e, o) => (typeof v === "string" && !laCotUrl(o.cot) && !/^https?:/.test(v) ? { giaTri: v, soCho: 0 } : cheO(v, e, o)),
  "URL đứng riêng": (v, e, o) => (typeof v === "string" && laCotUrl(o.cot) ? cheGiaTri(v, e) : cheO(v, e, o)),
  "mảng URL": (v, e, o) => (Array.isArray(v) ? { giaTri: v, soCho: 0 } : cheO(v, e, o)),
  "khoá json": (v, e, o) => {
    const r = cheO(v, e, o);
    return v && typeof v === "object" && !Array.isArray(v) && r.soCho ? { ...r, giaTri: giuKhoa(v, r.giaTri) } : r;
  },
  "giá trị json": (v, e, o) => {
    const r = cheO(v, e, o);
    return v && typeof v === "object" && !Array.isArray(v) && r.soCho ? { ...r, giaTri: Object.fromEntries(Object.keys(r.giaTri).map((k, i) => [k, Object.values(v)[i]])) } : r;
  },
  "số thập phân jsonb": (v, e, o) => {
    const r = cheO(v, e, o);
    return r.giaTri && typeof r.giaTri === "object" ? { ...r, giaTri: JSON.parse(JSON.stringify(r.giaTri)) } : r;
  },
};
for (const [kieu, cheOImpl] of Object.entries(DOT_BIEN)) {
  test(`SCC-1: chiều đỏ — bỏ che kiểu «${kieu}» thì ma trận đỏ đúng kiểu ấy`, coDb, async () => {
    const { goc, cot } = await dongSCC1();
    const { ra, dem } = che(goc, cot, { cheOImpl });
    assert.ok(kiemMaTran(goc, ra, dem).includes(kieu), `SCC-1 đột biến «${kieu}» không bị bắt`);
  });
}
test("SCC-1: chiều đỏ — che bằng cách ghi lại cả dòng thì «ô không trúng giữ nguyên byte» đỏ; cảnh báo mang giá trị thì «dòng cảnh báo» đỏ", coDb, async () => {
  const { goc, cot } = await dongSCC1();
  const { dem } = che(goc, cot);
  const caDong = goc.map((j) => {
    const o = docJson(j);
    for (const k of Object.keys(o)) o[k] = cheO(o[k], BIA, { cot: k }).giaTri;
    return JSON.stringify(o);
  });
  assert.ok(kiemMaTran(goc, caDong, dem).includes("ô không trúng giữ nguyên byte"), "SCC-1 đột biến ghi lại cả dòng không bị bắt");
  const { ra } = che(goc, cot);
  assert.ok(kiemMaTran(goc, ra, { ...dem, "bang_thu.mo_ta Nguonbia Kappa": 1 }).includes("dòng cảnh báo"), "SCC-1 cảnh báo mang giá trị không bị bắt");
});

// ───────────────────────── SCC-2 (E2, AC-2): bộ chặn mọi bảng ─────────────────────────

const CAY2 = [
  ["areas", "meta", `jsonb_build_object('ghi', 'theo Nguonbia Kappa')`],
  ["dq_check_results", "detail", `'kiểm theo Nguonbia Kappa'`],
  ["listings", "photo_urls", `'["https://cdn.nguonbiakappa.example/1.jpg"]'::jsonb`],
];
let modCu = null;
let tepCu = null;
async function napBanCu() {
  if (modCu) return modCu;
  const src = execFileSync("git", ["-C", GOC, "show", `${SHA_CU}:pipeline/sync-cloud.mjs`], { encoding: "utf8" });
  assert.ok(src.includes("for (const t of Object.keys(CLOUD_ALLOW))"), "SCC-2 tiền đề: bản cũ phải là bộ chặn chỉ CLOUD_ALLOW");
  tepCu = path.join(HERE, `.scc-sync-cloud-cu-${process.pid}.mjs`);
  writeFileSync(tepCu, src);
  modCu = await import(pathToFileURL(tepCu).href);
  return modCu;
}
after(() => { if (tepCu) try { unlinkSync(tepCu); } catch {} });

for (const [t, col, giaTri] of CAY2) {
  test(`SCC-2: cấy tên nguồn vào ${t}.${col} (ngoài CLOUD_ALLOW), tắt che → dừng ở scan nêu ${t}.${col}, 0 câu nạp; bộ chặn cũ để lọt`, coDb, async () => {
    assert.ok(!(t in CLOUD_ALLOW), "SCC-2 tiền đề: bảng ngoài CLOUD_ALLOW");
    const s = `scc2_${t}`;
    await dungPhu(s, { [t]: "LIMIT 20" });
    const { rows: [k] } = await c.query(`SELECT ctid::text AS id FROM ${s}.${t} LIMIT 1`);
    await c.query(`UPDATE ${s}.${t} SET ${col} = ${giaTri} WHERE ctid = $1::tid`, [k.id]);
    const l = await moPhu(s);
    try {
      const opts = { sourceEntries: BIA, fill: [t] };
      const tat = await chayLuot({ syncOnce }, l, { ...opts, che: false });
      assert.equal(tat.loi?.phase, "scan", `SCC-2 ${t}.${col}: tắt che mà lượt không dừng ở scan`);
      assert.ok(tat.loi.message.includes(`${t}.${col}`), `SCC-2 ${t}.${col}: thông điệp không nêu đúng bảng.cột`);
      assert.ok(!coTen(tat.loi.message), "SCC-2 thông điệp chứa tên nguồn");
      assert.equal(tat.soCauNap, 0, `SCC-2 ${t}.${col}: exec cloud giả nhận câu nạp`);
      const bat = await chayLuot({ syncOnce }, l, opts);
      assert.ok(quaScan(bat), `SCC-2 ${t}.${col}: có che mà lượt không qua scan (${bat.loi?.phase})`);
      assert.ok(!bat.staged.some((r) => coTen(r)), `SCC-2 ${t}.${col}: payload đã che còn tên nguồn`);
      // Đối chứng: bộ chặn cũ (chỉ ba bảng CLOUD_ALLOW, không che) để lọt — dòng mang tên tới câu nạp.
      const cu = await chayLuot(await napBanCu(), l, { sourceTokens: tokensFromEntries(BIA), fill: [t] });
      assert.ok(quaScan(cu) && cu.staged.some((r) => coTen(r)), `SCC-2 đối chứng ${t}.${col}: bộ chặn cũ không để lọt — phép thử không phân biệt`);
    } finally {
      await l.end();
    }
  });
}

// ───────────────────────── SCC-3 (E3, AC-3): ô sale_offers.street_raw kiểu 24/11 ─────────────────────────

test("SCC-3: street_raw mang tên nguồn S06 (token của sổ lượt) → có che qua scan, gửi mã; tắt che → dừng scan «sale_offers.street_raw»", coDb, async () => {
  const entries = await docSourceNameEntries(c);
  const e06 = entries.find((e) => e.code === "S06" && e.realName.trim().length >= 4);
  assert.ok(e06, "SCC-3 tiền đề: sổ của lượt có tên S06");
  await dungPhu("scc3", { sale_offers: "WHERE source = 'S06' ORDER BY offer_id LIMIT 40" });
  const l = await moPhu("scc3");
  try {
    // Bỏ dòng sẵn bẩn (dữ liệu máy thu) để chiều đỏ nêu đúng ô cấy.
    const { rows } = await l.query(localReadSql("sale_offers", selectList("sale_offers", CLOUD_ALLOW.sale_offers, [], tokensFromEntries(entries)).sql));
    const ban = rows.map((r) => JSON.parse(r.j)).filter((r) => findSourceNames(r.street_raw ?? "", entries).length || coTen(r, entries)).map((r) => r.offer_id);
    if (ban.length) await c.query("DELETE FROM scc3.sale_offers WHERE offer_id = ANY($1)", [ban]);
    const { rows: [k] } = await c.query("SELECT offer_id FROM scc3.sale_offers ORDER BY offer_id LIMIT 1");
    assert.ok(k, "SCC-3 tiền đề: còn dòng S06 sạch");
    await c.query("UPDATE scc3.sale_offers SET street_raw = $1 WHERE offer_id = $2", [`ngõ ${e06.realName} 3`, k.offer_id]);
    const bat = await chayLuot({ syncOnce }, l, { fill: ["sale_offers"] });
    assert.ok(quaScan(bat), `SCC-3: có che mà lượt không qua scan (pha ${bat.loi?.phase})`);
    const gui = bat.staged.find((r) => r.offer_id === k.offer_id);
    assert.ok(gui && gui.street_raw.includes("S06") && !findSourceNames(gui.street_raw, entries).length, "SCC-3: giá trị gửi không phải mã S06");
    const tat = await chayLuot({ syncOnce }, l, { fill: ["sale_offers"], che: false });
    assert.equal(tat.loi?.phase, "scan", "SCC-3 chiều đỏ: tắt che mà lượt không dừng ở scan");
    assert.match(tat.loi.message, /giá trị mang định danh nguồn \(tầng A\) ở sale_offers\.street_raw — dừng trước khi gửi/, "SCC-3 chiều đỏ: thông điệp khác nhật ký 24/11");
    assert.equal(tat.soCauNap, 0, "SCC-3 chiều đỏ: có câu nạp");
  } finally {
    await l.end();
  }
});

// ───────────────────────── SCC-5 (E5 chiều đỏ, AC-5): bỏ --kho thì đường cloud cổng chết fail kết nối ─────────────────────────

test("SCC-5: exec thật trỏ cổng chết 127.0.0.1:1 → lượt (không --kho) dừng ở catalog vì lỗi kết nối, 0 câu ghi", async () => {
  const ra = [];
  const code = await runMain({ local: null, exec: mgmtExec("token-gia", { url: "http://127.0.0.1:1/v1/x", retries: 0 }), out: (m) => ra.push(m), err: (m) => ra.push(m) });
  assert.equal(code, 1, "SCC-5: lượt không thất bại");
  assert.ok(ra.some((m) => /SYNC FAIL \[catalog\].*fetch failed/.test(m)), "SCC-5: không dừng ở catalog vì kết nối");
});

// ───────────────────────── SCC-8 (E8, AC-8): tên cột airdna_* giữ, giá trị và khoá lồng vẫn che ─────────────────────────

test("SCC-8: ref_calib_markets — khoá cấp dòng airdna_id giữ, không bị chặn; giá trị và khoá json lồng mang tên nguồn bị che", coDb, async () => {
  const entries = await docSourceNameEntries(c);
  const e = entries.find((x) => findSourceNames("airdna_id", [x]).length);
  assert.ok(e, "SCC-8 tiền đề: tên cột airdna_id phải mang một tên của sổ (nếu không, ca không đo gì)");
  await dungPhu("scc8", { airdna_markets: "ORDER BY airdna_id LIMIT 10" });
  const { rows: [k] } = await c.query("SELECT airdna_id FROM scc8.airdna_markets ORDER BY airdna_id LIMIT 1");
  await c.query("UPDATE scc8.airdna_markets SET name = $1, meta = coalesce(meta, '{}'::jsonb) || jsonb_build_object('nhom', jsonb_build_object($2::text, 1)) WHERE airdna_id = $3",
    [`thị trường ${e.realName}`, `${e.realName}_khoa`, k.airdna_id]);
  const l = await moPhu("scc8");
  try {
    const bat = await chayLuot({ syncOnce }, l, { fill: ["airdna_markets"] });
    assert.ok(quaScan(bat), `SCC-8: lượt không qua scan (pha ${bat.loi?.phase}) — tên cột bị chặn?`);
    const { rows: cols } = await c.query("SELECT column_name AS c FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'airdna_markets' ORDER BY ordinal_position");
    const gui = bat.staged.find((r) => r.airdna_id === k.airdna_id);
    assert.deepEqual(Object.keys(gui).sort(), cols.map((r) => r.c).sort(), "SCC-8: khoá cấp dòng (tên cột) bị đổi");
    assert.ok(!findSourceNames(gui.name, entries).length && gui.name.includes(e.code), "SCC-8: giá trị cột name không được che");
    const duong = Object.keys(gui.meta?.nhom ?? {});
    assert.ok(duong.length && duong.every((x) => !findSourceNames(x, entries).length) && duong.some((x) => x.startsWith(e.code)),
      `SCC-8: khoá json lồng không được che (đường: meta.nhom.${duong.map((x) => (findSourceNames(x, entries).length ? "<tên nguồn>" : x)).join("|")})`);
    // Đối chứng: tắt che → bộ chặn bắt (giá trị/khoá lồng), nêu ref_calib_markets.<cột>.
    const tat = await chayLuot({ syncOnce }, l, { fill: ["airdna_markets"], che: false });
    assert.equal(tat.loi?.phase, "scan", "SCC-8 đối chứng: tắt che mà không bị chặn");
    assert.match(tat.loi.message, /ref_calib_markets\.[a-z_]+ /, "SCC-8 đối chứng: thông điệp không nêu bảng.cột");
    // Đối chứng khoá cấp dòng: cùng dòng đã che, bộ chặn KHÔNG khai danh mục cột thì khoá airdna_id bị tính.
    const j = JSON.stringify(gui);
    const tok = tokensFromEntries(entries);
    assert.doesNotThrow(() => assertNoSourceNames(new Map([["ref_calib_markets", [j]]]), tok, { columns: { ref_calib_markets: Object.keys(gui) } }), "SCC-8: bộ chặn tính tên cột");
    assert.throws(() => assertNoSourceNames(new Map([["ref_calib_markets", [j]]]), tok), /ref_calib_markets\.<khoá ngoài danh mục cột>/, "SCC-8 đối chứng: không khai cột mà khoá không bị tính");
  } finally {
    await l.end();
  }
});

// ───────────────────────── SCC-9 (E9, AC-9): bên đọc sau che ─────────────────────────

/** Chạy mã TypeScript của data-api / app qua tsx của chính gói, trên DB lượt với lược đồ phủ đứng trước public. Trả JSON in ra. */
function chayTs(goi, code, schema, extraEnv = {}) {
  const u = new URL(DB);
  u.searchParams.set("options", `-c search_path=${schema},public`);
  const out = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
    cwd: path.join(GOC, goi), encoding: "utf8", timeout: 180_000, env: { ...process.env, ...extraEnv, DATABASE_URL: u.toString() },
  });
  return JSON.parse(out.trim().split("\n").at(-1));
}
const MA_MARKETS = `
  const { marketsRoute } = await import("./src/routes/markets.ts");
  const { pool } = await import("./src/db/client.ts");
  const ids = JSON.parse(process.env.SCC_IDS);
  const out = { "/": await (await marketsRoute.request("/?limit=200")).json() };
  for (const id of ids) for (const p of ["", "/submarkets", "/insights"]) out["/" + id + p] = await (await marketsRoute.request("/" + id + p)).json();
  await pool.end();
  console.log(JSON.stringify(out));`;
const MA_THE = `
  const { getAreaThumbnails } = await import("./src/lib/queries.ts");
  const { pool } = await import("./src/lib/db.ts");
  const m = await getAreaThumbnails(JSON.parse(process.env.SCC_IDS));
  await pool.end();
  console.log(JSON.stringify(Object.fromEntries(m)));`;
/** Đường đầu tiên hai JSON lệch nhau, hay null. */
function lech(a, b, p = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const r = lech(a[k], b[k], `${p}.${k}`);
      if (r) return r;
    }
  }
  return p || ".";
}

test("SCC-9: data-api markets (route thật) trả cùng JSON trước/sau che areas.meta; đối chứng dương: đổi trường trả về thì nêu trường lệch", coDb, async () => {
  const entries = await docSourceNameEntries(c);
  assert.ok(entries.length, "SCC-9 tiền đề: sổ của lượt có tên nguồn");
  await dungPhu("scc9m", { areas: "" });
  const { rows: mk } = await c.query("SELECT id FROM scc9m.areas WHERE region_type = 'market' ORDER BY id");
  const env = { SCC_IDS: JSON.stringify(mk.map((r) => r.id)) };
  const truoc = chayTs("data-api", MA_MARKETS, "scc9m", env);
  const { rows } = await c.query("SELECT id, meta::text AS m FROM scc9m.areas");
  let doi = 0;
  for (const r of rows) {
    const { text, soCho } = cheOJson(r.m, entries, { cot: "meta" });
    if (!soCho) continue;
    await c.query("UPDATE scc9m.areas SET meta = $1::jsonb WHERE id = $2", [text, r.id]);
    doi++;
  }
  assert.ok(doi > 0, "SCC-9 tiền đề: areas.meta của lượt phải có ô mang tên nguồn để che");
  const sau = chayTs("data-api", MA_MARKETS, "scc9m", env);
  assert.equal(lech(truoc, sau), null, `SCC-9 markets lệch sau che ở trường ${lech(truoc, sau)}`);
  // Đối chứng dương: phép so phát hiện được lệch ở một trường markets trả về.
  await c.query("UPDATE scc9m.areas SET name = name || ' (đổi)' WHERE id = $1", [mk[0].id]);
  const doiTen = chayTs("data-api", MA_MARKETS, "scc9m", env);
  assert.match(String(lech(sau, doiTen)), /\.name$/, "SCC-9 đối chứng dương: phép so không nêu trường lệch");
});

test("SCC-9: thẻ Invest (getAreaThumbnails thật) — mọi ảnh trúng tên nguồn bị bỏ → không ảnh, không lỗi; chưa che thì ảnh mang tên nguồn", coDb, async () => {
  await dungPhu("scc9t", { listings: "" });
  const { rows: [a] } = await c.query(`SELECT area_id FROM scc9t.listings WHERE jsonb_typeof(photo_urls) = 'array' AND jsonb_array_length(photo_urls) > 0
    AND area_id NOT IN (SELECT parent_id FROM areas WHERE parent_id IS NOT NULL) GROUP BY area_id ORDER BY count(*), area_id LIMIT 1`);
  assert.ok(a, "SCC-9 tiền đề: có khu vực có listing có ảnh");
  const env = { SCC_IDS: JSON.stringify([a.area_id]) };
  await c.query(`UPDATE scc9t.listings SET photo_urls = '["https://cdn.nguonbiakappa.example/1.jpg", "nguonbiakappa.example/2.jpg"]' WHERE area_id = $1`, [a.area_id]);
  const chuaChe = chayTs("app", MA_THE, "scc9t", env);
  assert.ok(coTen(chuaChe[a.area_id]?.candidates?.[0]?.src ?? ""), "SCC-9 chiều đỏ: chưa che mà thẻ không mang ảnh tên nguồn — phép thử không phân biệt");
  const { rows } = await c.query("SELECT id, photo_urls::text AS p FROM scc9t.listings WHERE area_id = $1", [a.area_id]);
  for (const r of rows) {
    const { text } = cheOJson(r.p, BIA, { cot: "photo_urls" });
    assert.equal(text, "[]", "SCC-9: mảng ảnh toàn URL trúng phải thành mảng rỗng");
    await c.query("UPDATE scc9t.listings SET photo_urls = $1::jsonb WHERE id = $2", [text, r.id]);
  }
  const daChe = chayTs("app", MA_THE, "scc9t", env);
  assert.equal(daChe[a.area_id], undefined, "SCC-9: thẻ vẫn có ảnh sau khi mọi ảnh bị bỏ");
});

// ───────────────────────── SCC-9 ca canh (GS 26/11): chưa có bên đọc areas.meta.source ở app/data-api ─────────────────────────
// Sau che, giá trị areas.meta.source trên cloud là «S04-…» (mã thay tên). Bên đọc mới tra khoá ấy (NGUON_PHUONG, phuongHopLe,
// meta.source) phải xử trước — HT26 ghi giới hạn có tên. Đọc cây kho (git ls-files), không cần DB.
const MAU_BEN_DOC = /NGUON_PHUONG|phuongHopLe|\bmeta\.source\b/;
const TB_CANH = "bên đọc areas.meta.source mới ở app/data-api — giá trị trên cloud là S04-…, xử trước (HT26 giới hạn có tên)";
/** Tệp trong `tep` có tham chiếu mẫu; `doc(tệp)` trả nội dung. */
function benDocMetaSource(tep, doc) {
  return tep.filter((f) => MAU_BEN_DOC.test(doc(f)));
}
const tepBenDoc = () =>
  execFileSync("git", ["-C", GOC, "ls-files", "--", "app/src", "data-api/src"], { encoding: "utf8" }).split("\n").filter(Boolean);
const docTep = (f) => readFileSync(path.join(GOC, f), "utf8");
function kiemBenDoc(tep, doc) {
  const co = benDocMetaSource(tep, doc);
  assert.ok(!co.length, `${TB_CANH}: ${co.join(", ")}`);
}

test("SCC-9: ca canh — không tệp nào dưới app/src, data-api/src tham chiếu NGUON_PHUONG, phuongHopLe hay meta.source", () => {
  const tep = tepBenDoc();
  assert.ok(tep.length > 100 && tep.some((f) => f.startsWith("data-api/src/")), "SCC-9 ca canh tiền đề: git ls-files phải ra cây app/src và data-api/src");
  kiemBenDoc(tep, docTep);
});

test("SCC-9: ca canh chiều đỏ — cấy tệp tạm dưới app/src chứa «meta.source» thì ca đỏ nêu đúng tệp", () => {
  const gia = "app/src/lib/scc9-ben-doc-tam.ts";
  const doc = (f) => (f === gia ? "const nguon = area.meta.source ?? null;\n" : docTep(f));
  assert.throws(() => kiemBenDoc([...tepBenDoc(), gia], doc), (e) => {
    assert.ok(e.message.includes(TB_CANH), "SCC-9 ca canh: thông điệp không ghim");
    assert.ok(e.message.endsWith(gia), "SCC-9 ca canh: thông điệp không nêu đúng tệp cấy");
    return true;
  });
  for (const mau of ["NGUON_PHUONG", "phuongHopLe(x)"]) assert.deepEqual(benDocMetaSource([gia], () => mau), [gia], `SCC-9 ca canh: mẫu ${mau} không bị bắt`);
  assert.deepEqual(benDocMetaSource([gia], () => "meta.sources"), [], "SCC-9 ca canh: «meta.sources» không phải khoá đang canh");
});
