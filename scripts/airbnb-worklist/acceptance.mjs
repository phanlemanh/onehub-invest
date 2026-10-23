#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `airbnb-worklist` (ZC5).
 *
 *   node scripts/airbnb-worklist/acceptance.mjs <mode>
 *   static          bash -n, plutil, mặc định (window off, cap 600, rotation 12, batch 24), plist cũ đã xoá
 *   installers      install-airbnb-cron.sh + install-cron.sh trên bản chép, HOME giả, launchctl stub
 *   scheduler       runCollector thật với collector giả: window off mặc định, jitter + cap còn, CONDUCT_WINDOW=19-23 vẫn chặn
 *   nightly-flow    airbnb-nightly.sh thật, các bước con là bản giả: gate 40% dừng đêm, batch lỗi dừng, hết việc dừng sớm
 *   finalize-cities finalize-airbnb.sh thật, docker/node con là bản giả: import chưa nạp, transform từng city, metrics
 *   health-gate     healthReport: biên 40%
 *   export-db       export-airdna-worklist.mjs trên DB local (CHỈ ĐỌC), ra tệp tạm
 *   adr             ADR-0007 ghi CONDUCT_WINDOW off (Mạnh chốt 23/10)
 *
 * AN TOÀN: không gọi Airbnb/AirDNA, không mở trình duyệt, không đụng .airdna-profile,
 * không launchctl thật (stub đứng đầu PATH, kiểm stub thắng trước khi chạy), không
 * ghi ~/Library/LaunchAgents thật (HOME giả). export-db chỉ SELECT.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const NODE_DIR = dirname(process.execPath);

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
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const sh = (cmd, opts = {}) => spawnSync("bash", ["-c", cmd], { encoding: "utf8", ...opts });

// ------------------------------------------------------------------ stubs
function makeStubs(dir, callsLog, names, extra = {}) {
  mkdirSync(dir, { recursive: true });
  for (const name of names) {
    const body = extra[name] ?? `#!/bin/bash\necho "${name} $*" >> "${callsLog}"\nexit 0\n`;
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  }
}
function assertStubsWin(env, stubDir, names) {
  const r = spawnSync("bash", ["-c", `for c in ${names.join(" ")}; do command -v "$c"; done`], { env, encoding: "utf8" });
  const got = r.stdout.trim().split("\n");
  if (got.length !== names.length || !got.every((p) => p.startsWith(stubDir + "/"))) {
    console.error(`AN TOÀN: stub không thắng PATH — bỏ chạy.\n${r.stdout}${r.stderr}`);
    process.exit(2);
  }
  console.log(`an toàn: ${names.join("/")} → stub trong thư mục tạm`);
}

// ----------------------------------------------------------------- static
function modeStatic() {
  for (const f of ["scripts/airbnb-nightly.sh", "pipeline/finalize-airbnb.sh", "scripts/install-airbnb-cron.sh", "scripts/install-cron.sh", "scripts/airdna-daily.sh"]) {
    const r = sh(`bash -n ${f}`, { cwd: ROOT });
    check(r.status === 0, `bash -n ${f}`);
  }
  const lint = sh("plutil -lint pipeline/cron/com.oneinvest.airbnb-nightly.plist", { cwd: ROOT });
  check(lint.status === 0 && /OK$/.test(lint.stdout.trim()), `plutil -lint airbnb-nightly.plist: ${lint.stdout.trim().split(": ").pop()}`);
  check(!existsSync(join(ROOT, "pipeline/cron/com.oneinvest.collector.plist")), "com.oneinvest.collector.plist đã xoá khỏi repo");
  const sched = read(join(ROOT, "collector/src/core/scheduler.ts"));
  check(/const WINDOW = process\.env\.CONDUCT_WINDOW \?\? "off";/.test(sched), "scheduler: CONDUCT_WINDOW mặc định off");
  check(/const JITTER = process\.env\.CONDUCT_JITTER !== "0";/.test(sched), "scheduler: jitter vẫn bật mặc định");
  check(/CONDUCT_DAILY_MAX \?\? 600\)/.test(sched), "scheduler: cap ngày mặc định 600");
  check(/AIRDNA_DAILY_MARKETS \?\? 12\)/.test(read(join(ROOT, "pipeline/airdna-rotate.mjs"))), "airdna-rotate: 12 market/đêm mặc định");
  check(/node "\$ROOT\/pipeline\/export-airdna-worklist\.mjs"/.test(read(join(ROOT, "scripts/airdna-daily.sh"))), "airdna-daily: xuất worklist sau transform AirDNA");
  check(/BATCHES="\$\{AIRBNB_NIGHTLY_BATCHES:-24\}"/.test(read(join(ROOT, "scripts/airbnb-nightly.sh"))), "airbnb-nightly: 24 batch × 25 = cap 600");
  const cron = read(join(ROOT, "scripts/install-cron.sh"));
  check(/^for f in smoke backup; do$/m.test(cron) && !/for f in[^\n]*collector/.test(cron), "install-cron.sh: vòng lặp chỉ còn smoke backup");
  finish("STATIC");
}

