import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ConfigError, loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped, type Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { executePhase } from "../collectors/s17-thua-dinh-gia/runner.js";
import { summarize } from "../collectors/s17-thua-dinh-gia/main.js";

/**
 * Trình điều khiển một pha: đọc số dư trước và sau lượt (bằng chứng không tiêu điểm), lưu trạng thái ra
 * tệp để nối tiếp, ghi log ở máy. Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-list": "/v2.x/projects",
    "project-detail": "/v2.x/projects/{id}",
    "building-tree": "/v2.x/projects/{id}/tree",
    gallery: "/v2.x/gallery/{id}",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });

type Harness = { sent: string[]; balances: number[] };

function harness(): Harness & {
  exec: (o: { phase: "session-check" | "projects"; checkBalance: boolean; dir: string }) => ReturnType<typeof executePhase>;
} {
  const h: Harness = { sent: [], balances: [] };
  let balanceReads = 0;
  const transport = async (url: string): Promise<Response> => {
    h.sent.push(url);
    const p = new URL(url).pathname;
    if (p.endsWith("/balance")) {
      const v = h.balances[Math.min(balanceReads++, h.balances.length - 1)];
      return json(env({ available: v }));
    }
    if (p.endsWith("/projects")) {
      const page = Number(new URL(url).searchParams.get("page"));
      const content = page === 0 ? [{ id: 1 }] : [];
      return json(env({ projects: { content, totalElements: 1, totalPages: 1 } }));
    }
    if (p.includes("/gallery/")) return json(env([{ name: "album" }]));
    if (/\/projects\/\d+(\/tree)?$/.test(p)) return json(env({ properties: { is_exists_apartment_info: false } }));
    return json(env({ available: true }));
  };
  const exec = (o: { phase: "session-check" | "projects"; checkBalance: boolean; dir: string }) =>
    executePhase({
      phase: o.phase,
      config: loadConfig(JSON.stringify(FAKE_CONFIG)),
      transport,
      snapshotRoot: join(o.dir, "snapshots"),
      statePath: join(o.dir, "state.json"),
      logPath: join(o.dir, "run.log.jsonl"),
      caps: { calls: 100, minutes: 60 },
      paceMs: 0,
      batchItems: 100,
      checkBalance: o.checkBalance,
      env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
    });
  return Object.assign(h, { exec });
}

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-exec-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

test("executePhase: đọc số dư trước và sau lượt; không đổi thì lượt xong bình thường", async () => withTmp(async (dir) => {
  const h = harness();
  h.balances.push(20);
  const r = await h.exec({ phase: "session-check", checkBalance: true, dir });
  assert.equal(r.ok, true);
  assert.equal(r.summary?.alive, true);
  assert.equal(r.balanceBefore, 20);
  assert.equal(r.balanceAfter, 20);
  assert.equal(h.sent.length, 3, "số dư trước + một lời kiểm phiên + số dư sau");
  assert.equal(r.calls, 3);
}));

test("executePhase: số dư giảm thì dừng cả lượt với lý do balance-spent", async () => withTmp(async (dir) => {
  const h = harness();
  h.balances.push(20, 16);
  const r = await h.exec({ phase: "session-check", checkBalance: true, dir });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "balance-spent");
  assert.equal(r.balanceBefore, 20);
  assert.equal(r.balanceAfter, 16);
}));

test("executePhase: không đọc số dư khi pha không đụng tài khoản", async () => withTmp(async (dir) => {
  const h = harness();
  const r = await h.exec({ phase: "session-check", checkBalance: false, dir });
  assert.equal(r.ok, true);
  assert.equal(h.sent.length, 1);
  assert.equal(r.balanceBefore, undefined);
}));

test("executePhase: dừng vì bị chặn thì trả ok=false kèm lý do, snapshot có lý do dừng", async () => withTmp(async (dir) => {
  const h = harness();
  const transport = async (url: string): Promise<Response> => (new URL(url).pathname.endsWith("/projects") ? json({ message: "denied" }, 403) : json(env({})));
  const r = await executePhase({
    phase: "projects",
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport,
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: false,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "blocked");
  assert.equal(r.blocks, 1);
  assert.equal(h.sent.length, 0);
}));

test("executePhase: trạng thái lưu ra tệp; chạy lại đọc lại và không lặp việc đã xong", async () => withTmp(async (dir) => {
  const h = harness();
  const first = await h.exec({ phase: "projects", checkBalance: false, dir });
  assert.equal(first.ok, true);
  const saved = JSON.parse(await readFile(join(dir, "state.json"), "utf8")) as { listDone: boolean; projectIds: string[]; detailDone: string[] };
  assert.equal(saved.listDone, true);
  assert.deepEqual(saved.detailDone, ["1"]);
  const callsAfterFirst = h.sent.length;
  const second = await h.exec({ phase: "projects", checkBalance: false, dir });
  assert.equal(second.ok, true);
  assert.equal(second.summary?.items, 0);
  assert.equal(h.sent.length, callsAfterFirst, "lượt hai không gọi gì");
  const log = (await readFile(join(dir, "run.log.jsonl"), "utf8")).trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
  assert.ok(log.some((e) => e.suKien === "ket-qua" && e.ok === true), "log kết thúc lượt ở máy");
}));

test("executePhase: lỗi ngoài dự kiến (cấu hình thiếu đường) không bị nuốt, ném tiếp sau khi chốt phần đã có", async () => withTmp(async (dir) => {
  const h = harness();
  const { "project-list": _omit, ...pathsMissing } = FAKE_CONFIG.paths;
  await assert.rejects(
    () =>
      executePhase({
        phase: "projects",
        config: loadConfig(JSON.stringify({ ...FAKE_CONFIG, paths: pathsMissing })),
        transport: async (url: string): Promise<Response> => {
          h.sent.push(url);
          return json(env({}));
        },
        snapshotRoot: join(dir, "snapshots"),
        statePath: join(dir, "state.json"),
        logPath: join(dir, "run.log.jsonl"),
        caps: { calls: 100, minutes: 60 },
        paceMs: 0,
        batchItems: 100,
        checkBalance: false,
        env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
      }),
    ConfigError,
  );
  assert.equal(h.sent.length, 0, "thiếu đường thì không gửi gì");
}));

test("RunStopped mang tên lớp để nhận diện ở ranh giới tiến trình", () => {
  const e = new RunStopped("blocked", "x");
  assert.equal(e.name, "RunStopped");
  assert.equal(e.reason, "blocked");
});

test("executePhase: không đọc được số dư thì dừng TRƯỚC khi chạy pha, lý do balance-unreadable (đo 24/11)", async () => withTmp(async (dir) => {
  const sent: string[] = [];
  const transport = async (url: string): Promise<Response> => {
    sent.push(url);
    return new URL(url).pathname.endsWith("/balance") ? json(env({ detail_by_type: [] })) : json(env({ available: true }));
  };
  const r = await executePhase({
    phase: "session-check",
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    transport,
    snapshotRoot: join(dir, "snapshots"),
    statePath: join(dir, "state.json"),
    logPath: join(dir, "run.log.jsonl"),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: true,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-24T04:00:00.000Z") },
  });
  assert.equal(r.ok, false);
  assert.equal(r.stopReason, "balance-unreadable");
  assert.equal(sent.length, 1, "chỉ có lời đọc số dư; pha không chạy");
}));

test("summarize: kết quả thiếu trường (lỗi ngoài dự kiến) vẫn in được dòng tóm tắt", () => {
  const line = summarize({ ok: false, message: "lỗi" } as unknown as Awaited<ReturnType<typeof executePhase>>);
  assert.equal(line.ok, false);
  assert.equal(line.snapshots, 0);
  assert.doesNotMatch(JSON.stringify(line), /undefined/);
});

test("summarize: lượt dừng giữa chừng chưa đọc số dư sau thì để trống, không nói «đổi»", () => {
  const line = summarize({ ok: false, stopReason: "call-cap", snapshots: [], calls: 5, blocks: 0, balanceBefore: 20 } as unknown as Awaited<ReturnType<typeof executePhase>>);
  assert.equal(line.ok, false);
  assert.equal("soDuKhongDoi" in line, true);
  assert.equal(line.soDuKhongDoi, undefined, "chưa có số sau thì không kết luận gì");
  assert.equal(summarize({ ok: true, snapshots: [], calls: 3, blocks: 0, balanceBefore: 20, balanceAfter: 20 } as unknown as Awaited<ReturnType<typeof executePhase>>).soDuKhongDoi, true);
});
