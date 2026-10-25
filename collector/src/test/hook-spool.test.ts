import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const thisDir = fileURLToPath(new URL(".", import.meta.url));

/**
 * ZC6 (claudedp-2310-5 mở lại): handler TỰ CHỨA spool/kev — chạy được từ
 * thư mục BẤT KỲ (mô phỏng ~/.openclaw/hooks/oneinvest-zalo-pipe/), KHÔNG
 * import bản build collector. Copy handler ra tmp rồi dynamic-import BẢN
 * COPY đó (import theo file:// tuyệt đối — đúng nghĩa chạy file ở nơi khác;
 * spawnSync từng gây treo 30s dưới node:test, bỏ).
 */

type Msg = { text: string; ts: string; senderId?: string | null };
type Handler = (ctx: unknown) => Promise<void>;

let root = "";
let home = "";
let spoolDir = "";
let handler: Handler | null = null;
let oldEnv: NodeJS.ProcessEnv = {};

test.before(async () => {
  root = join(tmpdir(), `zc6r3-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const hookDir = join(root, "hook");
  mkdirSync(hookDir, { recursive: true });
  copyFileSync(
    join(new URL("../../openclaw/handler.js", import.meta.url).pathname),
    join(hookDir, "handler.js"),
  );
  home = join(root, "home");
  mkdirSync(join(home, ".openclaw", "credentials"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "credentials", "oneinvest-agent.key"), "k1");
  spoolDir = join(root, "spool");
});

test.after(() => {
  Object.assign(process.env, oldEnv);
  rmSync(root, { recursive: true, force: true });
});

test("ZC6 vòng 3: khuôn log cũ ' post 202 '; drain dừng ở file hỏng đầu; 4xx vĩnh viễn (400/413/422) → rejected không gửi lại", async () => {
  const root3 = join(tmpdir(), `zc6v3-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const home = join(root3, "home");
  mkdirSync(join(home, ".openclaw", "credentials"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "credentials", "oneinvest-agent.key"), "k1");
  const spoolDir = join(root3, "spool");
  const logFile = join(home, ".openclaw", "logs", "oneinvest-zalo-pipe.log");
  mkdirSync(join(home, ".openclaw", "logs"), { recursive: true });
  const mkHook = async () => {
    const d = join(root3, `hook${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(d, { recursive: true });
    copyFileSync(join(thisDir, "../../openclaw/handler.js"), join(d, "handler.js"));
    return ((await import(pathToFileURL(join(d, "handler.js")).href)).default) as (ctx: unknown) => Promise<void>;
  };

  const sink: Msg[] = [];
  const collector = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const bodyTxt = Buffer.concat(chunks).toString();
      const which = (JSON.parse(bodyTxt) as { messages: Msg[] }).messages[0].text;
      if (which === "spB") {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "bad" }));
        return;
      }
      if (which === "spF") {
        res.socket?.destroy(); // treo
        return;
      }
      sink.push(...(JSON.parse(bodyTxt) as { messages: Msg[] }).messages);
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
    });
  });
  await new Promise<void>((d) => collector.listen(0, "127.0.0.1", d));
  const port = (collector.address() as AddressInfo).port;
  const kevStuck = createServer(() => {});
  await new Promise<void>((d) => kevStuck.listen(0, "127.0.0.1", d));

  const oldEnv = { ...process.env };
  process.env.HOME = home;
  process.env.ONEINVEST_API_URL = `http://127.0.0.1:${port}`;
  process.env.ONEINVEST_KEV_URL = `http://127.0.0.1:${(kevStuck.address() as AddressInfo).port}`;
  process.env.ONEINVEST_HOOK_SPOOL = spoolDir;
  const h = await mkHook();

  // (1) tin A đi thẳng → log phải giữ KHUÔN CŨ 'post 202 {"accepted":…'
  await h({ event: { channelId: "zalouser", content: "tin A", timestamp: Date.parse("2026-10-24T03:00:00Z"), metadata: { channelName: "g3" } } });
  const logTxt = readFileSync(logFile, "utf8");
  assert.match(logTxt, / post 202 /, "log có ' post 202 ' (khuôn cũ)");
  assert.match(logTxt, /"accepted":1/, "log có body accepted");

  // (3) B=400 → rejected; C ok — ghi trực tiếp file spool theo khuôn handler
  mkdirSync(spoolDir, { recursive: true }); // tin A đi thẳng nên spool chưa được mkdir
  for (const [f, text] of [["B.json", "spB"], ["C.json", "spC"]] as const) {
    writeFileSync(join(spoolDir, f), JSON.stringify({ group: "g3", message: { text, ts: "2026-10-24T03:0" + (f === "B.json" ? "1" : "2") + ":00Z" } }));
  }
  await h({ event: { channelId: "zalouser", content: "tin D", timestamp: Date.parse("2026-10-24T03:05:00Z"), metadata: { channelName: "g3" } } });
  assert.ok(existsSync(join(spoolDir, "rejected", "B.json")), "B (400) chuyển rejected/");
  assert.ok(!existsSync(join(spoolDir, "B.json")), "B rời spool chính");
  assert.ok(!existsSync(join(spoolDir, "C.json")), "C ok → gửi và xoá");
  assert.ok(sink.some((m) => m.text === "spC"), "C được gửi lại");
  assert.ok(sink.some((m) => m.text === "tin D"), "tin mới đi thẳng");

  // (2) E ok, F treo, G ok → drain DỪNG ở F; G KHÔNG bị gửi
  for (const [f, text] of [["E.json", "spE"], ["F.json", "spF"], ["G.json", "spG"]] as const) {
    writeFileSync(join(spoolDir, f), JSON.stringify({ group: "g3", message: { text, ts: "2026-10-24T03:1" + text.slice(-1) + ":00Z" } }));
  }
  await h({ event: { channelId: "zalouser", content: "tin H", timestamp: Date.parse("2026-10-24T03:15:00Z"), metadata: { channelName: "g3" } } });
  assert.ok(!existsSync(join(spoolDir, "E.json")), "E (trước F) đã gửi");
  assert.ok(existsSync(join(spoolDir, "F.json")), "F treo — giữ lại đợi lượt sau");
  assert.ok(existsSync(join(spoolDir, "G.json")), "G sau file hỏng đầu — KHÔNG được gửi");
  assert.ok(!sink.some((m) => m.text === "spG"), "G không tới collector (drain dừng ở F)");

  collector.closeAllConnections?.();
  collector.close();
  kevStuck.closeAllConnections?.();
  kevStuck.close();
  rmSync(root3, { recursive: true, force: true });
  Object.assign(process.env, oldEnv);
});

test("ZC6 tự chứa: từ thư mục NGOÀI repo — collector chết 2 tin → spool 2; sống → drain đủ, không trùng; kev treo → p=null", async () => {
  const sink: Msg[] = [];
  let up = false;
  const collector = createServer((req, res) => {
    if (!up) {
      res.socket?.destroy();
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as { messages: Msg[] };
      sink.push(...body.messages);
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
    });
  });
  await new Promise<void>((d) => collector.listen(0, "127.0.0.1", d));
  const apiPort = (collector.address() as AddressInfo).port;
  const kevStuck = createServer(() => {});
  await new Promise<void>((d) => kevStuck.listen(0, "127.0.0.1", d));
  const kevPort = (kevStuck.address() as AddressInfo).port;

  // env PHẢI gán trước import — handler đọc env lúc module load
  oldEnv = { ...process.env };
  process.env.HOME = home;
  process.env.ONEINVEST_API_URL = `http://127.0.0.1:${apiPort}`;
  process.env.ONEINVEST_KEV_URL = `http://127.0.0.1:${kevPort}`;
  process.env.ONEINVEST_HOOK_SPOOL = spoolDir;
  handler = (await import(pathToFileURL(join(root, "hook", "handler.js")).href)).default;
  assert.ok(handler, "handler export default phải có");

  const mkEv = (text: string, ts: string) => ({
    event: { channelId: "zalouser", content: text, timestamp: Date.parse(ts), metadata: { channelName: "g-zc6" } },
  });

  // 2 tin lúc collector chết; kev treo → mỗi lượt ~5s (timeout), không treo vĩnh viễn
  const t0 = Date.now();
  await handler!(mkEv("tin A collector chết", "2026-10-24T01:00:00Z"));
  await handler!(mkEv("tin B collector chết", "2026-10-24T01:01:00Z"));
  const elapsed = Date.now() - t0;
  assert.equal(readdirSync(spoolDir).length, 2, "spool giữ đủ 2 tin");
  assert.ok(elapsed < 15_000, `2 lượt kèm kev-timeout phải quay về (${elapsed}ms)`);

  // collector sống — 1 tin mới → drain 2 cũ + đẩy mới
  up = true;
  await handler!(mkEv("tin C sau khi sống", "2026-10-24T01:02:00Z"));
  assert.equal(readdirSync(spoolDir).length, 0, "spool rỗng sau drain");
  assert.deepEqual(
    sink.map((m) => m.text).sort(),
    ["tin A collector chết", "tin B collector chết", "tin C sau khi sống"],
    "đủ 3 tin, không trùng",
  );

  // tin TRÙNG y hệt khi sống → không nhân spool, sink chỉ +1 dòng
  await handler!(mkEv("tin A collector chết", "2026-10-24T01:00:00Z"));
  assert.equal(readdirSync(spoolDir).length, 0, "hash riêng idempotent — không nhân file");
  assert.equal(sink.length, 4);

  collector.closeAllConnections?.();
  collector.close();
  kevStuck.closeAllConnections?.();
  kevStuck.close();
});

test("2410-23: 401 giữ lại spool (log 'spool-held <status>' MỘT dòng mỗi lượt), collector sống lại thì gửi được; collector chậm 3s/file → trần 10s CẢ LƯỢT, phần còn lại xả lượt sau", async () => {
  const root4 = join(tmpdir(), `zc241023-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const home = join(root4, "home");
  mkdirSync(join(home, ".openclaw", "credentials"), { recursive: true });
  writeFileSync(join(home, ".openclaw", "credentials", "oneinvest-agent.key"), "k1");
  const spoolDir = join(root4, "spool");
  const logFile = join(home, ".openclaw", "logs", "oneinvest-zalo-pipe.log");
  mkdirSync(join(home, ".openclaw", "logs"), { recursive: true });
  const mkHook = async () => {
    const d = join(root4, `hook${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(d, { recursive: true });
    copyFileSync(join(thisDir, "../../openclaw/handler.js"), join(d, "handler.js"));
    return ((await import(pathToFileURL(join(d, "handler.js")).href)).default) as (ctx: unknown) => Promise<void>;
  };

  const sink: string[] = [];
  let mode: "held" | "ok" | "slow" = "held";
  const collector = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const which = (JSON.parse(Buffer.concat(chunks).toString()) as { messages: Msg[] }).messages[0].text;
      if (mode === "held" && which.startsWith("held")) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
      const ok = () => {
        sink.push(which);
        res.writeHead(202, { "content-type": "application/json" });
        res.end(JSON.stringify({ accepted: 1, duplicates: 0 }));
      };
      if (mode === "slow") setTimeout(ok, 3_000);
      else ok();
    });
  });
  await new Promise<void>((d) => collector.listen(0, "127.0.0.1", d));
  const kevFast = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ answers: { is_bds: { noul: 0.5 } } }));
    });
  });
  await new Promise<void>((d) => kevFast.listen(0, "127.0.0.1", d));

  const oldEnv = { ...process.env };
  process.env.HOME = home;
  process.env.ONEINVEST_API_URL = `http://127.0.0.1:${(collector.address() as AddressInfo).port}`;
  process.env.ONEINVEST_KEV_URL = `http://127.0.0.1:${(kevFast.address() as AddressInfo).port}`;
  process.env.ONEINVEST_HOOK_SPOOL = spoolDir;
  process.env.ONEINVEST_HOOK_DRAIN_BUDGET_MS = "10000";
  const h = await mkHook();
  const mkEv = (text: string, ts: string) => ({
    event: { channelId: "zalouser", content: text, timestamp: Date.parse(ts), metadata: { channelName: "g-241023" } },
  });
  const spoolJsons = () => readdirSync(spoolDir).filter((f) => f.endsWith(".json"));

  // (1) 2 file 401 → giữ lại spool (KHÔNG rejected/), log 'spool-held 401' đúng MỘT dòng
  mkdirSync(spoolDir, { recursive: true });
  for (const [f, text] of [["H1.json", "held-1"], ["H2.json", "held-2"]] as const) {
    writeFileSync(join(spoolDir, f), JSON.stringify({ group: "g-241023", message: { text, ts: "2026-10-25T04:00:0" + (f === "H1.json" ? "1" : "2") + ":00Z" } }));
  }
  await h(mkEv("tin mới A", "2026-10-25T04:05:00Z"));
  assert.equal(spoolJsons().length, 2, "2 file 401 vẫn ở spool");
  assert.ok(!existsSync(join(spoolDir, "rejected")), "401 KHÔNG vào rejected/");
  assert.ok(sink.some((t) => t === "tin mới A"), "tin mới vẫn đi thẳng");
  const log1 = readFileSync(logFile, "utf8");
  assert.equal((log1.match(/spool-held 401/g) ?? []).length, 1, "log 'spool-held 401' đúng MỘT dòng mỗi lượt (không mỗi tệp)");

  // (2) collector hồi phục (202) → lượt sau gửi được file từng 401
  mode = "ok";
  await h(mkEv("tin B", "2026-10-25T04:10:00Z"));
  assert.equal(spoolJsons().length, 0, "spool trống sau khi collector sống lại");
  assert.ok(sink.some((t) => t === "held-1") && sink.some((t) => t === "held-2"), "2 file held được gửi ở lượt sau");

  // (3) collector chậm 3s/file với 20 file → trần 10s CẢ LƯỢT: lượt < 20s, phần còn lại lượt sau
  mode = "slow";
  for (let i = 1; i <= 20; i++) {
    const ten = String(i).padStart(2, "0");
    writeFileSync(join(spoolDir, `S${ten}.json`), JSON.stringify({ group: "g-241023", message: { text: `sl-${ten}`, ts: `2026-10-25T04:2${Math.floor(i / 10)}:00:0${i % 10}Z` } }));
  }
  const t0 = Date.now();
  await h(mkEv("tin C", "2026-10-25T04:30:00Z"));
  const elapsed = Date.now() - t0;
  const conLai = spoolJsons().length;
  assert.ok(elapsed < 20_000, `lượt hook phải < 20 giây (được ${elapsed}ms)`);
  assert.ok(conLai > 0 && conLai < 20, `trần lượt phải để lại một phần cho lượt sau (còn ${conLai})`);
  // xả nốt qua các lượt sau — mỗi lượt cũng chịu trần
  for (let round = 1; spoolJsons().length > 0 && round <= 8; round++) {
    await h(mkEv(`round ${round}`, `2026-10-25T04:3${round}:00Z`));
  }
  assert.equal(spoolJsons().length, 0, "xả hết sau các lượt kế");
  assert.equal(sink.filter((t) => t.startsWith("sl-")).length, 20, "đủ 20 file chậm tới collector");

  collector.closeAllConnections?.();
  collector.close();
  kevFast.closeAllConnections?.();
  kevFast.close();
  rmSync(root4, { recursive: true, force: true });
  Object.assign(process.env, oldEnv);
});