// ------------------------------------------------------------- installers
function modeInstallers() {
  const S = mkdtempSync(join(tmpdir(), "acc-zc5-inst-"));
  try {
    const repo = join(S, "repo");
    mkdirSync(join(repo, "scripts"), { recursive: true });
    cpSync(join(ROOT, "scripts/install-airbnb-cron.sh"), join(repo, "scripts/install-airbnb-cron.sh"));
    cpSync(join(ROOT, "scripts/install-cron.sh"), join(repo, "scripts/install-cron.sh"));
    cpSync(join(ROOT, "pipeline/cron"), join(repo, "pipeline/cron"), { recursive: true });
    const home = join(S, "home");
    const dest = join(home, "Library/LaunchAgents");
    mkdirSync(dest, { recursive: true });
    // bản cài cũ của job Chủ nhật — installer mới phải bootout + xoá nó
    writeFileSync(join(dest, "com.oneinvest.collector.plist"), "<plist/>");
    const stub = join(S, "bin");
    const calls = join(S, "calls.log");
    const names = ["launchctl", "docker", "npm", "security", "osascript"];
    makeStubs(stub, calls, names);
    const env = { HOME: home, PATH: `${stub}:${NODE_DIR}:/usr/bin:/bin:/usr/sbin:/sbin` };
    assertStubsWin(env, stub, names);

    const a = spawnSync("bash", [join(repo, "scripts/install-airbnb-cron.sh")], { env, encoding: "utf8" });
    const la = read(calls);
    console.log(`install-airbnb-cron: exit ${a.status} · ${a.stdout.trim().split("\n").filter((l) => l.startsWith("installed")).map((l) => l.split("/").pop()).join(", ")}`);
    check(a.status === 0, "install-airbnb-cron.sh exit 0");
    check(/launchctl bootout gui\/\d+ .*com\.oneinvest\.collector\.plist/.test(la), "bootout job cũ com.oneinvest.collector");
    check(!existsSync(join(dest, "com.oneinvest.collector.plist")), "bản cài cũ collector.plist bị xoá khỏi LaunchAgents");
    for (const f of ["airbnb-nightly", "smoke"]) {
      const p = join(dest, `com.oneinvest.${f}.plist`);
      const body = read(p);
      check(existsSync(p) && !body.includes("__ROOT__") && body.includes(repo), `${f}.plist cài vào LaunchAgents giả, __ROOT__ đã thay`);
      check(new RegExp(`launchctl bootstrap gui/\\d+ .*com\\.oneinvest\\.${f}\\.plist`).test(la), `bootstrap ${f}`);
    }
    check(!/bootstrap[^\n]*com\.oneinvest\.collector\.plist/.test(la), "should-NOT-fire: không bootstrap lại job collector cũ");

    writeFileSync(calls, "");
    const c = spawnSync("bash", [join(repo, "scripts/install-cron.sh")], { env, encoding: "utf8" });
    const lc = read(calls);
    console.log(`install-cron: exit ${c.status} · ${c.stdout.trim().split("\n").filter((l) => l.startsWith("installed")).map((l) => l.split("/").pop()).join(", ")}`);
    check(c.status === 0, "install-cron.sh exit 0 (không còn gãy vì template collector đã xoá)");
    check(/bootstrap[^\n]*com\.oneinvest\.smoke\.plist/.test(lc) && /bootstrap[^\n]*com\.oneinvest\.backup\.plist/.test(lc), "install-cron.sh cài smoke + backup");
    check(!/collector\.plist/.test(lc) && !existsSync(join(dest, "com.oneinvest.collector.plist")), "should-NOT-fire: install-cron.sh không hồi sinh job collector");
    check(!/^security /m.test(lc), "không đụng Keychain khi không có BACKUP_PASS");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("INSTALLERS");
}

// --------------------------------------------------------------- scheduler
async function modeScheduler() {
  const sched = pathToFileURL(join(ROOT, "collector/dist/core/scheduler.js")).href;
  const runner = (S) => {
    const f = join(S, "run.mjs");
    writeFileSync(
      f,
      `const { runCollector } = await import(${JSON.stringify(sched)});
const t0 = Date.now();
await runCollector({
  city: { id: "acc-city", name: "Acc", country: "vn", center: [0, 0] },
  snapshotRoot: ${JSON.stringify(join(S, "snapshots"))},
  stateDir: ${JSON.stringify(join(S, "state"))},
  collector: {
    id: "acc-fake", description: "giả", requestsPerSecond: 50,
    async collect({ rateLimit }) {
      await rateLimit.take();
      return { items: [{ source: "acc", sourceId: "1", kind: "x", fetchedAt: new Date().toISOString(), payload: {}, meta: {} }],
               coverage: { discovered: 1, captured: 1, failed: 0, methods: {}, notes: [] } };
    },
  },
});
console.log("ELAPSED " + (Date.now() - t0));
`,
    );
    return f;
  };
  const run = (env) => {
    const S = mkdtempSync(join(tmpdir(), "acc-zc5-sched-"));
    try {
      const base = { PATH: process.env.PATH, HOME: S };
      const r = spawnSync(process.execPath, [runner(S)], { env: { ...base, ...env }, encoding: "utf8", timeout: 60_000 });
      const out = r.stdout + r.stderr;
      return { out, ran: /done: 1 items/.test(out), skipWin: /skip: ngoài cửa sổ/.test(out), skipCap: /skip: vượt cap/.test(out), ms: Number(out.match(/ELAPSED (\d+)/)?.[1] ?? NaN) };
    } finally {
      rmSync(S, { recursive: true, force: true });
    }
  };
  const h = new Date().getHours();
  const lo = (h + 2) % 24;
  const outside = `${lo}-${lo + 1}`;

  const def = run({});
  console.log(`mặc định (không env): chạy=${def.ran} · ${def.ms}ms`);
  check(def.ran && !def.skipWin, `không đặt CONDUCT_WINDOW → chạy ở giờ hiện tại (${h}h)`);
  check(def.ms >= 2000, `jitter mặc định vẫn còn: 1 request ngủ ≥ 2000ms (${def.ms}ms)`);
  const win = run({ CONDUCT_WINDOW: outside, CONDUCT_JITTER: "0" });
  check(win.skipWin && !win.ran, `should-NOT-fire: CONDUCT_WINDOW=${outside} (không chứa ${h}h) → bỏ qua, không gọi nguồn`);
  const cap = run({ CONDUCT_DAILY_MAX: "0", CONDUCT_JITTER: "0" });
  check(cap.skipCap && !cap.ran, "should-NOT-fire: cap ngày đã chạm (CONDUCT_DAILY_MAX=0) → bỏ qua");
  const off = run({ CONDUCT_WINDOW: "off", CONDUCT_JITTER: "0" });
  check(off.ran && off.ms < 2000, "CONDUCT_WINDOW=off + CONDUCT_JITTER=0 → chạy ngay (đường chạy tay)");
  finish("SCHEDULER");
}

// ------------------------------------------------------------ nightly-flow
function nightly(plan, extraEnv = {}) {
  const S = mkdtempSync(join(tmpdir(), "acc-zc5-night-"));
  try {
    const repo = join(S, "repo");
    for (const d of ["scripts", "collector/dist", "pipeline"]) mkdirSync(join(repo, d), { recursive: true });
    cpSync(join(ROOT, "scripts/airbnb-nightly.sh"), join(repo, "scripts/airbnb-nightly.sh"));
    const calls = join(S, "calls.log");
    const log = (tag) => `import { appendFileSync } from "node:fs"; appendFileSync(${JSON.stringify(calls)}, ${JSON.stringify(tag)} + " " + process.argv.slice(2).join(" ") + "\\n");`;
    // CLI giả: kế hoạch theo số thứ tự lần gọi — ok (còn việc) · done (còn=0) · skip (scheduler bỏ qua) · fail
    writeFileSync(
      join(repo, "collector/dist/cli.js"),
      `${log("cli")}
import { existsSync, readFileSync, writeFileSync } from "node:fs";
const cf = ${JSON.stringify(join(S, "n"))}; const n = (existsSync(cf) ? Number(readFileSync(cf, "utf8")) : 0) + 1; writeFileSync(cf, String(n));
const plan = JSON.parse(process.env.ACC_CLI); const step = plan[n - 1] ?? plan.at(-1);
if (process.env.AIRBNB_LISTING_WORKLIST !== "state/airbnb-worklist.json") { console.log("thiếu worklist env"); process.exit(3); }
if (step === "fail") { console.log("FAILED: giả"); process.exit(1); }
if (step === "done") console.log("[airbnb-listing/vn] ids=5, còn=0");
else if (step === "skip") console.log("[airbnb-listing/vn] skip: vượt cap ngày 600 items");
else console.log("[airbnb-listing/vn] ids=500, còn=400");
`,
    );
    writeFileSync(join(repo, "pipeline/export-airdna-worklist.mjs"), log("export"));
    writeFileSync(join(repo, "pipeline/worklist-health.mjs"), `${log("health")}\nprocess.exit(Number(process.env.ACC_HEALTH ?? 0));\n`);
    writeFileSync(join(repo, "pipeline/finalize-airbnb.sh"), `echo "finalize" >> "${calls}"\n`);
    const stub = join(S, "bin");
    makeStubs(stub, calls, ["sleep", "npm"]);
    const env = { HOME: join(S, "home"), PATH: `${stub}:${NODE_DIR}:/usr/bin:/bin`, ACC_CLI: JSON.stringify(plan.cli), ACC_HEALTH: String(plan.health ?? 0), ...extraEnv };
    assertStubsWin(env, stub, ["sleep", "npm"]);
    const r = spawnSync("bash", [join(repo, "scripts/airbnb-nightly.sh")], { env, encoding: "utf8", timeout: 60_000 });
    const c = read(calls).trim().split("\n").filter(Boolean);
    return {
      code: r.status,
      order: c.map((l) => l.split(" ")[0]),
      cli: c.filter((l) => l.startsWith("cli")).length,
      finalize: c.includes("finalize"),
      sleeps: c.filter((l) => l.startsWith("sleep")).map((l) => Number(l.split(" ")[1])),
      out: r.stdout + r.stderr,
    };
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
}

function modeNightlyFlow() {
  const z = { AIRBNB_NIGHTLY_JITTER_MAX: "0" };
  const a = nightly({ cli: ["ok", "ok", "done"] }, z);
  console.log(`1 còn việc ×2 rồi hết: exit ${a.code} · thứ tự ${[...new Set(a.order)].join("→")} · ${a.cli} batch · finalize ${a.finalize}`);
  check(a.code === 0 && a.cli === 3 && a.finalize, "hết việc ở batch 3 → dừng sớm, finalize chạy, exit 0");
  check(a.order.indexOf("export") < a.order.indexOf("health") && a.order.indexOf("health") < a.order.indexOf("cli"), "thứ tự: xuất worklist → gate sức khoẻ → thu");

  const g = nightly({ cli: ["ok"], health: 1 }, z);
  console.log(`2 gate delisted dừng: exit ${g.code} · ${g.cli} batch · finalize ${g.finalize}`);
  check(g.code !== 0 && g.cli === 0 && !g.finalize, "gate worklist-health báo dừng → cả đêm không thu, không finalize, exit khác 0");

  const f = nightly({ cli: ["ok", "fail"] }, z);
  console.log(`3 batch 2 lỗi: exit ${f.code} · ${f.cli} batch · finalize ${f.finalize}`);
  check(f.code === 1 && f.cli === 2 && !f.finalize, "batch lỗi → dừng ngay, không finalize, exit 1");

  const s = nightly({ cli: ["skip"] }, z);
  check(s.code === 0 && s.cli === 1 && s.finalize, "scheduler skip (vượt cap) → dừng sau batch 1, vẫn finalize phần đã có");

  const full = nightly({ cli: ["ok"] }, z);
  console.log(`5 luôn còn việc: ${full.cli} batch · finalize ${full.finalize}`);
  check(full.cli === 24 && full.finalize, "should-NOT-fire vượt trần: luôn còn việc → đúng 24 batch (24×25 = cap 600) rồi finalize");

  const j = nightly({ cli: ["done"] });
  console.log(`6 jitter mặc định: sleep [${j.sleeps.join(", ")}]`);
  check(j.sleeps.length === 1 && j.sleeps[0] >= 0 && j.sleeps[0] < 1200, "jitter mặc định trước khi chạm nguồn: một lần sleep < 1200s");
  finish("NIGHTLY-FLOW");
}

// --------------------------------------------------------- finalize-cities
function modeFinalizeCities() {
  const S = mkdtempSync(join(tmpdir(), "acc-zc5-fin-"));
  try {
    const repo = join(S, "repo");
    for (const d of ["pipeline/sql", "db"]) mkdirSync(join(repo, d), { recursive: true });
    cpSync(join(ROOT, "pipeline/finalize-airbnb.sh"), join(repo, "pipeline/finalize-airbnb.sh"));
    const calls = join(S, "calls.log");
    const sids = {
      hanoi: ["hanoi__airbnb-listing__20261023T010000"],
      hcmc: ["hcmc__airbnb-listing__20261023T010000"],
      danang: ["danang__airbnb-listing__20261023T010000"],
      vn: ["vn__airbnb-listing__20261023T010000", "vn__airbnb-listing__20261022T010000"],
    };
    const imported = "vn__airbnb-listing__20261022T010000"; // đã nạp từ trước → bỏ qua
    for (const [c, list] of Object.entries(sids)) for (const sid of list) mkdirSync(join(repo, "collector/snapshots", c, sid), { recursive: true });
    for (const f of ["import-airbnb.mjs", "reassign-areas.mjs", "transform-airbnb.mjs"]) {
      writeFileSync(join(repo, "pipeline", f), `import { appendFileSync } from "node:fs"; appendFileSync(${JSON.stringify(calls)}, "${f} " + process.argv.slice(2).map((a) => a.split("/").pop()).join(" ") + "\\n");\n`);
    }
    for (const n of ["300_metrics", "400_breakdowns", "410_listing_stats", "450_dq_checks"]) writeFileSync(join(repo, "pipeline/sql", `${n}.sql`), `-- ${n}\n`);
    const stub = join(S, "bin");
    const docker = `#!/bin/bash
args="$*"
if [[ "$args" == *"FROM airbnb_snapshots WHERE snapshot_id="* ]]; then
  if [[ "$args" == *"${imported}"* ]]; then echo 1; else echo 0; fi; exit 0
fi
if [ ! -t 0 ]; then first=$(head -1); [ -n "$first" ] && echo "sql $first" >> "${calls}"; fi
exit 0
`;
    makeStubs(stub, calls, ["docker"], { docker });
    const env = { HOME: join(S, "home"), PATH: `${stub}:${NODE_DIR}:/usr/bin:/bin` };
    assertStubsWin(env, stub, ["docker"]);
    const r = spawnSync("bash", [join(repo, "pipeline/finalize-airbnb.sh")], { env, encoding: "utf8", timeout: 60_000, input: "" });
    const c = read(calls).trim().split("\n").filter(Boolean);
    const imports = c.filter((l) => l.startsWith("import-airbnb")).map((l) => l.split(" ")[1]);
    const transforms = c.filter((l) => l.startsWith("transform-airbnb")).map((l) => l.split(" ")[1]);
    const sqls = c.filter((l) => l.startsWith("sql")).map((l) => l.replace("sql -- ", ""));
    console.log(`exit ${r.status} · nạp [${imports.join(", ")}] · transform [${transforms.join(", ")}] · sql [${sqls.join(", ")}]`);
    check(r.status === 0, "finalize-airbnb.sh exit 0");
    check(imports.length === 4 && ["hanoi", "hcmc", "danang", "vn"].every((c) => imports.some((s) => s.startsWith(`${c}__`))), "nạp snapshot chưa có của cả 4 city (hanoi, hcmc, danang, vn)");
    check(!imports.includes(imported), "should-NOT-fire: snapshot đã nạp không nạp lại");
    check(JSON.stringify(transforms) === JSON.stringify(["hanoi", "hcmc", "danang", "vn"]), "transform-airbnb chạy TỪNG city");
    check(c.filter((l) => l.startsWith("reassign-areas")).length === 1, "gán phường một lượt cho mọi city");
    check(JSON.stringify(sqls) === JSON.stringify(["300_metrics", "400_breakdowns", "410_listing_stats", "450_dq_checks"]), "metrics 300 → 400 → 410 → 450");
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("FINALIZE-CITIES");
}

// ------------------------------------------------------------- health-gate
async function modeHealthGate() {
  const { healthReport } = await import(pathToFileURL(join(ROOT, "pipeline/worklist-health.mjs")).href);
  const ids = (n, p) => Array.from({ length: n }, (_, i) => `${p}${i}`);
  const at = (done, gone) => healthReport({ doneIds: ids(done, "d"), goneIds: ids(gone, "g"), pendingByMarket: {} });
  const cases = [
    [10, 4, "ok", "đúng 40% → chưa dừng"],
    [10, 5, "stop", "50% → dừng"],
    [100, 41, "stop", "41% → dừng"],
    [500, 202, "ok", "40,4% làm tròn 40% → chưa dừng"],
    [500, 203, "stop", "40,6% làm tròn 41% → dừng"],
    [0, 0, "ok", "chưa thu gì → không chia 0, không dừng"],
  ];
  for (const [d, g, want, label] of cases) {
    const r = at(d, g);
    check(r.verdict === want, `${label} (gone ${g}/done ${d} → rate ${r.rate}%, ${r.verdict})`);
  }
  finish("HEALTH-GATE");
}

// --------------------------------------------------------------- export-db
async function modeExportDb() {
  const S = mkdtempSync(join(tmpdir(), "acc-zc5-exp-"));
  try {
    const out = join(S, "worklist.json");
    const r = spawnSync(process.execPath, [join(ROOT, "pipeline/export-airdna-worklist.mjs"), out], { cwd: join(ROOT, "pipeline"), encoding: "utf8", timeout: 60_000 });
    console.log(`export: exit ${r.status} · ${r.stdout.trim().replace(out, "<tệp tạm>")}`);
    check(r.status === 0 && existsSync(out), "export-airdna-worklist ghi worklist ra tệp tạm (không đụng collector/state)");
    const w = JSON.parse(read(out) || "{}");
    check(Array.isArray(w.ids) && w.total === w.ids.length && !Number.isNaN(Date.parse(w.generatedAt)), `khuôn {generatedAt,total,ids}: total=${w.total}`);
    check(w.ids.every((id) => /^abnb_\d+$/.test(id)) && new Set(w.ids).size === w.ids.length, "mọi id dạng abnb_<số>, không trùng");
    const { parseWorklist } = await import(pathToFileURL(join(ROOT, "collector/dist/collectors/airbnb-listing.js")).href);
    const parsed = parseWorklist(w);
    check(parsed.length === w.ids.length && parsed.every((x) => /^\d+$/.test(x)), "collector đọc worklist: bỏ prefix abnb_ còn id số cho URL /rooms/<id>");
    // thứ tự ưu tiên: hạng market không giảm dọc danh sách (47 → 48 → 89491 → khác)
    const require = createRequire(join(ROOT, "pipeline/package.json"));
    const pg = require("pg");
    const u = "oneinvest";
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? `postgres://${u}:${u}@localhost:5433/${u}` });
    await client.connect();
    const { rows } = await client.query("SELECT id, airdna_market_id::text AS m FROM airdna_listings WHERE id = ANY($1)", [w.ids]);
    await client.end();
    const rank = { 47: 0, 48: 1, 89491: 2 };
    const mk = Object.fromEntries(rows.map((x) => [x.id, rank[x.m] ?? 9]));
    const ranks = w.ids.map((id) => mk[id] ?? 9);
    check(ranks.every((x, i) => i === 0 || x >= ranks[i - 1]), `ưu tiên market lớn trước: ${["47", "48", "89491", "khác"].map((m, i) => `${m}=${ranks.filter((r) => r === (i === 3 ? 9 : i)).length}`).join(" ")}`);
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("EXPORT-DB");
}

// --------------------------------------------------------------------- adr
function modeAdr() {
  const adr = read(join(ROOT, "docs/adr/0007-collector-operating-principles.md"));
  check(/Sửa đổi 2026-10-23 \(Mạnh chốt/.test(adr), "ADR-0007 có mục sửa đổi 2026-10-23, Mạnh chốt");
  check(/`CONDUCT_WINDOW` mặc định `off`/.test(adr), "ghi CONDUCT_WINDOW mặc định off");
  check(/jitter 2–15s/.test(adr) && /600 items\/ngày/.test(adr), "ghi jitter và cap 600 giữ nguyên");
  finish("ADR");
}

const mode = process.argv[2];
const modes = { static: modeStatic, installers: modeInstallers, scheduler: modeScheduler, "nightly-flow": modeNightlyFlow, "finalize-cities": modeFinalizeCities, "health-gate": modeHealthGate, "export-db": modeExportDb, adr: modeAdr };
if (!modes[mode]) {
  console.error(`dùng: node scripts/airbnb-worklist/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
