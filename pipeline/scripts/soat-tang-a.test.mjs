// node --test pipeline/scripts/soat-tang-a.test.mjs (cd pipeline && npm test)
// NT2 `soat-tang-a-moi-duong-len-cloud`: MỘT bộ soát tầng A (pipeline/lib/tier-a-guard.mjs) cho sync-cloud và push-ops-facts.
// Tên thật lấy lúc chạy từ db/migrations — tệp này không chứa tên. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { findSourceNames, fold } from "../lib/mask-source-names.mjs";
import { guardValues } from "../lib/tier-a-guard.mjs";
import { scanSourceNames } from "../sync-cloud.mjs";
import { sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs";
import { captureOpsFacts, mutantPush, payloadLeaks } from "./capture-ops-facts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SEEDS = sourceRegistrySeeds();
const ENTRIES = SEEDS.map(({ code, realName }) => ({ code, realName }));
const name = (code) => SEEDS.find((s) => s.code === code).realName;
const FORMS = {
  full: (n) => n, upper: (n) => n.toUpperCase(), fold: (n) => fold(n),
  joined: (n) => fold(n).replace(/[\s.\-_/]+/g, ""), suffix: (n) => fold(n).replace(/[\s.\-_/]+/g, "") + "user",
  first: (n) => n.split(/\s+/)[0],
};
const expand = (s) => s.replace(/\{(S0\d):(\w+)\}/g, (_, code, form) => FORMS[form](name(code)));

describe("NT2-AC-6 một bộ soát", () => {
  test("NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca", () => {
    const { cases } = JSON.parse(readFileSync(path.join(HERE, "mask-source-names.cases.json"), "utf8"));
    const withNames = cases.filter((c) => !c.names);
    assert.ok(withNames.length >= 9, "bảng ca phải có đủ ca viết trước");
    const tokens = SEEDS.map((s) => s.realName);
    let hits = 0;
    for (const c of withNames) {
      const text = expand(c.in);
      const viaSync = scanSourceNames(text, tokens) !== null;
      const viaGuard = guardValues(text, ENTRIES).length > 0;
      assert.equal(viaSync, viaGuard, `hai đường lệch ở ca «${c.ten}»`);
      if (viaGuard) hits++;
    }
    assert.ok(hits >= 6 && hits < withNames.length, `bảng ca phải có cả ca trúng lẫn ca không trúng (trúng ${hits}/${withNames.length})`);
  });
});

// ---- AC-1…AC-5, AC-10: push-ops-facts THẬT (và bản sao đột biến) chạy qua máy chủ thu tạm ----
const LOGS = () => ({
  "airdna-daily.log": `2026-10-24T19:05:00 bắt đầu\n2026-10-24T19:06:00 ${name("S02")} rotation xong 6 market\n`,
  "launchd-smoke.log": `2026-10-24T20:00:00 smoke ${FORMS.joined(name("S01"))} ok\n`,
  "weekly-20261024.log": `2026-10-24T19:30:00 collect ${FORMS.fold(name("S06"))} xong\n`,
  "cloud-sync.log": `2026-10-24T19:45:00 heartbeat ${FORMS.suffix(name("S03"))} ok\n`,
});
const TIER_C = [/^zaloGroups\[\d+\]\.name$/];
const factsLines = (stderr) => stderr.split("\n").filter((l) => l.startsWith("FACTS CHẶN"));
const namesIn = (text) => findSourceNames(text, ENTRIES);
// Khoá JSON của bản tin (zaloGroups…) đã chốt giữ nguyên (ON7, ngoài phạm vi) — soát tên trên đầu ra trừ đường JSON của dòng chặn.
const outputNames = (text) => namesIn(text.replace(/^(FACTS CHẶN \[tầng A\]) \S+/gm, "$1"));
// Bản sao cấy giá trị: đoạn mã trong NT2_CAY chạy trên payload ngay trước bộ soát, N = tên thật của S02.
const ANCHOR = "  // NT2: bộ soát tầng A chung";
const cayCopy = () => mutantPush("cay.mjs", (s) => s.replace(ANCHOR,
  `  new Function("payload", "N", process.env.NT2_CAY)(payload, REG.names.find((n) => n.code === "S02").realName);\n${ANCHOR}`));

function assertBlocked(r, wantLine) {
  assert.notEqual(r.code, 0, "bản tin còn tên phải thoát ≠ 0");
  assert.equal(r.posts, 0, "máy chủ thu không được nhận POST nào");
  assert.ok(factsLines(r.stderr).includes(wantLine), `thiếu dòng «${wantLine}»: ${factsLines(r.stderr).join(" | ")}`);
  assert.deepEqual(outputNames(r.stderr + r.stdout), [], "đầu ra không được chứa tên nguồn thật");
}

describe("NT2-AC-1…AC-5 push-ops-facts qua bộ soát", () => {
  test("NT2-AC-1 bản tin lành → thoát 0, máy chủ thu nhận đúng một POST", async () => {
    const r = await captureOpsFacts({ logs: LOGS() });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1, "bản tin lành phải đi đúng một POST");
    assert.deepEqual(factsLines(r.stderr), [], "bản tin lành không được có dòng chặn");
    assert.deepEqual(payloadLeaks(r.payload, ENTRIES, TIER_C), [], "bản tin lành còn tên nguồn thật");
  });

  test("NT2-AC-2 bản sao bỏ bộ che → thoát ≠0, 0 POST, dòng FACTS CHẶN [tầng A] jobs[0].lastLine S02, không in tên", async () => {
    const f = mutantPush("bo-che.mjs", (s) => s.replace("lastLine: maskSourceNames(j.lastLine, REG.names)", "lastLine: j.lastLine"));
    assertBlocked(await captureOpsFacts({ script: f, logs: LOGS() }), "FACTS CHẶN [tầng A] jobs[0].lastLine S02");
  });

  // Ma trận viết trước: mỗi khoá cấp một của bản tin một ca, cộng một chuỗi lồng sâu và trường anh em cạnh đường miễn.
  const MATRIX = [
    { key: "pushedAt", code: "payload.pushedAt = N;", path: "pushedAt" },
    { key: "funnel", code: "payload.funnel.cay = N;", path: "funnel.cay" },
    { key: "health", code: "payload.health.lastHeartbeatAt = N;", path: "health.lastHeartbeatAt" },
    { key: "jobs", code: "payload.jobs[3].label = N;", path: "jobs[3].label" },
    { key: "sourceRuns", code: "payload.sourceRuns.unshift({ code: \"S09\", label_vi: N });", path: "sourceRuns[0].label_vi" },
    { key: "rotation", code: "payload.rotation.cay = N;", path: "rotation.cay" },
    { key: "zaloGroups", code: "payload.zaloGroups.unshift({ name: \"nhóm thử\", ownerAccount: N });", path: "zaloGroups[0].ownerAccount" },
    { key: "zaloFlow", code: "payload.zaloFlow[\"2026-10-24\"] = { ghi: N };", path: "zaloFlow.2026-10-24.ghi" },
    { key: "zaloAccounts", code: "payload.zaloAccounts.unshift({ accountId: \"x\", name: null, profile: N });", path: "zaloAccounts[0].profile" },
    { key: null, code: "payload.rotation.next = [{ id: \"1\", meta: { tags: [\"a\", N] } }];", path: "rotation.next[0].meta.tags[1]" },
  ];
  test("NT2-AC-3 ma trận viết trước: mỗi khoá cấp một + một chuỗi lồng sâu + trường anh em cạnh đường miễn → mỗi bản thoát ≠0, 0 POST, dòng chặn nêu đúng đường JSON viết trước", async () => {
    const healthy = await captureOpsFacts({ logs: LOGS() });
    assert.equal(healthy.code, 0, healthy.stderr.slice(0, 800));
    const healthyKeys = Object.keys(healthy.payload).sort();
    assert.deepEqual(MATRIX.filter((m) => m.key).map((m) => m.key).sort(), healthyKeys, "ma trận phải phủ ĐÚNG mọi khoá cấp một của bản tin");
    const f = cayCopy();
    for (const m of MATRIX) {
      const r = await captureOpsFacts({ script: f, logs: LOGS(), env: { NT2_CAY: m.code } });
      assertBlocked(r, `FACTS CHẶN [tầng A] ${m.path} S02`);
    }
  });

  test("NT2-AC-3 tên trong zaloGroups[0].name (tầng C) → không chặn", async () => {
    const r = await captureOpsFacts({ script: cayCopy(), logs: LOGS(), env: { NT2_CAY: "payload.zaloGroups.unshift({ name: N });" } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1, "tên nhóm S03 là tầng C — bản tin phải đi");
    assert.equal(namesIn(r.payload.zaloGroups[0].name).length, 1, "ca phải thật sự mang tên trong zaloGroups[0].name");
  });

  const ACCOUNTS = JSON.stringify({ channels: { zalouser: { accounts: {
    default: { name: "Tài khoản chính", groups: { g1: { enabled: true } } },
    phu: { name: "Tài khoản phụ", profile: "phu", groups: {} },
  } } } });
  test("NT2-AC-4 cấu hình tài khoản có tên → bản tin gửi zaloAccounts[i].name null", async () => {
    const r = await captureOpsFacts({ logs: LOGS(), home: { ".openclaw/openclaw.json": ACCOUNTS } });
    assert.equal(r.code, 0, r.stderr.slice(0, 800));
    assert.equal(r.posts, 1);
    assert.deepEqual(r.payload.zaloAccounts.map((a) => a.accountId), ["default", "phu"], "phải dựng đủ hai tài khoản từ cấu hình");
    assert.deepEqual(r.payload.zaloAccounts.map((a) => a.name), [null, null], "tên tài khoản thu là tầng A — gửi null");
  });

  test("NT2-AC-4 bản sao gửi tên tài khoản → chặn, nêu zaloAccounts[0].name", async () => {
    const f = mutantPush("ten-tk.mjs", (s) => s.replace("name: null, profile:", "name: z.accounts?.[id]?.name ?? null, profile:"));
    const r = await captureOpsFacts({ script: f, logs: LOGS(), home: { ".openclaw/openclaw.json": ACCOUNTS } });
    assertBlocked(r, "FACTS CHẶN [tầng A] zaloAccounts[0].name tên tài khoản thu");
    assert.ok(!r.stderr.includes("Tài khoản chính"), "dòng chặn không được in tên tài khoản");
  });

  test("NT2-AC-5 không đọc được source_registry → chặn, 0 POST, dòng nói không có danh sách tên", async () => {
    const f = mutantPush("reg-rong.mjs", (s) => s.replace(/REG\.names = reg\.filter\([^\n]+;/, "REG.names = [];"));
    const r = await captureOpsFacts({ script: f, logs: LOGS() });
    assert.notEqual(r.code, 0);
    assert.equal(r.posts, 0, "không có danh sách tên thì không được gửi");
    assert.ok(factsLines(r.stderr).some((l) => l.includes("không có danh sách tên để soát")), r.stderr.slice(0, 800));
  });
});

describe("NT2-AC-10 bản tin thật, chế độ khô", () => {
  // log + cấu hình thật của máy thu: HOME thật, cây log ở checkout chính (launchd ghi ở đó, không ở worktree)
  const mainRoot = () => path.dirname(execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: HERE, encoding: "utf8" }).trim());
  test("NT2-AC-10 bản tin dựng từ log và cấu hình thật (chế độ khô, không gửi) → 0 chỗ trúng", async () => {
    const r = await captureOpsFacts({ args: ["--kho"], env: { HOME: homedir(), ONEINVEST_ROOT: mainRoot() } });
    assert.equal(r.code, 0, factsLines(r.stderr).join(" | ") || r.stderr.slice(0, 800));
    assert.equal(r.posts, 0, "chế độ khô không được gửi");
    assert.match(r.stdout, /ops-facts khô: sạch, 0 chỗ chặn/);
  });
  test("NT2-AC-10 chiều đỏ: chế độ khô với bản sao cấy tên → thoát ≠0, chỉ in đường JSON + mã S0x", async () => {
    const r = await captureOpsFacts({ script: cayCopy(), args: ["--kho"], env: { HOME: homedir(), ONEINVEST_ROOT: mainRoot(), NT2_CAY: "payload.funnel.cay = N;" } });
    assertBlocked(r, "FACTS CHẶN [tầng A] funnel.cay S02");
    assert.match(r.stdout, /ops-facts khô: \d+ chỗ chặn/);
  });
});
