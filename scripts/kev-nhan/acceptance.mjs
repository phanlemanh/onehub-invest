#!/usr/bin/env node
/**
 * Eval máy cho hai hồ sơ trên nhánh zcode/kev-nhan:
 *   kev-thanh-nhan (PL4)  — handler-label · manifest-v3 · import-versions · watchdog-l1
 *   sourceid-tin-anh (ZC1) — sourceid · stg-roundtrip
 *
 *   node scripts/kev-nhan/acceptance.mjs <mode>
 *
 * AN TOÀN: handler.js chạy trong tiến trình con với HOME giả (khoá, log nằm
 * trong thư mục tạm), Kev và collector là server giả trên cổng ngẫu nhiên —
 * không chạm ~/.openclaw, :8009, :9210. Không chạy watchdog (L1 chỉ là grep
 * chép nguyên văn). stg-roundtrip ghi DB local :5433: kiểm trước snapshot_id
 * và post_id chưa tồn tại (có thì bỏ chạy), xoá đúng snapshot của mình sau đó.
 * Cần `cd collector && npm run build` trước.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COLLECTOR = join(ROOT, "collector");
const HANDLER = join(COLLECTOR, "openclaw/handler.js");

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
const listen = (server) => new Promise((done) => server.listen(0, "127.0.0.1", () => done(server.address().port)));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

function readSnapshot(root, city = "hanoi") {
  const out = [];
  const cityDir = join(root, city);
  if (!existsSync(cityDir)) return out;
  for (const dir of readdirSync(cityDir)) {
    const manifest = JSON.parse(readFileSync(join(cityDir, dir, "manifest.json"), "utf8"));
    const items = [];
    for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
      items.push(...JSON.parse(gunzipSync(readFileSync(join(cityDir, dir, f.name))).toString()));
    }
    out.push({ dir: join(cityDir, dir), manifest, items });
  }
  return out;
}

// ------------------------------------------------------------ handler-label
/** Chạy handler.js thật trong tiến trình con với HOME giả; trả mọi POST collector giả nhận được + log của hook. */
async function runHandler(events, { kevDown = false } = {}) {
  const S = mkdtempSync(join(tmpdir(), "acc-kev-"));
  const home = join(S, "home");
  mkdirSync(join(home, ".openclaw/credentials"), { recursive: true });
  mkdirSync(join(home, ".openclaw/logs"), { recursive: true });
  writeFileSync(join(home, ".openclaw/credentials/oneinvest-agent.key"), "acc-key\n");
  if (resolve(home) === resolve(homedir())) throw new Error("HOME giả trùng HOME thật — bỏ chạy");

  const kev = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const state = JSON.parse(body || "{}").state ?? "";
      if (state.includes("kev500")) {
        res.writeHead(500);
        return res.end("boom");
      }
      if (state.includes("kevjunk")) {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end("{}");
      }
      const p = Number(state.match(/p=([\d.]+)/)?.[1] ?? 0.5);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ answers: { is_bds: { noul: p } } }));
    });
  });
  const posts = [];
  const api = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      posts.push({ path: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
    });
  });
  const kevPort = await listen(kev);
  const apiPort = await listen(api);
  if (kevDown) await new Promise((done) => kev.close(done));

  const runner = join(S, "run.mjs");
  writeFileSync(
    runner,
    `const h = (await import(${JSON.stringify(pathToFileURL(HANDLER).href)})).default;
for (const ev of JSON.parse(process.env.ACC_EVENTS)) await h({ event: ev });
`,
  );
  // spawnSync chặn event loop của tiến trình này — server giả phải chạy ở tiến trình khác hoặc dùng spawn bất đồng bộ
  const { spawn } = await import("node:child_process");
  const child = spawn(process.execPath, [runner], {
    env: {
      PATH: process.env.PATH,
      HOME: home,
      ONEINVEST_KEV_URL: `http://127.0.0.1:${kevPort}`,
      ONEINVEST_API_URL: `http://127.0.0.1:${apiPort}`,
      ACC_EVENTS: JSON.stringify(events),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let err = "";
  child.stderr.on("data", (c) => (err += c));
  const code = await new Promise((done) => child.on("exit", done));
  if (!kevDown) kev.close();
  api.close();
  const logFile = join(home, ".openclaw/logs/oneinvest-zalo-pipe.log");
  const log = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
  rmSync(S, { recursive: true, force: true });
  return { code, err, posts, log };
}

const ev = (text, extra = {}) => ({
  channelId: "zalouser",
  content: text,
  timestamp: Date.parse("2026-10-23T03:00:00Z"),
  accountId: "acc",
  metadata: { channelName: "acc-group", senderId: "acc-sender", senderName: "acc" },
  ...extra,
});

async function modeHandlerLabel() {
  const events = [
    ev("bán nhà p=0.2 Cầu Giấy"),
    ev("cho thuê p=0.95 Ba Đình"),
    ev("hỏi đường kev500"),
    ev("chào cả nhà kevjunk"),
    ev("tin không có chữ", { content: "" }), // rỗng + không ảnh → bỏ (không phải lọc theo p)
    { ...ev("kênh khác p=0.99"), channelId: "telegram" }, // không phải zalouser → không đụng
  ];
  const r = await runHandler(events);
  const kevs = r.posts.map((p) => p.body.messages[0].kev);
  console.log(`gate sống: hook exit ${r.code} · POST tới collector ${r.posts.length} · p = [${kevs.map((k) => k?.p).join(", ")}]`);
  check(r.code === 0 && r.err === "", "hook chạy xong, không ném lỗi");
  check(r.posts.length === 4, "4 tin có chữ của zalouser đều được đẩy — kể cả p=0.2 (dưới ngưỡng 0.9)");
  check(kevs[0]?.p === 0.2 && kevs[1]?.p === 0.95, "p thấp và p cao đi kèm nguyên giá trị");
  check(kevs[2]?.p === null && kevs[3]?.p === null, "Kev trả 500 hoặc thiếu noul → p = null (không giả 1.0)");
  check(
    kevs.every((k) => k && k.model === "kev-latest" && k.threshold === 0.9 && !Number.isNaN(Date.parse(k.at))),
    "mọi tin có meta.kev đủ {p, model, threshold, at}",
  );
  check(r.posts.every((p) => p.path === "/agent-report" && p.auth === "Bearer acc-key"), "POST đúng /agent-report với khoá trong HOME giả");
  check(!/skip p=/.test(r.log), "log hook không còn dòng 'skip p=' (không bỏ tin theo điểm)");
  check(/skip \(rỗng\)/.test(r.log), "should-NOT-fire: tin rỗng không ảnh vẫn bị bỏ như cũ (không phải lọc theo p)");
  check(!r.posts.some((p) => p.body.messages[0].text.includes("kênh khác")), "should-NOT-fire: kênh không phải zalouser không bị đẩy");

  const down = await runHandler([ev("bán đất p=0.99 Đông Anh")], { kevDown: true });
  const k = down.posts[0]?.body.messages[0].kev;
  console.log(`gate chết (cổng đóng): POST ${down.posts.length} · p = ${k?.p}`);
  check(down.posts.length === 1 && k?.p === null, "Kev không nghe → tin vẫn đẩy, p = null");
  // ZC6 (bd51084d) đổi chữ log khi Kev không trả lời từ «gate-down» thành «kev null (timeout/gate)» — cùng ý: log ghi Kev hỏng
  check(/kev null \(timeout\/gate\)|gate-down/.test(down.log), "log ghi Kev không trả lời (kev null / gate-down)");
  finish("HANDLER-LABEL");
}

// -------------------------------------------------------------- manifest-v3
async function modeManifestV3() {
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));
  const root = mkdtempSync(join(tmpdir(), "acc-kev-snap-"));
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"] });
    const kev = { p: 0.31, model: "kev-latest", threshold: 0.9, at: "2026-10-23T03:00:00.000Z" };
    s.ingest({ agent_id: "acc", group: "acc-group", messages: [{ text: "có kev", ts: "2026-10-23T03:00:00Z", kev }, { text: "không kev", ts: "2026-10-23T03:00:01Z" }] }, "Bearer k");
    await s.flush();
    const [snap] = readSnapshot(root);
    const byText = Object.fromEntries(snap.items.map((i) => [i.payload.text, i]));
    console.log(`manifest schemaVersion ${snap.manifest.schemaVersion} · ${snap.items.length} item`);
    check(snap.manifest.schemaVersion === 3, "manifest khai schemaVersion 3");
    check(JSON.stringify(byText["có kev"].meta.kev) === JSON.stringify(kev), "tin có kev: meta.kev nguyên vẹn trong raw");
    check(!("kev" in byText["không kev"].meta), "should-NOT-fire: tin không kev không bị gắn meta.kev giả");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  finish("MANIFEST-V3");
}

