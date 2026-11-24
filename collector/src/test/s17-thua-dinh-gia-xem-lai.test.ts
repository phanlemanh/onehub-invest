import { strict as assert } from "node:assert";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import type { Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { egoOptions, parseCli } from "../collectors/s17-thua-dinh-gia/main.js";
import { LOCK_FILE, executePhase, type ExecResult } from "../collectors/s17-thua-dinh-gia/runner.js";

/**
 * S17 — các điểm sửa sau lượt soát mã 24/11 (mốc ngày 2). Dữ liệu GIẢ, máy chủ .test; chạy qua `executePhase` để
 * kiểm đúng lớp điều khiển: một thư mục trạng thái chỉ một lượt; số dư được nhớ để đối chiếu giữa các lượt; lượt nhanh
 * mà mạng hỏng liền được coi như một lần bị chặn; lỗi mềm của nguồn không bị đọc là «không có bản ghi».
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-detail": "/v2.x/projects/{id}",
    "apartment-list": "/v2.x/apartment-list",
    "apartment-detail": "/v2.x/apartment-detail",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });
const laBalance = (url: string) => new URL(url).pathname.endsWith("/balance");

type LuaChon = {
  phase: "session-check" | "lowrise" | "apartments";
  dir: string;
  traLoi: (url: string) => Response | Promise<Response>;
  checkBalance?: boolean;
  concurrency?: number;
  paceMs?: number;
  lowriseSweep?: { from: number; to: number };
  projects?: string[];
  caps?: { calls: number; minutes: number };
};

async function chay(c: LuaChon): Promise<{ r: ExecResult; daHoi: string[] }> {
  const daHoi: string[] = [];
  const r = await executePhase({
    phase: c.phase,
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport: async (url) => {
      daHoi.push(url);
      return await c.traLoi(url);
    },
    snapshotRoot: join(c.dir, "snapshots"),
    statePath: join(c.dir, "state.json"),
    logPath: join(c.dir, "run.log.jsonl"),
    caps: c.caps ?? { calls: 100, minutes: 60 },
    paceMs: c.paceMs ?? 0,
    batchItems: 100,
    checkBalance: c.checkBalance ?? false,
    ...(c.concurrency ? { concurrency: c.concurrency } : {}),
    lowriseSweep: c.lowriseSweep,
    projects: c.projects,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T12:00:00.000Z") },
  });
  return { r, daHoi };
}

const docState = async (dir: string): Promise<Record<string, any>> => JSON.parse(await readFile(join(dir, "state.json"), "utf8"));

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-xemlai-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

// ---------- một thư mục trạng thái chỉ một lượt ----------

test("khoá DANG-CHAY.lock: lượt khác đang giữ → dừng another-run, không gửi lời nào, không đụng khoá của lượt đó", async () => withTmp(async (dir) => {
  await writeFile(join(dir, LOCK_FILE), JSON.stringify({ pid: process.pid, luc: "2026-11-24T12:00:00.000Z" }));
  const { r, daHoi } = await chay({ phase: "session-check", dir, traLoi: () => json(env({ available: true })) });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "another-run", "lượt soát 24/11: hai lượt cùng thư mục ghi đè tiến độ và khoá tăng tốc của nhau");
  assert.equal(daHoi.length, 0, "không gửi lời nào");
  assert.equal(JSON.parse(await readFile(join(dir, LOCK_FILE), "utf8")).pid, process.pid, "khoá của lượt khác phải còn nguyên");
}));

test("khoá DANG-CHAY.lock: lượt giữ khoá suốt lúc chạy (kể cả lúc dừng) rồi nhả khi xong", async () => withTmp(async (dir) => {
  let trongLucChay: string | null = null;
  const { r } = await chay({
    phase: "session-check",
    dir,
    traLoi: async (url) => {
      trongLucChay ??= await readFile(join(dir, LOCK_FILE), "utf8").catch(() => null);
      return json(laBalance(url) ? env({ available: 20 }) : env({ available: true }));
    },
    checkBalance: true,
  });
  assert.equal(r.ok, true);
  assert.ok(trongLucChay !== null && JSON.parse(trongLucChay).pid === process.pid, "khoá phải tồn tại trong lúc chạy");
  await assert.rejects(readFile(join(dir, LOCK_FILE)), "nhả khoá khi xong");
  const dung = await chay({ phase: "session-check", dir, traLoi: () => json({ message: "denied" }, 403) });
  assert.equal(dung.r.stopReason, "blocked");
  await assert.rejects(readFile(join(dir, LOCK_FILE)), "lượt dừng giữa chừng cũng phải nhả khoá");
}));

test("khoá của một tiến trình đã chết được dọn và lấy lại (khoá mồ côi không chặn lượt kế)", async () => withTmp(async (dir) => {
  const chet = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
  await writeFile(join(dir, LOCK_FILE), JSON.stringify({ pid: chet.pid }));
  const { r } = await chay({ phase: "session-check", dir, traLoi: () => json(env({ available: true })) });
  assert.equal(r.ok, true);
  await assert.rejects(readFile(join(dir, LOCK_FILE)));
}));

// ---------- số dư được nhớ giữa các lượt ----------

test("số dư trước lượt thấp hơn số dư đã biết gần nhất → dừng balance-spent, không chạy pha (lượt trước dừng giữa chừng nên không có số sau)", async () => withTmp(async (dir) => {
  await writeFile(join(dir, "state.json"), JSON.stringify({ soDuLanCuoi: 20 }));
  const giam = await chay({ phase: "session-check", dir, traLoi: (url) => json(laBalance(url) ? env({ available: 16 }) : env({ available: true })), checkBalance: true });
  assert.equal(giam.r.stopReason, "balance-spent");
  assert.equal(giam.daHoi.some((u) => u.endsWith("/data-available")), false, "không chạy pha");
  assert.equal((await docState(dir)).soDuLanCuoi, 20, "số đã biết không bị ghi đè bằng số thấp hơn");
  const bang = await chay({ phase: "session-check", dir, traLoi: (url) => json(laBalance(url) ? env({ available: 20 }) : env({ available: true })), checkBalance: true });
  assert.equal(bang.r.ok, true);
  assert.equal((await docState(dir)).soDuLanCuoi, 20, "ghi lại số dư đã biết gần nhất");
}));

test("số dư cao hơn số đã biết thì vẫn chạy (không phải «đã tiêu»)", async () => withTmp(async (dir) => {
  await writeFile(join(dir, "state.json"), JSON.stringify({ soDuLanCuoi: 20 }));
  const { r } = await chay({ phase: "session-check", dir, traLoi: (url) => json(laBalance(url) ? env({ available: 25 }) : env({ available: true })), checkBalance: true });
  assert.equal(r.ok, true);
  assert.equal((await docState(dir)).soDuLanCuoi, 25);
}));

// ---------- lượt nhanh mà mạng hỏng liền ----------

test("lượt nhanh dừng vì 10 lời thất bại liền → ghi nhận như MỘT lần bị chặn; lượt nhanh kế bị từ chối, lượt nhịp cũ vẫn chạy", async () => withTmp(async (dir) => {
  // Nguồn trả 403/429 mà không kèm CORS thì trong trang chỉ thấy là lỗi mạng (đo 24/11 với 401) — không đếm thì khoá
  // tăng tốc không bao giờ bật.
  const hong = (): Response => {
    throw new TypeError("Failed to fetch");
  };
  const lan1 = await chay({ phase: "lowrise", dir, traLoi: hong, concurrency: 2, lowriseSweep: { from: 1, to: 12 }, caps: { calls: 400, minutes: 60 } });
  assert.equal(lan1.r.stopReason, "network-down");
  assert.equal(lan1.r.blocks, 0, "không giả vờ là đã thấy 403");
  assert.equal((await docState(dir)).blockedRuns, 1);
  const lan2 = await chay({ phase: "lowrise", dir, traLoi: hong, concurrency: 2, lowriseSweep: { from: 1, to: 12 }, caps: { calls: 400, minutes: 60 } });
  assert.equal(lan2.r.stopReason, "fast-after-block", "lượt nhanh kế bị từ chối");
  assert.equal(lan2.daHoi.length, 0);
  const lan3 = await chay({ phase: "lowrise", dir, traLoi: () => json(env(null)), paceMs: 350, lowriseSweep: { from: 1, to: 3 } });
  assert.equal(lan3.r.ok, true, "nhịp cũ một luồng vẫn được chạy");
}));

test("lượt NHỊP CŨ dừng vì mạng hỏng thì KHÔNG ghi nhận là bị chặn (trừ khi thấy hẳn 403/429)", async () => withTmp(async (dir) => {
  const { r } = await chay({ phase: "lowrise", dir, traLoi: () => { throw new TypeError("Failed to fetch"); }, paceMs: 350, lowriseSweep: { from: 1, to: 12 }, caps: { calls: 400, minutes: 60 } });
  assert.equal(r.stopReason, "network-down");
  assert.equal((await docState(dir)).blockedRuns ?? 0, 0);
}));

// ---------- lỗi mềm của nguồn ----------

test("nguồn trả status false (HTTP 200) → dừng source-error; KHÔNG đọc là «không có bản ghi» (lượt soát 24/11: 120 id bị đánh dấu rỗng)", async () => withTmp(async (dir) => {
  const { r } = await chay({
    phase: "lowrise",
    dir,
    traLoi: (url) => json(laBalance(url) ? env({ available: 20 }) : { status: false, message: "Phiên không hợp lệ", data: null }),
    checkBalance: true,
    lowriseSweep: { from: 1, to: 6 },
  });
  assert.equal(r.stopReason, "source-error");
  const st = await docState(dir);
  assert.equal((st.lowriseSweepChecked ?? []).length, 0, "không id nào bị đánh dấu rỗng");
  assert.equal((st.lowriseDone ?? []).length, 0);
}));

test("lời liệt kê căn trả status false với danh sách rỗng → source-error, không tính là khớp", async () => withTmp(async (dir) => {
  const { r } = await chay({
    phase: "apartments",
    dir,
    projects: ["1"],
    traLoi: (url) => {
      const p = new URL(url).pathname;
      if (p.endsWith("/balance")) return json(env({ available: 20 }));
      if (/\/projects\/\d+$/.test(p)) return json(env({ properties: { danh_sach_thap: ["A"], so_can: 3 } }));
      return json({ status: false, message: "Quá tải", data: { content: [], totalElements: 0, totalPages: 0 } });
    },
    checkBalance: true,
  });
  assert.equal(r.stopReason, "source-error");
  assert.equal((await docState(dir)).apartmentProved, false);
}));

// ---------- dừng giữa chừng vẫn ghi nhận phần đã chốt ----------

test("dừng vì quá trần giữa pha: những mục đã chốt ở lần chốt khi dừng được ghi nhận vào trạng thái (không ghi nhận trước khi chốt)", async () => withTmp(async (dir) => {
  // Trần 5 lời: số dư trước (1), chi tiết dự án (2), liệt kê (3), chi tiết căn thứ nhất (4) và thứ hai (5); căn thứ ba chạm trần.
  const { r } = await chay({
    phase: "apartments",
    dir,
    projects: ["1"],
    traLoi: (url) => {
      const u = new URL(url);
      const p = u.pathname;
      if (p.endsWith("/balance")) return json(env({ available: 20 }));
      if (/\/projects\/\d+$/.test(p)) return json(env({ properties: { danh_sach_thap: ["A"], so_can: 3 } }));
      if (p.endsWith("/apartment-list")) return json(env({ content: ["c1", "c2", "c3"].map((text) => ({ text })), totalElements: 3, totalPages: 1 }));
      return json(env({ properties: { ma_can: u.searchParams.get("ma_can") } }));
    },
    checkBalance: true,
    caps: { calls: 5, minutes: 60 },
  });
  assert.equal(r.stopReason, "call-cap");
  const manifest = JSON.parse(await readFile(join(dir, "snapshots", "vn", readdirSync(join(dir, "snapshots", "vn"))[0], "manifest.json"), "utf8"));
  assert.ok(manifest, "phần đang dở được chốt khi dừng");
  assert.deepEqual((await docState(dir)).apartmentDetailDone, ["1/c1", "1/c2"], "hai căn đã chốt được ghi nhận; căn thứ ba thì không");
}));

// ---------- đường dẫn của bản kê chạy ----------

test("đường dẫn tệp tương đối quy đổi theo thư mục GỌI — đúng chỗ main.ts đọc tệp (lượt thật 24/11: ENOENT trong tiến trình trình duyệt)", () => {
  const v = parseCli(["--phase", "parcels", "--space", "4", "--parcels-grid", "luoi-thua.json", "--caps-calls", "10", "--caps-minutes", "5", "--snapshots-root", "snap"]);
  const o = egoOptions(v, loadConfig(JSON.stringify(FAKE_CONFIG)), { statePath: "/tmp/s.json", logPath: "/tmp/l.jsonl", resultPath: "/tmp/r.json" }) as Record<string, string>;
  assert.equal(o.parcelsGrid, resolve(process.cwd(), "luoi-thua.json"));
  assert.equal(o.snapshotRoot, resolve(process.cwd(), "snap"));
});
