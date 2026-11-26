// kev2-ops-local.test.mjs — hồ sơ bo-lop-kev-o-ops-va-audit (KEV2): phần không cần DB. Bên ghi khối khoá an toàn
// (readLockdown), lưới Máy móc của bản tin (scheduler của push-ops-facts), phễu của bản tin (parseLog), khối F của
// audit-all.sh, và phép quét chặn chuỗi Kev quay lại. Mỗi ca có bản sao phá ghim thông điệp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.join(import.meta.dirname, "..");
const tam = (p) => mkdtempSync(path.join(tmpdir(), `kev2-${p}-`));

/** Bản sao `rel` (cùng thư mục với bản thật để import tương đối còn đúng) đã thay `cu` bằng `moi`. */
async function banPha(rel, cu, moi) {
  const goc = readFileSync(path.join(ROOT, rel), "utf8");
  assert.ok(goc.includes(cu), `mỏ neo «${cu.slice(0, 50)}» không còn trong ${rel} — thước mất mỏ neo`);
  const ban = path.join(ROOT, path.dirname(rel), `.kev2-pha-${process.pid}-${path.basename(rel)}`);
  writeFileSync(ban, goc.replace(cu, moi));
  try { return await import(pathToFileURL(ban).href + `?t=${Date.now()}`); } finally { (await import("node:fs")).rmSync(ban, { force: true }); }
}

/** Bảy dòng viết trước — thứ tự và mô tả, đối chiếu bản app ở ca AC-1-GHI. */
const BAY_DONG = [
  ["L1", "Chỉ đọc — không có API gửi tin"],
  ["L2", "Không gắn máy trả lời vào kênh nào"],
  ["L3", "Tắt kênh tài khoản chính thức, nhóm phải nhắc tên mới trả lời"],
  ["L4", "Bộ canh 5′ đang chạy"],
  ["L4b", "Lượt máy tự trả lời hôm nay = 0"],
  ["Hạ tầng", "OpenClaw đang chạy"],
  ["Hạ tầng", "Cổng nhận tin :9210"],
];

