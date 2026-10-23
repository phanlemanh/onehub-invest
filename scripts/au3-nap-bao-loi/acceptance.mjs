#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ nghiệm thu `au3-nap-bao-loi` (AU3 phần nạp, làn ZCode).
 *
 *   node scripts/au3-nap-bao-loi/acceptance.mjs chotot   # chotot-daily.sh: retry ECONNREFUSED, dừng trước transform, job-step như cũ
 *   node scripts/au3-nap-bao-loi/acceptance.mjs apify    # apify-facebook-daily.sh: giữ state ở snapshot thành công cuối, lần sau nạp lại
 *
 * AN TOÀN: chạy BẢN CHÉP hai script (+ scripts/lib/job-step.sh thật) trong thư mục
 * tạm. ROOT của bản chép là thư mục tạm, nên bước thu (collect-chotot, apify
 * collector — mạng/API trả phí) là bản GIẢ, không gọi ra ngoài. HOME giả (không đọc
 * khoá ~/.openclaw). `sleep` là stub đứng đầu PATH — thay cho việc sửa số 20 trong
 * script: stub ghi lại đúng đối số `20`, chuỗi không phải chờ 100s. Ca «DB chết thật»
 * dùng import-chotot.mjs / import-airbnb.mjs THẬT trỏ cổng không ai nghe: không ghi gì.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

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

async function deadPort() {
  const s = createServer();
  await new Promise((d) => s.listen(0, "127.0.0.1", d));
  const p = s.address().port;
  await new Promise((d) => s.close(d));
  return p;
}

/** Module giả: ghi lời gọi; kế hoạch theo khoá (TS snapshot hoặc tên bước) — ok | fail | econn | econn:N | exit:N. */
function fakeModule(calls, tag, keyExpr) {
  return `import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
const key = ${keyExpr};
const plan = JSON.parse(process.env.ACC_PLAN || "{}")[key] ?? "ok";
const cf = ${JSON.stringify(dirname(calls))} + "/n-" + ${JSON.stringify(tag)} + "-" + key.replace(/[^\\w.-]/g, "_");
const n = (existsSync(cf) ? Number(readFileSync(cf, "utf8")) : 0) + 1; writeFileSync(cf, String(n));
appendFileSync(${JSON.stringify(calls)}, ${JSON.stringify(tag)} + " " + key + " #" + n + "\\n");
if (plan === "fail") { console.error("❌ JSON hỏng trong items-0000.json.gz"); process.exit(1); }
const econn = plan === "econn" ? Infinity : plan.startsWith("econn:") ? Number(plan.slice(6)) : 0;
if (n <= econn) { console.error("❌ ECONNREFUSED — Error: connect ECONNREFUSED 127.0.0.1:5433"); process.exit(1); }
if (plan.startsWith("exit:")) process.exit(Number(plan.slice(5)));
`;
}

function sandbox(script) {
  const S = mkdtempSync(join(tmpdir(), "acc-au3-"));
  const repo = join(S, "repo");
  for (const d of ["scripts/lib", "pipeline/logs", "collector/snapshots"]) mkdirSync(join(repo, d), { recursive: true });
  cpSync(join(ROOT, "scripts", script), join(repo, "scripts", script));
  cpSync(join(ROOT, "scripts/lib/job-step.sh"), join(repo, "scripts/lib/job-step.sh"));
  const calls = join(S, "calls.log");
  const stub = join(S, "bin");
  mkdirSync(stub);
  writeFileSync(join(stub, "sleep"), `#!/bin/bash\necho "sleep $*" >> "${calls}"\nexit 0\n`);
  chmodSync(join(stub, "sleep"), 0o755);
  const env = { HOME: join(S, "home"), PATH: `${stub}:${NODE_DIR}:/usr/bin:/bin` };
  const w = spawnSync("bash", ["-c", "command -v sleep"], { env, encoding: "utf8" });
  if (!w.stdout.trim().startsWith(stub + "/")) {
    console.error("AN TOÀN: stub sleep không thắng PATH — bỏ chạy");
    process.exit(2);
  }
  return { S, repo, calls, env, cleanup: () => rmSync(S, { recursive: true, force: true }) };
}

function run(sb, script, extraEnv) {
  const r = spawnSync("bash", [join(sb.repo, "scripts", script)], { env: { ...sb.env, ...extraEnv }, encoding: "utf8", timeout: 120_000 });
  const c = read(sb.calls).trim().split("\n").filter(Boolean);
  return { code: r.status, out: r.stdout + r.stderr, calls: c, sleeps: c.filter((l) => l.startsWith("sleep")), tries: (tag, key) => c.filter((l) => l.startsWith(`${tag} ${key} `)).length, ran: (tag) => c.some((l) => l.startsWith(`${tag} `)) };
}

