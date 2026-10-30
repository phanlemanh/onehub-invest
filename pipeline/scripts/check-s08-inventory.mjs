// check-s08-inventory.mjs — eval máy của hồ sơ _acceptance/stg-s08-inventory (migration 040).
//   shape       DB local :5433: khoá, FK, CHECK state — dòng hợp lệ vào, dòng sai bị từ chối
//               (mọi ghi trong giao dịch rồi ROLLBACK)
//   local-only  sync-pii.test xanh; cấy stg_s08_inventory vào FILL (bản chép thư mục tạm) → đỏ;
//               leakGate báo bảng khi cloud có dòng, im khi 0 dòng / vắng
//   real-name   tên thật của S08 (đọc từ source_registry LOCAL, không in ra) vắng trong mọi tệp
//               của thay đổi; đối chứng dương: cấy tên vào bản chép thì bị bắt
//   reso        mappings.yaml sources.S08 trỏ stg_s08_inventory; mọi field DD khai ở đó có trong
//               dd-2.1.json (DD_JSON, mặc định research-local của checkout chính)
// Exit 0 = mọi dòng «ok». Dùng: node scripts/check-s08-inventory.mjs <mode>
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { leakGate, scanSourceNames } from "../sync-cloud.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PIPE, "..");
const DB = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const results = [];
const check = (ok, label) => {
  results.push(ok);
  console.log(`${ok ? "ok  " : "SAI "} ${label}`);
};