test("KEV2-AC-1-GHI readLockdown trả bảy dòng khớp LOCKDOWN_LAYERS của app; dò :9210, không dò 8009", async () => {
  const { readLockdown } = await import(path.join(ROOT, "scripts/lib/ops-local.mjs"));
  const goi = [];
  const probe = async (url) => { goi.push(url); return true; };
  const r = await readLockdown({ root: tam("ld"), agentLogDir: tam("ag"), probe, pgrep: async () => true });
  assert.deepEqual(r.layers.map((l) => [l.layer, l.desc]), BAY_DONG);
  // Bản app (nguồn chữ của LOCKDOWN_LAYERS) đọc thẳng từ tệp nguồn — bên ghi và bên đọc một danh sách.
  const app = readFileSync(path.join(ROOT, "app/src/lib/ops-queries.ts"), "utf8");
  const khoi = app.slice(app.indexOf("export const LOCKDOWN_LAYERS"), app.indexOf("];", app.indexOf("export const LOCKDOWN_LAYERS")));
  const appDong = [...khoi.matchAll(/\{ layer: "([^"]+)", desc: "([^"]+)" \}/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(appDong, BAY_DONG, "bên ghi lệch bên đọc");
  assert.ok(goi.some((u) => u.includes("127.0.0.1:9210")), `đối chứng dương: phải thấy lời dò :9210 — ${goi}`);
  assert.ok(!goi.some((u) => u.includes("8009")), `không được dò 8009: ${goi}`);
  // Chiều đỏ: bản sao còn dòng Kev → ghim «bên ghi lệch bên đọc».
  const pha = await banPha("scripts/lib/ops-local.mjs",
    '{ layer: "Hạ tầng", desc: "Cổng nhận tin :9210", ok: collectorUp },',
    '{ layer: "Hạ tầng", desc: "Cổng " + "Kev :8009", ok: false }, { layer: "Hạ tầng", desc: "Cổng nhận tin :9210", ok: collectorUp },');
  const rp = await pha.readLockdown({ root: tam("ld"), agentLogDir: tam("ag"), probe, pgrep: async () => true });
  assert.throws(() => assert.deepEqual(rp.layers.map((l) => [l.layer, l.desc]), appDong, "bên ghi lệch bên đọc"), /bên ghi lệch bên đọc/);
});

test("KEV2-AC-3 lưới Máy móc của bản tin (scheduler của push-ops-facts) không hàng kev, không chuỗi Kev/8009", async () => {
  const { scheduler } = await import(path.join(ROOT, "pipeline/push-ops-facts.mjs"));
  const root = tam("sch");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  const goi = [];
  const jobs = await scheduler({ root, probe: async (u) => { goi.push(u); return "yes"; } });
  assert.deepEqual(jobs.map((j) => j.id), ["s02-daily", "s01-weekly", "s01-smoke", "collector-api", "cloud-sync"]);
  assert.doesNotMatch(JSON.stringify(jobs), /Kev|8009/);
  assert.deepEqual(goi, ["http://127.0.0.1:9210/"]);
  const pha = await banPha("pipeline/push-ops-facts.mjs",
    '    { id: "cloud-sync",',
    '    { id: "kev", label: "Kev gate :8009", schedule: "KeepAlive", alive: "no", lastLogAt: null, lastLine: null },\n    { id: "cloud-sync",');
  const jp = await pha.scheduler({ root, probe: async () => "yes" });
  const ghim = (j) => { if (/Kev|8009/.test(JSON.stringify(j))) throw new Error("bản tin còn Kev"); };
  ghim(jobs);
  assert.throws(() => ghim(jp), /bản tin còn Kev/);
});

/** Nhật ký hook dựng từ khuôn dòng log rút từ collector/openclaw/handler.js (đọc nguồn, không viết tay chữ log). */
function nhatKyTuHandler() {
  const h = readFileSync(path.join(ROOT, "collector/openclaw/handler.js"), "utf8");
  const khuon = (re, ten) => { const m = h.match(re); assert.ok(m, `handler.js không còn dòng log «${ten}» — thước mất mỏ neo`); return m[1]; };
  const kevNull = khuon(/log\(`(kev null \(timeout\/gate\)) group=/, "kev null");
  const post = khuon(/log\(`(post) \$\{r\.status\}/, "post");
  const skip = khuon(/log\(`(skip \(rỗng\)) group=/, "skip (rỗng)");
  const t = (phut) => new Date(Date.now() - phut * 60_000).toISOString();
  const dong = [];
  // Ma trận viết trước: 3 tin đi đủ (mỗi tin một dòng kev null + một dòng post 202), 1 tin rỗng (skip), 1 heartbeat.
  for (let i = 0; i < 3; i++) {
    dong.push(`${t(30 - i)} ${kevNull} group=Nhóm A account=acc-1`);
    dong.push(`${t(30 - i)} ${post} 202 {"accepted":1} group=Nhóm A p=null account=acc-1 by=x`);
  }
  dong.push(`${t(10)} ${skip} group=Nhóm A account=acc-1`);
  dong.push(`${t(5)} heartbeat up`);
  return dong.join("\n") + "\n";
}
const MONG = { messages: 4, passed: 3, skipped: 1, accepted: 3 };

test("KEV2-AC-6-GHI parseLog của bản tin không đếm dòng kev null; khớp số với bộ đếm của app", async () => {
  const { parseLog } = await import(path.join(ROOT, "pipeline/lib/ops-flow.mjs"));
  const log = nhatKyTuHandler();
  const { funnel, groups } = parseLog(log);
  const lay = (b) => ({ messages: b.messages, passed: b.passed, skipped: b.skipped, accepted: b.accepted });
  assert.deepEqual(lay(funnel.last7), MONG);
  assert.equal([...groups.values()].find((g) => g.name === "Nhóm A")?.seen, 4, "số tin theo nhóm đếm đôi");
  const pha = await banPha("pipeline/lib/ops-flow.mjs", "    if (/ kev null /.test(line)) continue;\n", "");
  const ghim = (b) => { if (b.messages !== MONG.messages) throw new Error(`bản tin đếm đôi: ${b.messages}`); };
  ghim(funnel.last7);
  assert.throws(() => ghim(pha.parseLog(log).funnel.last7), /bản tin đếm đôi/);
});

test("KEV2-AC-7 khối F của audit-all chỉ dò :9210 (sống → PASS, chết → FAIL), không dò 8009", () => {
  const sh = readFileSync(path.join(ROOT, "scripts/audit-all.sh"), "utf8");
  const i = sh.indexOf("for svc in");
  assert.ok(i > 0, "audit-all.sh không còn vòng dò dịch vụ");
  const khoi = sh.slice(i, sh.indexOf("\ndone", i) + 5);
  const chay = (ma, khoiChay = khoi) => {
    const bin = tam("bin");
    const log = path.join(bin, "goi.log");
    writeFileSync(path.join(bin, "curl"), `#!/bin/sh\nfor a; do last=$a; done\necho "$last" >> ${log}\nprintf '%s' ${ma}\n`);
    chmodSync(path.join(bin, "curl"), 0o755);
    const r = spawnSync("bash", ["-c", `pass() { echo "PASS $1"; }; fail() { echo "FAIL $1"; }\n${khoiChay}`],
      { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
    return { out: r.stdout, goi: readFileSync(log, "utf8").trim().split("\n") };
  };
  const song = chay("200");
  assert.deepEqual(song.goi, ["http://127.0.0.1:9210/"]);
  assert.match(song.out, /^PASS Service :9210 sống$/m);
  assert.match(chay("000").out, /^FAIL Service :9210 chết$/m);
  const ghim = (g) => { if (g.some((u) => u.includes("8009"))) throw new Error("audit-all còn dò :8009"); };
  ghim(song.goi);
  assert.throws(() => ghim(chay("200", khoi.replace('for svc in ":9210"', 'for svc in ":8009" ":9210"')).goi), /audit-all còn dò :8009/);
});

const TEP_QUET = [
  "app/src/lib/ops-queries.ts", "app/src/lib/ops-cloud.ts", "app/src/lib/collections-queries.ts",
  "app/src/components/ops/collections-tables.tsx", "scripts/lib/ops-local.mjs", "scripts/audit-all.sh",
  "pipeline/push-ops-facts.mjs", "pipeline/lib/ops-flow.mjs",
];
const KHUON = /127\.0\.0\.1:8009|Cổng Kev|Kev gate|kevUp/;
function quet(nguon) {
  const bad = [];
  for (const [tep, text] of nguon) if (KHUON.test(text)) bad.push(tep);
  return bad;
}
test("KEV2-AC-8 các tệp của vùng không còn chuỗi Kev (127.0.0.1:8009, Cổng Kev, Kev gate, kevUp)", () => {
  const dir = path.join(ROOT, "app/src/components/ops/collections");
  const r = spawnSync("git", ["-C", ROOT, "ls-files", dir], { encoding: "utf8" });
  const tep = [...TEP_QUET, ...r.stdout.split("\n").filter(Boolean)];
  assert.ok(tep.length >= 9, `quét quá ít tệp (${tep.length}) — danh sách hỏng`);
  const nguon = tep.map((t) => [t, readFileSync(path.join(ROOT, t), "utf8")]);
  assert.deepEqual(quet(nguon), []);
  // Chiều đỏ: chèn lại một chuỗi vào bản sao một tệp → gọi tên tệp.
  const pha = nguon.map(([t, s]) => [t, t === "app/src/lib/ops-cloud.ts" ? s + '\n// "Cổng Kev :8009"\n' : s]);
  assert.deepEqual(quet(pha), ["app/src/lib/ops-cloud.ts"]);
});
