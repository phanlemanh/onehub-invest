#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `thu-danh-muc-ocp1` (PL10) và `import-s08` (ZC8).
 *
 *   node scripts/s08-danh-muc/acceptance.mjs nap-hai-lan     # importer THẬT, snapshot GIẢ: nạp hai lần không nhân dòng, đổi số, bỏ detail/lạ, snapshot thử bị bỏ
 *   node scripts/s08-danh-muc/acceptance.mjs nguon-duy-nhat  # importer dựng dòng S08 chỉ qua s08RowOf
 *   node scripts/s08-danh-muc/acceptance.mjs snapshot-that   # snapshot S08 thật trên máy: có danh sách căn Ocean Park, mã căn riêng, không trường liên hệ
 *   node scripts/s08-danh-muc/acceptance.mjs khong-lo-nguon  # dòng THÊM của nhánh so với main không chứa chuỗi nào của nguồn thật
 *
 * Tầng A: snapshot-that và khong-lo-nguon chỉ IN SỐ ĐẾM, không in tên, mã, id hay chuỗi khớp. Bộ mẫu của
 * khong-lo-nguon ở ~/.oneinvest/s08-leak-patterns.txt (chỉ máy local, sinh từ snapshot thật + bản code cũ),
 * thiếu thì thoát 2 — không bao giờ commit bộ mẫu.
 * DB: nap-hai-lan ghi DB local :5433 dưới snapshot giả mang mốc riêng, kiểm trước không trùng, xoá sau
 * (cascade từ airbnb_snapshots). Không đụng snapshot thật.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PIPE = join(ROOT, "pipeline");

let failures = 0;
function check(ok, line) {
  console.log(`${ok ? "ok  " : "FAIL"} ${line}`);
  if (!ok) failures++;
}
function finish(tag) {
  if (failures > 0) {
    console.log(`${tag} FAIL (${failures} mục)`);
    process.exit(1);
  }
  console.log(`${tag} PASS`);
}
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

// ------------------------------------------------------------- nap-hai-lan
function unit(code, state, extra = {}) {
  return {
    source: "s08-danh-muc",
    sourceId: sha256(`S08|900001|${code}`).slice(0, 32),
    kind: "inventory_unit",
    fetchedAt: "2026-10-26T00:00:00.000Z",
    payload: { product_code: code, row_code: "GA", subdivision_name: "PHÂN KHU GIẢ A", land_area: "100,5", number_of_room: "2", apartment_price: "13579135000", ...extra },
    meta: { city: "vn", source: "S08", projectId: "900001", projectType: "low_rise", state, productCode: code },
  };
}

function writeSnap(root, name, items) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schemaVersion: 4, snapshotId: name, city: "vn", source: "s08-danh-muc", startedAt: "2026-10-26T00:00:00Z", finishedAt: "2026-10-26T00:00:01Z", itemCount: items.length, files: [{ name: "items-0001.json.gz", sha256: sha256(gz), itemCount: items.length }] }),
  );
  return dir;
}