// ---------------------------------------------------------- import-versions
/** Snapshot giả hợp lệ (sha256 đúng) với schemaVersion tuỳ ý — chỉ để đo bước kiểm phiên bản. */
function fixtureSnapshot(root, version) {
  // Mốc đúng khuôn SNAPSHOT_TS_RE: từ PL1 (c666c4b9) importer bỏ thư mục sai khuôn TRƯỚC bước kiểm phiên bản,
  // tên cũ «acc-v<n>-<ms>» làm cả bốn ca rơi vào nhánh bỏ qua. Hậu tố -<v> giữ tên riêng từng bản.
  const id = `hanoi__zalo-agent__2026-10-23T000000-${version}`;
  const dir = join(root, id);
  mkdirSync(dir, { recursive: true });
  const gz = gzipSync(Buffer.from(JSON.stringify([])));
  writeFileSync(join(dir, "items-0000.json.gz"), gz);
  writeFileSync(
    join(dir, "manifest.json"),
    JSON.stringify({ schemaVersion: version, snapshotId: id, city: "hanoi", source: "zalo-agent", startedAt: "2026-10-23T00:00:00Z", finishedAt: "2026-10-23T00:00:01Z", itemCount: 0, files: [{ name: "items-0000.json.gz", sha256: sha256(gz), itemCount: 0 }] }),
  );
  return dir;
}

