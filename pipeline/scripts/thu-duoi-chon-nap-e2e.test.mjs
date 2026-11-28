// thu-duoi-chon-nap-e2e.test.mjs — claudedp-2611-21 (+ đính chính 2611-22): ca đầu-cuối dựng
// ĐÚNG CHUỖI làm snapshot đuôi «biến» khỏi stg:
//   (1) vòng đuôi nạp snapshot A (2 tin) → stg mang snapshot_id = A, airbnb_snapshots có A;
//   (2) lượt quét đủ thu lại ĐÚNG các tin đó với captured_at mới hơn, nạp snapshot B
//       → upsert theo list_id GHI ĐÈ snapshot_id = B; airbnb_snapshots vẫn còn cả A lẫn B;
//   (3) vòng rảnh kế chạy: A «không còn dòng nào mang snapshot_id A» trong stg nên trông như
//       chưa nạp → bản lỗi chọn A và nạp lại (lãng phí + nhật ký sai); bản sửa phải chọn
//       KHÔNG CÁI NÀO (sổ nạp bền là airbnb_snapshots, không phải các dòng stg).
// Chạy: HOME="$(mktemp -d)" node --test scripts/thu-duoi-chon-nap-e2e.test.mjs
// DB: tạo DB tạm riêng rồi xoá trong finally; không nối được Postgres thì bỏ qua ca.
// Không đụng DB máy thu (oneinvest); không plist; không chạy lượt thu ngoài ca này.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import pg from "pg";

const WORKTREE = new URL("../../", import.meta.url).pathname.replace(/\/$/, ""); // worktree wrapper — script ở scripts/, node_modules ở pipeline/
const NUT = dirname(process.execPath); // thư mục chứa node — đưa vào PATH cho wrapper
// Quy ước HT9: DB tạm dựng trên CÙNG máy chủ với TEST_DATABASE_URL_ADMIN (cụm dùng một lần
// của db-thu.sh --chay-trong / Postgres của CI), không ghim cổng.
const DB_ROOT = process.env.TEST_DATABASE_URL_ADMIN ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const urlTren = (ten) => { const u = new URL(DB_ROOT); u.pathname = `/${ten}`; return u.toString(); };

const tin = (list_id, phut) => ({
  source: "chotot-ads", // readSnapshot lọc theo source — thiếu là 0 item
  sourceId: `ct-${list_id}`,
  kind: "ad",
  fetchedAt: "2026-11-25T06:00:00Z",
  payload: {
    list_id,
    list_time: Date.parse("2026-11-25T06:00:00Z") + phut * 60_000,
    orig_list_time: Date.parse("2026-11-25T06:00:00Z") + phut * 60_000,
    subject: `tin ${list_id}`,
    region_v2: 13000,
    price: 1_000_000_000,
    area_name: "quan-gia",
  },
});

function vietSnapshot(goc, city, moc, cacTin, finishedAt) {
  const id = `${city}__chotot-ads__${moc}`;
  const dir = join(goc, "snapshots", city, id);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(JSON.stringify(cacTin.map((list_id, i) => tin(list_id, i))));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion: 1, snapshotId: id, city, source: "chotot-ads",
    startedAt: finishedAt, finishedAt,
    counts: { items: cacTin.length, failed: 0 },
    coverage: { discovered: cacTin.length, captured: cacTin.length, failed: 0, methods: { gatewayApi: cacTin.length } },
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
  }, null, 2));
  return id;
}

// Lược đồ tối thiểu — đủ cho import-chotot.mjs (upsert + airbnb_snapshots) và truy vấn vùng của wrapper
const LUC_DO = `
CREATE TABLE stg_chotot_ads (
  list_id bigint PRIMARY KEY, region_v2 bigint, city_code text, category bigint, ad_type text,
  subject text, price bigint, price_string text, size_m2 numeric, rooms numeric, toilets numeric,
  house_type text, area_name text, ward_name text, ward_name_v3 text, latitude numeric, longitude numeric,
  list_time timestamptz, seller jsonb, images jsonb, payload jsonb, snapshot_id text,
  captured_at timestamptz DEFAULT now());
CREATE TABLE airbnb_snapshots (
  snapshot_id text PRIMARY KEY, city text, source text, collected_at timestamptz, manifest jsonb);
CREATE TABLE source_registry (code text PRIMARY KEY, status text NOT NULL, reason text, resume_when timestamptz);
CREATE TABLE source_groups (
  id bigserial PRIMARY KEY, source_code text NOT NULL, group_key text NOT NULL,
  status text NOT NULL DEFAULT 'active', params jsonb NOT NULL DEFAULT '{}');
`;