async function modeNapHaiLan() {
  const require = createRequire(join(PIPE, "package.json"));
  const pg = require("pg");
  const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  // mốc giả đúng khuôn <city>__<nguồn>__<mốc> với hậu tố riêng của lượt — không trùng snapshot thật
  const nonce = String(Date.now() % 1e9);
  const name = `vn__s08-danh-muc__2026-10-26T000000-${nonce}`;
  const testName = `vn__s08-danh-muc__TEST-${nonce}`;
  const root = mkdtempSync(join(tmpdir(), "acc-s08-"));
  const run = (dir) => spawnSync(process.execPath, [join(PIPE, "import-airbnb.mjs"), dir], { cwd: PIPE, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: "utf8", timeout: 120_000 });
  const dem = async (id) => Number((await client.query("SELECT count(*) n FROM stg_s08_inventory WHERE snapshot_id = $1", [id])).rows[0].n);
  try {
    const truoc = await client.query("SELECT count(*) n FROM airbnb_snapshots WHERE snapshot_id LIKE $1", [`%${nonce}%`]);
    check(Number(truoc.rows[0].n) === 0, "mốc giả chưa có trong DB (không đè dữ liệu thật)");
    const items = [
      unit("GIA-A-01", "notSold"),
      unit("GIA-A-02", "notSold", { number_of_room: "S", land_area: "" }),
      unit("GIA-A-03", "sold", { number_of_room: "2PN", apartment_price: "giá rác" }),
      { ...unit("GIA-DETAIL", "detail"), kind: "inventory_unit" },
      unit("GIA-LA-01", "weird"),
    ];
    const dir = writeSnap(root, name, items);
    const r1 = run(dir);
    const out1 = r1.stdout + r1.stderr;
    console.log(`lượt 1: exit ${r1.status} · ${(out1.match(/đã nạp:.*$/m) ?? ["(không có dòng tổng)"])[0].replace(/^.*?(\d+ S08 căn.*)$/, "$1")}`);
    check(r1.status === 0, "lượt 1 thoát 0");
    const n1 = await dem(name);
    check(n1 === 3, `lượt 1: đúng 3 dòng căn (bỏ detail và state lạ) — được ${n1}`);
    const rows = (await client.query("SELECT product_code, number_of_room, land_area, apartment_price FROM stg_s08_inventory WHERE snapshot_id = $1 ORDER BY product_code", [name])).rows;
    const by = Object.fromEntries(rows.map((x) => [x.product_code, x]));
    check(Number(by["GIA-A-01"]?.land_area) === 100.5 && Number(by["GIA-A-01"]?.number_of_room) === 2, "chuỗi số hợp lệ đổi được ('100,5' → 100.5, '2' → 2)");
    check(by["GIA-A-02"]?.number_of_room === null && by["GIA-A-02"]?.land_area === null, "should-NOT-fire: 'S' và '' về NULL, không thành số");
    check(by["GIA-A-03"]?.number_of_room === null && by["GIA-A-03"]?.apartment_price === null, "should-NOT-fire: '2PN' và giá rác về NULL");
    check(/0 S08 căn|S08 căn/.test(out1) && /\+1 detail bỏ/.test(out1), "log lượt 1 đếm căn và 1 detail bỏ");
    const r2 = run(dir);
    const out2 = r2.stdout + r2.stderr;
    console.log(`lượt 2: exit ${r2.status} · ${(out2.match(/(\d+) S08 căn/) ?? ["?"])[0]}`);
    check(r2.status === 0, "lượt 2 thoát 0");
    const n2 = await dem(name);
    check(n2 === n1, `nạp lại cùng snapshot: số dòng không đổi (${n1} → ${n2})`);
    check(/\b0 S08 căn/.test(out2), "lượt 2 log đúng 0 căn mới (bộ đếm theo dòng thật sự ghi)");
    const dt = writeSnap(root, testName, [unit("GIA-T-01", "notSold")]);
    const r3 = run(dt);
    console.log(`snapshot thử: exit ${r3.status}`);
    const n3 = await dem(testName);
    check(n3 === 0, "should-NOT-fire: snapshot thử (tên sai khuôn mốc) không sinh dòng nào");
  } finally {
    const del = await client.query("DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE $1", [`%${nonce}%`]);
    const left = await client.query("SELECT count(*) n FROM stg_s08_inventory WHERE snapshot_id LIKE $1", [`%${nonce}%`]);
    console.log(`dọn: xoá ${del.rowCount} snapshot giả · còn ${left.rows[0].n} dòng giả`);
    check(Number(left.rows[0].n) === 0, "dọn sạch dữ liệu giả");
    await client.end();
    rmSync(root, { recursive: true, force: true });
  }
  finish("NAP-HAI-LAN");
}

