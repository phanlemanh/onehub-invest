// scripts/s06-vung-moi/acceptance.mjs — bộ kiểm hồ sơ s06-vung-moi-len-canonical. MỌI ca DB chạy trên bản chép DB máy thu:
// một bản gốc oneinvest_n1_svm_goc dựng bằng db/db-thu.sh (pg_dump, không chạm oneinvest ngoài khoá đọc), mỗi ca một DB
// `createdb -T` từ bản gốc rồi xoá. Không ca nào ghi vào oneinvest.
//   node scripts/s06-vung-moi/acceptance.mjs mig|rao|dem|reassign|transform|real
//   SVM_GOC_MOI=1 … → dựng lại bản gốc (mặc định dùng lại nếu < 6 giờ)
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pg = createRequire(join(ROOT, "pipeline/package.json"))("pg");
const MIG = join(ROOT, "db/migrations/064_ma_thi_truong_ngan.sql");
const GOC = "oneinvest_n1_svm_goc";
const URL_DB = (db) => `postgres://oneinvest:oneinvest@localhost:5433/${db}`;
const DX = ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db"];
const MA_DAI = /^vn-(thanh-pho|tinh)-/;

let loi = 0;
const check = (ok, ten) => { console.log(`${ok ? "ok  " : "FAIL"} ${ten}`); if (!ok) loi++; };
const finish = (ten) => { console.log(loi ? `${ten} FAIL (${loi} mục)` : `${ten} PASS`); process.exit(loi ? 1 : 0); };