/** Snapshot giả hợp lệ (sha256 đúng) cho import-airbnb.mjs THẬT — chỉ để nó đi tới bước nối DB. */
function realSnapshot(dir, id) {
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from("[]"));
  writeFileSync(join(dir, "items-0000.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 3, snapshotId: id, city: "hanoi", source: "zalo-agent", startedAt: "2026-10-23T00:00:00Z", finishedAt: "2026-10-23T00:00:01Z", itemCount: 0, files: [{ name: "items-0000.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), itemCount: 0 }] }));
}

// ------------------------------------------------------------------ chotot
function chototSandbox({ realImport = false } = {}) {
  const sb = sandbox("chotot-daily.sh");
  const p = (f) => join(sb.repo, "pipeline", f);
  writeFileSync(p("collect-chotot.mjs"), fakeModule(sb.calls, "collect", '"collect"'));
  if (realImport) {
    cpSync(join(ROOT, "pipeline/import-chotot.mjs"), p("import-chotot.mjs"));
    cpSync(join(ROOT, "pipeline/package.json"), p("package.json"));
    symlinkSync(join(ROOT, "pipeline/node_modules"), p("node_modules"));
  } else {
    writeFileSync(p("import-chotot.mjs"), fakeModule(sb.calls, "import", 'process.argv[2].split("/").at(-1)'));
  }
  for (const [f, tag] of [["transform-chotot.mjs", "transform-chotot"], ["refresh-bait-gap.mjs", "refresh-bait-gap"], ["resolve-properties.mjs", "resolve-properties"]]) {
    writeFileSync(p(f), fakeModule(sb.calls, tag, JSON.stringify(tag)));
  }
  for (const c of ["hanoi", "hcmc"]) {
    for (const ts of ["20261022T053000", "20261023T053000"]) mkdirSync(join(sb.repo, "collector/snapshots", c, `${c}__chotot-ads__${ts}`), { recursive: true });
  }
  return sb;
}

async function modeChotot() {
  const H = "hanoi__chotot-ads__20261023T053000";
  const C = "hcmc__chotot-ads__20261023T053000";

  // (a) DB chết THẬT: import-chotot.mjs thật, cổng không ai nghe
  let sb = chototSandbox({ realImport: true });
  const port = await deadPort();
  const u = "acc";
  let r = run(sb, "chotot-daily.sh", { DATABASE_URL: `postgres://${u}:${u}@localhost:${port}/${u}` });
  const retryLines = r.out.split("\n").filter((l) => l.startsWith("ECONNREFUSED (lần"));
  console.log(`(a) DB chết thật: exit ${r.code} · ${retryLines.length} dòng retry · sleep ${r.sleeps.length}× [${[...new Set(r.sleeps)].join(", ")}] · transform ${r.ran("transform-chotot")}`);
  check(r.code !== 0, "(a) exit khác 0");
  check(retryLines.length === 10 && r.sleeps.length === 10 && r.sleeps.every((l) => l === "sleep 20"), "(a) lỗi thật của import-chotot được nhận là ECONNREFUSED: mỗi thành phố thử 5 lần, chờ 20s giữa các lần");
  check(!r.ran("transform-chotot") && !r.ran("refresh-bait-gap") && !r.ran("resolve-properties"), "(a) KHÔNG chạy transform / refresh / resolve");
  check(/❌ import chotot fail — dừng trước transform/.test(r.out), "(a) log báo dừng trước transform");
  sb.cleanup();

  // (c) lỗi không phải ECONNREFUSED → không retry
  sb = chototSandbox();
  r = run(sb, "chotot-daily.sh", { ACC_PLAN: JSON.stringify({ [H]: "fail" }) });
  console.log(`(c) lỗi khác DB: exit ${r.code} · thử hanoi ${r.tries("import", H)} lần · sleep ${r.sleeps.length}`);
  check(r.code !== 0 && r.tries("import", H) === 1 && r.sleeps.length === 0, "(c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ, exit khác 0");
  check(!r.ran("transform-chotot"), "(c) không transform");
  sb.cleanup();

  // ECONNREFUSED tạm (DB lên lại) → đi tiếp
  sb = chototSandbox();
  r = run(sb, "chotot-daily.sh", { ACC_PLAN: JSON.stringify({ [H]: "econn:2" }) });
  console.log(`DB lên lại sau 2 lần: exit ${r.code} · thử hanoi ${r.tries("import", H)} lần · sleep ${r.sleeps.length}`);
  check(r.code === 0 && r.tries("import", H) === 3 && r.sleeps.length === 2 && r.ran("transform-chotot"), "ECONNREFUSED 2 lần rồi lên → thử 3 lần, chờ 2×20s, đi tiếp transform, exit 0");
  sb.cleanup();

  // (d) DB sống → như cũ: chỉ snapshot mới nhất mỗi thành phố, đủ 3 bước job-step
  sb = chototSandbox();
  r = run(sb, "chotot-daily.sh", {});
  const imported = r.calls.filter((l) => l.startsWith("import ")).map((l) => l.split(" ")[1]);
  console.log(`(d) DB sống: exit ${r.code} · nạp [${imported.join(", ")}] · bước [${r.calls.filter((l) => !l.startsWith("import") && !l.startsWith("collect")).map((l) => l.split(" ")[0]).join(", ")}]`);
  check(r.code === 0 && r.sleeps.length === 0, "(d) DB sống → exit 0, không chờ");
  check(JSON.stringify(imported) === JSON.stringify([H, C]), "(d) should-NOT-fire: chỉ nạp snapshot MỚI NHẤT mỗi thành phố, bản 22/10 không nạp");
  check(r.ran("transform-chotot") && r.ran("refresh-bait-gap") && r.ran("resolve-properties"), "(d) đủ 3 bước transform → refresh → resolve");
  sb.cleanup();

  // (d) phần job-step làn Claude giữ nguyên: transform hỏng → bước liên nguồn vẫn chạy, exit = mã bước hỏng đầu
  sb = chototSandbox();
  r = run(sb, "chotot-daily.sh", { ACC_PLAN: JSON.stringify({ "transform-chotot": "exit:3" }) });
  check(r.code === 3 && r.ran("refresh-bait-gap") && r.ran("resolve-properties") && /JOB FAIL \[chotot-daily\] bước transform-chotot mã 3/.test(r.out), "(d) transform hỏng → refresh + resolve vẫn chạy, exit 3, dòng JOB FAIL");
  sb.cleanup();
  finish("CHOTOT");
}