// claudedp-2611-27 (2c): mốc QUÁ HẠN → xoá mốc, vòng chạy lại bình thường (node thật — qua shim
// không phân biệt được quá hạn/hết hạn vì mọi lời gọi node đều qua shim).
test("2611-27 đã hết khoảng nghỉ → xoá mốc, vòng chạy bình thường", { timeout: 180_000 }, async (t) => {
  const tenDb = `zcode_thuduois06_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const admin = new pg.Client({ connectionString: DB_ROOT });
  let db = null, home = null, goc = null;
  try {
    await admin.connect();
    await admin.query(`CREATE DATABASE ${tenDb}`);
    db = new pg.Client({ connectionString: urlTren(tenDb) });
    await db.connect();
    await db.query(LUC_DO);
    await db.query(`INSERT INTO source_registry (code, status) VALUES ('S06', 'active')`);
    await db.query(`INSERT INTO source_groups (source_code, group_key, status) VALUES ('S06', 'hcmc', 'active')`);
    home = mkdtempSync(join(tmpdir(), "thuduois06-e2e-home-"));
    goc = mkdtempSync(join(tmpdir(), "thuduois06-e2e-goc-"));
    const root = join(WORKTREE, "pipeline", ".e2e-root-cooldown");
    rmSync(root, { recursive: true, force: true });
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "pipeline", "lib"), { recursive: true });
    const doc = async (d) => (await import("node:fs/promises")).readFile(d, "utf8");
    writeFileSync(join(root, "scripts", "thu-duoi-s06.sh"), await doc(join(WORKTREE, "scripts", "thu-duoi-s06.sh")));
    writeFileSync(join(root, "pipeline", "import-chotot.mjs"), await doc(join(WORKTREE, "pipeline", "import-chotot.mjs")));
    writeFileSync(join(root, "pipeline", "lib", "vong-doi.mjs"), await doc(join(WORKTREE, "pipeline", "lib", "vong-doi.mjs")));
    writeFileSync(join(root, "pipeline", "lib", "thu-duoi-moc.mjs"), await doc(join(WORKTREE, "pipeline", "lib", "thu-duoi-moc.mjs")));
    writeFileSync(join(root, "pipeline", "collect-s06-duoi.mjs"), "process.exit(0);\n");
    // mốc QUÁ HẠN 1 phút
    writeFileSync(join(goc, "bi-chan.json"), JSON.stringify({ hetLuc: new Date(Date.now() - 60_000).toISOString() }));
    const envDb = { ...process.env, DATABASE_URL: urlTren(tenDb), HOME: home, THU_DUOI_S06_GOC: goc };
    const r = spawnSync("bash", [join(root, "scripts", "thu-duoi-s06.sh")], { env: envDb, encoding: "utf8", timeout: 120_000 });
    assert.equal(r.status, 0, `vòng rảnh phải thoát 0 — stdout=${r.stdout?.slice(0, 300)} stderr=${r.stderr?.slice(0, 300)}`);
    assert.equal(existsSync(join(goc, "bi-chan.json")), false, "mốc quá hạn phải được xoá rồi mới chạy");
    assert.doesNotMatch(r.stdout, /nghỉ sau bị chặn/, "không được coi là còn nghỉ");
  } finally {
    if (db) await db.end().catch(() => {});
    await admin.query(`DROP DATABASE IF EXISTS ${tenDb} WITH (FORCE)`).catch(() => {});
    await admin.end().catch(() => {});
    if (home) rmSync(home, { recursive: true, force: true });
    if (goc) rmSync(goc, { recursive: true, force: true });
    rmSync(join(WORKTREE, "pipeline", ".e2e-root-cooldown"), { recursive: true, force: true });
  }
});

test("snapshot đuôi đã nạp bị lượt quét đủ đè hết snapshot_id → vòng rảnh kế KHÔNG nạp lại (đỏ trên 7173fc21a)", { timeout: 180_000 }, async (t) => {
  const tenDb = `zcode_thuduois06_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const admin = new pg.Client({ connectionString: DB_ROOT });
  let db = null;
  try {
    await admin.connect();
  } catch {
    t.skip("không nối được Postgres local — bỏ qua ca DB");
    return;
  }
  let home = null, goc = null;
  try {
    await admin.query(`CREATE DATABASE ${tenDb}`);
    db = new pg.Client({ connectionString: urlTren(tenDb) });
    await db.connect();
    await db.query(LUC_DO);
    await db.query(`INSERT INTO source_registry (code, status) VALUES ('S06', 'active')`);
    await db.query(`INSERT INTO source_groups (source_code, group_key, status) VALUES ('S06', 'hcmc', 'active')`);

    // — fake ROOT nằm TRONG pipeline/ thật để import-chotot.mjs giải được pg từ node_modules —
    home = mkdtempSync(join(tmpdir(), "thuduois06-e2e-home-"));
    goc = mkdtempSync(join(tmpdir(), "thuduois06-e2e-goc-"));
    const root = join(WORKTREE, "pipeline", ".e2e-root");
    rmSync(root, { recursive: true, force: true });
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "pipeline", "lib"), { recursive: true });
    const doc = async (duong) => (await import("node:fs/promises")).readFile(duong, "utf8");
    writeFileSync(join(root, "scripts", "thu-duoi-s06.sh"), await doc(join(WORKTREE, "scripts", "thu-duoi-s06.sh")));
    writeFileSync(join(root, "pipeline", "import-chotot.mjs"), await doc(join(WORKTREE, "pipeline", "import-chotot.mjs")));
    writeFileSync(join(root, "pipeline", "lib", "vong-doi.mjs"), await doc(join(WORKTREE, "pipeline", "lib", "vong-doi.mjs")));
    writeFileSync(join(root, "pipeline", "lib", "thu-duoi-moc.mjs"), await doc(join(WORKTREE, "pipeline", "lib", "thu-duoi-moc.mjs")));
    // collect là STUB: vòng thật đã được đo riêng (2411-6); ca này chỉ cần bước chọn-nạp chạy
    writeFileSync(join(root, "pipeline", "collect-s06-duoi.mjs"), "process.exit(0);\n");

    const dbUrl = urlTren(tenDb);
    const envDb = { ...process.env, DATABASE_URL: dbUrl, HOME: home, THU_DUOI_S06_GOC: goc };

    // (1) vòng đuôi nạp snapshot A
    const idA = vietSnapshot(goc, "hcmc", "2026-11-25T080000", [101, 102], "2026-11-25T08:00:00Z");
    let r = spawnSync(process.execPath, [join(root, "pipeline", "import-chotot.mjs"), join(goc, "snapshots", "hcmc", idA)], { env: envDb, encoding: "utf8", timeout: 60_000 });
    assert.equal(r.status, 0, `nạp A phải thoát 0 — stderr=${r.stderr?.slice(0, 300)}`);

    // (2) lượt quét đủ nạp snapshot B: ĐÚNG các tin, captured_at mới hơn → đè snapshot_id
    const idB = vietSnapshot(goc, "hcmc", "2026-11-25T083000", [101, 102], "2026-11-25T08:30:00Z");
    const idC = vietSnapshot(goc, "hcmc", "2026-11-25T090000", [201], "2026-11-25T09:00:00Z"); // tin mới thật, sau lượt quét đủ
    r = spawnSync(process.execPath, [join(root, "pipeline", "import-chotot.mjs"), join(goc, "snapshots", "hcmc", idB)], { env: envDb, encoding: "utf8", timeout: 60_000 });
    assert.equal(r.status, 0, `nạp B phải thoát 0 — stderr=${r.stderr?.slice(0, 300)}`);

    const stgSauB = await db.query("SELECT DISTINCT snapshot_id FROM stg_chotot_ads");
    assert.deepEqual(stgSauB.rows.map((x) => x.snapshot_id), [idB], "chuỗi dựng đúng: stg phải chỉ còn trỏ tới B");

    // (3) vòng rảnh kế — bước chọn-nạp phải dựa vào SỔ NẠP BỀN (airbnb_snapshots), không phải dòng stg
    r = spawnSync("bash", [join(root, "scripts", "thu-duoi-s06.sh")], {
      env: { ...envDb }, encoding: "utf8", timeout: 120_000,
    });
    assert.equal(r.status, 0, `vòng rảnh phải thoát 0 — stdout=${r.stdout?.slice(0, 400)} stderr=${r.stderr?.slice(0, 400)}`);
    // (3a) snapshot mới thật (C) phải được nạp — trên 7173fc21a argv của inline -e bị lệch (slice(2)
    // với -e là [GOC]) nên chọn-nạp thoát im lặng, KHÔNG nạp gì cả → đỏ ở đây
    assert.match(r.stdout, new RegExp(`nạp snapshot đuôi .*${idC}`), "snapshot C mới thật phải được nạp");
    // (3b) snapshot A đã nạp bị quét đủ đè hết snapshot_id thì KHÔNG được nạp lại
    assert.doesNotMatch(r.stdout, new RegExp(`nạp snapshot đuôi .*${idA}`),
      "BẢN LỖI (sau khi sửa argv) sẽ chọn A (A trông như chưa nạp) và in «nạp snapshot đuôi …A»");
    const stgSauVong = await db.query("SELECT list_id, snapshot_id FROM stg_chotot_ads ORDER BY list_id");
    const theoList = Object.fromEntries(stgSauVong.rows.map((x) => [String(x.list_id), x.snapshot_id]));
    assert.equal(theoList["101"], idB, "tin 101 không lùi — vẫn trỏ B (quét đủ)");
    assert.equal(theoList["102"], idB, "tin 102 không lùi — vẫn trỏ B");
    assert.equal(theoList["201"], idC, "tin 201 (mới thật) phải trỏ C");
  } finally {
    if (db) await db.end().catch(() => {});
    await admin.query(`DROP DATABASE IF EXISTS ${tenDb} WITH (FORCE)`).catch(() => {});
    await admin.end().catch(() => {});
    if (home) rmSync(home, { recursive: true, force: true });
    if (goc) rmSync(goc, { recursive: true, force: true });
    rmSync(join(WORKTREE, "pipeline", ".e2e-root"), { recursive: true, force: true });
  }
});
