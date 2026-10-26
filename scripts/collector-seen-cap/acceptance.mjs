#!/usr/bin/env node
/**
 * Eval máy cho hồ sơ collector-seen-cap (2510-2 — flush() không còn lặp vô hạn khi một lượt có hơn 5000 id mới).
 *
 *   node scripts/collector-seen-cap/acceptance.mjs <flush-6000|hai-luot|khoi-dong-lai|tran-lo>
 *
 * AN TOÀN: gọi createAgentServer() của bản build (collector/dist) với snapshotRoot + stateDir trong thư mục tạm;
 * tran-lo mở HTTP trên cổng ngẫu nhiên 127.0.0.1. Không chạm :9210, không ghi DB, không gọi mạng ngoài.
 * Mỗi chế độ chạy trong TIẾN TRÌNH CON có timeout: nếu flush lặp vô hạn (lỗi cũ) thì tiến trình bị giết và eval đỏ,
 * thay vì treo cả lượt chấm. Cần `cd collector && npm run build` trước.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SERVER = pathToFileURL(join(ROOT, "collector/dist/api/server.js")).href;
const SELF = fileURLToPath(import.meta.url);

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

const msgs = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => ({ text: `tin ${from + i}`, ts: `2026-10-25T00:00:${String((from + i) % 60).padStart(2, "0")}Z`, senderId: "s" }));
async function server(root, stateDir, extra = {}) {
  const { createAgentServer } = await import(SERVER);
  return createAgentServer({ snapshotRoot: root, stateDir, city: "hanoi", keys: ["k"], ...extra });
}
const ingest = (s, list) => {
  let acc = 0, dup = 0;
  for (let i = 0; i < list.length; i += 500) {
    const r = s.ingest({ agent_id: "acc", group: "acc-g", messages: list.slice(i, i + 500) }, "Bearer k");
    acc += r.body.accepted; dup += r.body.duplicates;
  }
  return { acc, dup };
};
const stateIds = (stateDir) => JSON.parse(readFileSync(join(stateDir, "agent-seen.json"), "utf8"));

// ---------------------------------------------------------------- các ca (chạy trong tiến trình con)
const CASES = {
  // AC-1: một lượt flush với 6000 id mới kết thúc nhanh, state giữ đúng 5000 id mới nhất
  async "flush-6000"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    try {
      const s = await server(join(T, "snap"), join(T, "state"));
      const r = ingest(s, msgs(1, 6000));
      check(r.acc === 6000 && r.dup === 0, `nhận đủ 6000 tin mới, được ${r.acc}/${r.dup}`);
      const t0 = Date.now();
      await s.flush({ skipMedia: true });
      const ms = Date.now() - t0;
      check(ms < 5000, `flush 6000 id kết thúc trong ${ms} ms (< 5000)`);
      const ids = stateIds(join(T, "state"));
      check(ids.length === 5000, `tệp state giữ đúng 5000 id, được ${ids.length}`);
      check(new Set(ids).size === ids.length, "should-NOT-fire: state không có id trùng");
      const again = ingest(s, msgs(1001, 6000));
      check(again.dup === 5000 && again.acc === 0, `5000 tin mới nhất gửi lại → đều trùng, được dup ${again.dup}`);
      const old = ingest(s, msgs(1, 1000));
      check(old.acc === 1000, `1000 tin cũ nhất đã bị đẩy khỏi bộ nhớ khử trùng → nhận lại (FIFO), được ${old.acc}`);
    } finally {
      rmSync(T, { recursive: true, force: true });
    }
  },
  // AC-2: hai lượt 4000 + 2000 — cap theo thứ tự ingest, không đếm trùng
  async "hai-luot"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    try {
      const s = await server(join(T, "snap"), join(T, "state"));
      ingest(s, msgs(1, 4000));
      await s.flush({ skipMedia: true });
      check(stateIds(join(T, "state")).length === 4000, "sau lượt 1 (4000): state 4000 id, không bị xoá bớt");
      ingest(s, msgs(4001, 6000));
      await s.flush({ skipMedia: true });
      const ids = stateIds(join(T, "state"));
      check(ids.length === 5000 && ids[0] === ids.find(Boolean), `sau lượt 2 (+2000): state đúng 5000 id, được ${ids.length}`);
      const recent = ingest(s, msgs(1001, 6000));
      check(recent.dup === 5000, `id 1001–6000 vẫn trùng, được ${recent.dup}`);
      const below = ingest(s, msgs(4000, 4000));
      check(below.dup === 1, "should-NOT-fire: id 4000 (ngay trong cửa sổ 5000) vẫn bị khử trùng");
    } finally {
      rmSync(T, { recursive: true, force: true });
    }
  },
  // AC-3: khởi động lại nạp state — khử trùng sống qua restart, vẫn cap đúng
  async "khoi-dong-lai"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    try {
      const s1 = await server(join(T, "snap"), join(T, "state"));
      ingest(s1, msgs(1, 5500));
      await s1.flush({ skipMedia: true });
      const s2 = await server(join(T, "snap"), join(T, "state"));
      const r = ingest(s2, msgs(501, 5500));
      check(r.dup === 5000, `sau khởi động lại: 5000 id mới nhất vẫn trùng, được ${r.dup}`);
      const n = ingest(s2, msgs(5501, 5600));
      await s2.flush({ skipMedia: true });
      check(n.acc === 100 && stateIds(join(T, "state")).length === 5000, "tin mới sau restart được nhận, state vẫn đúng 5000 id");
    } finally {
      rmSync(T, { recursive: true, force: true });
    }
  },
  // AC-4: trần lô HTTP 1000 tin → 413 rõ ràng, không đệm gì; 1000 tin → 202
  async "tran-lo"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    const s = await server(join(T, "snap"), join(T, "state"));
    const http = createServer((req, res) => s.handle(req, res).catch(() => {}));
    await new Promise((d) => http.listen(0, "127.0.0.1", d));
    const port = http.address().port;
    const post = (list) => fetch(`http://127.0.0.1:${port}/agent-report`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer k" }, body: JSON.stringify({ agent_id: "acc", group: "acc-g", messages: list }) });
    try {
      let r = await post(msgs(1, 1001));
      const body = await r.json();
      check(r.status === 413 && /1001/.test(body.error) && /1000/.test(body.error), `1001 tin → 413 kèm số và trần (${r.status} ${JSON.stringify(body).slice(0, 80)})`);
      check(s.stats().buffered === 0, "lô bị từ chối không vào bộ đệm");
      r = await post(msgs(1, 1000));
      check(r.status === 202, `should-NOT-fire: đúng 1000 tin → 202, được ${r.status}`);
      check(s.stats().accepted === 1000, `1000 tin được nhận (có thể đã tự flush), được ${s.stats().accepted}`);
    } finally {
      http.close();
      rmSync(T, { recursive: true, force: true });
    }
  },
  // AC-6 (vòng 2): tệp state cũ có id trùng → nạp bỏ trùng, khử trùng không lệch qua các lượt cắt
  async "state-trung"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    try {
      const { mkdirSync, writeFileSync } = await import("node:fs");
      const { createHash } = await import("node:crypto");
      mkdirSync(join(T, "state"), { recursive: true });
      // id thật = sourceId do collector tính cho msgs(); dựng state cũ: 4990 id + 10 id lặp ở cuối (giống bản cũ ghi trùng)
      const s0 = await server(join(T, "snap0"), join(T, "state0"));
      ingest(s0, msgs(1, 4990));
      await s0.flush({ skipMedia: true });
      const base = JSON.parse(readFileSync(join(T, "state0", "agent-seen.json"), "utf8"));
      const dupState = [...base, ...base.slice(-10)];
      writeFileSync(join(T, "state", "agent-seen.json"), JSON.stringify(dupState));
      const s = await server(join(T, "snap"), join(T, "state"));
      // đẩy qua nhiều lượt cắt: thêm 20 id mới mỗi lượt, 3 lượt
      for (const [a, b] of [[10001, 10020], [10021, 10040], [10041, 10060]]) {
        ingest(s, msgs(a, b));
        await s.flush({ skipMedia: true });
      }
      const ids = stateIds(join(T, "state"));
      check(new Set(ids).size === ids.length, `state sau các lượt cắt không còn id trùng (${ids.length} phần tử, ${new Set(ids).size} id)`);
      const lastTen = ingest(s, msgs(4981, 4990));
      check(lastTen.dup === 10, `10 id từng bị trùng trong state cũ vẫn bị khử trùng khi gửi lại, được dup ${lastTen.dup}`);
    } finally {
      rmSync(T, { recursive: true, force: true });
    }
  },
  // AC-7 (vòng 2): thân null / không phải object → 400, không 500
  async "body-null"() {
    const T = mkdtempSync(join(tmpdir(), "acc-seen-"));
    const s = await server(join(T, "snap"), join(T, "state"));
    const http = createServer((req, res) => s.handle(req, res).catch(() => { res.writeHead(500); res.end("{}"); }));
    await new Promise((d) => http.listen(0, "127.0.0.1", d));
    const port = http.address().port;
    try {
      for (const [name, raw] of [["null", "null"], ["số", "42"], ["chuỗi", "\"x\""], ["mảng", "[]"]]) {
        const r = await fetch(`http://127.0.0.1:${port}/agent-report`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer k" }, body: raw });
        check(r.status === 400, `thân ${name} → 400, được ${r.status}`);
      }
      const ok = await fetch(`http://127.0.0.1:${port}/agent-report`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer k" }, body: JSON.stringify({ agent_id: "acc", group: "g", messages: msgs(1, 1) }) });
      check(ok.status === 202, "should-NOT-fire: thân hợp lệ vẫn 202");
    } finally {
      http.close();
      rmSync(T, { recursive: true, force: true });
    }
  },
};

const mode = process.argv[2];
if (process.argv[3] === "--child") {
  await CASES[mode]();
  finish(mode.toUpperCase());
} else {
  if (!CASES[mode]) {
    console.error(`dùng: node scripts/collector-seen-cap/acceptance.mjs <${Object.keys(CASES).join("|")}>`);
    process.exit(2);
  }
  if (!existsSync(fileURLToPath(SERVER))) {
    console.error("thiếu collector/dist — chạy cd collector && npm run build trước");
    process.exit(2);
  }
  const r = spawnSync(process.execPath, [SELF, mode, "--child"], { encoding: "utf8", timeout: 60_000 });
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  if (r.error || r.signal) {
    console.log(`FAIL tiến trình bị giết sau 60 giây (${r.signal ?? r.error?.code}) — flush không kết thúc`);
    console.log(`${mode.toUpperCase()} FAIL (treo)`);
    process.exit(1);
  }
  process.exit(r.status ?? 1);
}