// ------------------------------------------------------------------- apify
function apifySandbox({ realImport = false } = {}) {
  const sb = sandbox("apify-facebook-daily.sh");
  const p = (f) => join(sb.repo, "pipeline", f);
  writeFileSync(p("apify-facebook-collector.mjs"), fakeModule(sb.calls, "apify", '"apify"'));
  const snaps = ["2026-10-22T010000000", "2026-10-23T010000000", "2026-10-23T070000000", "2026-10-23T130000000"];
  for (const ts of snaps) {
    const id = `hanoi__zalo-agent__${ts}`;
    const dir = join(sb.repo, "collector/snapshots/hanoi", id);
    if (realImport) realSnapshot(dir, id);
    else mkdirSync(dir, { recursive: true });
  }
  if (realImport) {
    cpSync(join(ROOT, "pipeline/import-airbnb.mjs"), p("import-airbnb.mjs"));
    cpSync(join(ROOT, "pipeline/package.json"), p("package.json"));
    symlinkSync(join(ROOT, "pipeline/node_modules"), p("node_modules"));
  } else {
    writeFileSync(p("import-airbnb.mjs"), fakeModule(sb.calls, "import", 'process.argv[2].split("__").at(-1)'));
  }
  for (const [f, tag] of [["transform-fb.mjs", "transform-fb"], ["refresh-bait-gap.mjs", "refresh-bait-gap"]]) writeFileSync(p(f), fakeModule(sb.calls, tag, JSON.stringify(tag)));
  writeFileSync(join(sb.repo, "pipeline/logs/apify-daily.state"), "2026-10-22T120000000\n");
  return { ...sb, state: () => read(join(sb.repo, "pipeline/logs/apify-daily.state")).trim(), reset: () => writeFileSync(sb.calls, "") };
}