// ---------------------------------------------------------- nguon-duy-nhat
function modeNguonDuyNhat() {
  const src = readFileSync(join(PIPE, "import-airbnb.mjs"), "utf8");
  check(/import\s*\{[^}]*\bs08RowOf\b[^}]*\}\s*from\s*["']\.\/import-s08-row\.mjs["']/.test(src), "import-airbnb nhập s08RowOf từ import-s08-row.mjs");
  const i = src.indexOf('it.source === "s08-danh-muc"');
  check(i >= 0, "có nhánh nạp S08 trong importer");
  const nhanh = src.slice(i, src.indexOf("s08++", i) + 5);
  check(/s08RowOf\(/.test(nhanh), "nhánh S08 gọi s08RowOf để dựng dòng");
  check(!/it\.payload\?\./.test(nhanh), "should-NOT-fire: nhánh S08 không tự đọc it.payload (không có bản dựng dòng thứ hai)");
  finish("NGUON-DUY-NHAT");
}

// ----------------------------------------------------------- snapshot-that
function timSnapshotThat() {
  if (process.env.S08_SNAPSHOT) return process.env.S08_SNAPSHOT;
  const goc = [join(homedir(), "dev/onehub-invest/collector/snapshots/vn"), join(homedir(), "dev/onehub-invest-zcode/collector/snapshots/vn")];
  const ds = goc.filter(existsSync).flatMap((g) => readdirSync(g).filter((n) => /^vn__s08-danh-muc__\d{4}-/.test(n)).map((n) => join(g, n)));
  return ds.sort((a, b) => a.split("__").pop().localeCompare(b.split("__").pop())).pop();
}
const PII = /^(contact_data|phone|phone_number|mobile|email|customer_name|full_name|id_card|identity)$/i;
function demPii(o) {
  if (Array.isArray(o)) return o.reduce((s, v) => s + demPii(v), 0);
  if (o && typeof o === "object") return Object.entries(o).reduce((s, [k, v]) => s + (PII.test(k) ? 1 : 0) + demPii(v), 0);
  return 0;
}
function modeSnapshotThat() {
  const dir = timSnapshotThat();
  if (!dir) {
    console.error("không thấy snapshot S08 thật trên máy (đặt S08_SNAPSHOT)");
    process.exit(2);
  }
  const man = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  let items = [];
  let shaOk = true;
  for (const f of man.files) {
    const buf = readFileSync(join(dir, f.name));
    if (sha256(buf) !== f.sha256) shaOk = false;
    items = items.concat(JSON.parse(gunzipSync(buf).toString("utf8")));
  }
  console.log(`snapshot S08 thật: schemaVersion ${man.schemaVersion} · ${items.length} item`);
  check(shaOk, "sha256 mọi tệp khớp manifest");
  const can = items.filter((i) => i.meta?.state === "notSold" || i.meta?.state === "sold");
  const duAn = new Map();
  for (const i of can) {
    const k = i.meta.projectId;
    if (!duAn.has(k)) duAn.set(k, { ten: String(i.payload?.project_name ?? ""), loai: i.meta.projectType, ma: [] });
    duAn.get(k).ma.push(i.meta.productCode);
  }
  const ocp = [...duAn.values()].filter((d) => /ocean\s*park/i.test(d.ten));
  console.log(`dự án có căn: ${duAn.size} · khớp Ocean Park: ${ocp.length} (cao tầng ${ocp.filter((d) => d.loai === "high_rise").length}, thấp tầng ${ocp.filter((d) => d.loai === "low_rise").length}) · căn Ocean Park: ${ocp.reduce((s, d) => s + d.ma.length, 0)}`);
  check(ocp.length >= 1 && ocp.some((d) => d.loai === "high_rise" && d.ma.length > 0), "có danh sách căn cho ít nhất một dự án cao tầng Ocean Park");
  check(ocp.every((d) => d.ma.every(Boolean) && new Set(d.ma).size === d.ma.length), "mỗi căn Ocean Park có mã căn riêng, không trùng trong dự án");
  const sid = new Set(can.map((i) => i.sourceId));
  check(sid.size === can.length, `sourceId không trùng giữa ${can.length} căn`);
  const nPii = demPii(items.map((i) => i.payload));
  console.log(`trường liên hệ còn trong payload: ${nPii}`);
  check(nPii === 0, "should-NOT-fire: không trường liên hệ nào ở mọi độ sâu payload");
  finish("SNAPSHOT-THAT");
}

// ---------------------------------------------------------- khong-lo-nguon
function modeKhongLoNguon() {
  const tep = process.env.S08_LEAK_PATTERNS ?? join(homedir(), ".oneinvest/s08-leak-patterns.txt");
  if (!existsSync(tep)) {
    console.error(`thiếu bộ mẫu local ${tep} — không kiểm được`);
    process.exit(2);
  }
  const mau = readFileSync(tep, "utf8").split("\n").map((s) => s.trim()).filter((s) => s.length >= 6);
  const base = spawnSync("git", ["merge-base", "origin/main", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const diff = spawnSync("git", ["diff", "--unified=0", base, "HEAD", "--", ".", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md"], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 }).stdout;
  const them = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  console.log(`bộ mẫu: ${mau.length} chuỗi · dòng thêm so với main: ${them.length}`);
  const tapThem = them.join("\n");
  check(mau.length > 100, "bộ mẫu đủ lớn để có nghĩa");
  // tự kiểm bộ dò: cấy một chuỗi mẫu vào bản sao dòng thêm thì phải bắt được (không in chuỗi)
  const cay = `${tapThem}\n+ ${mau[Math.floor(mau.length / 2)]}`;
  check(mau.filter((m) => cay.includes(m)).length >= 1, "bộ dò bắt được chuỗi nguồn thật khi cấy vào");
  const khop = mau.filter((m) => tapThem.includes(m));
  console.log(`chuỗi nguồn thật khớp trong dòng thêm: ${khop.length}`);
  check(khop.length === 0, "should-NOT-fire: không chuỗi nào của nguồn thật (tên/mã dự án, mã căn, đường dẫn API) trong dòng thêm");
  const url = them.filter((l) => /https?:\/\/(?!testbase\b|[^\s"'`]*\.invalid\b|localhost\b|127\.0\.0\.1\b)[a-z0-9.-]+\.[a-z]{2,}/i.test(l));
  console.log(`dòng thêm có URL ngoài máy: ${url.length}`);
  check(url.length === 0, "should-NOT-fire: không URL tên miền ngoài trong dòng thêm");
  const fx = JSON.parse(readFileSync(join(ROOT, "collector/src/test/fixtures/s08-ocp2.json"), "utf8"));
  const ids = [];
  (function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) (k === "project_id" ? ids.push(Number(v)) : walk(v));
  })(fx);
  check(ids.length > 0 && ids.every((n) => n >= 900000), `project_id trong fixture đều là id giả ≥ 900000 (${ids.length} chỗ)`);
  finish("KHONG-LO-NGUON");
}

// --------------------------------------------------------------- thieu-env
// Collector bản build (collector/dist) với fetch giả đếm lời gọi: thiếu bất kỳ cấu hình local nào → ném, 0 lời gọi mạng;
// đủ cấu hình → có lời gọi và có item (chứng bộ đếm sống). Không mạng thật, token giả trong thư mục tạm.
async function modeThieuEnv() {
  const tmp = mkdtempSync(join(tmpdir(), "acc-s08-env-"));
  writeFileSync(join(tmp, "token.json"), JSON.stringify({ access_token: "TKN-GIA" }));
  process.env.S08_TOKEN_FILE = join(tmp, "token.json"); // đọc lúc nạp module — đặt trước import
  const { s08DanhMuc } = await import(join(ROOT, "collector/dist/collectors/s08-danh-muc.js"));
  const fx = JSON.parse(readFileSync(join(ROOT, "collector/src/test/fixtures/s08-ocp2.json"), "utf8"));
  let goi = 0;
  globalThis.fetch = async (url) => {
    goi++;
    const u = String(url);
    const body = u.includes("detail-gia") ? { code: 1, data: fx.detail?.data ?? fx.detail ?? {} } : u.includes("state=sold") ? fx.sold : fx.notSold;
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  const ctx = { log: () => {}, rateLimit: { take: async () => {} } };
  const DU = { S08_API_BASE: "http://testbase", S08_EP_UNITS: "units-gia", S08_EP_CATALOG: "catalog-gia", S08_EP_DETAIL: "detail-gia", S08_PROJECTS: "900001:low_rise" };
  const dat = (env) => {
    for (const k of Object.keys(DU)) delete process.env[k];
    Object.assign(process.env, env);
  };
  try {
    for (const thieu of Object.keys(DU)) {
      const env = { ...DU };
      delete env[thieu];
      dat(env);
      goi = 0;
      let nem = null;
      await s08DanhMuc.collect(ctx).catch((e) => (nem = e));
      check(nem !== null && goi === 0, `should-NOT-fire: thiếu ${thieu} → ném lỗi, ${goi} lời gọi mạng`);
    }
    dat(DU);
    goi = 0;
    const kq = await s08DanhMuc.collect(ctx);
    console.log(`đủ cấu hình: ${goi} lời gọi · ${kq.items.length} item`);
    check(goi > 0 && kq.items.some((i) => i.kind === "inventory_unit" && i.meta.state !== "detail"), "đủ cấu hình → có lời gọi và có căn (bộ đếm sống)");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  finish("THIEU-ENV");
}

const mode = process.argv[2];
const modes = { "thieu-env": modeThieuEnv, "nap-hai-lan": modeNapHaiLan, "nguon-duy-nhat": modeNguonDuyNhat, "snapshot-that": modeSnapshotThat, "khong-lo-nguon": modeKhongLoNguon };
if (!modes[mode]) {
  console.error(`dùng: node scripts/s08-danh-muc/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