function docker(args, input) {
  const r = spawnSync("docker", [...DX, ...args], { input, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** Bản gốc: dựng bằng db-thu.sh nếu vắng hoặc cũ hơn 6 giờ (ghi mốc ở bảng nhỏ trong chính bản gốc). */
async function banGoc() {
  const c = new pg.Client({ connectionString: URL_DB("oneinvest") });
  await c.connect();
  const { rows } = await c.query("SELECT 1 FROM pg_database WHERE datname = $1", [GOC]);
  await c.end();
  let moi = process.env.SVM_GOC_MOI === "1" || rows.length === 0;
  if (!moi) {
    const g = new pg.Client({ connectionString: URL_DB(GOC) });
    await g.connect();
    const r = await g.query("SELECT extract(epoch FROM now() - dung_luc) AS s FROM _svm_goc").catch(() => ({ rows: [] }));
    await g.end();
    moi = !r.rows.length || Number(r.rows[0].s) > 6 * 3600;
  }
  if (moi) {
    const r = spawnSync("bash", [join(ROOT, "db/db-thu.sh"), GOC], { encoding: "utf8" });
    if (r.status !== 0) { console.error(r.stdout + r.stderr); process.exit(2); }
    const g = new pg.Client({ connectionString: URL_DB(GOC) });
    await g.connect();
    await g.query("CREATE TABLE _svm_goc AS SELECT now() AS dung_luc");
    await g.end();
  }
}

/** Một DB ca chép từ bản gốc; trả client + hàm dọn. */
async function banCa(ten) {
  const db = `oneinvest_n1_svm_${ten}`;
  docker(["dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", db]);
  const r = docker(["createdb", "-U", "oneinvest", "-h", "localhost", "-T", GOC, db]);
  if (r.code !== 0) { console.error(r.out); process.exit(2); }
  const c = new pg.Client({ connectionString: URL_DB(db) });
  await c.connect();
  return { db, c, url: URL_DB(db), don: async () => { await c.end(); docker(["dropdb", "-U", "oneinvest", "-h", "localhost", "--if-exists", db]); } };
}

/** Áp một tệp SQL lên DB ca bằng psql (đúng đường áp thật); trả mã + output. */
function apSql(db, sql) {
  return docker(["psql", "-U", "oneinvest", "-h", "localhost", "-d", db, "-v", "ON_ERROR_STOP=1", "-q"], sql);
}

async function trangThaiThiTruong(c) {
  const { rows } = await c.query(
    `SELECT id, name, md5(coalesce(ST_AsBinary(geom)::text, '')) AS g, md5(coalesce(meta::text, '')) AS m
       FROM areas WHERE region_type = 'market' ORDER BY id`);
  return rows;
}

// ------------------------------------------------------------------ mig (AC-1)
async function modeMig() {
  await banGoc();
  const ca = await banCa("mig");
  try {
    const c = ca.c;
    const truoc = await trangThaiThiTruong(c);
    const dai = truoc.filter((r) => MA_DAI.test(r.id));
    const kyVong = new Map(dai.map((r) => [r.id.replace(MA_DAI, "vn-"), r]));
    const { rows: [as0] } = await c.query(`SELECT count(*)::int AS n FROM area_sources WHERE area_id ~ '^vn-(thanh-pho|tinh)-'`);
    // cài một dòng area_breakdowns và data_level_snapshot trỏ mã dài để chứng UPDATE của hai cột (bản chép không có dòng)
    const maMau = dai[0].id;
    await c.query(`INSERT INTO area_breakdowns (area_id, kind, label, payload) VALUES ($1, 'svm', 'svm', '{}')`, [maMau]);
    await c.query(`INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n) VALUES (current_date, $1, 'svm', 'can', 'B0', 1)`, [maMau]);
    console.log(`trước: ${truoc.length} thị trường, ${dai.length} mã dài, area_sources trỏ mã dài ${as0.n}`);

    const r1 = apSql(ca.db, readFileSync(MIG, "utf8"));
    check(r1.code === 0, `áp 064 lần một thoát 0 (${r1.out.trim().split("\n").pop()})`);
    const sau = await trangThaiThiTruong(c);
    check(sau.length === truoc.length, `số thị trường trước = sau (${truoc.length} → ${sau.length})`);
    check(sau.filter((r) => MA_DAI.test(r.id)).length === 0, "0 mã dài còn ở areas");
    const giuNguyen = [...kyVong].every(([ngan, cu]) => {
      const m = sau.find((r) => r.id === ngan);
      return m && m.name === cu.name && m.g === cu.g && m.m === cu.m;
    });
    check(giuNguyen && kyVong.size === dai.length, `${kyVong.size} mã vn-<x> đúng danh sách tính trước, tên/polygon/meta giữ nguyên`);
    const { rows: [as1] } = await c.query(`SELECT count(*)::int AS dai, count(*) FILTER (WHERE area_id = ANY($1))::int AS moi FROM area_sources WHERE area_id ~ '^vn-(thanh-pho|tinh)-' OR area_id = ANY($1)`, [[...kyVong.keys()]]);
    check(as1.dai - as1.moi === 0 && as1.moi === as0.n, `area_sources trỏ mã dài ${as0.n} → 0, trỏ mã mới ${as1.moi}`);
    const { rows: [ab] } = await c.query(`SELECT count(*)::int AS n FROM area_breakdowns WHERE area_id = $1`, [maMau.replace(MA_DAI, "vn-")]);
    const { rows: [dl] } = await c.query(`SELECT count(*)::int AS n FROM data_level_snapshot WHERE market_id = $1`, [maMau.replace(MA_DAI, "vn-")]);
    check(ab.n === 1 && dl.n === 1, `area_breakdowns và data_level_snapshot cài trước sang mã mới (${ab.n}, ${dl.n})`);

    const r2 = apSql(ca.db, readFileSync(MIG, "utf8"));
    const sau2 = await trangThaiThiTruong(c);
    check(r2.code === 0 && JSON.stringify(sau2) === JSON.stringify(sau) && /không còn mã thị trường dài/.test(r2.out),
      "áp lần hai: thoát 0, NOTICE 'không còn mã thị trường dài', 0 dòng đổi");

    // chiều đỏ ghim: bỏ UPDATE area_sources khỏi bản chép migration → còn mã dài ở area_sources
    const ca2 = await banCa("mig_do");
    try {
      const hong = readFileSync(MIG, "utf8").replace(/UPDATE area_sources[^;]*;/, "");
      apSql(ca2.db, hong);
      const { rows: [x] } = await ca2.c.query(`SELECT count(*)::int AS n FROM area_sources WHERE area_id ~ '^vn-(thanh-pho|tinh)-'`);
      check(x.n === as0.n, `chiều đỏ: bỏ UPDATE area_sources → 'area_sources còn ${x.n} mã dài' (thước bắt được)`);
    } finally { await ca2.don(); }
  } finally { await ca.don(); }
  finish("MIG");
}

// ------------------------------------------------------------------ rao (AC-2)
/** Ca rào: (tên, hàm cài) — 7 khoá ngoại đọc từ catalog + 1 va chạm. Cài bằng UPDATE một dòng có sẵn (không cần biết cột bắt buộc). */
async function modeRao() {
  await banGoc();
  const g = new pg.Client({ connectionString: URL_DB(GOC) });
  await g.connect();
  const { rows: fks } = await g.query(
    `SELECT c.conrelid::regclass::text AS bang, a.attname AS cot
       FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
      WHERE c.contype = 'f' AND c.confrelid = 'areas'::regclass ORDER BY 1`);
  await g.end();
  const MA_TRAN = ["properties", "areas", "listing_records", "market_asset_stats", "market_metrics", "sale_offer_records", "saved_markets"];
  check(JSON.stringify(fks.map((f) => f.bang).sort()) === JSON.stringify([...MA_TRAN].sort()),
    `ma trận viết trước 7 bảng khoá ngoại = catalog (${fks.map((f) => `${f.bang}.${f.cot}`).join(", ")})`);
  let i = 0;
  for (const fk of fks) {
    const ca = await banCa(`rao${i++}`);
    try {
      const { rows: [m] } = await ca.c.query(`SELECT id FROM areas WHERE id ~ '^vn-(thanh-pho|tinh)-' ORDER BY id LIMIT 1`);
      let cai;
      if (fk.bang === "areas") {
        cai = await ca.c.query(`UPDATE areas SET parent_id = $1 WHERE id = (SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1)`, [m.id]);
      } else {
        cai = await ca.c.query(`UPDATE ${fk.bang} SET ${fk.cot} = $1 WHERE ctid = (SELECT ctid FROM ${fk.bang} LIMIT 1)`, [m.id]);
      }
      if (cai.rowCount !== 1) { check(false, `${fk.bang}: không có dòng để cài ca rào`); continue; }
      const truoc = await trangThaiThiTruong(ca.c);
      const r = apSql(ca.db, readFileSync(MIG, "utf8"));
      const sau = await trangThaiThiTruong(ca.c);
      check(r.code !== 0 && r.out.includes(`${fk.bang}.${fk.cot}`) && JSON.stringify(sau) === JSON.stringify(truoc),
        `${fk.bang}.${fk.cot} trỏ mã dài → 064 dừng gọi tên bảng, 0 dòng đổi`);
    } finally { await ca.don(); }
  }
  // va chạm: mã ngắn đích đã có
  const ca = await banCa("rao_va");
  try {
    const { rows: [m] } = await ca.c.query(`SELECT id FROM areas WHERE id ~ '^vn-(thanh-pho|tinh)-' ORDER BY id LIMIT 1`);
    const ngan = m.id.replace(MA_DAI, "vn-");
    await ca.c.query(`INSERT INTO areas (id, region_type, name, country_code, meta) VALUES ($1, 'market', 'va chạm thử', 'vn', '{}')`, [ngan]);
    const truoc = await trangThaiThiTruong(ca.c);
    const r = apSql(ca.db, readFileSync(MIG, "utf8"));
    const sau = await trangThaiThiTruong(ca.c);
    check(r.code !== 0 && r.out.includes(ngan) && JSON.stringify(sau) === JSON.stringify(truoc), `va chạm ${ngan} → 064 dừng gọi tên mã, 0 dòng đổi`);
  } finally { await ca.don(); }
  // đối chứng dương: không cài ca nào → áp được
  const ok = await banCa("rao_ok");
  try {
    const r = apSql(ok.db, readFileSync(MIG, "utf8"));
    const { rows: [x] } = await ok.c.query(`SELECT count(*)::int AS n FROM areas WHERE id ~ '^vn-(thanh-pho|tinh)-'`);
    check(r.code === 0 && x.n === 0, "đối chứng dương: không cài ca nào → 064 áp được, 0 mã dài");
  } finally { await ok.don(); }
  finish("RAO");
}

// ------------------------------------------------------------------ dem (AC-10)
async function modeDem() {
  await banGoc();
  const { demMaDai, danhSachCot } = await import("./dem-ma-dai.mjs");
  const ca = await banCa("dem");
  try {
    const c = ca.c;
    const exec = async (sql) => (await c.query(sql)).rows;
    const lenh = (env = {}) => {
      const r = spawnSync("node", [join(ROOT, "scripts/s06-vung-moi/dem-ma-dai.mjs")], { env: { ...process.env, DATABASE_URL: ca.url, ...env }, encoding: "utf8" });
      return { code: r.status, out: r.stdout + r.stderr };
    };
    const { rows: fks } = await c.query(
      `SELECT c.conrelid::regclass::text AS bang, a.attname AS cot
         FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.contype = 'f' AND c.confrelid = 'areas'::regclass`);
    const cot = await danhSachCot(exec);
    const fkLenh = cot.filter((x) => x.fk).map((x) => `${x.bang}.${x.cot}`).sort();
    check(JSON.stringify(fkLenh) === JSON.stringify(fks.map((f) => `${f.bang}.${f.cot}`).sort()), `danh sách khoá ngoại của lệnh = catalog (${fkLenh.length})`);
    let r = lenh();
    check(r.code === 0 && /báo area_sources\.area_id/.test(r.out) && !/khoá ngoại — chặn/.test(r.out), "sạch khoá ngoại: thoát 0, area_sources chỉ dòng 'báo'");
    const { con } = await demMaDai(exec);
    check(con.every((x) => !x.fk), "bản chép sạch: không khoá ngoại nào trỏ mã dài");
    let i = 0;
    for (const fk of fks) {
      // mỗi ca một bản chép riêng — không phải hoàn lại dòng đã cài
      const cb = await banCa(`dem${i++}`);
      try {
        const { rows: [m] } = await cb.c.query(`SELECT id FROM areas WHERE id ~ '^vn-(thanh-pho|tinh)-' ORDER BY id LIMIT 1`);
        const cai = fk.bang === "areas"
          ? await cb.c.query(`UPDATE areas SET parent_id = $1 WHERE id = (SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1)`, [m.id])
          : await cb.c.query(`UPDATE ${fk.bang} SET ${fk.cot} = $1 WHERE ctid = (SELECT ctid FROM ${fk.bang} LIMIT 1)`, [m.id]);
        const r2 = spawnSync("node", [join(ROOT, "scripts/s06-vung-moi/dem-ma-dai.mjs")], { env: { ...process.env, DATABASE_URL: cb.url }, encoding: "utf8" });
        const out = r2.stdout + r2.stderr;
        const dong = out.split("\n").filter((l) => l.includes("khoá ngoại — chặn"));
        check(cai.rowCount === 1 && r2.status === 1 && dong.length === 1 && dong[0].includes(`${fk.bang}.${fk.cot}`),
          `${fk.bang}.${fk.cot} trỏ mã dài → thoát 1, đúng một dòng chặn gọi tên bảng`);
      } finally { await cb.don(); }
    }
  } finally { await ca.don(); }
  finish("DEM");
}

// ------------------------------------------------------- fixture ranh giới (AC-4) — qua importer thật
/** Snapshot S04 giả: thư mục đúng khuôn collector `<city.id>__osm-boundaries__<mốc>` (city.id đọc từ cities.ts), hai
 * phường hình vuông nhỏ quanh điểm-trên-bề-mặt của polygon thị trường; nạp bằng pipeline/import-airbnb.mjs THẬT. */
async function napRanhGioiGia(ca, khoa, thiTruong, tenPhuong) {
  const cities = readFileSync(join(ROOT, "collector/src/config/cities.ts"), "utf8");
  if (!new RegExp(`\\bid:\\s*"${khoa}"`).test(cities)) throw new Error(`khoá ${khoa} không có trong collector/src/config/cities.ts`);
  const { rows: [p] } = await ca.c.query(
    `SELECT ST_X(ST_PointOnSurface(geom::geometry)) AS x, ST_Y(ST_PointOnSurface(geom::geometry)) AS y FROM areas WHERE id = $1`, [thiTruong]);
  if (!p) throw new Error(`thị trường ${thiTruong} chưa có polygon để đặt phường giả`);
  const vuong = (dx) => {
    const [x, y, d] = [Number(p.x) + dx, Number(p.y), 0.004];
    return [[x - d, y - d], [x + d, y - d], [x + d, y + d], [x - d, y + d], [x - d, y - d]].map(([lon, lat]) => ({ lat, lon }));
  };
  const items = tenPhuong.map((ten, i) => ({
    source: "osm-boundaries", sourceId: String(990000 + i), kind: "admin-boundary", fetchedAt: "2026-10-31T00:00:00Z",
    payload: { type: "relation", id: 990000 + i, tags: { name: `Phường ${ten}`, admin_level: "6", boundary: "administrative" },
      members: [{ type: "way", role: "outer", geometry: vuong(i * 0.012) }] },
    meta: { name: `Phường ${ten}`, adminLevel: "6" },
  }));
  const T = mkdtempSync(join(tmpdir(), "svm-s04-"));
  const id = `${khoa}__osm-boundaries__2026-10-31T000000000`;
  const dir = join(T, id);
  const { mkdirSync } = await import("node:fs");
  const { gzipSync } = await import("node:zlib");
  const { createHash } = await import("node:crypto");
  mkdirSync(dir);
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0000.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 3, snapshotId: id, city: khoa, source: "osm-boundaries",
    startedAt: "2026-10-31T00:00:00Z", finishedAt: "2026-10-31T00:00:01Z", itemCount: items.length,
    files: [{ name: "items-0000.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: items.length }] }));
  const r = spawnSync("node", [join(ROOT, "pipeline/import-airbnb.mjs"), dir], { env: { ...process.env, DATABASE_URL: ca.url }, encoding: "utf8" });
  rmSync(T, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`import-airbnb thất bại: ${r.stdout}${r.stderr}`);
  const { rows: [n] } = await ca.c.query(`SELECT count(*)::int AS n FROM stg_osm_boundaries WHERE snapshot_id = $1`, [id]);
  if (n.n !== items.length) throw new Error(`importer nạp ${n.n}/${items.length} ranh giới`);
}

const chayReassign = (ca) => {
  const r = spawnSync("node", [join(ROOT, "pipeline/reassign-areas.mjs")], { env: { ...process.env, DATABASE_URL: ca.url }, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};
const tapPhuong = async (c, ids) =>
  (await c.query(`SELECT id FROM areas WHERE parent_id = ANY($1) AND region_type = 'submarket' ORDER BY id`, [ids])).rows.map((r) => r.id);

// ------------------------------------------------------------ reassign (AC-4, AC-5)
async function modeReassign() {
  await banGoc();
  // AC-4: đã áp 064
  const a = await banCa("re_a");
  try {
    check(apSql(a.db, readFileSync(MIG, "utf8")).code === 0, "AC-4 bản chép: áp 064");
    await napRanhGioiGia(a, "danang", "vn-da-nang", ["Thử Một", "Thử Hai"]);
    const truoc = await tapPhuong(a.c, ["vn-hanoi", "vn-hcmc"]);
    const r = chayReassign(a);
    check(r.code === 0, `AC-4 reassign không đối số thoát 0`);
    const dn = await tapPhuong(a.c, ["vn-da-nang"]);
    check(JSON.stringify(dn) === JSON.stringify(["vn-da-nang-thu-hai", "vn-da-nang-thu-mot"]), `AC-4 phường giả upsert dưới vn-da-nang: ${dn.join(", ")}`);
    const sau = await tapPhuong(a.c, ["vn-hanoi", "vn-hcmc"]);
    check(JSON.stringify(sau) === JSON.stringify(truoc), `AC-4 tập id phường HN/HCM trước = sau (${truoc.length})`);
    const dong = r.out.split("\n").filter((l) => /haiphong/.test(l) && /chưa có snapshot/.test(l));
    check(dong.length === 1, `AC-4 khoá haiphong không có snapshot → đúng một dòng gọi tên (${dong.length})`);
  } finally { await a.don(); }
  // AC-5: CHƯA áp 064
  const b = await banCa("re_b");
  try {
    const mk0 = (await b.c.query(`SELECT id FROM areas WHERE region_type = 'market' ORDER BY id`)).rows.map((r) => r.id);
    // polygon thị trường còn ở mã dài — fixture đặt theo mã dài, khoá vẫn là danang
    await napRanhGioiGia(b, "danang", "vn-thanh-pho-da-nang", ["Thử Một"]);
    const r = chayReassign(b);
    const mk1 = (await b.c.query(`SELECT id FROM areas WHERE region_type = 'market' ORDER BY id`)).rows.map((r) => r.id);
    check(r.code === 0 && r.out.split("\n").some((l) => l.includes("danang") && l.includes("vn-da-nang") && l.includes("chưa có trong areas")),
      "AC-5 064 chưa áp: một dòng nêu danang + vn-da-nang thiếu");
    check(JSON.stringify(mk1) === JSON.stringify(mk0) && !mk1.includes("vn-da-nang"), `AC-5 0 thị trường mới được chèn (${mk0.length} → ${mk1.length})`);
    check(/hanoi: phường upsert/.test(r.out) && /hcmc: phường upsert/.test(r.out), "AC-5 phường Hà Nội/TP.HCM vẫn upsert");
  } finally { await b.don(); }
  finish("REASSIGN");
}

// ----------------------------------------------------------- transform (AC-6, AC-7)
/** transform-chotot của main chạy trong cây tạm (symlink lib/node_modules) — đối chứng HN/HCM. */
function chayTransform(ca, banMain = false) {
  let file = join(ROOT, "pipeline/transform-chotot.mjs");
  let T;
  if (banMain) {
    T = mkdtempSync(join(tmpdir(), "svm-main-"));
    const { mkdirSync, symlinkSync } = require_fs();
    mkdirSync(join(T, "pipeline"));
    for (const f of ["lib", "node_modules", "transform-zalo.mjs", "package.json"]) symlinkSync(join(ROOT, "pipeline", f), join(T, "pipeline", f));
    const goc = spawnSync("git", ["-C", ROOT, "show", `${process.env.SVM_BASE ?? "origin/main"}:pipeline/transform-chotot.mjs`], { encoding: "utf8" });
    if (goc.status !== 0) throw new Error(`không lấy được transform-chotot của main: ${goc.stderr}`);
    file = join(T, "pipeline/transform-chotot.mjs");
    writeFileSync(file, goc.stdout);
  }
  const r = spawnSync("node", [file], { env: { ...process.env, DATABASE_URL: ca.url }, encoding: "utf8", maxBuffer: 64 << 20 });
  if (T) rmSync(T, { recursive: true, force: true });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
function require_fs() { return createRequire(import.meta.url)("node:fs"); }

const bangHnHcm = async (c) => (await c.query(
  `SELECT o.offer_id, o.area_id FROM sale_offer_records o JOIN stg_chotot_ads s ON o.originating_system_key = s.list_id::text
    WHERE o.source = 'S06' AND s.city_code IN ('vn-hanoi', 'vn-hcmc') ORDER BY 1`)).rows;

const xoaAreaS06 = (c) => c.query(`UPDATE sale_offer_records SET area_id = NULL WHERE source = 'S06'`);

async function chenTin(c, listId, cityCode, ward) {
  const { rows: [snap] } = await c.query(`SELECT snapshot_id FROM stg_chotot_ads LIMIT 1`);
  await c.query(
    `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject, price, size_m2, ward_name_v3, payload, snapshot_id, list_time)
     VALUES ($1, 0, $2, 1010, 's', 'tin thử svm', 2000000000, 60, $3, '{}', $4, now())`, [listId, cityCode, ward, snap.snapshot_id]);
}

async function modeTransform() {
  await banGoc();
  // đối chứng: transform của main trên bản chép riêng (không fixture)
  const d = await banCa("tf_main");
  let bangMain;
  try {
    await xoaAreaS06(d.c);   // để transform TÍNH LẠI phường (upsert giữ area_id cũ khi tính ra NULL)
    const r = chayTransform(d, true);
    check(r.code === 0, "đối chứng: transform-chotot của main thoát 0");
    bangMain = await bangHnHcm(d.c);
  } finally { await d.don(); }

  const c = await banCa("tf_nhanh");
  try {
    check(apSql(c.db, readFileSync(MIG, "utf8")).code === 0, "bản chép: áp 064");
    await napRanhGioiGia(c, "danang", "vn-da-nang", ["Thử Một", "Thử Hai"]);
    check(chayReassign(c).code === 0, "bản chép: reassign nạp phường giả ĐN");
    // không cài tin lạ → không có dòng 'city_code lạ' (should-NOT-fire)
    await xoaAreaS06(c.c);
    const r0 = chayTransform(c);
    check(r0.code === 0 && !/city_code lạ/.test(r0.out), "AC-7 không cài tin lạ → không dòng 'city_code lạ'");
    const bangNhanh = await bangHnHcm(c.c);
    check(bangNhanh.length > 0 && JSON.stringify(bangNhanh) === JSON.stringify(bangMain),
      `AC-6 bảng offer→area HN/HCM: transform main = nhánh từng dòng (${bangMain.length} tin)`);

    const { rows: [hcm] } = await c.c.query(`SELECT id, name FROM areas WHERE parent_id = 'vn-hcmc' AND meta->>'source' = 'osm-phuong' ORDER BY id LIMIT 1`);
    await chenTin(c.c, 9900000001, "vn-da-nang", "Phường Thử Một");
    await chenTin(c.c, 9900000002, "vn-binh-duong", `Phường ${hcm.name}`);
    await chenTin(c.c, 9900000003, "vn-xyz-thu", "Phường Thử Một");
    const r = chayTransform(c);
    check(r.code === 0, "transform nhánh có tin thử thoát 0");
    const ga = async (lid) => (await c.c.query(`SELECT area_id, confidence FROM sale_offer_records WHERE originating_system_key = $1`, [String(lid)])).rows[0];
    const dn = await ga(9900000001), bd = await ga(9900000002), la = await ga(9900000003);
    check(dn?.area_id === "vn-da-nang-thu-mot" && dn.confidence === "high", `AC-6 tin vn-da-nang → ${dn?.area_id} (${dn?.confidence})`);
    check(bd?.area_id === hcm.id && bd.confidence === "high", `AC-6 tin vn-binh-duong → phường TP.HCM ${bd?.area_id} (${bd?.confidence})`);
    const dongLa = r.out.split("\n").filter((l) => l.startsWith("city_code lạ:"));
    check(la && la.area_id === null && dongLa.length === 1 && dongLa[0].includes("vn-xyz-thu") && dongLa[0].includes("(1 tin)"),
      `AC-7 tin vn-xyz-thu → area_id NULL, đúng một dòng '${dongLa[0] ?? "—"}'`);
  } finally { await c.don(); }
  finish("TRANSFORM");
}

// --------------------------------------------------------------------- real (AC-8)
/** Tỉ lệ tin bán S06 sống có phường theo thị trường — mẫu số theo city_code ánh xạ (KHÔNG suy từ area_id). */
async function tiLe(c) {
  const { thiTruongCua } = await import(join(ROOT, "pipeline/lib/thi-truong.mjs"));
  const mk = new Set((await c.query(`SELECT id FROM areas WHERE region_type = 'market'`)).rows.map((r) => r.id));
  const { rows } = await c.query(
    `SELECT s.city_code, o.area_id, a.parent_id FROM sale_offers o
       JOIN stg_chotot_ads s ON o.originating_system_key = s.list_id::text
       LEFT JOIN areas a ON a.id = o.area_id
      WHERE o.source = 'S06' AND o.kind = 'sale'`);
  const t = new Map();
  for (const r of rows) {
    const m = thiTruongCua(r.city_code, mk);
    if (!m) continue;
    const x = t.get(m) ?? { song: 0, coPhuong: 0, nul: 0 };
    x.song++;
    if (r.area_id && r.parent_id === m) x.coPhuong++;
    if (!r.area_id) x.nul++;
    t.set(m, x);
  }
  return t;
}
const pct = (x) => (x && x.song ? (100 * x.coPhuong) / x.song : 0);

async function modeReal() {
  await banGoc();
  const e = await banCa("real");
  try {
    const { rows: [s04] } = await e.c.query(`SELECT count(DISTINCT osm_id)::int AS n FROM stg_osm_boundaries WHERE snapshot_id LIKE 'danang__%' AND payload->'tags'->>'admin_level' = '6'`);
    if (!s04.n) {
      console.log("REAL BLOCKED: chưa có ranh giới S04 Đà Nẵng thật (danang__osm-boundaries__*) trong stg_osm_boundaries — chờ claudedp-3110-17; dựng lại bản gốc bằng SVM_GOC_MOI=1 sau khi ZCode nạp");
      process.exit(2);
    }
    const truoc = await tiLe(e.c);
    check(apSql(e.db, readFileSync(MIG, "utf8")).code === 0, "áp 064");
    check(chayReassign(e).code === 0, `reassign (ranh giới ĐN thật: ${s04.n} phường)`);
    check(chayTransform(e).code === 0, "transform-chotot");
    for (const f of ["300_metrics.sql", "400_breakdowns.sql"]) check(apSql(e.db, readFileSync(join(ROOT, "pipeline/sql", f), "utf8")).code === 0, f);
    const sau = await tiLe(e.c);
    console.log("thị trường · sống · có phường · % (trước → sau)");
    for (const m of [...new Set([...truoc.keys(), ...sau.keys()])].sort()) {
      const a = truoc.get(m), b = sau.get(m);
      console.log(`  ${m} · ${b?.song ?? 0} · ${b?.coPhuong ?? 0} · ${pct(a).toFixed(1)}% → ${pct(b).toFixed(1)}% · area_id NULL ${b?.nul ?? 0}`);
    }
    const dn = sau.get("vn-da-nang");
    check(pct(dn) >= 80, `AC-8 vn-da-nang có phường ${pct(dn).toFixed(1)}% ≥ 80% (mẫu số ${dn?.song ?? 0} tin theo city_code)`);
    for (const m of ["vn-hanoi", "vn-hcmc"]) check(pct(sau.get(m)) >= pct(truoc.get(m)), `AC-8 ${m} không tụt (${pct(truoc.get(m)).toFixed(1)}% → ${pct(sau.get(m)).toFixed(1)}%)`);
    const { rows: [hp] } = await e.c.query(`SELECT count(*)::int AS n FROM stg_osm_boundaries WHERE snapshot_id LIKE 'haiphong__%'`);
    if (!hp.n) console.log("vn-hai-phong: chưa có ranh giới S04");
    // đối chứng đỏ: xoá area_id 30% tin ĐN → thước phải dưới 80%
    await e.c.query(`UPDATE sale_offer_records o SET area_id = NULL FROM stg_chotot_ads s
                      WHERE o.originating_system_key = s.list_id::text AND o.source = 'S06' AND s.city_code = 'vn-da-nang'
                        AND abs(hashtext(o.offer_id)) % 10 < 3`);
    const hong = (await tiLe(e.c)).get("vn-da-nang");
    check(pct(hong) < 80 && hong?.song === dn?.song, `đối chứng đỏ: xoá area_id 30% tin ĐN → ${pct(hong).toFixed(1)}% < 80%, mẫu số giữ ${hong?.song}`);
  } finally { await e.don(); }
  finish("REAL");
}

const modes = { mig: modeMig, rao: modeRao, dem: modeDem, reassign: modeReassign, transform: modeTransform, real: modeReal };
const mode = process.argv[2];
if (!modes[mode]) { console.error(`dùng: acceptance.mjs ${Object.keys(modes).join("|")}`); process.exit(2); }
await modes[mode]();