async function modeApify() {
  const [T1, T2, T3] = ["2026-10-23T010000000", "2026-10-23T070000000", "2026-10-23T130000000"];

  // (a) DB chết THẬT: import-airbnb.mjs thật đọc manifest, verify sha, rồi hỏng ở bước nối DB
  let sb = apifySandbox({ realImport: true });
  const port = await deadPort();
  const u = "acc";
  let r = run(sb, "apify-facebook-daily.sh", { DATABASE_URL: `postgres://${u}:${u}@localhost:${port}/${u}` });
  const retry = r.out.split("\n").filter((l) => l.startsWith("ECONNREFUSED (lần"));
  console.log(`(a) DB chết thật: exit ${r.code} · ${retry.length} dòng retry · sleep ${r.sleeps.length} · state ${sb.state()} · transform ${r.ran("transform-fb")}`);
  check(r.code !== 0 && retry.length === 5 && r.sleeps.every((l) => l === "sleep 20") && r.sleeps.length === 5, "(a) lỗi thật được nhận là ECONNREFUSED: thử 5 lần, chờ 20s, exit khác 0");
  check(sb.state() === "2026-10-22T120000000", "(a) state giữ nguyên (chưa nạp được snapshot nào)");
  check(retry.every((l) => l.includes(T1)), "(a) dừng chuỗi ngay ở snapshot đầu, không thử các snapshot sau");
  check(!r.ran("transform-fb") && !r.ran("refresh-bait-gap"), "(a) không transform / refresh");
  sb.cleanup();

  // (b) snapshot giữa lỗi → state giữ ở snapshot thành công cuối; lần sau nạp lại đúng snapshot đó
  sb = apifySandbox();
  r = run(sb, "apify-facebook-daily.sh", { ACC_PLAN: JSON.stringify({ [T2]: "fail" }) });
  console.log(`(b) lượt 1, ${T2} lỗi: exit ${r.code} · state ${sb.state()} · nạp [${r.calls.filter((l) => l.startsWith("import")).join(", ")}]`);
  check(r.code !== 0 && sb.state() === T1, "(b) lượt 1: exit khác 0, state giữ ở snapshot thành công cuối");
  check(r.tries("import", T3) === 0 && !r.ran("transform-fb"), "(b) lượt 1: snapshot sau không nạp, không transform");
  check(r.tries("import", "2026-10-22T010000000") === 0, "should-NOT-fire: snapshot cũ hơn state không nạp lại");
  sb.reset();
  r = run(sb, "apify-facebook-daily.sh", { ACC_PLAN: JSON.stringify({}) });
  console.log(`(b) lượt 2, DB lành: exit ${r.code} · state ${sb.state()} · nạp [${r.calls.filter((l) => l.startsWith("import")).join(", ")}]`);
  check(r.code === 0 && r.tries("import", T2) === 1 && r.tries("import", T3) === 1 && r.tries("import", T1) === 0, "(b) lượt 2: nạp lại đúng snapshot lỗi rồi snapshot sau, không nạp lại snapshot đã thành công");
  check(sb.state() === T3 && r.ran("transform-fb") && r.ran("refresh-bait-gap"), "(b) lượt 2: state tới snapshot cuối, transform + refresh chạy");
  sb.cleanup();

  // (c) lỗi không phải ECONNREFUSED → không retry
  sb = apifySandbox();
  r = run(sb, "apify-facebook-daily.sh", { ACC_PLAN: JSON.stringify({ [T1]: "fail" }) });
  check(r.code !== 0 && r.tries("import", T1) === 1 && r.sleeps.length === 0, "(c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ");
  sb.cleanup();

  // ECONNREFUSED tạm → đi tiếp
  sb = apifySandbox();
  r = run(sb, "apify-facebook-daily.sh", { ACC_PLAN: JSON.stringify({ [T1]: "econn:3" }) });
  check(r.code === 0 && r.tries("import", T1) === 4 && r.sleeps.length === 3 && sb.state() === T3, "ECONNREFUSED 3 lần rồi lên → thử 4 lần, chờ 3×20s, nạp hết, exit 0");
  sb.cleanup();

  // (d) phần job-step: transform-fb hỏng → refresh vẫn chạy, exit = mã bước hỏng
  sb = apifySandbox();
  r = run(sb, "apify-facebook-daily.sh", { ACC_PLAN: JSON.stringify({ "transform-fb": "exit:4" }) });
  check(r.code === 4 && r.ran("refresh-bait-gap") && /JOB FAIL \[apify-facebook-daily\] bước transform-fb mã 4/.test(r.out) && sb.state() === T3, "(d) DB sống, transform-fb hỏng → refresh vẫn chạy, exit 4, dòng JOB FAIL, state tới cuối");
  sb.cleanup();
  finish("APIFY");
}

const mode = process.argv[2];
const modes = { chotot: modeChotot, apify: modeApify };
if (!modes[mode]) {
  console.error(`dùng: node scripts/au3-nap-bao-loi/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