async function modeImportVersions() {
  const root = mkdtempSync(join(tmpdir(), "acc-kev-imp-"));
  const net = await import("node:net");
  const s = net.createServer();
  await new Promise((done) => s.listen(0, "127.0.0.1", done));
  const deadPort = s.address().port;
  await new Promise((done) => s.close(done));
  const u = "acc";
  try {
    for (const v of [1, 2, 3, 4]) {
      const dir = fixtureSnapshot(root, v);
      // DB trỏ cổng chết: phiên bản được nhận thì đi tiếp tới bước nối DB và hỏng ở đó — không ghi gì
      const r = spawnSync(process.execPath, [join(ROOT, "pipeline/import-airbnb.mjs"), dir], {
        cwd: join(ROOT, "pipeline"),
        env: { ...process.env, DATABASE_URL: `postgres://${u}:${u}@127.0.0.1:${deadPort}/${u}` },
        encoding: "utf8",
        timeout: 30_000,
      });
      const outAll = r.stdout + r.stderr;
      const rejected = /schemaVersion \d+ chưa hỗ trợ/.test(outAll);
      const passedCheck = /manifest ok:/.test(outAll);
      console.log(`schemaVersion ${v}: exit ${r.status} · ${rejected ? "bị từ chối" : passedCheck ? "qua kiểm phiên bản + sha256, dừng ở bước nối DB (cổng chết)" : outAll.trim().split("\n").at(-1)}`);
      if (v <= 3) check(passedCheck && !rejected, `v${v} được nhận`);
      else check(rejected && !passedCheck && r.status !== 0, "should-NOT-fire: v4 bị từ chối trước khi đọc dữ liệu");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  finish("IMPORT-VERSIONS");
}

// -------------------------------------------------------------- watchdog-l1
/** Chép NGUYÊN VĂN mẫu grep L1 từ watchdog (không chạy watchdog), áp lên handler.js thật và một bản cấy API gửi tin. */
function modeWatchdogL1() {
  const wd = readFileSync(join(ROOT, "scripts/zalo-watchdog.sh"), "utf8");
  const m = wd.match(/if grep -qiE "([^"]+)" "\$HANDLER"/);
  if (!m) {
    console.error("không tìm thấy dòng grep L1 trong zalo-watchdog.sh");
    process.exit(2);
  }
  const pattern = m[1];
  console.log(`mẫu L1 (nguyên văn watchdog): ${pattern}`);
  const real = spawnSync("grep", ["-qiE", pattern, HANDLER]);
  check(real.status === 1, "handler.js thật: L1 không khớp (không có API gửi tin) — watchdog không kill");
  const S = mkdtempSync(join(tmpdir(), "acc-kev-l1-"));
  try {
    for (const inject of ["await api.sendMessage(group, text);", "await reply(text);", "send-message"]) {
      const f = join(S, "handler.js");
      cpSync(HANDLER, f);
      appendFileSync(f, `\n${inject}\n`);
      const r = spawnSync("grep", ["-qiE", pattern, f]);
      check(r.status === 0, `đối chứng: bản cấy «${inject}» → L1 khớp`);
    }
  } finally {
    rmSync(S, { recursive: true, force: true });
  }
  finish("WATCHDOG-L1");
}

// ----------------------------------------------------------------- sourceid
async function modeSourceid() {
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));
  const root = mkdtempSync(join(tmpdir(), "acc-zc1-"));
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"] });
    const g = "acc-group-zc1";
    const ts = "2026-10-23T04:00:00Z";
    const img = (u) => [{ url: `https://f1.zdn.vn/${u}.jpg`, type: "photo" }];
    const post = (messages) => s.ingest({ agent_id: "acc", group: g, messages }, "Bearer k");
    const a = post([
      { text: "", ts, senderId: "s1", media: img("x") },
      { text: "", ts, senderId: "s2", media: img("x") }, // khác sender
      { text: "", ts, senderId: "s1", media: img("y") }, // khác URL
    ]);
    const dup = post([{ text: "", ts, senderId: "s1", media: img("x") }]); // y hệt tin 1
    const t1 = post([{ text: "bán nhà Cầu Giấy", ts, senderId: "s1", media: img("z") }]);
    const t2 = post([{ text: "bán nhà Cầu Giấy", ts, senderId: "s9" }]); // cùng chữ, khác sender, không ảnh
    console.log(`3 tin chỉ ảnh: ${JSON.stringify(a.body)} · lặp y hệt: ${JSON.stringify(dup.body)} · tin chữ: ${JSON.stringify(t1.body)} / ${JSON.stringify(t2.body)}`);
    await s.flush();
    const [snap] = readSnapshot(root);
    const ids = snap.items.map((i) => i.sourceId);
    check(a.body.accepted === 3 && a.body.duplicates === 0, "khác sender hoặc khác URL, cùng nhóm cùng ts → 3 tin đều được nhận");
    check(new Set(ids.slice(0, 3)).size === 3, "3 RawItem chỉ ảnh mang 3 sourceId khác nhau");
    check(dup.body.accepted === 0 && dup.body.duplicates === 1, "should-NOT-fire: tin chỉ ảnh lặp y hệt (cùng sender, cùng URL) vẫn bị khử trùng");
    const oldId = sha256(`${g}|${ts}|bán nhà Cầu Giấy`).slice(0, 32);
    const textItem = snap.items.find((i) => i.payload.text === "bán nhà Cầu Giấy");
    check(textItem?.sourceId === oldId, `tin có chữ (kèm ảnh) giữ nguyên id cũ sha256(group|ts|text) = ${oldId.slice(0, 12)}…`);
    check(t2.body.accepted === 0 && t2.body.duplicates === 1, "tin chữ cùng nội dung khác sender vẫn trùng như trước (công thức cũ không đổi)");
    check(snap.items.length === 4, `snapshot có 4 item (3 chỉ ảnh + 1 tin chữ), được ${snap.items.length}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  finish("SOURCEID");
}

// ------------------------------------------------------------ stg-roundtrip
async function modeStgRoundtrip() {
  const require = createRequire(join(ROOT, "pipeline/package.json"));
  const pg = require("pg");
  const u = "oneinvest";
  const dbUrl = process.env.DATABASE_URL ?? `postgres://${u}:${u}@localhost:5433/${u}`;
  const { createAgentServer } = await import(join(COLLECTOR, "dist/api/server.js"));
  const root = mkdtempSync(join(tmpdir(), "acc-zc1-stg-"));
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  let snapshotId = null;
  try {
    const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k"] });
    const g = `acc-zc1-${Date.now()}`;
    const ts = "2026-10-23T04:00:00Z";
    s.ingest({ agent_id: "acc", group: g, messages: [
      { text: "", ts, senderId: "s1", media: [{ url: "https://f1.zdn.vn/a.jpg", type: "photo" }] },
      { text: "", ts, senderId: "s2", media: [{ url: "https://f1.zdn.vn/b.jpg", type: "photo" }] },
    ] }, "Bearer k");
    const m = await s.flush({ skipMedia: true }); // không tải ảnh thật
    snapshotId = m.snapshotId;
    const [snap] = readSnapshot(root);
    const ids = snap.items.map((i) => i.sourceId);
    // AN TOÀN: snapshot_id và post_id không được trùng dữ liệu thật
    const clash1 = await client.query("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [snapshotId]);
    const clash2 = await client.query("SELECT count(*)::int n FROM stg_zalo_posts WHERE post_id = ANY($1)", [ids]);
    if (clash1.rows[0].n || clash2.rows[0].n) {
      console.error("AN TOÀN: snapshot_id hoặc post_id đã có trong DB — bỏ chạy, không nạp");
      snapshotId = null;
      process.exit(2);
    }
    const r = spawnSync(process.execPath, [join(ROOT, "pipeline/import-airbnb.mjs"), snap.dir], { cwd: join(ROOT, "pipeline"), env: { ...process.env, DATABASE_URL: dbUrl }, encoding: "utf8" });
    console.log(`nạp: exit ${r.status} · ${(r.stdout.trim().split("\n").at(-1) ?? "").slice(0, 160)}`);
    const rows = await client.query("SELECT post_id, sender_id FROM stg_zalo_posts WHERE snapshot_id = $1 ORDER BY sender_id", [snapshotId]);
    console.log(`stg_zalo_posts của snapshot: ${rows.rows.length} dòng · sender [${rows.rows.map((x) => x.sender_id).join(", ")}]`);
    check(r.status === 0, "import-airbnb nạp snapshot v3 không lỗi");
    check(ids.length === 2 && new Set(ids).size === 2, "hai event ảnh cùng nhóm cùng ts → hai raw item");
    check(rows.rows.length === 2 && new Set(rows.rows.map((x) => x.post_id)).size === 2, "→ hai dòng stg_zalo_posts khác post_id");
  } finally {
    if (snapshotId) {
      const del = await client.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = $1", [snapshotId]);
      const left = await client.query("SELECT count(*)::int n FROM stg_zalo_posts WHERE snapshot_id = $1", [snapshotId]);
      console.log(`dọn: xoá ${del.rowCount} snapshot · còn ${left.rows[0].n} dòng stg của snapshot giả`);
      check(left.rows[0].n === 0, "dọn sạch dữ liệu giả");
    }
    await client.end();
    rmSync(root, { recursive: true, force: true });
  }
  finish("STG-ROUNDTRIP");
}

const mode = process.argv[2];
const modes = {
  "handler-label": modeHandlerLabel,
  "manifest-v3": modeManifestV3,
  "import-versions": modeImportVersions,
  "watchdog-l1": modeWatchdogL1,
  sourceid: modeSourceid,
  "stg-roundtrip": modeStgRoundtrip,
};
if (!modes[mode]) {
  console.error(`dùng: node scripts/kev-nhan/acceptance.mjs <${Object.keys(modes).join("|")}>`);
  process.exit(2);
}
await modes[mode]();