async function shape() {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  // Thử một câu trong savepoint: trả mã lỗi SQLSTATE (null = chạy được).
  const attempt = async (sql, params) => {
    await c.query("SAVEPOINT s");
    try {
      await c.query(sql, params);
      await c.query("RELEASE SAVEPOINT s");
      return null;
    } catch (e) {
      await c.query("ROLLBACK TO SAVEPOINT s");
      return e.code;
    }
  };
  try {
    await c.query("BEGIN");
    const snap = `eval-s08-${Date.now()}`;
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'eval', '{}')`,
      [snap],
    );
    const ins = `INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, state, product_code, payload)
                 VALUES ($1, $2, '87', $3, 'KĐ5-44', '{}')`;
    check((await attempt(ins, ["u1", snap, "notSold"])) === null, "dòng hợp lệ (notSold) vào được");
    check((await attempt(ins, ["u1", `${snap}-b`, "sold"])) === "23503", "snapshot không tồn tại → FK từ chối (23503)");
    check((await attempt(ins, ["u2", snap, "pending"])) === "23514", "state ngoài {notSold, sold} → CHECK từ chối (23514)");
    check((await attempt(ins, ["u1", snap, "sold"])) === "23505", "trùng (source_id, snapshot_id) → khoá từ chối (23505)");
    const snap2 = `${snap}-2`;
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'eval', '{}')`,
      [snap2],
    );
    check((await attempt(ins, ["u1", snap2, "sold"])) === null, "cùng căn ở snapshot sau (sold) vào được — giữ vòng đời");
    await c.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = $1", [snap]);
    const { rows } = await c.query("SELECT count(*)::int AS n FROM stg_s08_inventory WHERE snapshot_id = $1", [snap]);
    check(rows[0].n === 0, "xoá snapshot → dòng staging của nó xoá theo (ON DELETE CASCADE)");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function localOnly() {
  const run = (mutate) => {
    const dir = mkdtempSync(join(tmpdir(), "s08-mut-"));
    try {
      for (const f of ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs", "import-s08-row.mjs"]) copyFileSync(join(PIPE, f), join(dir, f));
      symlinkSync(join(PIPE, "node_modules"), join(dir, "node_modules"));
      symlinkSync(join(PIPE, "lib"), join(dir, "lib")); // sync-cloud.mjs nhập lib/tier-a-guard.mjs
      if (mutate) {
        const p = join(dir, "sync-cloud.mjs");
        const src = readFileSync(p, "utf8");
        const out = src.replace("export const FILL = [", 'export const FILL = [\n  "stg_s08_inventory",');
        if (out === src) throw new Error("không cấy được đột biến — FILL đổi hình dạng?");
        writeFileSync(p, out);
      }
      const r = spawnSync("node", ["--test", "--test-reporter=tap", "sync-pii.test.mjs"], { cwd: dir, encoding: "utf8" });
      const s08 = /^not ok .*stg_s08_inventory/m.test(r.stdout);
      return { status: r.status, s08 };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const m0 = run(false);
  check(m0.status === 0, `M0 bản gốc: sync-pii.test xanh (exit ${m0.status})`);
  const m1 = run(true);
  check(m1.status !== 0 && m1.s08, `M1 FILL += stg_s08_inventory: sync-pii.test đỏ, ca S08 đỏ (exit ${m1.status})`);

  // leakGate với cloud giả: chỉ có stg_s08_inventory, n dòng.
  const fakeCloud = (n) => async (sql) => {
    if (sql.includes("table_name LIKE 'stg_%'")) return [{ table_name: "stg_s08_inventory" }];
    if (sql.includes("information_schema.columns")) return []; // piiColumnLeaks: bảng người bán vắng ở cloud giả
    if (sql.includes("to_regclass")) return [{ r: sql.includes("stg_s08_inventory") ? "stg_s08_inventory" : null }];
    if (sql.includes('FROM public."stg_s08_inventory"')) return [{ n }];
    if (sql.includes("FROM pg_roles WHERE rolname = 'anon'")) return [{ n: 1 }];
    if (sql.includes("WITH rel AS")) return [];
    return [{ n: 0, r: null }];
  };
  const hit = await leakGate(fakeCloud(3));
  check(hit.some((l) => l === "stg_s08_inventory=3"), `leak gate: cloud có 3 dòng → báo (${hit.join("; ")})`);
  const quiet = await leakGate(fakeCloud(0));
  check(quiet.length === 0, `leak gate: cloud 0 dòng → im (${quiet.length} vi phạm)`);
}

async function realName() {
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  const { rows } = await c.query("SELECT real_name FROM source_registry WHERE code = 'S08'").finally(() => c.end());
  check(rows.length === 1, "source_registry local có dòng S08 (nguồn tên thật để soát)");
  if (!rows.length) return;
  // Token: tên đầy đủ + phần trước dấu chấm đầu (tên miền không đuôi) — không in ra màn hình.
  const name = rows[0].real_name;
  const tokens = [name, name.split(".")[0]].filter((t) => t && t.length >= 4);
  const base = process.env.BASE_REF ?? "origin/main";
  const diff = spawnSync("git", ["diff", "--name-only", "--diff-filter=AM", `${base}...HEAD`], { cwd: ROOT, encoding: "utf8" });
  const files = diff.stdout.split("\n").filter(Boolean).filter((f) => existsSync(join(ROOT, f)));
  check(files.includes("db/migrations/040_stg_s08_inventory.sql"), `tập soát có migration 040 (${files.length} tệp so ${base})`);
  const leaked = files.filter((f) => scanSourceNames(readFileSync(join(ROOT, f), "utf8"), tokens));
  check(leaked.length === 0, `tên thật S08 vắng trong mọi tệp thay đổi (${leaked.length} tệp trúng${leaked.length ? ": " + leaked.join(", ") : ""})`);
  const planted = readFileSync(join(ROOT, "db/migrations/040_stg_s08_inventory.sql"), "utf8") + `\n-- ${name}\n`;
  check(scanSourceNames(planted, tokens) !== null, "đối chứng dương: cấy tên thật vào bản chép migration → bị bắt");
}

function reso() {
  const yaml = readFileSync(join(PIPE, "mappings.yaml"), "utf8");
  const block = yaml.match(/\n {2}S08:\n([\s\S]*?)(?=\n {2}[A-Z0-9]+:\n|\n# -{5,})/);
  check(Boolean(block), "mappings.yaml có mục sources.S08");
  if (!block) return;
  check(/\n\s+staging: stg_s08_inventory\n/.test(block[0]), "sources.S08.staging = stg_s08_inventory");
  const ddPath = process.env.DD_JSON ?? join(homedir(), "dev/onehub-invest/research-local/reso/dd-2.1.json");
  check(existsSync(ddPath), "có dd-2.1.json để tra");
  if (!existsSync(ddPath)) return;
  const dd = readFileSync(ddPath, "utf8");
  // Field DD = chữ sau «"→ » đầu giá trị; dòng state ánh xạ GIÁ TRỊ enum StandardStatus — kiểm riêng.
  const fields = [...new Set([...block[0].matchAll(/"→ (?:Building\.)?([A-Z][A-Za-z]+)/g)].map((m) => m[1]))];
  check(fields.length >= 8, `mục S08 khai ${fields.length} field DD`);
  const missing = fields.filter((f) => !new RegExp(`"fieldName":\\s*"${f}"`).test(dd));
  check(missing.length === 0, `mọi field DD khai có trong dd-2.1.json (thiếu: ${missing.join(", ") || "0"})`);
  const lookup = (v) => new RegExp(`"lookupName":\\s*"org\\.reso\\.metadata\\.enums\\.StandardStatus",\\s*"lookupValue":\\s*"${v}"`).test(dd);
  check(/state: "notSold → StandardStatus Active · sold → Closed"/.test(block[0]) && lookup("Active") && lookup("Closed"),
    "state → StandardStatus: Active và Closed là giá trị lookup StandardStatus trong DD");
  check(!new RegExp(`"fieldName":\\s*"EarlyPaymentPrice"`).test(dd) && /early_payment_price — DD không có/.test(block[0]),
    "should-NOT-fire: early_payment_price không bị gán field DD bịa — khai «DD không có»");
}

const mode = process.argv[2];
const modes = { shape, "local-only": localOnly, "real-name": realName, reso };
if (!modes[mode]) {
  console.error(`mode phải là một trong: ${Object.keys(modes).join(", ")}`);
  process.exit(2);
}
await modes[mode]();
const pass = results.length > 0 && results.every(Boolean);
console.log(pass ? `S08 ${mode.toUpperCase()} PASS` : `S08 ${mode.toUpperCase()} FAIL`);
process.exit(pass ? 0 : 1);
